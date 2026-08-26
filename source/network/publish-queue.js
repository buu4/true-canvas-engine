/**
 * network/publish-queue.js — concurrent worker pool with batching, retry, monitoring.
 */

'use strict';

const { sleep } = require('../core/math.js');

/**
 * Manages a pool of concurrent publish workers with:
 *  - configurable concurrency
 *  - true auto-batching (multiple points per HTTP request)
 *  - exponential backoff retry with optional rate-limit detection
 *  - event callbacks: onRateLimit, onError, onFlush
 *  - live status metrics: pending, active, failed, sent counts
 */
class PublishQueue {
    /**
     * @param {object}   pubnub
     * @param {object}  [opts]
     * @param {number}  [opts.concurrency=8]     Max simultaneous in-flight publishes.
     * @param {number}  [opts.batchSize=1]       Points per publish call.
     * @param {number}  [opts.maxRetries=3]      Retry attempts before giving up a job.
     * @param {number}  [opts.retryBaseMs=200]   Base delay for exponential backoff.
     * @param {Function} [opts.onRateLimit]      Called with the rate-limit error when a 429 is detected.
     * @param {Function} [opts.onError]          Called with (error, jobs) for unrecoverable failures.
     * @param {Function} [opts.onFlush]          Called each time the queue drains to empty.
     */
    constructor(pubnub, {
        concurrency  = 8,
        batchSize    = 1,
        maxRetries   = 3,
        retryBaseMs  = 200,
        onRateLimit  = null,
        onError      = null,
        onFlush      = null,
    } = {}) {
        this.pubnub       = pubnub;
        this.concurrency  = concurrency;
        this.batchSize    = Math.max(1, batchSize);
        this.maxRetries   = maxRetries;
        this.retryBaseMs  = retryBaseMs;
        this.onRateLimit  = onRateLimit;
        this.onError      = onError;
        this.onFlush      = onFlush;

        this._queue       = [];
        this._active      = 0;
        this._aborted     = false;
        this._idleWaiters = [];

        // Metrics
        this.stats = { pending: 0, active: 0, sent: 0, failed: 0 };
    }

    /**
     * Enqueue a single publish job.
     * @param {string} channel
     * @param {object} message
     * @returns {Promise<void>}  Resolves when published; rejects on unrecoverable error.
     */
    push(channel, message) {
        return new Promise((resolve, reject) => {
            if (this._aborted) { reject(new Error('queue aborted')); return; }
            this._queue.push({ channel, message, resolve, reject });
            this.stats.pending++;
            this._drain();
        });
    }

    /**
     * Enqueue multiple messages at once (bypasses individual push overhead).
     * @param {string}   channel
     * @param {object[]} messages
     * @returns {Promise<void>[]}
     */
    pushBatch(channel, messages) {
        return messages.map(msg => this.push(channel, msg));
    }

    /** Abort all pending jobs and reject their promises. */
    abort() {
        this._aborted = true;
        const pending = this._queue.splice(0);
        this.stats.pending = 0;
        for (const job of pending) job.reject(new Error('queue aborted'));
        this._checkIdle();
    }

    /** Reset aborted state so the queue can accept new jobs. */
    reset() {
        this._aborted = false;
        this.stats = { pending: 0, active: 0, sent: 0, failed: 0 };
    }

    /**
     * Wait until the queue is fully drained (all pending + in-flight jobs done).
     * @returns {Promise<void>}
     */
    flush() {
        if (this._active === 0 && this._queue.length === 0) return Promise.resolve();
        return new Promise(resolve => this._idleWaiters.push(resolve));
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    async _publishWithRetry(jobs) {
        const channel = jobs[0].channel;
        let attempt   = 0;

        for (;;) {
            try {
                const isBatch = jobs.length > 1 && typeof this.pubnub.publishBatch === 'function';
                if (isBatch) {
                    await this.pubnub.publishBatch({ channel, messages: jobs.map(j => j.message) });
                } else if (jobs.length > 1) {
                    await Promise.all(jobs.map(j => this.pubnub.publish({ channel: j.channel, message: j.message })));
                } else {
                    await this.pubnub.publish({ channel, message: jobs[0].message });
                }

                this.stats.sent += jobs.length;
                for (const j of jobs) j.resolve();
                return;

            } catch (err) {
                attempt++;

                // Detect rate limiting (HTTP 429)
                const isRateLimit = err?.status === 429 || String(err?.message).includes('429');
                if (isRateLimit && this.onRateLimit) this.onRateLimit(err);

                if (attempt > this.maxRetries) {
                    this.stats.failed += jobs.length;
                    if (this.onError) this.onError(err, jobs);
                    for (const j of jobs) j.reject(err);
                    return;
                }

                // Exponential backoff — extra penalty on rate limit
                const delay = this.retryBaseMs * 2 ** (attempt - 1) * (isRateLimit ? 3 : 1);
                await sleep(delay);
            }
        }
    }

    _drain() {
        while (!this._aborted && this._active < this.concurrency && this._queue.length > 0) {
            const batch = this._queue.splice(0, this.batchSize);
            this.stats.pending -= batch.length;
            this._active++;
            this.stats.active = this._active;

            this._publishWithRetry(batch).finally(() => {
                this._active--;
                this.stats.active = this._active;
                this._drain();
                this._checkIdle();
            });
        }
    }

    _checkIdle() {
        if (this._active === 0 && this._queue.length === 0) {
            if (this.onFlush) this.onFlush(this.stats);
            const waiters = this._idleWaiters.splice(0);
            for (const resolve of waiters) resolve();
        }
    }
}

module.exports = { PublishQueue };
