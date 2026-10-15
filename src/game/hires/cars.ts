import * as THREE from "three";

export type PaintOpts = {
  body: string;
  accent?: string;
  interior?: string;
  rims?: string;
};

function hex(c: string) {
  return new THREE.Color(c);
}

function box(w: number, h: number, d: number, x = 0, y = 0, z = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(g);
  m.position.set(x, y, z);
  return m;
}

function cyl(r: number, h: number, seg = 16) {
  return new THREE.CylinderGeometry(r, r, h, seg);
}

export function makeR34(opts: PaintOpts): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({
    color: hex(opts.body),
    roughness: 0.35,
    metalness: 0.72,
  });
  const accent = new THREE.MeshStandardMaterial({
    color: hex(opts.accent ?? "#111111"),
    roughness: 0.4,
    metalness: 0.6,
  });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x8ec8dc,
    roughness: 0.06,
    metalness: 0.15,
    transparent: true,
    opacity: 0.42,
  });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8, metalness: 0.2 });
  const rimMat = new THREE.MeshStandardMaterial({
    color: hex(opts.rims ?? "#c0c0c0"),
    roughness: 0.22,
    metalness: 0.9,
  });
  const intMat = new THREE.MeshStandardMaterial({
    color: hex(opts.interior ?? "#2a1810"),
    roughness: 0.7,
    metalness: 0.1,
  });

  // Chassis / lower body
  g.add(box(1.82, 0.28, 4.15, 0, 0.42, 0));
  const lower = box(1.78, 0.22, 4.05, 0, 0.52, 0);
  lower.material = body;
  g.add(lower);

  // Main cabin
  const cabin = box(1.68, 0.55, 2.1, 0, 0.88, -0.15);
  cabin.material = body;
  g.add(cabin);

  // Roof
  const roof = box(1.45, 0.08, 1.6, 0, 1.18, -0.1);
  roof.material = body;
  g.add(roof);

  // Hood
  const hood = box(1.7, 0.12, 1.35, 0, 0.62, 1.15);
  hood.material = body;
  g.add(hood);

  // Trunk
  const trunk = box(1.65, 0.18, 0.85, 0, 0.68, -1.55);
  trunk.material = body;
  g.add(trunk);

  // Spoiler
  const spoiler = box(1.55, 0.04, 0.22, 0, 1.05, -1.85);
  spoiler.material = accent;
  g.add(spoiler);
  const spoilerLegs = box(0.08, 0.28, 0.08, 0.55, 0.88, -1.78);
  spoilerLegs.material = accent;
  g.add(spoilerLegs);
  const spoilerLegs2 = spoilerLegs.clone();
  spoilerLegs2.position.x = -0.55;
  g.add(spoilerLegs2);

  // Front bumper / splitter
  const front = box(1.85, 0.18, 0.35, 0, 0.38, 1.95);
  front.material = accent;
  g.add(front);

  // Rear bumper
  const rear = box(1.8, 0.2, 0.3, 0, 0.4, -1.95);
  rear.material = accent;
  g.add(rear);

  // Windows
  const windshield = box(1.42, 0.42, 0.08, 0, 1.02, 0.72);
  windshield.material = glass;
  windshield.rotation.x = -0.35;
  g.add(windshield);
  const sideWin = box(0.06, 0.32, 1.15, 0.84, 0.98, -0.1);
  sideWin.material = glass;
  g.add(sideWin);
  const sideWin2 = sideWin.clone();
  sideWin2.position.x = -0.84;
  g.add(sideWin2);
  const rearWin = box(1.35, 0.35, 0.06, 0, 1.0, -0.95);
  rearWin.material = glass;
  rearWin.rotation.x = 0.25;
  g.add(rearWin);

  // Lights
  const headL = box(0.32, 0.12, 0.08, 0.55, 0.55, 2.05);
  headL.material = new THREE.MeshBasicMaterial({ color: 0xfff5cc });
  g.add(headL);
  const headR = headL.clone();
  headR.position.x = -0.55;
  g.add(headR);
  const tailL = box(0.38, 0.1, 0.06, 0.55, 0.58, -2.05);
  tailL.material = new THREE.MeshBasicMaterial({ color: 0xff2218 });
  g.add(tailL);
  const tailR = tailL.clone();
  tailR.position.x = -0.55;
  g.add(tailR);

  // Interior (basic)
  const seat = box(0.45, 0.35, 0.4, 0.35, 0.72, -0.15);
  seat.material = intMat;
  g.add(seat);
  const seat2 = seat.clone();
  seat2.position.x = -0.35;
  g.add(seat2);
  const dash = box(1.4, 0.18, 0.35, 0, 0.82, 0.55);
  dash.material = dark;
  g.add(dash);
  const wheel = new THREE.Mesh(cyl(0.16, 0.04, 12), dark);
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(0.32, 0.9, 0.45);
  g.add(wheel);

  // Wheels
  const tireGeo = cyl(0.34, 0.26, 18);
  tireGeo.rotateZ(Math.PI / 2);
  const rimGeo = cyl(0.2, 0.28, 14);
  rimGeo.rotateZ(Math.PI / 2);
  const positions = [
    [0.92, 0.34, 1.35],
    [-0.92, 0.34, 1.35],
    [0.92, 0.34, -1.35],
    [-0.92, 0.34, -1.35],
  ];
  for (const [x, y, z] of positions) {
    const w = new THREE.Group();
    w.position.set(x, y, z);
    w.add(new THREE.Mesh(tireGeo, dark));
    w.add(new THREE.Mesh(rimGeo, rimMat));
    g.add(w);
  }

  return g;
}

export function makeDiabloVT(opts: PaintOpts): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({
    color: hex(opts.body),
    roughness: 0.28,
    metalness: 0.78,
  });
  const accent = new THREE.MeshStandardMaterial({
    color: hex(opts.accent ?? "#0a0a0a"),
    roughness: 0.35,
    metalness: 0.65,
  });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x6aa8c0,
    roughness: 0.05,
    metalness: 0.2,
    transparent: true,
    opacity: 0.38,
  });
  const dark = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.85, metalness: 0.15 });
  const rimMat = new THREE.MeshStandardMaterial({
    color: hex(opts.rims ?? "#d0d0d0"),
    roughness: 0.18,
    metalness: 0.92,
  });
  const intMat = new THREE.MeshStandardMaterial({
    color: hex(opts.interior ?? "#1a1010"),
    roughness: 0.65,
    metalness: 0.08,
  });

  // Low wedge body
  const lower = box(1.95, 0.22, 4.35, 0, 0.32, 0);
  lower.material = body;
  g.add(lower);
  const mid = box(1.85, 0.32, 3.6, 0, 0.52, 0.1);
  mid.material = body;
  g.add(mid);

  // Cabin (very low)
  const cabin = box(1.55, 0.38, 1.65, 0, 0.78, -0.25);
  cabin.material = body;
  g.add(cabin);
  const roof = box(1.35, 0.06, 1.2, 0, 1.0, -0.2);
  roof.material = body;
  g.add(roof);

  // Long nose
  const nose = box(1.7, 0.18, 1.6, 0, 0.48, 1.35);
  nose.material = body;
  g.add(nose);

  // Rear haunches
  const haunch = box(0.55, 0.35, 1.1, 0.7, 0.62, -0.85);
  haunch.material = body;
  g.add(haunch);
  const haunch2 = haunch.clone();
  haunch2.position.x = -0.7;
  g.add(haunch2);

  // Scissors door hint (black trim)
  const doorLine = box(0.04, 0.32, 1.15, 0.96, 0.72, -0.1);
  doorLine.material = accent;
  g.add(doorLine);
  const doorLine2 = doorLine.clone();
  doorLine2.position.x = -0.96;
  g.add(doorLine2);

  // Rear wing
  const wing = box(1.7, 0.05, 0.28, 0, 0.95, -1.95);
  wing.material = accent;
  g.add(wing);
  const wingLeg = box(0.06, 0.22, 0.08, 0.6, 0.78, -1.85);
  wingLeg.material = accent;
  g.add(wingLeg);
  const wingLeg2 = wingLeg.clone();
  wingLeg2.position.x = -0.6;
  g.add(wingLeg2);

  // Front splitter
  const splitter = box(1.95, 0.06, 0.25, 0, 0.28, 2.05);
  splitter.material = accent;
  g.add(splitter);

  // Glass
  const ws = box(1.3, 0.32, 0.06, 0, 0.88, 0.45);
  ws.material = glass;
  ws.rotation.x = -0.55;
  g.add(ws);
  const sideG = box(0.05, 0.22, 0.85, 0.78, 0.82, -0.15);
  sideG.material = glass;
  g.add(sideG);
  const sideG2 = sideG.clone();
  sideG2.position.x = -0.78;
  g.add(sideG2);

  // Lights
  const hl = box(0.28, 0.08, 0.06, 0.55, 0.48, 2.12);
  hl.material = new THREE.MeshBasicMaterial({ color: 0xfff8e0 });
  g.add(hl);
  const hr = hl.clone();
  hr.position.x = -0.55;
  g.add(hr);
  const tl = box(0.42, 0.08, 0.05, 0.55, 0.52, -2.12);
  tl.material = new THREE.MeshBasicMaterial({ color: 0xff1800 });
  g.add(tl);
  const tr = tl.clone();
  tr.position.x = -0.55;
  g.add(tr);

  // Interior
  const seat = box(0.4, 0.28, 0.35, 0.28, 0.58, -0.2);
  seat.material = intMat;
  g.add(seat);
  const seat2 = seat.clone();
  seat2.position.x = -0.28;
  g.add(seat2);
  const dash = box(1.2, 0.12, 0.28, 0, 0.68, 0.35);
  dash.material = dark;
  g.add(dash);
  const sw = new THREE.Mesh(cyl(0.14, 0.03, 10), dark);
  sw.rotation.z = Math.PI / 2;
  sw.position.set(0.25, 0.75, 0.28);
  g.add(sw);

  // Wheels (larger rear)
  const tireF = cyl(0.32, 0.28, 16);
  tireF.rotateZ(Math.PI / 2);
  const tireR = cyl(0.36, 0.32, 16);
  tireR.rotateZ(Math.PI / 2);
  const rimF = cyl(0.18, 0.3, 12);
  rimF.rotateZ(Math.PI / 2);
  const rimR = cyl(0.2, 0.34, 12);
  rimR.rotateZ(Math.PI / 2);

  const frontPos = [[0.98, 0.32, 1.45], [-0.98, 0.32, 1.45]];
  const rearPos = [[1.02, 0.36, -1.35], [-1.02, 0.36, -1.35]];
  for (const [x, y, z] of frontPos) {
    const w = new THREE.Group();
    w.position.set(x, y, z);
    w.add(new THREE.Mesh(tireF, dark));
    w.add(new THREE.Mesh(rimF, rimMat));
    g.add(w);
  }
  for (const [x, y, z] of rearPos) {
    const w = new THREE.Group();
    w.position.set(x, y, z);
    w.add(new THREE.Mesh(tireR, dark));
    w.add(new THREE.Mesh(rimR, rimMat));
    g.add(w);
  }

  return g;
}

export function setPaint(car: THREE.Group, opts: PaintOpts) {
  car.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const mat = o.material as THREE.MeshStandardMaterial;
    if (!mat || !mat.color) return;
    // Simple: recolor body meshes by checking roughness/metalness range
    if (mat.metalness > 0.6 && mat.roughness < 0.45 && mat.color.getHex() !== 0x1a1a1a) {
      mat.color.set(opts.body);
    }
  });
}
