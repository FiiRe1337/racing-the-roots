import * as THREE from "three";
import { resolveCar, type CarDef, type Part, type Slot, type Stage } from "./cars";
import { createAudio } from "./audio";
import { Race, forwardOf, type Actions, type RaceSetup, type Racer } from "./race";
import { applyDrive, loadProfile, saveProfile, type Profile } from "./profile";
import type { BuiltTrack, Sample, Vibe } from "./track";

export type TouchState = {
  left: boolean;
  right: boolean;
  gas: boolean;
  brake: boolean;
  drift: boolean;
};

export type Cell<T> = { current: T };

export type ResultInfo = {
  place: number;
  total: number;
  time: number;
  bestLap: number;
  carName: string;
  trackName: string;
  bestRace: number | null;
};

export type GameHooks = {
  speed: Cell<HTMLSpanElement | null>;
  lap: Cell<HTMLSpanElement | null>;
  place: Cell<HTMLSpanElement | null>;
  time: Cell<HTMLSpanElement | null>;
  best: Cell<HTMLSpanElement | null>;
  drift: Cell<HTMLDivElement | null>;
  wrong: Cell<HTMLParagraphElement | null>;
  boost: Cell<HTMLParagraphElement | null>;
  map: Cell<HTMLCanvasElement | null>;
  stage: Cell<HTMLDivElement | null>;
  onDone: (info: ResultInfo) => void;
  onSave: (trackId: string, bestLap: number | null, bestRace: number | null) => void;
  onProfile: (profile: Profile) => void;
};

export type GameApi = {
  start: (setup: RaceSetup) => void;
  preview: (carId: string, stage: Stage) => void;
  menu: () => void;
  setTrack: (id: string) => void;
  respawn: () => void;
  unlock: () => void;
  destroy: () => void;
};

const SAVE_KEY = "grid90-tracks-v1";

type SaveFile = Record<string, { bestLap: number | null; bestRace: number | null }>;

type Kit = {
  fog: number;
  density: number;
  ambient: number;
  sun: number;
  asphalt: number;
  shoulder: number;
  rumbleA: number;
  rumbleB: number;
  line: number;
  barrierA: number;
  barrierB: number;
  buildings: number[];
  neons: number[];
  canopy: number;
  trunk: number;
  water: number;
  words: string[];
};

const KITS: Record<Vibe, Kit> = {
  tokyo: {
    fog: 0x10141f,
    density: 0.0032,
    ambient: 0x9aa4b8,
    sun: 0xc5d4ff,
    asphalt: 0x14161c,
    shoulder: 0x0c0e12,
    rumbleA: 0xff4d1c,
    rumbleB: 0xf3efe4,
    line: 0x3dffe8,
    barrierA: 0x2a2e38,
    barrierB: 0xff4d1c,
    buildings: [0x141822, 0x1a1030, 0x101820, 0x221820],
    neons: [0xff4d1c, 0x3dffe8, 0xff4fa3],
    canopy: 0x1d3a32,
    trunk: 0x2a2118,
    water: 0x0c1c2e,
    words: ["NITE", "DRIFT", "GRID", "90"],
  },
  vice: {
    fog: 0xe08a72,
    density: 0.0016,
    ambient: 0xffc8ae,
    sun: 0xffe2c4,
    asphalt: 0x3c4048,
    shoulder: 0x6a5a68,
    rumbleA: 0xf3efe4,
    rumbleB: 0xff4d1c,
    line: 0xf2c14e,
    barrierA: 0xf2a3c7,
    barrierB: 0x7ddec8,
    buildings: [0xf2a3c7, 0xf3e2c0, 0x7ddec8, 0x8fd0e8],
    neons: [0xff4fa3, 0x3dffe8, 0xf2c14e],
    canopy: 0x2f8f4e,
    trunk: 0x6b4428,
    water: 0x1a7ea4,
    words: ["VICE", "PALM", "HEAT", "BAY"],
  },
  bali: {
    fog: 0xd9c4a4,
    density: 0.0024,
    ambient: 0xffe2c0,
    sun: 0xfff0d2,
    asphalt: 0x7a4e2e,
    shoulder: 0x5e8a3c,
    rumbleA: 0xc4a574,
    rumbleB: 0x6b4428,
    line: 0x5c3a22,
    barrierA: 0x8a5a32,
    barrierB: 0xc4a574,
    buildings: [0xb7a48a, 0x8a9a62, 0x6d8a4a, 0xd8c4a0],
    neons: [0xff4d1c, 0xf2c14e, 0xf3efe4],
    canopy: 0x2f7a3a,
    trunk: 0x5a3a22,
    water: 0x3a8f96,
    words: ["DUST", "TEMPLE", "SLOW", "90"],
  },
};

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function loadSave(): SaveFile {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as SaveFile;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function formatTime(t: number) {
  if (!Number.isFinite(t) || t <= 0) return "--:--.--";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  const cs = Math.floor((t % 1) * 100);
  return `${m}:${s.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`;
}

function fillSlot(parts: Part[], slot: Slot) {
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  for (const part of parts) {
    if (part.slot !== slot) continue;
    const g = new THREE.BoxGeometry(Math.max(0.06, part.sx), Math.max(0.06, part.sy), Math.max(0.06, part.sz));
    g.translate(part.x, part.y, part.z);
    const idx = g.getIndex();
    const pos = g.getAttribute("position");
    const nor = g.getAttribute("normal");
    if (!idx) {
      g.dispose();
      continue;
    }
    const col = new THREE.Color(part.color);
    for (let i = 0; i < idx.count; i++) {
      const vi = idx.getX(i);
      positions.push(pos.getX(vi), pos.getY(vi), pos.getZ(vi));
      normals.push(nor.getX(vi), nor.getY(vi), nor.getZ(vi));
      colors.push(col.r, col.g, col.b);
    }
    g.dispose();
  }
  if (!positions.length) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  return geo;
}

type Visual = {
  group: THREE.Group;
  wheels: THREE.Object3D[];
  tails: THREE.MeshBasicMaterial;
  heads: THREE.MeshBasicMaterial;
};

function makeCar(def: CarDef): Visual {
  const group = new THREE.Group();
  group.rotation.order = "YXZ";
  const bodyGeo = fillSlot(def.parts, "body");
  const glassGeo = fillSlot(def.parts, "glass");
  const trimGeo = fillSlot(def.parts, "trim");
  const chunks = [bodyGeo, trimGeo].filter((g): g is THREE.BufferGeometry => !!g);
  if (chunks.length) {
    const merged = mergeGeos(chunks);
    chunks.forEach((g) => g.dispose());
    group.add(new THREE.Mesh(merged, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.38, metalness: 0.62 })));
  }
  if (glassGeo) {
    group.add(new THREE.Mesh(glassGeo, new THREE.MeshStandardMaterial({ color: 0x9ec8dc, roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.45 })));
  }
  const tailGeo = fillSlot(def.parts, "tail");
  const tails = new THREE.MeshBasicMaterial({ color: 0xff2218 });
  if (tailGeo) group.add(new THREE.Mesh(tailGeo, tails));
  const headGeo = fillSlot(def.parts, "head");
  const heads = new THREE.MeshBasicMaterial({ color: 0xfff1c4 });
  if (headGeo) group.add(new THREE.Mesh(headGeo, heads));

  const wheels: THREE.Object3D[] = [];
  const tire = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.92, metalness: 0 });
  const rim = new THREE.MeshStandardMaterial({ color: def.rim, roughness: 0.28, metalness: 0.85 });
  const tireGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.24, 18);
  const rimGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.26, 12);
  tireGeo.rotateZ(Math.PI / 2);
  rimGeo.rotateZ(Math.PI / 2);
  for (const w of def.wheels) {
    for (const sign of [1, -1]) {
      const pivot = new THREE.Group();
      pivot.position.set(w.x * sign, 0.33, w.z);
      pivot.add(new THREE.Mesh(tireGeo, tire));
      pivot.add(new THREE.Mesh(rimGeo, rim));
      group.add(pivot);
      wheels.push(pivot);
    }
  }
  return { group, wheels, tails, heads };
}

function mergeGeos(list: THREE.BufferGeometry[]) {
  let count = 0;
  for (const g of list) count += g.getAttribute("position").count;
  const pos = new Float32Array(count * 3);
  const nor = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  let o = 0;
  for (const g of list) {
    const p = g.getAttribute("position");
    const n = g.getAttribute("normal");
    const c = g.getAttribute("color");
    pos.set(p.array as Float32Array, o * 3);
    nor.set(n.array as Float32Array, o * 3);
    col.set(c.array as Float32Array, o * 3);
    o += p.count;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return geo;
}

function signTexture(title: string, accent: string) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const g = c.getContext("2d");
  if (!g) return null;
  g.imageSmoothingEnabled = true;
  g.fillStyle = "#14171f";
  g.fillRect(0, 0, 256, 64);
  g.fillStyle = accent;
  g.fillRect(0, 0, 10, 64);
  g.fillRect(246, 0, 10, 64);
  g.fillStyle = "#f3efe4";
  g.font = "bold 28px monospace";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(title.slice(0, 16), 128, 34);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeTex(draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const g = c.getContext("2d");
  if (!g) return null;
  draw(g, 512, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

function speckle(g: CanvasRenderingContext2D, w: number, h: number, color: string, n: number, alpha: number) {
  g.fillStyle = color;
  for (let i = 0; i < n; i++) {
    g.globalAlpha = alpha * (0.4 + Math.random());
    const s = 1 + Math.random() * 2.4;
    g.fillRect(Math.random() * w, Math.random() * h, s, s);
  }
  g.globalAlpha = 1;
}

const TEX = {
  wet: makeTex((g, w, h) => {
    g.fillStyle = "#16181e";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#0e1014";
    g.fillRect(w * 0.18, 0, w * 0.22, h);
    g.fillRect(w * 0.6, 0, w * 0.22, h);
    speckle(g, w, h, "#6e7684", 9000, 0.35);
    speckle(g, w, h, "#9fb4c8", 1800, 0.18);
    g.strokeStyle = "rgba(180,200,220,0.18)";
    g.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      g.beginPath();
      g.moveTo(0, (i / 8) * h + 10);
      g.lineTo(w, (i / 8) * h + 40);
      g.stroke();
    }
  }),
  dry: makeTex((g, w, h) => {
    g.fillStyle = "#3a3d44";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#2c2f35";
    g.fillRect(w * 0.2, 0, w * 0.2, h);
    g.fillRect(w * 0.58, 0, w * 0.2, h);
    speckle(g, w, h, "#6a6e76", 8000, 0.4);
    speckle(g, w, h, "#d7c4a8", 1200, 0.15);
  }),
  dirt: makeTex((g, w, h) => {
    g.fillStyle = "#6b4428";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#4e3018";
    g.fillRect(w * 0.16, 0, w * 0.24, h);
    g.fillRect(w * 0.58, 0, w * 0.22, h);
    speckle(g, w, h, "#c4a574", 7000, 0.35);
    speckle(g, w, h, "#2a1a10", 2500, 0.3);
  }),
  grass: makeTex((g, w, h) => {
    g.fillStyle = "#2f6a34";
    g.fillRect(0, 0, w, h);
    speckle(g, w, h, "#1d4a24", 6000, 0.45);
    speckle(g, w, h, "#8fb86a", 4000, 0.28);
  }),
  jungle: makeTex((g, w, h) => {
    g.fillStyle = "#3d6a32";
    g.fillRect(0, 0, w, h);
    speckle(g, w, h, "#23441e", 5000, 0.4);
    speckle(g, w, h, "#c4a574", 1800, 0.2);
  }),
  sand: makeTex((g, w, h) => {
    g.fillStyle = "#d7c4a4";
    g.fillRect(0, 0, w, h);
    speckle(g, w, h, "#f3efe4", 4000, 0.25);
    speckle(g, w, h, "#a88862", 3000, 0.3);
  }),
  windows: makeTex((g, w, h) => {
    g.fillStyle = "#1a1e28";
    g.fillRect(0, 0, w, h);
    for (let y = 8; y < h; y += 18) {
      for (let x = 8; x < w; x += 16) {
        const lit = Math.random() > 0.42;
        g.fillStyle = lit ? (Math.random() > 0.7 ? "#ffd2a8" : "#9fd7ff") : "#10141c";
        g.fillRect(x, y, 8, 10);
      }
    }
  }),
};

function ribbon(samples: Sample[], left: number, right: number, lift: number, material: THREE.Material, along: number) {
  const n = samples.length;
  const pos = new Float32Array(n * 2 * 3);
  const uv = new Float32Array(n * 2 * 2);
  const idx: number[] = [];
  for (let i = 0; i < n; i++) {
    const s = samples[i]!;
    const offs = [left, right];
    for (let k = 0; k < 2; k++) {
      const o = (i * 2 + k) * 3;
      pos[o] = s.x + s.rx * offs[k]!;
      pos[o + 1] = s.y + lift;
      pos[o + 2] = s.z + s.rz * offs[k]!;
      uv[(i * 2 + k) * 2] = k;
      uv[(i * 2 + k) * 2 + 1] = s.s / along;
    }
  }
  for (let i = 0; i < n; i++) {
    const i2 = (i + 1) % n;
    const a = i * 2;
    const b = a + 1;
    const c = i2 * 2;
    const d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, material);
}

function roadMat(map: THREE.Texture | null, rough: number, metal: number) {
  return new THREE.MeshStandardMaterial({ map: map ?? undefined, roughness: rough, metalness: metal, color: 0xffffff });
}

function buildWorld(built: BuiltTrack) {
  const root = new THREE.Group();
  const kit = KITS[built.def.vibe];
  const samples = built.samples;
  const n = samples.length;
  const half = built.def.half;
  const vibe = built.def.vibe;
  const dirt = built.def.dirt;
  const verge = dirt ? TEX.jungle : vibe === "vice" ? TEX.sand : TEX.grass;
  const surface = dirt ? TEX.dirt : vibe === "tokyo" ? TEX.wet : TEX.dry;
  if (verge) root.add(ribbon(samples, -half - 26, -half + 0.2, 0.0, roadMat(verge, 0.95, 0), 8));
  if (verge) root.add(ribbon(samples, half - 0.2, half + 26, 0.0, roadMat(verge, 0.95, 0), 8));
  if (surface) {
    root.add(ribbon(samples, -half, half, 0.03, roadMat(surface, dirt ? 0.94 : vibe === "tokyo" ? 0.38 : 0.72, vibe === "tokyo" ? 0.18 : 0.02), dirt ? 7 : 5));
  }
  const edge = new THREE.MeshBasicMaterial({ color: dirt ? 0xc4a574 : 0xf3efe4 });
  root.add(ribbon(samples, -half + 0.15, -half + 0.38, 0.045, edge, 40));
  root.add(ribbon(samples, half - 0.38, half - 0.15, 0.045, edge, 40));

  const rand = rng(hash(built.def.id));
  const dummy = new THREE.Object3D();
  const length = Math.max(1, built.length);
  const barSpacing = 16;
  const barCount = Math.min(2400, Math.ceil(length / barSpacing) * 2);
  const bar = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: dirt ? 0x8a5a32 : 0xb7bcc4, roughness: dirt ? 0.8 : 0.35, metalness: dirt ? 0.05 : 0.65 }),
    barCount,
  );
  let bi = 0;
  let walked = 0;
  for (let i = 0; i < n && bi < barCount - 1; i++) {
    const a = samples[i]!;
    const b = samples[(i + 1) % n]!;
    walked += Math.hypot(b.x - a.x, b.z - a.z);
    if (walked < barSpacing) continue;
    walked = 0;
    const len = barSpacing * 0.92;
    const yaw = Math.atan2(a.tx, a.tz);
    for (const side of [-1, 1]) {
      dummy.position.set(a.x + a.rx * side * (half + 0.55), a.y + 0.42, a.z + a.rz * side * (half + 0.55));
      dummy.scale.set(dirt ? 0.28 : 0.18, dirt ? 0.7 : 0.55, len);
      dummy.rotation.set(0, yaw, 0);
      dummy.updateMatrix();
      bar.setMatrixAt(bi, dummy.matrix);
      bi++;
    }
  }
  bar.count = bi;
  root.add(bar);

  const dashN = Math.min(1800, Math.floor(length / 18));
  if (!dirt && dashN > 0) {
    const dashes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.02, 2.4), new THREE.MeshBasicMaterial({ color: 0xf3efe4 }), dashN);
    for (let i = 0; i < dashN; i++) {
      const s = samples[Math.floor((i / dashN) * n)]!;
      dummy.position.set(s.x, s.y + 0.06, s.z);
      dummy.scale.set(1, 1, 1);
      dummy.rotation.set(0, Math.atan2(s.tx, s.tz), 0);
      dummy.updateMatrix();
      dashes.setMatrixAt(i, dummy.matrix);
    }
    root.add(dashes);
  }

  const buildSpacing = Math.max(vibe === "tokyo" ? 26 : vibe === "vice" ? 48 : 90, length / (vibe === "tokyo" ? 420 : 180));
  const buildings: { x: number; y: number; z: number; w: number; h: number; d: number; color: number; neon: number }[] = [];
  walked = buildSpacing * 0.5;
  for (let i = 0; i < n && buildings.length < (vibe === "bali" ? 80 : 520); i++) {
    const a = samples[i]!;
    const b = samples[(i + 1) % n]!;
    walked += Math.hypot(b.x - a.x, b.z - a.z);
    if (walked < buildSpacing) continue;
    walked = 0;
    if (rand() < (vibe === "bali" ? 0.55 : 0.12)) continue;
    const side = rand() < 0.5 ? -1 : 1;
    const dist = half + (vibe === "tokyo" ? 14 : 18) + rand() * (vibe === "tokyo" ? 22 : 14);
    const h = vibe === "tokyo" ? 16 + rand() * 70 : vibe === "vice" ? 8 + rand() * 22 : 4 + rand() * 7;
    buildings.push({
      x: a.x + a.rx * side * dist,
      y: a.y,
      z: a.z + a.rz * side * dist,
      w: 8 + rand() * 14,
      h,
      d: 8 + rand() * 14,
      color: kit.buildings[Math.floor(rand() * kit.buildings.length)] ?? kit.buildings[0]!,
      neon: kit.neons[Math.floor(rand() * kit.neons.length)] ?? kit.neons[0]!,
    });
  }
  if (buildings.length && TEX.windows) {
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: vibe === "tokyo" ? 0.45 : 0.7, metalness: vibe === "tokyo" ? 0.2 : 0.04 });
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), bodyMat, buildings.length);
    const wins = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xfff1c4 }), buildings.length);
    buildings.forEach((b, i) => {
      dummy.position.set(b.x, b.y + b.h / 2, b.z);
      dummy.scale.set(b.w, b.h, b.d);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, new THREE.Color(b.color));
      dummy.position.set(b.x, b.y + b.h * 0.62, b.z);
      dummy.scale.set(b.w * 0.92, b.h * 0.45, b.d * 0.92);
      dummy.updateMatrix();
      wins.setMatrixAt(i, dummy.matrix);
      wins.setColorAt(i, new THREE.Color(vibe === "tokyo" ? b.neon : 0xffe2c0));
    });
    root.add(mesh);
    if (vibe !== "bali") root.add(wins);
  }

  const treeN = Math.min(vibe === "tokyo" ? 80 : 700, Math.floor(length / (vibe === "bali" ? 22 : 40)));
  if (treeN > 0) {
    const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.25, 0.4, 1, 6), new THREE.MeshStandardMaterial({ color: kit.trunk, roughness: 0.9 }), treeN);
    const tops = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 7, 5), new THREE.MeshStandardMaterial({ color: kit.canopy, roughness: 0.85 }), treeN);
    for (let i = 0; i < treeN; i++) {
      const s = samples[Math.floor((i / treeN) * n)]!;
      const side = i % 2 === 0 ? 1 : -1;
      const dist = half + 6 + (i % 5) * 3.2;
      const x = s.x + s.rx * side * dist;
      const z = s.z + s.rz * side * dist;
      const th = vibe === "vice" ? 7.5 : vibe === "bali" ? 8.5 : 5;
      dummy.position.set(x, s.y + th / 2, z);
      dummy.scale.set(1, th, 1);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      trunks.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x, s.y + th + (vibe === "vice" ? 1.2 : 2.4), z);
      dummy.scale.set(vibe === "vice" ? 1.6 : 3.2, vibe === "vice" ? 0.7 : 2.6, vibe === "vice" ? 1.6 : 3.2);
      dummy.updateMatrix();
      tops.setMatrixAt(i, dummy.matrix);
    }
    root.add(trunks, tops);
  }

  const lampN = Math.min(420, Math.floor(length / 28));
  if (lampN > 0) {
    const poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.08, 0.12, 1, 6), new THREE.MeshStandardMaterial({ color: 0x2a2e38, metalness: 0.4, roughness: 0.45 }), lampN);
    const heads = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial(), lampN);
    for (let i = 0; i < lampN; i++) {
      const s = samples[Math.floor((i / lampN) * n)]!;
      const side = i % 2 === 0 ? 1 : -1;
      const x = s.x + s.rx * side * (half + 1.8);
      const z = s.z + s.rz * side * (half + 1.8);
      dummy.position.set(x, s.y + 3.2, z);
      dummy.scale.set(1, 6.4, 1);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      poles.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x, s.y + 6.5, z);
      dummy.scale.set(0.9, 0.18, 0.45);
      dummy.updateMatrix();
      heads.setMatrixAt(i, dummy.matrix);
      heads.setColorAt(i, new THREE.Color(vibe === "vice" ? 0xffe2c4 : vibe === "bali" ? 0xf2c14e : kit.neons[i % kit.neons.length]!));
    }
    root.add(poles, heads);
  }

  const start = samples[2] ?? samples[0]!;
  const tex = signTexture(built.def.name, vibe === "vice" ? "#ff4fa3" : vibe === "bali" ? "#f2c14e" : "#3dffe8");
  if (tex) {
    const board = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(28, half * 2.2), 3.2), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
    board.position.set(start.x, start.y + 5.4, start.z);
    board.rotation.y = Math.atan2(-start.tx, -start.tz);
    root.add(board);
  }

  return { root, kit };
}

function disposeTree(obj: THREE.Object3D) {
  obj.traverse((node: THREE.Object3D) => {
    const mesh = node as THREE.Mesh;
    mesh.geometry?.dispose();
    const mat = mesh.material;
    const mats = Array.isArray(mat) ? mat : mat ? [mat] : [];
    for (const m of mats) {
      const mapped = m as THREE.MeshBasicMaterial;
      mapped.map?.dispose();
      m.dispose();
    }
  });
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      setKeys?: (codes: string[]) => void;
      setSteer?: (v: number) => void;
    };
  }
}

export function startGame(canvas: HTMLCanvasElement, touch: TouchState, hooks: GameHooks): GameApi {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(1.25, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, 1, 0.4, 2600);
  const hemi = new THREE.AmbientLight(0xffffff, 1);
  const sun = new THREE.DirectionalLight(0xffffff, 1.35);
  sun.position.set(-80, 140, 40);
  scene.add(hemi, sun);
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 24, 16), new THREE.MeshBasicMaterial({ side: THREE.BackSide, vertexColors: true }));
  paintSky(sky.geometry, 0x10141f, 0x07080c);
  scene.add(sky);

  const race = new Race();
  const visuals = new Map<string, Visual>();
  let shown = "";

  let world = buildWorld(race.built);
  scene.add(world.root);
  let atmoKey = "";
  applyAtmo(true);

  const sparks: { mesh: THREE.Mesh; life: number; vx: number; vy: number; vz: number }[] = [];
  const sparkGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
  for (let i = 0; i < 20; i++) {
    const mesh = new THREE.Mesh(sparkGeo, new THREE.MeshBasicMaterial({ color: 0xff4d1c }));
    mesh.visible = false;
    scene.add(mesh);
    sparks.push({ mesh, life: 0, vx: 0, vy: 0, vz: 0 });
  }
  let sparkI = 0;
  const rain: THREE.Mesh[] = [];
  const rainGeo = new THREE.BoxGeometry(0.05, 0.45, 0.05);
  const rainMat = new THREE.MeshBasicMaterial({ color: 0xd5e4ee });
  for (let i = 0; i < 28; i++) {
    const drop = new THREE.Mesh(rainGeo, rainMat);
    drop.visible = false;
    scene.add(drop);
    rain.push(drop);
  }

  const audio = createAudio();
  const keys = new Set<string>();
  let override: Set<string> | null = null;
  let steerLock: number | null = null;
  let told = false;
  let previewId = "q40";
  let previewStage: Stage = 0;
  let save = loadSave();
  let bestShown = save[race.track.id]?.bestLap ?? null;
  let session = { km: 0, walls: 0, off: 0, wrong: 0, contact: false };
  let sessionOpen = false;

  const camPos = new THREE.Vector3();
  const lookPos = new THREE.Vector3();
  const desired = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();
  let camReady = false;

  function applyAtmo(force = false) {
    const tod = race.liveTod();
    const weather = race.liveWeather();
    const key = `${race.track.vibe}:${tod}:${weather}`;
    if (!force && key === atmoKey) return;
    atmoKey = key;
    const kit = world.kit;
    let fog = kit.fog;
    let density = kit.density;
    let ambient = kit.ambient;
    let sunColor = kit.sun;
    let ambInt = 1;
    let sunInt = 1.15;
    let top = race.track.vibe === "tokyo" ? 0x070814 : race.track.vibe === "vice" ? 0x5a2a62 : 0x7eb0d8;
    if (tod === "day") {
      fog = 0xc5d6e4;
      density = 0.0032;
      ambient = 0xfff6ea;
      sunColor = 0xffffff;
      ambInt = 1.15;
      sunInt = 1.45;
      top = 0x8eb6de;
    } else if (tod === "dawn") {
      fog = 0xf0b090;
      density = 0.0045;
      ambient = 0xffc8ae;
      sunColor = 0xffd0a8;
      top = 0x6a4a78;
    } else if (tod === "dusk") {
      fog = 0xe08a62;
      density = 0.0048;
      ambient = 0xffc2a0;
      sunColor = 0xffb080;
      top = 0x4a2858;
    }
    if (weather === "nebel") density *= 2.6;
    if (weather === "regen") {
      density *= 1.45;
      ambInt *= 0.8;
      sunInt *= 0.7;
    }
    scene.background = new THREE.Color(fog);
    scene.fog = new THREE.FogExp2(fog, density);
    hemi.color.setHex(ambient);
    hemi.intensity = ambInt;
    sun.color.setHex(sunColor);
    sun.intensity = sunInt;
    paintSky(sky.geometry, fog, top);
  }

  function rebuild(id: string) {
    scene.remove(world.root);
    disposeTree(world.root);
    race.load(id);
    world = buildWorld(race.built);
    scene.add(world.root);
    applyAtmo(true);
    bestShown = save[race.track.id]?.bestLap ?? null;
    told = false;
    camReady = false;
    if (race.mode === "attract" || race.mode === "done") race.spawnAttract();
  }

  function remember(kind: "lap" | "race", value: number) {
    const id = race.track.id;
    const row = save[id] ?? { bestLap: null, bestRace: null };
    if (kind === "lap") {
      if (row.bestLap == null || value < row.bestLap) row.bestLap = value;
    } else if (row.bestRace == null || value < row.bestRace) row.bestRace = value;
    save = { ...save, [id]: row };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch {
      /* ignore quota */
    }
    bestShown = row.bestLap;
    hooks.onSave(id, row.bestLap, row.bestRace);
  }

  function readActions(): Actions {
    const down = (code: string) => (override ? override.has(code) : keys.has(code));
    if (!override && race.mode !== "race" && race.mode !== "done") {
      return { throttle: 0, brake: 0, steer: 0, drift: false };
    }
    let steer = 0;
    if (down("KeyA") || down("ArrowLeft") || (!override && touch.left)) steer += 1;
    if (down("KeyD") || down("ArrowRight") || (!override && touch.right)) steer -= 1;
    if (steerLock != null) steer = steerLock;
    const throttle = down("KeyW") || down("ArrowUp") || (!override && touch.gas) ? 1 : 0;
    const brake = down("KeyS") || down("ArrowDown") || (!override && touch.brake) ? 1 : 0;
    const drift = down("Space") || (!override && touch.drift);
    return { throttle, brake, steer: Math.max(-1, Math.min(1, steer)), drift };
  }

  const onKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")) return;
    keys.add(e.code);
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
    if (e.code === "KeyR") {
      const player = race.player;
      if (player && !player.finished) race.respawn(player);
    }
  };
  const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code);
  const clearKeys = () => keys.clear();
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", clearKeys);

  window.__controlsTest = {
    getYaw: () => race.player?.yaw ?? 0,
    getSpeed: () => race.playerForwardSpeed(),
    setKeys: (codes) => {
      override = new Set(codes);
    },
    setSteer: (v) => {
      steerLock = v;
    },
  };

  function resize() {
    const stage = hooks.stage.current ?? canvas.parentElement;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const scale = 1;
    const rw = Math.max(320, Math.floor(rect.width));
    const rh = Math.max(240, Math.floor(rect.height));
    renderer.setPixelRatio(Math.min(1.25, window.devicePixelRatio || 1));
    renderer.setSize(rw, rh, false);
    canvas.style.width = `${rw * scale}px`;
    canvas.style.height = `${rh * scale}px`;
    camera.aspect = rw / rh;
    camera.updateProjectionMatrix();
  }
  resize();
  const observer = new ResizeObserver(() => resize());
  if (hooks.stage.current) observer.observe(hooks.stage.current);

  let last = performance.now();
  let acc = 0;
  let raf = 0;
  let seenLap = 0;

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    acc += dt;
    const actions = readActions();
    let steps = 0;
    while (acc >= 1 / 60 && steps < 5) {
      const before = race.player?.lap ?? 0;
      race.step(1 / 60, actions);
      const player = race.player;
      if (player && player.lap > before && player.lapTime > 1 && player.lapTime < player.bestLap + 0.001) {
        remember("lap", player.bestLap);
      }
      if (player && player.lap > seenLap) seenLap = player.lap;
      if (sessionOpen && race.mode === "race" && player) {
        session.km += (Math.abs(race.playerForwardSpeed()) * (1 / 60)) / 1000;
        if (player.contact && !session.contact) session.walls += 1;
        session.contact = player.contact;
        if (player.off) session.off += 1 / 60;
        if (player.wrong > 0.45) session.wrong += 1 / 60;
      }
      acc -= 1 / 60;
      steps++;
    }

    const showcase = samplesAt(10);
    syncCars();
    applyAtmo(false);
    if (race.mode === "garage") {
      const vis = visuals.get(visKey(previewId, previewStage));
      if (vis) {
        vis.group.visible = true;
        vis.group.position.set(showcase.x, showcase.y + 0.05, showcase.z);
        vis.group.rotation.y = race.showcaseYaw;
        vis.group.rotation.x = 0;
        for (const w of vis.wheels) w.rotation.x = race.showcaseYaw * 2;
      }
      const ang = race.showcaseYaw * 0.65;
      camera.position.set(showcase.x + Math.sin(ang) * 8, showcase.y + 2.5, showcase.z + Math.cos(ang) * 8);
      camera.lookAt(showcase.x, showcase.y + 0.7, showcase.z);
      audio.silence();
    } else {
      for (const r of race.racers) {
        const vis = visuals.get(visKey(r.carId, r.stage));
        if (!vis) continue;
        vis.group.visible = true;
        vis.group.position.set(r.x, r.y + 0.05, r.z);
        vis.group.rotation.y = r.yaw;
        vis.group.rotation.x = r.pitch;
        for (const w of vis.wheels) w.rotation.x = r.spin;
        const bright = (r.isPlayer && actions.brake > 0) || r.boost > 0;
        vis.tails.color.setHex(bright ? 0xfff0f0 : 0xff1e18);
        if ((r.drift > 0.2 || (race.track.dirt && Math.hypot(r.vx, r.vz) > 16)) && Math.random() < 0.4) {
          const f = forwardOf(r.yaw);
          const spark = sparks[sparkI++ % sparks.length]!;
          spark.life = 0.32;
          spark.mesh.visible = true;
          spark.mesh.position.set(r.x - f.x * 1.4, r.y + 0.25, r.z - f.z * 1.4);
          spark.vx = -f.x * 2 + (Math.random() - 0.5) * 3;
          spark.vy = 1.5 + Math.random();
          spark.vz = -f.z * 2 + (Math.random() - 0.5) * 3;
          (spark.mesh.material as THREE.MeshBasicMaterial).color.setHex(race.track.dirt && r.drift < 0.2 ? 0xc4a574 : 0xff4d1c);
        }
      }
      let focus = race.racers[0];
      if ((race.mode === "race" || race.mode === "done") && race.player) focus = race.player;
      else for (const r of race.racers) if (focus && r.place < focus.place) focus = r;
      if (focus) {
        const f = forwardOf(focus.yaw);
        const speed = Math.hypot(focus.vx, focus.vz);
        desired.set(focus.x - f.x * 6.4, focus.y + 2.45, focus.z - f.z * 6.4);
        lookTarget.set(focus.x + f.x * 7, focus.y + 0.85, focus.z + f.z * 7);
        const k = 1 - Math.exp(-5.2 * Math.max(dt, 0.016));
        if (!camReady) {
          camPos.copy(desired);
          lookPos.copy(lookTarget);
          camReady = true;
        }
        camPos.lerp(desired, k);
        lookPos.lerp(lookTarget, k);
        camera.position.copy(camPos);
        camera.lookAt(lookPos);
        const fov = 52 + Math.min(1, speed / 70) * 8 + (focus.boost > 0 ? 3 : 0);
        if (Math.abs(camera.fov - fov) > 0.3) {
          camera.fov = fov;
          camera.updateProjectionMatrix();
        }
        audio.update(speed, focus.isPlayer ? actions.throttle : 0.7, focus.drift, focus.boost > 0);
      }
    }

    for (const spark of sparks) {
      if (spark.life <= 0) continue;
      spark.life -= dt;
      spark.vy -= 6 * dt;
      spark.mesh.position.x += spark.vx * dt;
      spark.mesh.position.y += spark.vy * dt;
      spark.mesh.position.z += spark.vz * dt;
      if (spark.life <= 0) spark.mesh.visible = false;
    }

    const wet = race.liveWeather() === "regen";
    for (const drop of rain) {
      drop.visible = wet;
      if (!wet) continue;
      drop.position.y -= dt * 26;
      if (drop.position.y < camera.position.y - 1) {
        drop.position.set(camera.position.x + (Math.random() - 0.5) * 26, camera.position.y + 6 + Math.random() * 8, camera.position.z + (Math.random() - 0.5) * 26);
      }
    }

    const player = race.player;
    if (player && race.mode === "done" && !told) {
      told = true;
      commit();
      remember("race", player.finishTime);
      const row = save[race.track.id];
      const driven = resolveCar(player.carId, player.stage);
      hooks.onDone({
        place: player.place,
        total: race.racers.length,
        time: player.finishTime,
        bestLap: Number.isFinite(player.bestLap) ? player.bestLap : 0,
        carName: driven.name,
        trackName: race.track.name,
        bestRace: row?.bestRace ?? player.finishTime,
      });
    }

    writeHud(player, actions);
    drawMap();
    sky.position.copy(camera.position);
    renderer.render(scene, camera);
  }

  function visKey(id: string, stage: Stage) {
    return `${id}:${stage}`;
  }

  function syncCars() {
    const need = race.mode === "garage" ? [{ id: previewId, stage: previewStage }] : race.racers.map((r) => ({ id: r.carId, stage: r.stage }));
    const sig = need.map((n) => visKey(n.id, n.stage)).sort().join("|");
    if (sig === shown) return;
    shown = sig;
    const keep = new Set(need.map((n) => visKey(n.id, n.stage)));
    for (const [key, vis] of visuals) {
      if (keep.has(key)) continue;
      scene.remove(vis.group);
      disposeTree(vis.group);
      visuals.delete(key);
    }
    for (const n of need) {
      const key = visKey(n.id, n.stage);
      if (visuals.has(key)) continue;
      const vis = makeCar(resolveCar(n.id, n.stage));
      visuals.set(key, vis);
      scene.add(vis.group);
    }
  }

  function commit() {
    if (!sessionOpen) return;
    sessionOpen = false;
    const next = saveProfile(applyDrive(loadProfile(), session));
    hooks.onProfile(next);
    session = { km: 0, walls: 0, off: 0, wrong: 0, contact: false };
  }

  function samplesAt(i: number) {
    return race.samples[i % race.samples.length]!;
  }

  function writeHud(player: Racer | undefined, _actions: Actions) {
    const p = player;
    if (!p || (race.mode !== "race" && race.mode !== "done")) return;
    const speed = Math.abs(race.playerForwardSpeed()) * 3.6;
    if (hooks.speed.current) hooks.speed.current.textContent = `${Math.round(speed)}`;
    if (hooks.lap.current) hooks.lap.current.textContent = `${Math.min(race.track.laps, p.lap + (p.finished ? 0 : 1))}/${race.track.laps}`;
    if (hooks.place.current) hooks.place.current.textContent = `P${p.place}`;
    if (hooks.time.current) hooks.time.current.textContent = formatTime(p.finished ? p.finishTime : race.time);
    if (hooks.best.current) hooks.best.current.textContent = formatTime(bestShown ?? (Number.isFinite(p.bestLap) ? p.bestLap : 0));
    if (hooks.drift.current) hooks.drift.current.style.width = `${Math.round(p.drift * 100)}%`;
    hooks.wrong.current?.classList.toggle("hidden", p.wrong < 0.45);
    hooks.boost.current?.classList.toggle("hidden", p.boost <= 0 && !_actions.drift);
    if (hooks.boost.current && p.boost > 0) hooks.boost.current.textContent = "BOOST";
    else if (hooks.boost.current && _actions.drift) hooks.boost.current.textContent = "DRIFT";
  }

  function drawMap() {
    const map = hooks.map.current;
    if (!map) return;
    const w = 160;
    const h = 160;
    if (map.width !== w) map.width = w;
    if (map.height !== h) map.height = h;
    const g = map.getContext("2d");
    if (!g) return;
    const b = race.built;
    const spanX = Math.max(1, b.maxX - b.minX);
    const spanZ = Math.max(1, b.maxZ - b.minZ);
    g.imageSmoothingEnabled = true;
    g.clearRect(0, 0, w, h);
    g.fillStyle = "rgba(8,10,14,0.72)";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = race.track.dirt ? "#c4a574" : "#f3efe4";
    g.lineWidth = 3;
    g.lineJoin = "round";
    g.lineCap = "round";
    g.beginPath();
    race.samples.forEach((s, i) => {
      const x = ((s.x - b.minX) / spanX) * (w - 16) + 8;
      const y = ((s.z - b.minZ) / spanZ) * (h - 16) + 8;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    });
    g.closePath();
    g.stroke();
    for (const r of race.racers) {
      const x = ((r.x - b.minX) / spanX) * (w - 16) + 8;
      const y = ((r.z - b.minZ) / spanZ) * (h - 16) + 8;
      g.fillStyle = r.isPlayer ? "#ff4d1c" : "#d7d2c8";
      g.beginPath();
      g.arc(x, y, r.isPlayer ? 4 : 2.5, 0, Math.PI * 2);
      g.fill();
    }
  }

  raf = requestAnimationFrame(frame);

  return {
    start(setup: RaceSetup) {
      commit();
      previewId = setup.carId;
      previewStage = setup.stage;
      told = false;
      seenLap = 0;
      camReady = false;
      shown = "";
      session = { km: 0, walls: 0, off: 0, wrong: 0, contact: false };
      sessionOpen = true;
      race.start(setup);
    },
    preview(carId: string, stage: Stage) {
      if (race.mode === "race") commit();
      previewId = carId;
      previewStage = stage;
      race.enterGarage();
      shown = "";
    },
    menu() {
      if (race.mode === "race") commit();
      race.spawnAttract();
      told = false;
      shown = "";
    },
    setTrack(id: string) {
      if (race.track.id === id && world) return;
      rebuild(id);
    },
    respawn() {
      const player = race.player;
      if (player && !player.finished) race.respawn(player);
    },
    unlock() {
      audio.unlock();
    },
    destroy() {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearKeys);
      if (window.__controlsTest) delete window.__controlsTest;
      disposeTree(world.root);
      renderer.dispose();
    },
  };
}

function paintSky(geo: THREE.BufferGeometry, horizon: number, top: number) {
  const pos = geo.getAttribute("position");
  const colors = new Float32Array(pos.count * 3);
  const a = new THREE.Color(horizon);
  const b = new THREE.Color(top);
  const mix = new THREE.Color();
  const radius = 900;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / radius;
    const t = Math.min(1, Math.max(0, y * 0.5 + 0.5));
    mix.copy(a).lerp(b, t);
    colors[i * 3] = mix.r;
    colors[i * 3 + 1] = mix.g;
    colors[i * 3 + 2] = mix.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
}
