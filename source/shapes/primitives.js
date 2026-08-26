// basic geometric shape generators.
// Each function returns an array of Vec2 (normalized or pixel, depending on args).

'use strict';

const { lerp } = require('../core/math.js');
const { Vec2 } = require('../core/vec2.js');
const { interpolate } = require('./curves.js');

// Circle.
//
// @param {{ x, y }} center
// @param {number}   radius
// @param {number}  [steps=64]
// @returns {Vec2[]}
function circlePoints(center, radius, steps = 64) {
    const c = Vec2.from(center);
    const pts = [];
    for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        pts.push(new Vec2(c.x + Math.cos(a) * radius, c.y + Math.sin(a) * radius));
    }
    return pts;
}

// Ellipse.
//
// @param {{ x, y }} center
// @param {number}   rx      Radius on X axis.
// @param {number}   ry      Radius on Y axis.
// @param {number}  [rotation=0]  Rotation in radians.
// @param {number}  [steps=64]
// @returns {Vec2[]}
function ellipsePoints(center, rx, ry, rotation = 0, steps = 64) {
    const c  = Vec2.from(center);
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const pts = [];
    for (let i = 0; i <= steps; i++) {
        const a  = (i / steps) * Math.PI * 2;
        const lx = Math.cos(a) * rx;
        const ly = Math.sin(a) * ry;
        pts.push(new Vec2(c.x + lx * cos - ly * sin, c.y + lx * sin + ly * cos));
    }
    return pts;
}

// Circular arc.
//
// @param {{ x, y }} center
// @param {number}   radius
// @param {number}   startAngle  Start angle in radians.
// @param {number}   endAngle    End angle in radians.
// @param {number}  [steps=32]
// @returns {Vec2[]}
function arcPoints(center, radius, startAngle, endAngle, steps = 32) {
    const c = Vec2.from(center);
    const pts = [];
    for (let i = 0; i <= steps; i++) {
        const a = lerp(startAngle, endAngle, i / steps);
        pts.push(new Vec2(c.x + Math.cos(a) * radius, c.y + Math.sin(a) * radius));
    }
    return pts;
}

// Axis-aligned rectangle (outline).
//
// @param {{ x, y }} topLeft
// @param {number}   width
// @param {number}   height
// @param {number}  [stepsPerSide=10]
// @returns {Vec2[]}
function rectPoints(topLeft, width, height, stepsPerSide = 10) {
    const { x, y } = topLeft;
    const corners = [
        { x, y },
        { x: x + width, y },
        { x: x + width, y: y + height },
        { x, y: y + height },
        { x, y },
    ];
    const pts = [];
    for (let i = 0; i < 4; i++) {
        const seg = interpolate(corners[i], corners[i + 1], 1, stepsPerSide);
        // Avoid duplicate corner points except at the very end
        if (i > 0) seg.shift();
        pts.push(...seg);
    }
    return pts;
}

// Regular polygon.
//
// @param {{ x, y }} center
// @param {number}   radius
// @param {number}   sides       Number of sides (≥ 3).
// @param {number}  [rotation=0] Rotation in radians.
// @returns {Vec2[]}
function polygonPoints(center, radius, sides, rotation = 0) {
    if (sides < 3) throw new Error('polygon needs at least 3 sides');
    const c = Vec2.from(center);
    const pts = [];
    for (let i = 0; i <= sides; i++) {
        const a = rotation + (i / sides) * Math.PI * 2;
        pts.push(new Vec2(c.x + Math.cos(a) * radius, c.y + Math.sin(a) * radius));
    }
    return pts;
}

// Star / asterisk shape.
//
// @param {{ x, y }} center
// @param {number}   outerRadius
// @param {number}   innerRadius
// @param {number}  [points=5]
// @param {number}  [rotation=0]  Radians. Default points a tip upward.
// @returns {Vec2[]}
function starPoints(center, outerRadius, innerRadius, points = 5, rotation = -Math.PI / 2) {
    const c = Vec2.from(center);
    const total = points * 2;
    const verts = [];
    for (let i = 0; i <= total; i++) {
        const a = rotation + (i % total) * (Math.PI / points);
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        verts.push(new Vec2(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r));
    }
    return verts;
}

module.exports = { circlePoints, ellipsePoints, arcPoints, rectPoints, polygonPoints, starPoints };
