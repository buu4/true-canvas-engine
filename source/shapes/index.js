// barrel module re-exporting all shape/curve generators.

'use strict';

module.exports = {
    ...require('./curves.js'),
    ...require('./primitives.js'),
    ...require('./parametric.js'),
    ...require('./fill.js'),
};
