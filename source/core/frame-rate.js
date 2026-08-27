// core/frame-rate.js    fixed-FPS frame limiter.

'use strict';

const { sleep } = require('./math.js');

// Simple fixed-FPS frame limiter.
//
// Usage:
//   const fps = new FrameRate(30);
//   while (true) {
//     drawFrame();
//     await fps.wait();   // waits only the time remaining in the frame budget
//   }
class FrameRate {
    // @param {number} [targetFPS=30]
    constructor(targetFPS = 30) {
        this.frameBudgetMs = 1000 / targetFPS;
        this._last = 0;
    }

    // Wait for the remainder of the current frame's time budget.
    async wait() {
        const now     = Date.now();
        const elapsed = now - this._last;
        const remaining = this.frameBudgetMs - elapsed;
        if (remaining > 0) await sleep(remaining);
        this._last = Date.now();
    }

    // Reset the timer (call before the first frame).
    reset() { this._last = Date.now(); }
}

module.exports = { FrameRate };
