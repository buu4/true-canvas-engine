/**
 * font/renderer.js — converts vector-font glyph definitions into pixel-space
 * stroke points for drawing.
 */

'use strict';

const { Vec2 } = require('../core/vec2.js');
const { GLYPHS } = require('./glyphs.js');

/**
 * Compute the points for a single text stroke, scaled and translated.
 *
 * @param {number[][]} rawPts  Array of [x, y] pairs in glyph local space.
 * @param {number}     ox      X offset (pixels).
 * @param {number}     oy      Y offset (pixels).
 * @param {number}     scale   Font size (pixels).
 * @param {number}     strokeSteps  Interpolation steps per segment.
 * @returns {Vec2[]}  Pixel-space points.
 */
function _glyphStrokePoints(rawPts, ox, oy, scale, strokeSteps = 5) {
    const out = [];
    for (let i = 0; i < rawPts.length - 1; i++) {
        const [x0, y0] = rawPts[i];
        const [x1, y1] = rawPts[i + 1];
        for (let s = 0; s < strokeSteps; s++) {
            const t = s / strokeSteps;
            out.push(new Vec2(ox + (x0 + (x1 - x0) * t) * scale, oy + (y0 + (y1 - y0) * t) * scale));
        }
    }
    const last = rawPts[rawPts.length - 1];
    out.push(new Vec2(ox + last[0] * scale, oy + last[1] * scale));
    return out;
}

/**
 * Get all pixel-space points for a single character glyph.
 *
 * @param {string} ch           The character.
 * @param {number} ox           X origin (pixels).
 * @param {number} oy           Y origin (pixels).
 * @param {number} [size=42]    Font size (pixels).
 * @param {number} [steps=5]    Interpolation steps per stroke segment.
 * @returns {{ strokes: Vec2[][] }}  One array of points per stroke.
 */
function glyphStrokes(ch, ox, oy, size = 42, steps = 5) {
    const key = ch.toUpperCase();
    const def  = GLYPHS[key] ?? GLYPHS[' '];
    return {
        strokes: def.map(rawPts => _glyphStrokePoints(rawPts, ox, oy, size, steps)),
    };
}

module.exports = { glyphStrokes };
