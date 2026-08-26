// core/vec2.js — immutable-style 2-D vector.

'use strict';

const { lerp } = require('./math.js');

// 2-D vector with common math operations.
// All arithmetic methods return a NEW Vec2 (non-mutating).
class Vec2 {
    // @param {number} [x=0]
    // @param {number} [y=0]
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    // Return a copy of this vector.
    clone() { return new Vec2(this.x, this.y); }

    // Component-wise addition.
    add(v) { return new Vec2(this.x + v.x, this.y + v.y); }

    // Component-wise subtraction.
    sub(v) { return new Vec2(this.x - v.x, this.y - v.y); }

    // Scalar multiplication.
    scale(s) { return new Vec2(this.x * s, this.y * s); }

    // Component-wise multiplication.
    mul(v) { return new Vec2(this.x * v.x, this.y * v.y); }

    // Dot product.
    dot(v) { return this.x * v.x + this.y * v.y; }

    // 2-D cross product (scalar z-component).
    cross(v) { return this.x * v.y - this.y * v.x; }

    // Euclidean length.
    length() { return Math.hypot(this.x, this.y); }

    // Squared length (cheaper than length()).
    lengthSq() { return this.x * this.x + this.y * this.y; }

    // Euclidean distance to another vector.
    distanceTo(v) { return Math.hypot(this.x - v.x, this.y - v.y); }

    // Angle of this vector (radians, from +x axis).
    angle() { return Math.atan2(this.y, this.x); }

    // Angle from this point toward another (radians).
    angleTo(v) { return Math.atan2(v.y - this.y, v.x - this.x); }

    // Unit vector. Returns (0,0) if length is zero.
    normalize() {
        const len = this.length();
        return len === 0 ? new Vec2(0, 0) : this.scale(1 / len);
    }

    // Rotate around the origin by `angle` radians.
    // @param {number} angle  Radians.
    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vec2(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
    }

    // Rotate around a pivot point.
    // @param {Vec2}   pivot
    // @param {number} angle  Radians.
    rotateAround(pivot, angle) {
        return this.sub(pivot).rotate(angle).add(pivot);
    }

    // Linear interpolation toward `v` at parameter `t` (0..1).
    lerp(v, t) { return new Vec2(lerp(this.x, v.x, t), lerp(this.y, v.y, t)); }

    // Reflect this vector across a normal `n` (must be unit length).
    // @param {Vec2} n  Unit normal.
    reflect(n) { return this.sub(n.scale(2 * this.dot(n))); }

    // Perpendicular vector (rotated 90° CCW).
    perp() { return new Vec2(-this.y, this.x); }

    // Project this vector onto `v`.
    // @param {Vec2} v
    projectOnto(v) {
        const d = v.dot(v);
        return d === 0 ? new Vec2(0, 0) : v.scale(this.dot(v) / d);
    }

    // Equality check within an optional epsilon.
    equals(v, eps = 1e-9) {
        return Math.abs(this.x - v.x) <= eps && Math.abs(this.y - v.y) <= eps;
    }

    toString() { return `Vec2(${this.x.toFixed(4)}, ${this.y.toFixed(4)})`; }

    // Create a Vec2 from any {x,y} object.
    // @param {{ x: number, y: number }} obj
    // @returns {Vec2}
    static from(obj) { return new Vec2(obj.x, obj.y); }

    // Create a unit vector pointing at `angle` radians.
    // @param {number} angle
    // @returns {Vec2}
    static fromAngle(angle) { return new Vec2(Math.cos(angle), Math.sin(angle)); }

    // Zero vector.
    static get ZERO() { return new Vec2(0, 0); }

    // (1, 0)
    static get RIGHT() { return new Vec2(1, 0); }

    // (0, 1)
    static get DOWN() { return new Vec2(0, 1); }
}

module.exports = { Vec2 };
