// Draw 3d rotating robot
const Canvas = require('../source/true-canvas.js');

const CANVAS_W     = 1000;
const CANVAS_H     = 1000;
const CENTER_POS   = { x: 500, y: 500 };
const FOV_DISTANCE = 500;
const LOOP_DELAY   = 1200;

function addCuboid(cx, cy, cz, w, h, d, vertices, edges) {
    const hw = w / 2;
    const hh = h / 2;
    const hd = d / 2;
    const b = vertices.length;

    vertices.push(
        new Canvas.Vec3(cx - hw, cy - hh, cz - hd),
        new Canvas.Vec3(cx + hw, cy - hh, cz - hd),
        new Canvas.Vec3(cx + hw, cy + hh, cz - hd),
        new Canvas.Vec3(cx - hw, cy + hh, cz - hd),
        new Canvas.Vec3(cx - hw, cy - hh, cz + hd),
        new Canvas.Vec3(cx + hw, cy - hh, cz + hd),
        new Canvas.Vec3(cx + hw, cy + hh, cz + hd),
        new Canvas.Vec3(cx - hw, cy + hh, cz + hd)
    );

    edges.push(
        [b + 0, b + 1], [b + 1, b + 2], [b + 2, b + 3], [b + 3, b + 0],
        [b + 4, b + 5], [b + 5, b + 6], [b + 6, b + 7], [b + 7, b + 4],
        [b + 0, b + 4], [b + 1, b + 5], [b + 2, b + 6], [b + 3, b + 7]
    );
}

const BASE_VERTICES = [];
const EDGES = [];

// Head
addCuboid(0, -140, 0, 40, 40, 40, BASE_VERTICES, EDGES);

// Neck
const neckIdx = BASE_VERTICES.length;
BASE_VERTICES.push(new Canvas.Vec3(0, -120, 0), new Canvas.Vec3(0, -100, 0));
EDGES.push([neckIdx, neckIdx + 1]);

// Torso
addCuboid(0, -40, 0, 70, 100, 40, BASE_VERTICES, EDGES);

// Left & Right Arms
addCuboid(-55, -40, 0, 24, 85, 24, BASE_VERTICES, EDGES);
addCuboid(55, -40, 0, 24, 85, 24, BASE_VERTICES, EDGES);

// Left & Right Legs
addCuboid(-20, 75, 0, 26, 110, 26, BASE_VERTICES, EDGES);
addCuboid(20, 75, 0, 26, 110, 26, BASE_VERTICES, EDGES);

async function main() {
    const bot = new Canvas.Artist({
        userId:              'robot-3d-bot',
        style:               '#00ffcc',
        resolution:          { width: CANVAS_W, height: CANVAS_H },
        concurrency:         48,
        uniqueUserIdPerPath: true,
        pointDelayMs:        0,
    });

    let angle = 0;

    while (true) {
        const rad = Canvas.toRad(angle);

        const rotatedVertices = BASE_VERTICES.map(v => v.rotateY(rad));

        await bot.drawWireframe(rotatedVertices, EDGES, CENTER_POS, {
            fov: FOV_DISTANCE,
            spacing: 18,
        });

        angle = (angle + 15) % 360;

        await Canvas.sleep(LOOP_DELAY);
    }
}

main().catch(console.error);
