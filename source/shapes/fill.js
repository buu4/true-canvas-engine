// scan-line rasterization helpers.
// Useful for "filling" an area with dots when the canvas has no native fill.

'use strict';

const { Vec2 } = require('../core/vec2.js');

/**
 * Rasterize a filled rectangle as a grid of scan-line points.
 *
 * @param {{ x, y }} topLeft
 * @param {number}   width
 * @param {number}   height
 * @param {number}  [spacing=0.01]  Distance between scan lines (and between points on each line).
 * @returns {Vec2[]}
 */
function fillRect(topLeft, width, height, spacing = 0.01) {
    const pts = [];
    const rows = Math.floor(height / spacing);
    for (let row = 0; row <= rows; row++) {
        const y   = topLeft.y + row * spacing;
        const cols = Math.floor(width / spacing);
        for (let col = 0; col <= cols; col++) {
            pts.push(new Vec2(topLeft.x + col * spacing, y));
        }
    }
    return pts;
}

/**
 * Rasterize a filled circle (flood of dots arranged in scan-line order).
 *
 * @param {{ x, y }} center
 * @param {number}   radius
 * @param {number}  [spacing=0.01]
 * @returns {Vec2[]}
 */
function fillCircle(center, radius, spacing = 0.01) {
    const c = Vec2.from(center);
    const pts = [];
    for (let dy = -radius; dy <= radius; dy += spacing) {
        const halfW = Math.sqrt(Math.max(0, radius * radius - dy * dy));
        for (let dx = -halfW; dx <= halfW; dx += spacing) {
            pts.push(new Vec2(c.x + dx, c.y + dy));
        }
    }
    return pts;
}

module.exports = { fillRect, fillCircle };
