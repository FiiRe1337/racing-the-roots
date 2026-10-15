import type { Blueprint, Kind, Stage } from "./cars";
import { trackById } from "./track";

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
    return a / 4294967296;
  };
}

function mix(hex: string, amount: number) {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  const ch = (shift: number) => {
    const v = (n >> shift) & 255;
    return Math.max(0, Math.min(255, Math.round(v + amount)));
  };
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
}

type Pt = [number, number];

const SHELL: Record<Kind, Pt[]> = {
  coupe: [[0.08, 0.62], [0.22, 0.58], [0.46, 0.34], [0.62, 0.3], [0.78, 0.4], [0.94, 0.58], [0.96, 0.66], [0.04, 0.66]],
  sedan: [[0.06, 0.64], [0.18, 0.6], [0.34, 0.38], [0.58, 0.36], [0.72, 0.5], [0.94, 0.58], [0.96, 0.68], [0.04, 0.68]],
  hatch: [[0.08, 0.64], [0.2, 0.58], [0.38, 0.36], [0.62, 0.34], [0.84, 0.5], [0.94, 0.64], [0.96, 0.7], [0.04, 0.7]],
  wagon: [[0.06, 0.64], [0.16, 0.58], [0.3, 0.36], [0.72, 0.34], [0.9, 0.48], [0.96, 0.66], [0.04, 0.68]],
  roadster: [[0.08, 0.6], [0.28, 0.52], [0.48, 0.42], [0.7, 0.46], [0.94, 0.58], [0.96, 0.66], [0.04, 0.66]],
  truck: [[0.04, 0.7], [0.08, 0.48], [0.28, 0.4], [0.42, 0.48], [0.46, 0.62], [0.96, 0.64], [0.96, 0.74], [0.04, 0.74]],
  suv: [[0.06, 0.7], [0.14, 0.42], [0.28, 0.32], [0.7, 0.3], [0.88, 0.42], [0.96, 0.66], [0.04, 0.72]],
  wedge: [[0.04, 0.66], [0.16, 0.62], [0.55, 0.4], [0.82, 0.36], [0.98, 0.58], [0.98, 0.66]],
  van: [[0.06, 0.72], [0.1, 0.34], [0.22, 0.28], [0.78, 0.28], [0.92, 0.4], [0.96, 0.68], [0.04, 0.72]],
  f1: [[0.02, 0.58], [0.18, 0.52], [0.34, 0.46], [0.48, 0.4], [0.62, 0.46], [0.86, 0.5], [0.98, 0.56], [0.98, 0.62], [0.02, 0.62]],
};

const GLASS: Record<Kind, Pt[]> = {
  coupe: [[0.4, 0.4], [0.5, 0.34], [0.66, 0.36], [0.6, 0.48]],
  sedan: [[0.32, 0.44], [0.38, 0.38], [0.58, 0.38], [0.66, 0.5]],
  hatch: [[0.36, 0.44], [0.42, 0.36], [0.64, 0.38], [0.72, 0.52]],
  wagon: [[0.28, 0.44], [0.34, 0.36], [0.68, 0.36], [0.74, 0.5]],
  roadster: [[0.4, 0.5], [0.48, 0.44], [0.62, 0.48], [0.56, 0.54]],
  truck: [[0.16, 0.5], [0.22, 0.42], [0.36, 0.44], [0.34, 0.54]],
  suv: [[0.26, 0.42], [0.32, 0.34], [0.62, 0.34], [0.7, 0.48]],
  wedge: [[0.48, 0.48], [0.58, 0.42], [0.74, 0.4], [0.66, 0.52]],
  van: [[0.16, 0.42], [0.22, 0.32], [0.7, 0.32], [0.76, 0.46]],
  f1: [[0.4, 0.5], [0.46, 0.44], [0.54, 0.46], [0.5, 0.52]],
};

function poly(g: CanvasRenderingContext2D, pts: Pt[], ox: number, oy: number, sx: number, sy: number) {
  g.beginPath();
  pts.forEach(([x, y], i) => {
    const px = ox + x * sx;
    const py = oy + y * sy;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  });
  g.closePath();
}

export function paintCar(canvas: HTMLCanvasElement, bp: Blueprint, stage: Stage) {
  const w = canvas.width;
  const h = canvas.height;
  const g = canvas.getContext("2d");
  if (!g) return;
  g.imageSmoothingEnabled = true;
  const sky = g.createLinearGradient(0, 0, w, h);
  sky.addColorStop(0, "#6d7888");
  sky.addColorStop(0.45, "#303846");
  sky.addColorStop(1, "#1a1f28");
  g.fillStyle = sky;
  g.fillRect(0, 0, w, h);
  const floor = g.createLinearGradient(0, h * 0.55, 0, h);
  floor.addColorStop(0, "rgba(255,255,255,0.05)");
  floor.addColorStop(1, "rgba(0,0,0,0.35)");
  g.fillStyle = floor;
  g.fillRect(0, h * 0.58, w, h * 0.42);

  const sx = w * 0.72;
  const sy = h * 0.42;
  const ox = w * 0.14;
  const oy = h * 0.22;
  g.fillStyle = "rgba(0,0,0,0.45)";
  g.beginPath();
  g.ellipse(w * 0.5, oy + sy * 0.78, sx * 0.42, h * 0.06, 0, 0, Math.PI * 2);
  g.fill();

  const shell = SHELL[bp.kind];
  const glass = GLASS[bp.kind];
  const body = g.createLinearGradient(ox, oy, ox + sx, oy + sy);
  body.addColorStop(0, mix(bp.body, 70));
  body.addColorStop(0.35, bp.body);
  body.addColorStop(1, mix(bp.body, -50));
  g.fillStyle = body;
  poly(g, shell, ox, oy, sx, sy);
  g.fill();
  g.strokeStyle = "rgba(255,255,255,0.18)";
  g.lineWidth = 2;
  g.stroke();

  g.fillStyle = "rgba(170,210,230,0.55)";
  poly(g, glass, ox, oy, sx, sy);
  g.fill();

  const stripe = g.createLinearGradient(ox, oy + sy * 0.45, ox + sx, oy + sy * 0.55);
  stripe.addColorStop(0, "rgba(255,255,255,0)");
  stripe.addColorStop(0.45, "rgba(255,255,255,0.28)");
  stripe.addColorStop(0.7, "rgba(255,255,255,0)");
  g.fillStyle = stripe;
  poly(g, shell, ox, oy, sx, sy);
  g.fill();

  if (stage > 0) {
    g.fillStyle = bp.accent;
    const wing = 8 + stage * 7;
    g.fillRect(ox + sx * 0.78, oy + sy * 0.28 - wing, sx * 0.16, 6);
    g.fillRect(ox + sx * 0.84, oy + sy * 0.28 - wing, 4, wing);
  }

  g.fillStyle = "#fff4d2";
  g.beginPath();
  g.roundRect(ox + sx * 0.07, oy + sy * 0.5, sx * 0.055, sy * 0.07, 3);
  g.fill();
  g.fillStyle = "#ff2a2a";
  g.beginPath();
  g.roundRect(ox + sx * 0.88, oy + sy * 0.5, sx * 0.05, sy * 0.08, 3);
  g.fill();

  const wheels: [number, number][] = bp.kind === "f1" ? [[0.22, 0.6], [0.78, 0.6]] : [[0.24, 0.66], [0.78, 0.66]];
  for (const [wx, wy] of wheels) {
    const cx = ox + wx * sx;
    const cy = oy + wy * sy;
    const r = bp.kind === "suv" || bp.kind === "truck" ? h * 0.09 : h * 0.075;
    g.fillStyle = "#1a1c20";
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = bp.accent;
    g.beginPath();
    g.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "rgba(255,255,255,0.35)";
    g.lineWidth = 2;
    g.beginPath();
    g.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
    g.stroke();
  }
}

export function paintTrack(canvas: HTMLCanvasElement, id: string) {
  const built = trackById(id);
  const w = canvas.width;
  const h = canvas.height;
  const g = canvas.getContext("2d");
  if (!g) return;
  g.imageSmoothingEnabled = true;
  const vibe = built.def.vibe;
  const rand = rng(hash(id));
  const sky = g.createLinearGradient(0, 0, 0, h);
  if (vibe === "tokyo") {
    sky.addColorStop(0, "#243044");
    sky.addColorStop(1, "#101820");
  } else if (vibe === "vice") {
    sky.addColorStop(0, "#f3d2b0");
    sky.addColorStop(1, "#d08a68");
  } else {
    sky.addColorStop(0, "#8fb56a");
    sky.addColorStop(1, "#3e6a34");
  }
  g.fillStyle = sky;
  g.fillRect(0, 0, w, h);

  for (let i = 0; i < 80; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const s = 8 + rand() * (vibe === "tokyo" ? 28 : 16);
    g.fillStyle = vibe === "tokyo" ? `rgba(${40 + rand() * 40},${30 + rand() * 20},${70 + rand() * 40},0.35)` : vibe === "vice" ? `rgba(255,255,255,${0.05 + rand() * 0.08})` : `rgba(20,50,20,${0.15 + rand() * 0.25})`;
    g.fillRect(x, y, s, s * (0.6 + rand()));
  }

  const spanX = Math.max(1, built.maxX - built.minX);
  const spanZ = Math.max(1, built.maxZ - built.minZ);
  const pad = 28;
  const scale = Math.min((w - pad * 2) / spanX, (h - pad * 2) / spanZ);
  const ox = (w - spanX * scale) / 2;
  const oy = (h - spanZ * scale) / 2;
  const pts = built.samples.map((s) => [ox + (s.x - built.minX) * scale, oy + (s.z - built.minZ) * scale] as Pt);

  const draw = (width: number, color: string) => {
    g.beginPath();
    pts.forEach((p, i) => (i === 0 ? g.moveTo(p[0], p[1]) : g.lineTo(p[0], p[1])));
    g.closePath();
    g.strokeStyle = color;
    g.lineWidth = width;
    g.lineJoin = "round";
    g.lineCap = "round";
    g.stroke();
  };
  draw(18, "rgba(0,0,0,0.45)");
  draw(12, vibe === "bali" ? "#c4a574" : "#d5d8de");
  draw(8, vibe === "bali" ? "#6b4428" : "#2c3138");
  draw(1.6, "rgba(255,255,255,0.9)");

  const start = pts[0];
  if (start) {
    g.fillStyle = "#ff4d1c";
    g.beginPath();
    g.arc(start[0], start[1], 5, 0, Math.PI * 2);
    g.fill();
  }

  const vignette = g.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.65);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.35)");
  g.fillStyle = vignette;
  g.fillRect(0, 0, w, h);
}
