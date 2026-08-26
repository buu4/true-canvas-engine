/**
 * core/vec3.js — 3-D vector with projection helpers.
 */

'use strict';

const { lerp } = require('./math.js');
const { Vec2 } = require('./vec2.js');

/**
 * 3-D vector with common operations and built-in 3-D→2-D projection.
 * All arithmetic methods return a new Vec3 (non-mutating).
 */
class Vec3 {
    /**
     * @param {number} [x=0]
     * @param {number} [y=0]
     * @param {number} [z=0]
     */
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    clone() { return new Vec3(this.x, this.y, this.z); }

    add(v) { return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z); }
    sub(v) { return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z); }
    scale(s) { return new Vec3(this.x * s, this.y * s, this.z * s); }

    dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }

    cross(v) {
        return new Vec3(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x,
        );
    }

    length() { return Math.hypot(this.x, this.y, this.z); }
    lengthSq() { return this.x * this.x + this.y * this.y + this.z * this.z; }

    normalize() {
        const len = this.length();
        return len === 0 ? new Vec3(0, 0, 0) : this.scale(1 / len);
    }

    lerp(v, t) { return new Vec3(lerp(this.x, v.x, t), lerp(this.y, v.y, t), lerp(this.z, v.z, t)); }

    /**
     * Rotate around the X axis by `angle` radians.
     * @param {number} angle
     */
    rotateX(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vec3(this.x, this.y * cos - this.z * sin, this.y * sin + this.z * cos);
    }

    /**
     * Rotate around the Y axis by `angle` radians.
     * @param {number} angle
     */
    rotateY(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vec3(this.x * cos + this.z * sin, this.y, -this.x * sin + this.z * cos);
    }

    /**
     * Rotate around the Z axis by `angle` radians.
     * @param {number} angle
     */
    rotateZ(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vec3(this.x * cos - this.y * sin, this.x * sin + this.y * cos, this.z);
    }

    /**
     * Perspective projection onto a 2-D plane.
     * Returns a Vec2 in canvas-pixel space, centered at `center`.
     *
     * @param {{ x: number, y: number }} center  Pixel-space origin (e.g. { x: 500, y: 500 }).
     * @param {number} [fovDistance=600]          Camera-to-projection-plane distance.
     * @returns {Vec2}
     */
    project(center, fovDistance = 600) {
        const scale = fovDistance / (fovDistance + this.z);
        return new Vec2(center.x + this.x * scale, center.y + this.y * scale);
    }

    toString() { return `Vec3(${this.x.toFixed(4)}, ${this.y.toFixed(4)}, ${this.z.toFixed(4)})`; }

    static from(obj) { return new Vec3(obj.x, obj.y, obj.z ?? 0); }
    static get ZERO() { return new Vec3(0, 0, 0); }
}

module.exports = { Vec3 };
