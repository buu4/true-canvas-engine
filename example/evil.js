// Draw vampire evil face
'use strict';

const Canvas = require('../source/true-canvas.js');

async function drawEvilFace(bot) {
    const center = new Canvas.Vec2(500, 500);

    await bot.setStyle('#cc0000').drawCircle(center, 300, { pixels: true, steps: 80 });

    await bot.setStyle('#ff0000').drawPath([
        new Canvas.Vec2(350, 420),
        new Canvas.Vec2(440, 450),
        new Canvas.Vec2(360, 460),
        new Canvas.Vec2(350, 420),
    ], { pixels: true });

    await bot.setStyle('#ff0000').drawPath([
        new Canvas.Vec2(650, 420),
        new Canvas.Vec2(560, 450),
        new Canvas.Vec2(640, 460),
        new Canvas.Vec2(650, 420),
    ], { pixels: true });

    await bot.setStyle('#880000').drawLine({ x: 330, y: 390 }, { x: 450, y: 440 }, { pixels: true });
    await bot.setStyle('#880000').drawLine({ x: 670, y: 390 }, { x: 550, y: 440 }, { pixels: true });

    const mouthLeft   = { x: 380, y: 620 };
    const mouthRight  = { x: 620, y: 620 };
    const smileSteps  = 8;

    for (let i = 0; i <= smileSteps; i++) {
        const t     = i / smileSteps;
        const ctrl  = { x: 500, y: 620 + t * 180 };
        const color = Canvas.Color.lerp('#660000', '#ff0000', t);
        await bot.setStyle(color).drawCurve(mouthLeft, ctrl, mouthRight, { pixels: true, steps: 35 });
    }

    await bot.setStyle('#ffffff');

    await bot.drawPath([
        new Canvas.Vec2(420, 630),
        new Canvas.Vec2(435, 670),
        new Canvas.Vec2(450, 630),
    ], { pixels: true });

    await bot.drawPath([
        new Canvas.Vec2(550, 630),
        new Canvas.Vec2(565, 670),
        new Canvas.Vec2(580, 630),
    ], { pixels: true });
}

async function main() {
    const bot = new Canvas.Artist({
        userId:              'evil-bot',
        style:               '#ff0000',
        resolution:          { width: 1000, height: 1000 },
        concurrency:         16,
        uniqueUserIdPerPath: true,
        pointDelayMs:        0,
    });

    console.log('Evil Bot Started ');

    let count = 1;
    while (true) {
        await drawEvilFace(bot);
        count++;
    }
}

main().catch(console.error);
