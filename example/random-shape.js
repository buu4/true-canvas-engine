// Draw random 3d shape with your timestamp RNG
'use strict';

const Canvas = require('../source/true-canvas.js');

const CANVAS_W     = 1000;
const CANVAS_H     = 1000;
const CENTER_POS   = { x: 500, y: 500 };
const FOV_DISTANCE = 500;
const LOOP_DELAY   = 3800;

class TimePRNG {
    constructor(seed = BigInt(Date.now())) {
        this.state = BigInt(seed);
    }

    next() {
        this.state = (this.state * 6364136223846793005n + 1442695040888963407n) & 0xFFFFFFFFFFFFFFFFn;
        return Number((this.state >> 32n) & 0xFFFFFFFFn) / 4294967296;
    }

    range(min, max) {
        return min + this.next() * (max - min);
    }

    int(min, max) {
        return Math.floor(this.range(min, max + 1));
    }
}

function generateProceduralShape(seedTimestamp) {
    const rng = new TimePRNG(seedTimestamp);
    const vertices = [];
    const edges    = [];

    const layers        = rng.int(3, 6);
    const pointsPerLayer = rng.int(4, 8);
    const height        = rng.range(150, 250);

    for (let l = 0; l < layers; l++) {
        const y      = -height / 2 + (l / (layers - 1)) * height;
        const radius = rng.range(40, 140);

        for (let p = 0; p < pointsPerLayer; p++) {
            const angle   = (p / pointsPerLayer) * Math.PI * 2;
            const jitterX = rng.range(-15, 15);
            const jitterZ = rng.range(-15, 15);
            vertices.push(new Canvas.Vec3(
                Math.cos(angle) * radius + jitterX,
                y,
                Math.sin(angle) * radius + jitterZ,
            ));
        }
    }

    for (let l = 0; l < layers; l++) {
        const layerStart = l * pointsPerLayer;
        for (let p = 0; p < pointsPerLayer; p++) {
            const curr = layerStart + p;
            edges.push([curr, layerStart + ((p + 1) % pointsPerLayer)]);
            if (l < layers - 1) edges.push([curr, curr + pointsPerLayer]);
        }
    }

    return { vertices, edges, rng };
}

async function main() {
    const bot = new Canvas.Artist({
        userId:              'procedural-time-bot',
        style:               '#ff00ff',
        resolution:          { width: CANVAS_W, height: CANVAS_H },
        concurrency:         48,
        uniqueUserIdPerPath: true,
        pointDelayMs:        0,
    });

    let angle = 0;

    while (true) {
        const timeSeed = BigInt(Date.now());
        const { vertices, edges, rng } = generateProceduralShape(timeSeed);

        const hue      = rng.int(0, 360);
        const hexColor = Canvas.Color.hslToHex(hue, 100, 50);
        bot.setStyle(hexColor);

        const rad             = Canvas.toRad(angle);
        const rotatedVertices = vertices.map(v => v.rotateY(rad).rotateX(rad * 0.5));

        await bot.drawWireframe(rotatedVertices, edges, CENTER_POS, {
            fov: FOV_DISTANCE,
            spacing: 18
        });

        angle = (angle + 20) % 360;
        await Canvas.sleep(LOOP_DELAY);
    }
}

main().catch(console.error);
