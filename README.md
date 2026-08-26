# True Canvas Engine

Render 2D/3D drawing on Pubnub [Draw On My Face Canvas](https://stephenlb.github.io/draw-on-my-face) easily

## Usage

```js
const Canvas = require('./source/true-canvas.js');

const bot = new Canvas.Artist({ style: '#ff0000' });
await bot.drawLine({ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.9 });
```

## Notes

You don't need to understand all the things here, all you need to do is just knowing how to use `Canvas.Artist` properly. You can also look into the [Examples](example) folder to see all example of how it works!

## Project structure

```
source/
  index.js              Public API entry point (re-exports everything below)
  true-canvas.js         Backwards-compatible alias for index.js
  pubnub.js               PubNub transport client (SSE subscribe / publish / history)

  core/                  Framework-agnostic primitives
    math.js                clamp, rand, sleep, lerp, toRad, toDeg
    vec2.js                Vec2 — 2-D vector math
    vec3.js                Vec3 — 3-D vector math + perspective projection
    color.js               Color — hex/RGB/HSL conversion & blending
    frame-rate.js          FrameRate — fixed-FPS frame limiter

  shapes/                Point generators — each returns Vec2[]
    curves.js              line interpolation, quadratic/cubic Bézier, Catmull-Rom
    primitives.js           circle, ellipse, arc, rect, polygon, star
    parametric.js            spiral, Lissajous, rose, heart
    fill.js                 scan-line rasterized fillRect / fillCircle
    index.js                barrel re-export of the four files above

  font/                  Built-in stroke-based vector font
    glyphs.js               raw glyph stroke definitions
    renderer.js              glyphStrokes() — glyph → pixel-space stroke points
    index.js                 barrel re-export

  network/               Transport-layer concerns
    publish-queue.js        PublishQueue — concurrent publish pool w/ batching & retry

  bot/                   The public drawing bot
    artist.js               Artist — composes shapes + font + PublishQueue into a
                             chainable draw*() API
```
