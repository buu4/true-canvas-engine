// parametric curve generators.
// Each function returns an array of Vec2 (normalized or pixel, depending on args).

'use strict';

const { lerp } = require('../core/math.js');
const { Vec2 } = require('../core/vec2.js');

/**
 * Spiral (Archimedean).
 *
 * @param {{ x, y }} center
 * @param {number}   startRadius
 * @param {number}   endRadius
 * @param {number}  [turns=3]
 * @param {number}  [steps=180]
 * @returns {Vec2[]}
 */
function spiralPoints(center, startRadius, endRadius, turns = 3, steps = 180) {
    const c = Vec2.from(center);
    const totalAngle = turns * Math.PI * 2;
    const pts = [];
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const a = t * totalAngle;
        const r = lerp(startRadius, endRadius, t);
        pts.push(new Vec2(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r));
    }
    return pts;
}

/**
 * Lissajous curve.
 *
 * @param {{ x, y }} center
 * @param {number}   rx         Horizontal amplitude.
 * @param {number}   ry         Vertical amplitude.
 * @param {number}  [freqX=3]
 * @param {number}  [freqY=2]
 * @param {number}  [phase=Math.PI/2]
 * @param {number}  [steps=180]
 * @returns {Vec2[]}
 */
function lissajousPoints(center, rx, ry, freqX = 3, freqY = 2, phase = Math.PI / 2, steps = 180) {
    const c = Vec2.from(center);
    const pts = [];
    for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * Math.PI * 2;
        pts.push(new Vec2(c.x + Math.cos(freqX * t + phase) * rx, c.y + Math.sin(freqY * t) * ry));
    }
    return pts;
}

/**
 * Rose curve (rhodonea).
 *
 * @param {{ x, y }} center
 * @param {number}   radius
 * @param {number}  [k=3]       Petal count (odd k -> k petals, even k -> 2k petals).
 * @param {number}  [steps=360]
 * @returns {Vec2[]}
 */
function rosePoints(center, radius, k = 3, steps = 360) {
    const c = Vec2.from(center);
    const pts = [];
    const turns = (k % 2 === 0) ? 2 : 1;
    for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * Math.PI * 2 * turns;
        const r = radius * Math.cos(k * t);
        pts.push(new Vec2(c.x + r * Math.cos(t), c.y + r * Math.sin(t)));
    }
    return pts;
}

/**
 * Heart curve (parametric).
 *
 * @param {{ x, y }} center
 * @param {number}   size      Scale factor (pixels or normalized units).
 * @param {number}  [steps=120]
 * @returns {Vec2[]}
 */
function heartPoints(center, size, steps = 120) {
    const c = Vec2.from(center);
    const pts = [];
    for (let i = 0; i <= steps; i++) {
        const t  = (i / steps) * Math.PI * 2;
        const x  = 16 * Math.pow(Math.sin(t), 3);
        const y  = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        const s  = size / 17; // normalize heart to ~size units
        pts.push(new Vec2(c.x + x * s, c.y + y * s));
    }
    return pts;
}

module.exports = { spiralPoints, lissajousPoints, rosePoints, heartPoints };
