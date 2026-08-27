// Draw text
'use strict';

const readline = require('readline');
const Canvas = require('../source/true-canvas.js');

const CANVAS_W   = 1000;
const CANVAS_H   = 1000;

function prompt(question) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(question, answer => {
        rl.close();
        resolve(answer);
    }));
}

async function main() {
    const userText = await prompt('Enter text to draw: ');

    if (!userText || userText.trim() === '') {
        console.log('Text cannot be empty.');
        return;
    }

    const bot = new Canvas.Artist({
        userId:              'text-top-bot',
        style:               '#ff0000',
        resolution:          { width: CANVAS_W, height: CANVAS_H },
        concurrency:         48,
        uniqueUserIdPerPath: true,
        pointDelayMs:        0,
    });

    const color = Canvas.Color.hslToHex(0, 100, 50);

    while (true) {
        await bot.drawText(userText, {
            x: 50,
            y: 50,
            fontSize: 28,
            lineHeight: 38,
            canvasWidth: CANVAS_W,
            canvasHeight: CANVAS_H,
            style: color,
        });
    }
}

main().catch(console.error);
