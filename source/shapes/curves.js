/**
 * shapes/curves.js — line interpolation and curve generators.
 * Each function returns an array of Vec2 (normalized or pixel, depending on args).
 */

'use strict';

const { clamp } = require('../core/math.js');
const { Vec2 } = require('../core/vec2.js');

/**
 * Sample points along a straight line using adaptive spacing.
 *
 * @param {{ x, y }}  p0
 * @param {{ x, y }}  p1
 * @param {number}   [spacing=0.01]    Step size (same units as coordinates).
 * @param {number}   [maxPoints=512]   Hard cap on returned points.
 * @returns {Vec2[]}
 */
function interpolate(p0, p1, spacing = 0.01, maxPoints = 512) {
    const a = Vec2.from(p0);
    const b = Vec2.from(p1);
    const dist = a.distanceTo(b);
    const steps = clamp(Math.floor(dist / spacing), 1, maxPoints);
    const pts = [];
    for (let i = 0; i <= steps; i++) pts.push(a.lerp(b, i / steps));
    return pts;
}

/**
 * Quadratic Bézier curve (one control point).
 *
 * @param {{ x, y }} p0   Start point.
 * @param {{ x, y }} ctrl Control point.
 * @param {{ x, y }} p1   End point.
 * @param {number}  [steps=40]
 * @returns {Vec2[]}
 */
function quadraticCurve(p0, ctrl, p1, steps = 40) {
    const a = Vec2.from(p0), c = Vec2.from(ctrl), b = Vec2.from(p1);
    const pts = [];
    for (let i = 0; i <= steps; i++) {
        const t  = i / steps;
        const mt = 1 - t;
        pts.push(new Vec2(
            mt * mt * a.x + 2 * mt * t * c.x + t * t * b.x,
            mt * mt * a.y + 2 * mt * t * c.y + t * t * b.y,
        ));
    }
    return pts;
}

/**
 * Cubic Bézier curve (two control points).
 *
 * @param {{ x, y }} p0    Start.
 * @param {{ x, y }} ctrl1 First control point.
 * @param {{ x, y }} ctrl2 Second control point.
 * @param {{ x, y }} p1    End.
 * @param {number}  [steps=40]
 * @returns {Vec2[]}
 */
function cubicCurve(p0, ctrl1, ctrl2, p1, steps = 40) {
    const a = Vec2.from(p0), b = Vec2.from(ctrl1), c = Vec2.from(ctrl2), d = Vec2.from(p1);
    const pts = [];
    for (let i = 0; i <= steps; i++) {
        const t  = i / steps;
        const mt = 1 - t;
        const mt2 = mt * mt;
        const t2  = t * t;
        pts.push(new Vec2(
            mt2 * mt * a.x + 3 * mt2 * t * b.x + 3 * mt * t2 * c.x + t2 * t * d.x,
            mt2 * mt * a.y + 3 * mt2 * t * b.y + 3 * mt * t2 * c.y + t2 * t * d.y,
        ));
    }
    return pts;
}

/**
 * Catmull-Rom spline through a sequence of control points.
 * Produces smooth curves without manual control-point placement.
 *
 * @param {{ x, y }[]} pts   At least 4 points.
 * @param {number}    [steps=20]  Segments between each pair of inner points.
 * @returns {Vec2[]}
 */
function catmullRom(pts, steps = 20) {
    if (pts.length < 4) throw new Error('catmullRom needs at least 4 points');
    const v = pts.map(Vec2.from);
    const out = [];
    for (let i = 1; i < v.length - 2; i++) {
        const [p0, p1, p2, p3] = [v[i - 1], v[i], v[i + 1], v[i + 2]];
        for (let s = 0; s < steps; s++) {
            const t  = s / steps;
            const t2 = t * t;
            const t3 = t2 * t;
            out.push(new Vec2(
                0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
                0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
            ));
        }
    }
    out.push(v[v.length - 2]);
    return out;
}

module.exports = { interpolate, quadraticCurve, cubicCurve, catmullRom };
