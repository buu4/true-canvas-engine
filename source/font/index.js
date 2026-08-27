// font/index.js    barrel module for the vector font (glyph data + renderer).

'use strict';

module.exports = {
    ...require('./glyphs.js'),
    ...require('./renderer.js'),
};
