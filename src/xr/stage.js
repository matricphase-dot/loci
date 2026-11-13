/**
 * LOCI — the stage.
 *
 * A procedural stand-in room, shown ONLY when there is no passthrough to draw on
 * (desktop, the Immersive Web Emulator, or a device without immersive-ar).
 *
 * Why this exists:
 *   The first version drew a wireframe grid, which read as "unfinished demo" and
 *   made emulator capture look like a dark void with floating cards. Since many
 *   judges — and many developers — will first meet LOCI through the emulator,
 *   that first impression was underselling the whole idea.
 *
 *   This builds a quiet, stylised room instead: floor, two walls, a table, a
 *   window. It is deliberately desaturated and abstract so it never pretends to
 *   be real passthrough video, but it gives notes something to sit ON, which is
 *   the entire premise of the product.
 *
 *   It is completely absent inside a real immersive-ar session.
 */

import * as THREE from 'three';

const C = {
  floor: 0x1a2228,
  floorLine: 0x243038,
  wall: 0x151c22,
  wallEdge: 0x2a3a42,
  table: 0x1e262c,
  tableEdge: 0x35505a,
  window: 0x2e4a58,
  glow: 0x7fe3c0
};

function edgeBox(w, h, d, color, opacity = 0.55) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    color, transparent: true, opacity, depthWrite: false
  }));
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geo),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: opacity * 1.6 })
  );
  mesh.add(edges);
  return mesh;
}

/**
 * @returns {{group: THREE.Group, setVisible:Function, dispose:Function}}
 */
export function createStage(scene) {
  const group = new THREE.Group();
  group.name = 'loci-stage';

  // ---- floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 9),
    new THREE.MeshBasicMaterial({ color: C.floor })
  );
  floor.rotation.x = -Math.PI / 2;
  group.add(floor);

  const grid = new THREE.GridHelper(9, 18, C.floorLine, C.floorLine);
  grid.material.transparent = true;
  grid.material.opacity = 0.35;
  grid.position.y = 0.002;
  group.add(grid);

  // ---- walls: a corner, so depth is legible and the room reads as a space
  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(6.4, 2.9),
    new THREE.MeshBasicMaterial({ color: C.wall })
  );
  backWall.position.set(0, 1.45, -2.3);
  group.add(backWall);

  const backTrim = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.PlaneGeometry(6.4, 2.9)),
    new THREE.LineBasicMaterial({ color: C.wallEdge, transparent: true, opacity: 0.5 })
  );
  backTrim.position.copy(backWall.position);
  group.add(backTrim);

  const sideWall = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 2.9),
    new THREE.MeshBasicMaterial({ color: C.wall })
  );
  sideWall.rotation.y = Math.PI / 2;
  sideWall.position.set(-3.2, 1.45, -0.4);
  group.add(sideWall);

  // ---- window: a soft rectangle of light on the back wall. The only bright
  // thing in the scene, which gives the eye somewhere to rest and makes the
  // notes read as foreground.
  const win = new THREE.Mesh(
    new THREE.PlaneGeometry(1.05, 1.35),
    new THREE.MeshBasicMaterial({ color: C.window, transparent: true, opacity: 0.42 })
  );
  win.position.set(1.95, 1.62, -2.28);
  group.add(win);

  const winFrame = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.PlaneGeometry(1.05, 1.35)),
    new THREE.LineBasicMaterial({ color: C.tableEdge, transparent: true, opacity: 0.7 })
  );
  winFrame.position.copy(win.position);
  group.add(winFrame);

  const winGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.1, 2.3),
    new THREE.MeshBasicMaterial({
      color: C.glow, transparent: true, opacity: 0.038, depthWrite: false
    })
  );
  winGlow.position.set(1.95, 1.62, -2.27);
  group.add(winGlow);

  // ---- table: the primary anchor surface in the demo
  const tableTop = edgeBox(1.55, 0.06, 0.85, C.table, 0.95);
  tableTop.position.set(0.1, 0.73, -1.15);
  group.add(tableTop);

  // legs, deliberately faint
  for (const [x, z] of [[-0.62, -1.5], [0.82, -1.5], [-0.62, -0.8], [0.82, -0.8]]) {
    const leg = edgeBox(0.05, 0.72, 0.05, C.tableEdge, 0.5);
    leg.position.set(0.1 + x, 0.36, z);
    group.add(leg);
  }

  // ---- shelf on the side wall: a second, higher anchor surface so the demo
  // can show notes conforming to more than one plane.
  const shelf = edgeBox(0.9, 0.05, 0.32, C.table, 0.85);
  shelf.position.set(-3.0, 1.42, -0.7);
  group.add(shelf);

  // ---- ceiling haze, keeps the top of frame from being pure black
  const haze = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 9),
    new THREE.MeshBasicMaterial({ color: 0x101820, transparent: true, opacity: 0.9 })
  );
  haze.rotation.x = Math.PI / 2;
  haze.position.y = 2.95;
  group.add(haze);

  scene.add(group);

  return {
    group,
    setVisible(v) { group.visible = v; },
    dispose() {
      scene.remove(group);
      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material.dispose();
        }
      });
    }
  };
}
