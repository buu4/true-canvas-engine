// core/math.js    scalar math helpers shared across the engine.

'use strict';

// Clamp `v` to [min, max].
// @param {number} v
// @param {number} min
// @param {number} max
// @returns {number}
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// Random float in [min, max).
// @param {number} min
// @param {number} max
// @returns {number}
const rand = (min, max) => min + Math.random() * (max - min);

// Promisified setTimeout.
// @param {number} ms
// @returns {Promise<void>}
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Linear interpolation between two scalars.
// @param {number} a
// @param {number} b
// @param {number} t  0..1
// @returns {number}
const lerp = (a, b, t) => a + (b - a) * t;

// Degrees -> radians.
// @param {number} deg
// @returns {number}
const toRad = (deg) => (deg * Math.PI) / 180;

// Radians -> degrees.
// @param {number} rad
// @returns {number}
const toDeg = (rad) => (rad * 180) / Math.PI;

module.exports = { clamp, rand, sleep, lerp, toRad, toDeg };
