/**
 * true-canvas.js — backwards-compatible entry point.
 *
 * The engine core was modularized into core/, shapes/, font/, network/,
 * and bot/ (see index.js). This file re-exports the same public API from
 * its original location so existing `require('./true-canvas.js')` calls
 * keep working unchanged.
 *
 * New code should prefer `require('./index.js')`.
 */

'use strict';

module.exports = require('./index.js');
