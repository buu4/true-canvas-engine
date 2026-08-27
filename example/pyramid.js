// draw 3d rotating pyramid and pubnub text below the pyramid
const Canvas = require('../source/true-canvas.js');

const CANVAS_W = 1000;
const CANVAS_H = 1000;
const CENTER_POS = { x: 820, y: 180 };
const PYRAMID_SIZE = 80;
const FOV_DISTANCE = 400;
const LOOP_DELAY = 2800;

const BASE_VERTICES = [
    new Canvas.Vec3(0, -PYRAMID_SIZE, 0),
    new Canvas.Vec3(-PYRAMID_SIZE, PYRAMID_SIZE * 0.8, -PYRAMID_SIZE),
    new Canvas.Vec3(PYRAMID_SIZE, PYRAMID_SIZE * 0.8, -PYRAMID_SIZE),
    new Canvas.Vec3(PYRAMID_SIZE, PYRAMID_SIZE * 0.8, PYRAMID_SIZE),
    new Canvas.Vec3(-PYRAMID_SIZE, PYRAMID_SIZE * 0.8, PYRAMID_SIZE),
];

const EDGES = [
    [0, 1], [0, 2], [0, 3], [0, 4],
    [1, 2], [2, 3], [3, 4], [4, 1]
];

async function renderFrame(bot, angle, hue) {
    const rad = Canvas.toRad(angle);
    const rotatedVertices = BASE_VERTICES.map(v => v.rotateY(rad));

    const coloredEdges = EDGES.map(([p1, p2], i) => {
        const currentHue = (hue + i * 25) % 360;
        const color = Canvas.Color.hslToHex(currentHue, 100, 50);
        return [p1, p2, { style: color }];
    });

    await bot.drawWireframe(rotatedVertices, coloredEdges, CENTER_POS, {
        fov: FOV_DISTANCE,
        spacing: 12,
    });

    await bot.drawText('PUBNUB', {
        x: 745,
        y: 280,
        fontSize: 24,
        style: '#ff0000',
    });
}

async function main() {
    const bot = new Canvas.Artist({
        userId: 'mini-pyramid',
        style: '#ff0000',
        resolution: { width: CANVAS_W, height: CANVAS_H },
        concurrency: 48,
        uniqueUserIdPerPath: true,
        pointDelayMs: 0,
    });

    let angle = 0;
    let hue = 0;

    while (true) {
        await renderFrame(bot, angle, hue);

        angle = (angle + 12) % 360;
        hue = (hue + 18) % 360;

        await Canvas.sleep(LOOP_DELAY);
    }
}

main().catch(console.error);
