// Protocol:
//   channel: 'coords'
//   message: { userId, style, x, y, seq }
//     - x, y  : normalized 0..1 (fraction of receiver's screen width/height)
//     - style : hex color string, e.g. '#ff00ff'
//     - seq   : monotonically increasing per-user sequence number
//

'use strict';

const { clamp, rand, sleep, lerp, toRad, toDeg } = require('./core/math.js');
const { Vec2 } = require('./core/vec2.js');
const { Vec3 } = require('./core/vec3.js');
const { Color } = require('./core/color.js');
const { FrameRate } = require('./core/frame-rate.js');

const {
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
} = require('./shapes/index.js');

const { GLYPHS, glyphStrokes } = require('./font/index.js');

const { PublishQueue } = require('./network/publish-queue.js');
const { Artist } = require('./bot/artist.js');

module.exports = {
    // Primitives
    Vec2, Vec3,
    Color,
    FrameRate,

    // Shape generators (return Vec2[])
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

    // Font
    GLYPHS,
    glyphStrokes,

    // Core
    PublishQueue,
    Artist,

    // Utils
    clamp, rand, sleep, lerp, toRad, toDeg,
};
