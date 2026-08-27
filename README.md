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
  Public API:

    true-canvas.j           Public API entry point (re-exports everything below)
    pubnub.js               PubNub transport client (SSE subscribe / publish / history)

  Computation:

    core/                  Framework-agnostic primitives
    shapes/                Point generators    each returns Vec2[]
    font/                  Built-in stroke-based vector font
    network/               Transport-layer concerns

  The public drawing bot artists, this folder is where
  all drawing logic and API is:
  
    bot/
```
