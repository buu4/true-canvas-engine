// core/color.js    hex color utilities.

'use strict';

const { clamp, lerp } = require('./math.js');

// Color utility namespace.
// All conversions work with 6-digit hex strings (e.g. `'#ff00ff'`).
const Color = {
    // Random hex color.
    randomHex() {
        return '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
    },

    // Parse `'#rrggbb'` -> `{ r, g, b }` (0-255 integers).
    // @param {string} hex
    // @returns {{ r: number, g: number, b: number }}
    hexToRgb(hex) {
        const n = parseInt(hex.replace('#', ''), 16);
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    },

    // `{ r, g, b }` -> `'#rrggbb'`.
    // @param {{ r: number, g: number, b: number }} rgb
    // @returns {string}
    rgbToHex({ r, g, b }) {
        return '#' + [r, g, b].map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
    },

    // Linear interpolation between two hex colors.
    // @param {string} hexA
    // @param {string} hexB
    // @param {number} t    0..1
    // @returns {string}
    lerp(hexA, hexB, t) {
        const a = Color.hexToRgb(hexA), b = Color.hexToRgb(hexB);
        return Color.rgbToHex({
            r: lerp(a.r, b.r, t),
            g: lerp(a.g, b.g, t),
            b: lerp(a.b, b.b, t),
        });
    },

    // HSL -> `'#rrggbb'`.
    // @param {number} h  Hue 0..360.
    // @param {number} s  Saturation 0..100.
    // @param {number} l  Lightness 0..100.
    // @returns {string}
    hslToHex(h, s, l) {
        l /= 100;
        const a = (s / 100) * Math.min(l, 1 - l);
        const f = n => {
            const k = (n + h / 30) % 12;
            return Math.round(255 * (l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1))).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    },

    // Rainbow hue sweep    maps `t` (0..1) to a full hue cycle.
    // @param {number} t     0..1
    // @param {number} [s=100]
    // @param {number} [l=50]
    // @returns {string}
    rainbow(t, s = 100, l = 50) {
        return Color.hslToHex((t * 360) % 360, s, l);
    },

    // Slightly mutate the blue channel to force a new continuous path on the
    // receiver (Draw on my Face renders same-color consecutive points as one stroke).
    // @param {string}  hex
    // @param {boolean} toggle
    // @returns {string}
    nudge(hex, toggle) {
        const rgb = Color.hexToRgb(hex);
        rgb.b = toggle ? (rgb.b ^ 1) : rgb.b;
        return Color.rgbToHex(rgb);
    },

    // Darken a hex color by a ratio.
    // @param {string} hex
    // @param {number} amount  0..1 (1 = black, 0 = no change)
    // @returns {string}
    darken(hex, amount) {
        const rgb = Color.hexToRgb(hex);
        return Color.rgbToHex({ r: rgb.r * (1 - amount), g: rgb.g * (1 - amount), b: rgb.b * (1 - amount) });
    },

    // Lighten a hex color by a ratio.
    // @param {string} hex
    // @param {number} amount  0..1 (1 = white, 0 = no change)
    // @returns {string}
    lighten(hex, amount) {
        const rgb = Color.hexToRgb(hex);
        return Color.rgbToHex({
            r: rgb.r + (255 - rgb.r) * amount,
            g: rgb.g + (255 - rgb.g) * amount,
            b: rgb.b + (255 - rgb.b) * amount,
        });
    },

    // Return a color with alpha=0 approximation    blends toward a background color.
    // Because the canvas only accepts opaque hex, this simulates transparency by
    // interpolating toward `bgHex`.
    // @param {string} hex
    // @param {number} alpha   0..1 (0 = fully transparent / bg, 1 = opaque)
    // @param {string} [bgHex='#000000']
    // @returns {string}
    withAlpha(hex, alpha, bgHex = '#000000') {
        return Color.lerp(bgHex, hex, alpha);
    },
};

module.exports = { Color };
