/**
 * bot/artist.js — Artist: the main publish-only drawing bot.
 *
 * Key concepts:
 *  - Coordinates are either **normalized** (0..1) or **pixel** (based on `resolution`).
 *    Pass `pixels: true` in draw options to use pixel coordinates.
 *  - Each userId on the receiver is treated as one continuous path.
 *    Set `uniqueUserIdPerPath: true` to auto-increment the userId per `drawPath` call,
 *    so each stroke is isolated (its own 40-point budget + independent expiry).
 *  - `drawText()` renders a string using the built-in vector font.
 */

'use strict';

const PubNub = require('../pubnub.js');

const { sleep } = require('../core/math.js');
const { Color } = require('../core/color.js');
const { PublishQueue } = require('../network/publish-queue.js');
const { glyphStrokes } = require('../font/renderer.js');
const {
    interpolate,
    quadraticCurve,
    cubicCurve,
    catmullRom,
    circlePoints,
    ellipsePoints,
    arcPoints,
    rectPoints,
    polygonPoints,
    starPoints,
    spiralPoints,
    lissajousPoints,
    rosePoints,
    heartPoints,
    fillRect,
    fillCircle,
} = require('../shapes/index.js');

/**
 * Publish-only bot that draws shapes on the PubNub canvas.
 */
class Artist {
    /**
     * @param {object}  [opts]
     * @param {string}  [opts.userId]               Base userId (default: random).
     * @param {string}  [opts.style='#ff00ff']       Default hex color.
     * @param {string}  [opts.channel='coords']      PubNub channel name.
     * @param {{ width, height }} [opts.resolution]  Virtual canvas size for pixel→norm conversion.
     * @param {string}  [opts.subscribeKey='demo']
     * @param {string}  [opts.publishKey='demo']
     * @param {string}  [opts.origin]
     * @param {string}  [opts.authKey]
     * @param {number}  [opts.concurrency=8]         PublishQueue worker count.
     * @param {number}  [opts.batchSize=1]           Points per publish call.
     * @param {number}  [opts.pointDelayMs=0]        Optional per-point delay (ms).
     * @param {boolean} [opts.uniqueUserIdPerPath]   Auto-increment userId per drawPath.
     * @param {Function} [opts.onRateLimit]          Rate-limit callback.
     * @param {Function} [opts.onError]              Error callback.
     * @param {Function} [opts.onFlush]              Queue-drain callback.
     */
    constructor({
        userId              = `bot-${Math.random().toString(36).slice(2)}`,
        style               = '#ff00ff',
        channel             = 'coords',
        resolution          = { width: 1000, height: 1000 },
        subscribeKey        = 'demo',
        publishKey          = 'demo',
        origin              = 'h2.pubnubapi.com',
        authKey             = 'user-default',
        concurrency         = 8,
        batchSize           = 1,
        pointDelayMs        = 0,
        uniqueUserIdPerPath = false,
        onRateLimit         = null,
        onError             = null,
        onFlush             = null,
    } = {}) {
        this.userId              = userId;
        this._baseUserId         = userId;
        this._pathCounter        = 0;
        this.uniqueUserIdPerPath = uniqueUserIdPerPath;
        this.style               = style;
        this.channel             = channel;
        this.resolution          = resolution;
        this.pointDelayMs        = pointDelayMs;
        this.pubnub              = PubNub({ userId, subscribeKey, publishKey, origin, authKey });
        this._seq                = 0;
        this._strokeToggle       = false;
        this._queue              = new PublishQueue(this.pubnub, {
            concurrency,
            batchSize,
            onRateLimit,
            onError,
            onFlush,
        });
    }

    // ── Configuration ─────────────────────────────────────────────────────────

    /**
     * Set the current draw color. Chainable.
     * @param {string} hex
     * @returns {this}
     */
    setStyle(hex) { this.style = hex; return this; }

    /**
     * Override userId. Resets the sequence counter. Chainable.
     * @param {string} id
     * @returns {this}
     */
    setUserId(id) { this.userId = id; this._seq = 0; return this; }

    /**
     * Advance to the next auto-incremented userId (`base-1`, `base-2`, …).
     * Useful for manually isolating a stroke when `uniqueUserIdPerPath` is false.
     * @returns {string}  The new userId.
     */
    nextUserId() {
        this._pathCounter++;
        this.userId = `${this._baseUserId}-${this._pathCounter}`;
        this._seq   = 0;
        return this.userId;
    }

    /** Live queue stats: `{ pending, active, sent, failed }`. */
    get stats() { return this._queue.stats; }

    // ── Low-level send ────────────────────────────────────────────────────────

    /**
     * Convert pixel coordinates to normalized (0..1) space.
     * @param {{ x, y }} pt
     * @returns {{ x, y }}
     */
    toNormalized({ x, y }) {
        return { x: x / this.resolution.width, y: y / this.resolution.height };
    }

    /**
     * Send a single point to the queue.
     *
     * @param {{ x, y }} coords   Normalized (default) or pixel if `pixels: true`.
     * @param {object}  [opts]
     * @param {boolean} [opts.pixels=false]
     * @param {string}  [opts.style]     Override color for this point only.
     * @returns {Promise<void>}
     */
    send(coords, { pixels = false, style } = {}) {
        const pt = pixels ? this.toNormalized(coords) : coords;
        this._seq++;
        return this._queue.push(this.channel, {
            userId: this.userId,
            style:  style ?? this.style,
            x:      pt.x,
            y:      pt.y,
            seq:    this._seq,
        });
    }

    // ── Path drawing ──────────────────────────────────────────────────────────

    /**
     * Draw a sequence of pre-computed points.
     *
     * @param {Vec2[] | { x, y }[]} points
     * @param {object}  [opts]
     * @param {boolean} [opts.pixels=false]         Points are in pixel space.
     * @param {number}  [opts.delayMs]              Per-point delay override.
     * @param {boolean} [opts.uniqueUserId]         Force a new userId for this path.
     * @param {string}  [opts.style]                Color override for this path.
     * @returns {Promise<void>}
     */
    async drawPath(points, { pixels = false, delayMs, uniqueUserId, style } = {}) {
        const useUnique = uniqueUserId ?? this.uniqueUserIdPerPath;
        if (useUnique) this.nextUserId();

        this._strokeToggle = !this._strokeToggle;
        const drawStyle = style ?? Color.nudge(this.style, this._strokeToggle);
        const delay     = delayMs ?? this.pointDelayMs;

        for (const p of points) {
            this.send(p, { pixels, style: drawStyle });
            if (delay > 0) await sleep(delay);
        }

        await this._queue.flush();
    }

    /** Abort all pending work. */
    abort() { this._queue.abort(); }

    // ── Shape drawing API ─────────────────────────────────────────────────────

    /**
     * Draw a straight line from `p0` to `p1`.
     *
     * @param {{ x, y }} p0
     * @param {{ x, y }} p1
     * @param {object}  [opts]
     * @param {boolean} [opts.pixels=false]
     * @param {number}  [opts.spacing=0.01]  Point density (same units as coords).
     * @param {number}  [opts.maxPoints=512]
     * @returns {Promise<void>}
     */
    async drawLine(p0, p1, opts = {}) {
        const defaultSpacing = opts.pixels ? 8 : 0.01;
        const pts = interpolate(p0, p1, opts.spacing ?? defaultSpacing, opts.maxPoints);
        await this.drawPath(pts, opts);
    }

    /**
     * Draw a quadratic Bézier curve (1 control point).
     *
     * @param {{ x, y }} p0
     * @param {{ x, y }} ctrl
     * @param {{ x, y }} p1
     * @param {object}  [opts]
     * @param {number}  [opts.steps=40]
     * @returns {Promise<void>}
     */
    async drawCurve(p0, ctrl, p1, opts = {}) {
        const pts = quadraticCurve(p0, ctrl, p1, opts.steps ?? 40);
        await this.drawPath(pts, opts);
    }

    /**
     * Draw a cubic Bézier curve (2 control points).
     *
     * @param {{ x, y }} p0
     * @param {{ x, y }} ctrl1
     * @param {{ x, y }} ctrl2
     * @param {{ x, y }} p1
     * @param {object}  [opts]
     * @param {number}  [opts.steps=40]
     * @returns {Promise<void>}
     */
    async drawCubicCurve(p0, ctrl1, ctrl2, p1, opts = {}) {
        const pts = cubicCurve(p0, ctrl1, ctrl2, p1, opts.steps ?? 40);
        await this.drawPath(pts, opts);
    }

    /**
     * Draw a smooth Catmull-Rom spline through the given waypoints.
     *
     * @param {{ x, y }[]} waypoints  At least 4 points.
     * @param {object}  [opts]
     * @param {number}  [opts.steps=20]  Segments between each inner point pair.
     * @returns {Promise<void>}
     */
    async drawSpline(waypoints, opts = {}) {
        const pts = catmullRom(waypoints, opts.steps ?? 20);
        await this.drawPath(pts, opts);
    }

    /**
     * Draw a circle.
     *
     * @param {{ x, y }} center
     * @param {number}   radius
     * @param {object}  [opts]
     * @param {number}  [opts.steps=64]
     * @returns {Promise<void>}
     */
    async drawCircle(center, radius, opts = {}) {
        const pts = circlePoints(center, radius, opts.steps ?? 64);
        await this.drawPath(pts, opts);
    }

    /**
     * Draw an ellipse.
     *
     * @param {{ x, y }} center
     * @param {number}   rx        Horizontal radius.
     * @param {number}   ry        Vertical radius.
     * @param {object}  [opts]
     * @param {number}  [opts.rotation=0]  Radians.
     * @param {number}  [opts.steps=64]
     * @returns {Promise<void>}
     */
    async drawEllipse(center, rx, ry, opts = {}) {
        const pts = ellipsePoints(center, rx, ry, opts.rotation ?? 0, opts.steps ?? 64);
        await this.drawPath(pts, opts);
    }

    /**
     * Draw a circular arc.
     *
     * @param {{ x, y }} center
     * @param {number}   radius
     * @param {number}   startAngle  Radians.
     * @param {number}   endAngle    Radians.
     * @param {object}  [opts]
     * @param {number}  [opts.steps=32]
     * @returns {Promise<void>}
     */
    async drawArc(center, radius, startAngle, endAngle, opts = {}) {
        const pts = arcPoints(center, radius, startAngle, endAngle, opts.steps ?? 32);
        await this.drawPath(pts, opts);
    }

    /**
     * Draw an axis-aligned rectangle.
     *
     * @param {{ x, y }} topLeft
     * @param {number}   width
     * @param {number}   height
     * @param {object}  [opts]
     * @param {number}  [opts.stepsPerSide=10]
     * @returns {Promise<void>}
     */
    async drawRect(topLeft, width, height, opts = {}) {
        const pts = rectPoints(topLeft, width, height, opts.stepsPerSide ?? 10);
        await this.drawPath(pts, opts);
    }

    /**
     * Draw a regular polygon.
     *
     * @param {{ x, y }} center
     * @param {number}   radius
     * @param {number}   sides
     * @param {object}  [opts]
     * @param {number}  [opts.rotation=0]  Radians.
     * @returns {Promise<void>}
     */
    async drawPolygon(center, radius, sides, opts = {}) {
        const pts = polygonPoints(center, radius, sides, opts.rotation ?? 0);
        await this.drawPath(pts, opts);
    }

    /**
     * Draw a star.
     *
     * @param {{ x, y }} center
     * @param {number}   outerRadius
     * @param {number}   innerRadius
     * @param {object}  [opts]
     * @param {number}  [opts.points=5]
     * @param {number}  [opts.rotation]  Radians (default: tip-up).
     * @returns {Promise<void>}
     */
    async drawStar(center, outerRadius, innerRadius, opts = {}) {
        const pts = starPoints(center, outerRadius, innerRadius, opts.points ?? 5, opts.rotation ?? -Math.PI / 2);
        await this.drawPath(pts, opts);
    }

    /**
     * Draw an Archimedean spiral.
     *
     * @param {{ x, y }} center
     * @param {number}   startRadius
     * @param {number}   endRadius
     * @param {object}  [opts]
     * @param {number}  [opts.turns=3]
     * @param {number}  [opts.steps=180]
     * @returns {Promise<void>}
     */
    async drawSpiral(center, startRadius, endRadius, opts = {}) {
        const pts = spiralPoints(center, startRadius, endRadius, opts.turns ?? 3, opts.steps ?? 180);
        await this.drawPath(pts, opts);
    }

    /**
     * Draw a Lissajous figure.
     *
     * @param {{ x, y }} center
     * @param {number}   rx   Horizontal amplitude.
     * @param {number}   ry   Vertical amplitude.
     * @param {object}  [opts]
     * @param {number}  [opts.freqX=3]
     * @param {number}  [opts.freqY=2]
     * @param {number}  [opts.phase=Math.PI/2]
     * @param {number}  [opts.steps=180]
     * @returns {Promise<void>}
     */
    async drawLissajous(center, rx, ry, opts = {}) {
        const pts = lissajousPoints(center, rx, ry, opts.freqX ?? 3, opts.freqY ?? 2, opts.phase ?? Math.PI / 2, opts.steps ?? 180);
        await this.drawPath(pts, opts);
    }

    /**
     * Draw a rose curve (rhodonea).
     *
     * @param {{ x, y }} center
     * @param {number}   radius
     * @param {object}  [opts]
     * @param {number}  [opts.k=3]       Petal factor.
     * @param {number}  [opts.steps=360]
     * @returns {Promise<void>}
     */
    async drawRose(center, radius, opts = {}) {
        const pts = rosePoints(center, radius, opts.k ?? 3, opts.steps ?? 360);
        await this.drawPath(pts, opts);
    }

    /**
     * Draw a heart.
     *
     * @param {{ x, y }} center
     * @param {number}   size
     * @param {object}  [opts]
     * @param {number}  [opts.steps=120]
     * @returns {Promise<void>}
     */
    async drawHeart(center, size, opts = {}) {
        const pts = heartPoints(center, size, opts.steps ?? 120);
        await this.drawPath(pts, opts);
    }

    /**
     * Fill a rectangle with scan-line dots.
     *
     * @param {{ x, y }} topLeft
     * @param {number}   width
     * @param {number}   height
     * @param {object}  [opts]
     * @param {number}  [opts.spacing=0.01]
     * @returns {Promise<void>}
     */
    async fillRect(topLeft, width, height, opts = {}) {
        const pts = fillRect(topLeft, width, height, opts.spacing ?? (opts.pixels ? 8 : 0.01));
        await this.drawPath(pts, opts);
    }

    /**
     * Fill a circle with scan-line dots.
     *
     * @param {{ x, y }} center
     * @param {number}   radius
     * @param {object}  [opts]
     * @param {number}  [opts.spacing=0.01]
     * @returns {Promise<void>}
     */
    async fillCircle(center, radius, opts = {}) {
        const pts = fillCircle(center, radius, opts.spacing ?? (opts.pixels ? 8 : 0.01));
        await this.drawPath(pts, opts);
    }

    /**
     * Draw a text string using the built-in vector font.
     * Long strings are word-wrapped automatically.
     *
     * @param {string}   text
     * @param {object}  [opts]
     * @param {number}  [opts.x=28]          Left margin (pixels).
     * @param {number}  [opts.y=36]          Top margin (pixels).
     * @param {number}  [opts.fontSize=42]   Font size (pixels).
     * @param {number}  [opts.lineHeight]    Line height (defaults to fontSize * 1.38).
     * @param {number}  [opts.charWidth]     Character advance (defaults to fontSize * 1.14).
     * @param {number}  [opts.strokeSteps=5] Interpolation steps per glyph stroke segment.
     * @param {number}  [opts.canvasWidth]   Wrap boundary (defaults to resolution.width).
     * @param {number}  [opts.canvasHeight]  Vertical boundary (defaults to resolution.height).
     * @param {string}  [opts.style]         Color override.
     * @returns {Promise<void>}
     */
    async drawText(text, {
        x           = 28,
        y           = 36,
        fontSize    = 42,
        lineHeight,
        charWidth,
        strokeSteps = 5,
        canvasWidth,
        canvasHeight,
        ...pathOpts
    } = {}) {
        const cw  = canvasWidth  ?? this.resolution.width;
        const ch  = canvasHeight ?? this.resolution.height;
        const lh  = lineHeight   ?? fontSize * 1.38;
        const adv = charWidth    ?? fontSize * 1.14;
        const marginX = x;
        const marginY = y;
        const maxX = cw - marginX;

        // Word wrap
        const words = text.split(' ');
        const lines = [];
        let current = '';
        for (const word of words) {
            const candidate = current ? `${current} ${word}` : word;
            if (candidate.length * adv > maxX && current) {
                lines.push(current);
                current = word;
            } else {
                current = candidate;
            }
        }
        if (current) lines.push(current);

        let cy = marginY;
        for (const line of lines) {
            if (cy + fontSize > ch - marginY) cy = marginY; // wrap to top
            let cx = marginX;
            for (const glyphChar of line) {
                const { strokes } = glyphStrokes(glyphChar, cx, cy, fontSize, strokeSteps);
                for (const stroke of strokes) {
                    if (stroke.length > 0) {
                        await this.drawPath(stroke, { pixels: true, ...pathOpts });
                    }
                }
                cx += adv;
            }
            cy += lh;
        }
    }

    /**
     * Draw a 3-D wireframe mesh defined by vertices and edges.
     * Handles projection, rotation, and edge drawing in one call.
     *
     * @param {Vec3[]}      vertices    Array of 3-D points.
     * @param {[number, number][]} edges  Pairs of vertex indices.
     * @param {{ x, y }}    center      2-D center for projection (pixels).
     * @param {object}     [opts]
     * @param {number}     [opts.fov=600]       Field-of-view distance.
     * @param {number}     [opts.spacing=25]    Line density (pixels).
     * @returns {Promise<void>}
     */
    async drawWireframe(vertices, edges, center, opts = {}) {
        const fov     = opts.fov ?? 600;
        const spacing = opts.spacing ?? 25;
        const proj    = vertices.map(v => v.project(center, fov));
        for (const [i, j] of edges) {
            await this.drawLine(proj[i], proj[j], { pixels: true, spacing, ...opts });
        }
    }

    /**
     * "Clear" the canvas by flooding it with the background color.
     * Because the canvas is an event stream with no erase primitive,
     * this draws over existing content with a dense grid of `bgColor` points.
     *
     * @param {object}  [opts]
     * @param {string}  [opts.bgColor='#000000']
     * @param {number}  [opts.spacing]   Dot spacing (default: 20 pixels if resolution-based).
     * @returns {Promise<void>}
     */
    async clearCanvas({ bgColor = '#000000', spacing } = {}) {
        const sp = spacing ?? 20;
        const w  = this.resolution.width;
        const h  = this.resolution.height;
        const pts = fillRect({ x: 0, y: 0 }, w, h, sp);
        const savedStyle = this.style;
        this.style = bgColor;
        await this.drawPath(pts, { pixels: true });
        this.style = savedStyle;
    }

    /**
     * "Fade" by drawing a semi-transparent overlay of `bgColor` dots.
     * Less aggressive than clearCanvas — lets old content bleed through.
     *
     * @param {object}  [opts]
     * @param {string}  [opts.bgColor='#000000']
     * @param {number}  [opts.passes=1]   Number of overlay passes (more = stronger fade).
     * @param {number}  [opts.spacing=40] Sparser than clearCanvas for partial coverage.
     * @returns {Promise<void>}
     */
    async fadeCanvas({ bgColor = '#000000', passes = 1, spacing = 0 } = {}) {
        for (let p = 0; p < passes; p++) {
            await this.clearCanvas({ bgColor, spacing });
        }
    }
}

module.exports = { Artist };
