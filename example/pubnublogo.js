// Draw pubnub logo
'use strict';

const Canvas = require('../source/true-canvas.js');

const CANVAS_W   = 1000;
const CANVAS_H   = 1000;

function roundedBoxSegments(x, y, w, h, r) {
    return [
        [{ x: x + r,     y: y         }, { x: x + w - r, y: y         }],
        [{ x: x + w,     y: y + r     }, { x: x + w,     y: y + h - r }],
        [{ x: x + w - r, y: y + h     }, { x: x + r,     y: y + h     }],
        [{ x: x,         y: y + h - r }, { x: x,         y: y + r     }],
        [{ x: x + w - r, y: y         }, { x: x + w,     y: y + r     }],
        [{ x: x + w,     y: y + h - r }, { x: x + w - r, y: y + h     }],
        [{ x: x + r,     y: y + h     }, { x: x,         y: y + h - r }],
        [{ x: x,         y: y + r     }, { x: x + r,     y: y         }],
    ];
}

async function drawPubNubIcon(bot, cx, cy, pulse) {
    bot.setStyle('#E62B1E');

    const w1 = 170 + pulse, h1 = 120 + pulse, r1 = 20;
    const x1 = cx - 140, y1 = cy - 110;
    for (const [a, b] of roundedBoxSegments(x1, y1, w1, h1, r1)) {
        await bot.drawLine(a, b, { pixels: true, spacing: 6 });
    }
    await bot.drawLine({ x: x1 + 35, y: y1 + h1 },      { x: x1 - 30, y: y1 + h1 + 40 }, { pixels: true, spacing: 6 });
    await bot.drawLine({ x: x1 - 30, y: y1 + h1 + 40 }, { x: x1,      y: y1 + h1 - 25 }, { pixels: true, spacing: 6 });

    const w2 = 170 + pulse, h2 = 120 + pulse, r2 = 20;
    const x2 = cx - 30, y2 = cy - 20;
    for (const [a, b] of roundedBoxSegments(x2, y2, w2, h2, r2)) {
        await bot.drawLine(a, b, { pixels: true, spacing: 6 });
    }
    await bot.drawLine({ x: x2 + w2 - 35, y: y2      }, { x: x2 + w2 + 30, y: y2 - 40  }, { pixels: true, spacing: 6 });
    await bot.drawLine({ x: x2 + w2 + 30, y: y2 - 40 }, { x: x2 + w2,      y: y2 + 25  }, { pixels: true, spacing: 6 });
}

async function main() {
    const bot = new Canvas.Artist({
        userId:              'pubnub-logo-bot',
        style:               '#E62B1E',
        resolution:          { width: CANVAS_W, height: CANVAS_H },
        concurrency:         48,
        uniqueUserIdPerPath: true,
        pointDelayMs:        0,
    });

    let frame = 0;

    while (true) {
        const pulse = Math.sin(frame * 0.5) * 6;

        await drawPubNubIcon(bot, 500, 380, pulse);
        await bot.drawText('PUBNUB', { x: 340, y: 560, fontSize: 50, style: '#E62B1E' });

        frame++;
    }
}

main().catch(console.error);
