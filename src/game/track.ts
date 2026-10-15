export const CP_COUNT = 8;
const SPACING = 14;

export type Vibe = "tokyo" | "vice" | "bali";

export type Sample = {
  x: number;
  y: number;
  z: number;
  tx: number;
  ty: number;
  tz: number;
  rx: number;
  rz: number;
  s: number;
  curvature: number;
};

export type TrackDef = {
  id: string;
  name: string;
  vibe: Vibe;
  place: string;
  blurb: string;
  half: number;
  laps: number;
  dirt: boolean;
  grip: number;
  lengthM: number;
};

export type BuiltTrack = {
  def: TrackDef;
  samples: Sample[];
  length: number;
  elev: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY: number;
  maxY: number;
};

type V2 = { x: number; z: number };

export const VIBES: { id: Vibe; label: string }[] = [
  { id: "tokyo", label: "TOKYO NIGHT" },
  { id: "vice", label: "VICE SUNSET" },
  { id: "bali", label: "BALI DIRT" },
];

type Spec = {
  id: string;
  name: string;
  vibe: Vibe;
  place: string;
  blurb: string;
  half: number;
  laps: number;
  dirt: boolean;
  length: number;
  radius: number;
  pts: [number, number][];
  elev: [number, number][];
};

const course = (
  id: string,
  name: string,
  vibe: Vibe,
  place: string,
  blurb: string,
  half: number,
  laps: number,
  dirt: boolean,
  length: number,
  radius: number,
  pts: [number, number][],
  elev: [number, number][],
): Spec => ({ id, name, vibe, place, blurb, half, laps, dirt, length, radius, pts, elev });

const SPECS: Spec[] = [
  course("panora", "PANORA CREST", "tokyo", "Bergkuppe", "Steiler Anstieg, lange Abfahrt, eine Kuppe.", 6.4, 3, false, 6213, 42, [[0, 0], [520, 30], [980, 180], [860, 620], [420, 980], [40, 860], [-180, 520], [-80, 180]], [[0, 0], [0.18, 40], [0.42, 174], [0.68, 60], [1, 0]]),
  course("monte", "MONTE CALLE", "tokyo", "Hafengasse", "Kurz, eng, Mauern nah. Kaum Luft.", 5.4, 3, false, 3337, 22, [[0, 0], [120, 8], [210, 70], [180, 180], [60, 250], [-40, 210], [-90, 120], [-70, 30], [20, -20]], [[0, 8], [0.35, 42], [0.7, 12], [1, 8]]),
  course("ardenne", "ARDENNE RIDGE", "tokyo", "Höhenkamm", "Ein langes Auf, eine Gerade, die fällt.", 8, 3, false, 7004, 70, [[0, 0], [380, 40], [1400, 280], [2100, 820], [1680, 1400], [700, 1500], [-80, 980], [-220, 360]], [[0, 0], [0.16, 78], [0.34, 40], [0.7, 18], [1, 0]]),
  course("guia", "GUIA NIGHT", "tokyo", "Stadtberg", "Häuserschlucht mit Höhenmetern.", 5.6, 3, false, 6120, 16, [[0, 0], [480, 20], [920, 260], [1040, 700], [640, 1080], [120, 900], [-80, 420]], [[0, 0], [0.25, 28], [0.55, 62], [0.8, 20], [1, 0]]),
  course("sarthe", "SARTHE NUIT", "tokyo", "Lange Nacht", "Zwei ewige Geraden, dazwischen Knicke.", 8.2, 2, false, 13626, 80, [[0, 0], [900, 40], [2600, 80], [2700, 220], [4300, 260], [4450, 80], [6200, 120], [6100, 480], [3400, 920], [900, 780], [200, 420]], [[0, 4], [0.5, 18], [1, 4]]),
  course("kaspi", "KASPI MAUERN", "tokyo", "Ufermauer", "Stadtecken und eine Küstenlange.", 6.2, 3, false, 6003, 28, [[0, 0], [1400, 40], [1680, 220], [1500, 520], [900, 640], [200, 480], [40, 180]], [[0, 2], [0.5, 12], [1, 2]]),
  course("donnor", "DONNOR PARK", "tokyo", "Parktempo", "Fließender Park, schnell, alte Bögen.", 7.2, 3, false, 4020, 36, [[0, 0], [380, 20], [640, 180], [520, 460], [180, 520], [-40, 300], [40, 80]], [[0, 6], [0.4, 24], [0.75, 8], [1, 6]]),
  course("danube", "DANUBE BOWL", "tokyo", "Talsohle", "Enges Tal, Kurve an Kurve.", 6.6, 3, false, 4381, 28, [[0, 0], [260, 8], [420, 180], [280, 400], [20, 520], [-160, 340], [-60, 80]], [[0, 0], [0.3, 22], [0.6, 34], [1, 0]]),
  course("styria", "STYRIA HILL", "tokyo", "Kurz und steil", "Kleine Runde, der Anstieg beißt.", 7.4, 3, false, 4318, 48, [[0, 0], [900, 30], [1100, 280], [700, 520], [80, 360]], [[0, 0], [0.22, 65], [0.55, 20], [1, 0]]),
  course("lagoa", "LAGOA LOOP", "tokyo", "Senke", "Runter in die Senke, wieder hinauf.", 7.2, 3, false, 4309, 34, [[0, 0], [200, 30], [420, 160], [360, 420], [80, 520], [-80, 300], [20, 80], [180, 220], [80, 60]], [[0, 30], [0.28, 4], [0.62, 38], [1, 30]]),

  course("green", "GREEN MILE", "vice", "Langer Rhythmus", "Wellig, viele Richtungswechsel.", 6.2, 1, false, 20832, 30, [[0, 0], [400, 80], [200, 500], [-100, 900], [300, 1300], [800, 1500], [1200, 1100], [1500, 700], [1100, 300], [700, 500], [900, 900], [600, 1200], [200, 1000], [100, 400]], [[0, 0], [0.2, 80], [0.45, 180], [0.62, 40], [0.78, 210], [1, 0]]),
  course("parco", "PARCO VELOCE", "vice", "Wenige Kurven", "Viel Gerade, wenig Verzeihung.", 8.4, 3, false, 5793, 90, [[0, 0], [1100, 20], [1250, 260], [700, 520], [80, 400], [40, 120]], [[0, 2], [1, 2]]),
  course("hatch", "HATCH BOWL", "vice", "Kurze Schüssel", "Kleine Mulde, hohes Tempo.", 6.8, 3, false, 3908, 32, [[0, 0], [280, 10], [460, 160], [300, 360], [40, 300], [-20, 120]], [[0, 8], [0.5, 28], [1, 8]]),
  course("costa", "COSTA TECNICA", "vice", "Letzte Passage", "Lange Gerade, dann ein enges Finale.", 7.6, 3, false, 4657, 40, [[0, 0], [900, 20], [980, 180], [700, 420], [200, 460], [40, 200]], [[0, 4], [0.6, 30], [1, 4]]),
  course("brick", "BRICK OVAL", "vice", "Vier Bögen", "Flach, vier Kurven, eine Ziegelgerade.", 10, 3, false, 4023, 210, [[0, 0], [1000, 0], [1000, 280], [0, 280]], [[0, 0], [1, 0]]),
  course("strip", "NEON STRIP", "vice", "Blockrunde", "Rechtecke um die Häuserblocks.", 6.4, 3, false, 6201, 30, [[0, 0], [1500, 20], [1680, 280], [1400, 640], [400, 700], [20, 300]], [[0, 1], [1, 1]]),
  course("arena", "RING ARENA", "vice", "Boxengasse", "Moderne Schüssel mit langer Boxengasse.", 8, 3, false, 5148, 46, [[0, 0], [700, 10], [860, 220], [500, 520], [40, 400], [-40, 140]], [[0, 6], [0.45, 28], [1, 6]]),
  course("twin", "TWIN PALMS", "vice", "Zwei Nadeln", "Zwei enge Kehren, dazwischen heiß.", 7.8, 3, false, 5543, 38, [[0, 0], [500, 20], [900, 300], [600, 700], [100, 640], [-40, 300], [200, 200]], [[0, 4], [0.5, 22], [1, 4]]),
  course("delta", "DELTA HORN", "vice", "Wird enger", "Eine Gerade, dann zieht es sich zu.", 7.6, 3, false, 5451, 36, [[0, 0], [1100, 30], [980, 400], [400, 620], [80, 280], [200, 40]], [[0, 2], [0.4, 16], [1, 2]]),
  course("coast", "BLACK COAST", "vice", "Am Wasser", "Flach, lang am Ufer entlang.", 7.4, 3, false, 5848, 50, [[0, 0], [1400, 10], [1600, 300], [900, 520], [80, 360], [20, 80]], [[0, 2], [1, 2]]),

  course("mann", "MANN ROAD", "bali", "Schmale Bergstraße", "Schmal, steil, Staub statt Auslauf.", 5.2, 1, true, 60721, 28, [[0, 0], [800, 200], [600, 1600], [-200, 2800], [900, 3600], [2200, 3000], [2600, 1600], [1400, 400], [400, -200]], [[0, 0], [0.22, 160], [0.48, 420], [0.7, 180], [1, 0]]),
  course("eight", "EIGHT CREEK", "bali", "Zwei Bögen", "Zwei Schlaufen, die sich nicht kreuzen.", 7.2, 3, true, 5807, 34, [[0, 0], [300, 20], [520, 200], [400, 480], [80, 420], [20, 200], [200, 260], [360, 160], [200, 40]], [[0, 6], [0.5, 36], [1, 6]]),
  course("palace", "PALACE LOOP", "bali", "Hotelgasse", "Enge Gasse, Sand neben der Spur.", 6.6, 3, true, 5281, 30, [[0, 0], [900, 10], [1100, 200], [700, 520], [200, 400], [40, 120]], [[0, 2], [1, 2]]),
  course("dune", "DUNE BANK", "bali", "Dünenfluss", "Kurze Dünen, fließend, bankig im Gefühl.", 7, 3, true, 4259, 32, [[0, 0], [500, 10], [620, 220], [300, 420], [20, 240], [40, 40]], [[0, 4], [0.35, 18], [0.7, 6], [1, 4]]),
  course("biscayne", "BISCAYNE BAY", "bali", "Marina", "Hafengassen, Palmen, Staub.", 6.2, 3, true, 5412, 26, [[0, 0], [700, 20], [980, 180], [800, 520], [200, 560], [20, 240]], [[0, 2], [1, 2]]),
  course("bospor", "BOSPOR CLIMB", "bali", "Langer Aufstieg", "Ein Aufstieg mit mehreren Scheiteln.", 7.4, 3, true, 5338, 36, [[0, 0], [400, 30], [900, 200], [700, 600], [200, 720], [-40, 300]], [[0, 0], [0.3, 40], [0.55, 72], [0.8, 20], [1, 0]]),
  course("altar", "ALTAR BOWL", "bali", "Stadionschüssel", "Weite Schüssel, ein letzter großer Bogen.", 8, 3, true, 4304, 55, [[0, 0], [600, 20], [780, 300], [300, 560], [-40, 280], [40, 40]], [[0, 2], [0.5, 14], [1, 2]]),
  course("lonestar", "LONE HILL", "bali", "Wellen und Steig", "Esses, dann eine Gerade den Hügel hinauf.", 7.6, 3, true, 5513, 34, [[0, 0], [200, 40], [500, 20], [700, 180], [500, 400], [200, 520], [40, 260]], [[0, 0], [0.25, 12], [0.55, 48], [1, 8]]),
  course("santerno", "SANTERNO RUN", "bali", "Flussbögen", "Schnell am Fluss, alte Bögen.", 7, 3, true, 4909, 32, [[0, 0], [350, 10], [600, 180], [400, 420], [40, 360], [-20, 120]], [[0, 8], [0.4, 30], [1, 8]]),
  course("avenue", "DOUBLE BANK", "bali", "Zwei Geraden", "Zwei Gerade, zwei Bögen, überall Staub.", 8.5, 2, true, 8300, 70, [[0, 0], [2800, 20], [2900, 180], [100, 200]], [[0, 0], [1, 0]]),
];

function filletClosed(pts: V2[], radius: number): V2[] {
  const n = pts.length;
  const out: V2[] = [];
  for (let i = 0; i < n; i++) {
    const a = pts[(i - 1 + n) % n]!;
    const b = pts[i]!;
    const c = pts[(i + 1) % n]!;
    const abx = b.x - a.x;
    const abz = b.z - a.z;
    const bcx = c.x - b.x;
    const bcz = c.z - b.z;
    const lab = Math.hypot(abx, abz) || 1;
    const lbc = Math.hypot(bcx, bcz) || 1;
    const ux = abx / lab;
    const uz = abz / lab;
    const vx = bcx / lbc;
    const vz = bcz / lbc;
    const cross = ux * vz - uz * vx;
    const dot = Math.min(1, Math.max(-1, ux * vx + uz * vz));
    const delta = Math.atan2(cross, dot);
    const abs = Math.abs(delta);
    if (abs < 0.05) {
      out.push({ x: b.x, z: b.z });
      continue;
    }
    const tanHalf = Math.tan(abs / 2);
    let cut = radius / Math.max(0.12, tanHalf);
    cut = Math.min(cut, lab * 0.46, lbc * 0.46);
    const r = cut * Math.max(0.12, tanHalf);
    const p1 = { x: b.x - ux * cut, z: b.z - uz * cut };
    const p2 = { x: b.x + vx * cut, z: b.z + vz * cut };
    const leftX = -uz;
    const leftZ = ux;
    const side = delta > 0 ? 1 : -1;
    const cx = p1.x + leftX * r * side;
    const cz = p1.z + leftZ * r * side;
    const a0 = Math.atan2(p1.z - cz, p1.x - cx);
    const a1 = Math.atan2(p2.z - cz, p2.x - cx);
    let sweep = a1 - a0;
    if (side > 0 && sweep < 0) sweep += Math.PI * 2;
    if (side < 0 && sweep > 0) sweep -= Math.PI * 2;
    const steps = Math.max(3, Math.ceil(Math.abs(sweep) / 0.18));
    for (let s = 0; s <= steps; s++) {
      const t = a0 + sweep * (s / steps);
      out.push({ x: cx + Math.cos(t) * r, z: cz + Math.sin(t) * r });
    }
  }
  return out;
}

function polylineLength(pts: V2[], yAt?: (t: number) => number) {
  let total = 0;
  const n = pts.length;
  let acc = 0;
  const seg = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % n]!;
    seg[i] = Math.hypot(b.x - a.x, b.z - a.z);
    total += seg[i]!;
  }
  if (!yAt || total <= 0) return { total, seg };
  let yLen = 0;
  acc = 0;
  for (let i = 0; i < n; i++) {
    const t0 = acc / total;
    acc += seg[i]!;
    const t1 = acc / total;
    const dy = yAt(t1) - yAt(t0);
    yLen += Math.hypot(seg[i]!, dy);
  }
  return { total: yLen, seg };
}

function elevAt(t: number, keys: [number, number][]) {
  const wrapped = ((t % 1) + 1) % 1;
  const pts = [...keys].sort((a, b) => a[0] - b[0]);
  if (!pts.length) return 0;
  let prevT = pts[pts.length - 1]![0] - 1;
  let prevY = pts[pts.length - 1]![1];
  for (const [kt, ky] of pts) {
    if (wrapped <= kt) {
      const span = kt - prevT || 1;
      const u = (wrapped - prevT) / span;
      return prevY + (ky - prevY) * u;
    }
    prevT = kt;
    prevY = ky;
  }
  const first = pts[0]!;
  const span = first[0] + 1 - prevT || 1;
  const u = (wrapped - prevT) / span;
  return prevY + (first[1] - prevY) * u;
}

function scaleToLength(pts: V2[], yOf: (t: number) => number, target: number): { x: number; y: number; z: number }[] {
  const { total } = polylineLength(pts);
  const s0 = target / Math.max(1, total);
  const flat = pts.map((p) => ({ x: p.x * s0, z: p.z * s0 }));
  const yLen = polylineLength(flat, yOf).total;
  const s = s0 * (target / Math.max(1, yLen));
  const scaled = pts.map((p) => ({ x: p.x * s, z: p.z * s }));
  const measure = polylineLength(scaled);
  const n = scaled.length;
  const out: { x: number; y: number; z: number }[] = [];
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const p = scaled[i]!;
    out.push({ x: p.x, y: yOf(acc / Math.max(1, measure.total)), z: p.z });
    acc += measure.seg[i]!;
  }
  return out;
}

function resample3(raw: { x: number; y: number; z: number }[], spacing: number) {
  const n = raw.length;
  const seg = new Array<number>(n);
  let total = 0;
  for (let i = 0; i < n; i++) {
    const a = raw[i]!;
    const b = raw[(i + 1) % n]!;
    const d = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
    seg[i] = d;
    total += d;
  }
  const count = Math.max(80, Math.round(total / spacing));
  const out: { x: number; y: number; z: number }[] = [];
  const step = total / count;
  let acc = 0;
  let idx = 0;
  for (let s = 0; s < count; s++) {
    const target = s * step;
    let guard = 0;
    while (acc + seg[idx]! < target - 1e-6 && guard++ < n + 2) {
      acc += seg[idx]!;
      idx = (idx + 1) % n;
    }
    const span = seg[idx] || 1;
    const u = Math.min(1, Math.max(0, (target - acc) / span));
    const a = raw[idx]!;
    const b = raw[(idx + 1) % n]!;
    out.push({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, z: a.z + (b.z - a.z) * u });
  }
  return out;
}

function straightest(raw: { x: number; z: number }[]) {
  const n = raw.length;
  const hop = Math.max(4, Math.round(n / 80));
  let best = 0;
  let bestScore = Infinity;
  for (let i = 0; i < n; i++) {
    const a = raw[(i - hop + n) % n]!;
    const b = raw[i]!;
    const c = raw[(i + hop) % n]!;
    const abx = b.x - a.x;
    const abz = b.z - a.z;
    const bcx = c.x - b.x;
    const bcz = c.z - b.z;
    const la = Math.hypot(abx, abz) || 1;
    const lb = Math.hypot(bcx, bcz) || 1;
    const score = 1 - ((abx / la) * (bcx / lb) + (abz / la) * (bcz / lb));
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}

function toSamples(raw: { x: number; y: number; z: number }[]): Sample[] {
  const n = raw.length;
  const samples: Sample[] = [];
  let s = 0;
  for (let i = 0; i < n; i++) {
    const p = raw[i]!;
    const prev = raw[(i - 1 + n) % n]!;
    const next = raw[(i + 1) % n]!;
    let tx = next.x - prev.x;
    let ty = next.y - prev.y;
    let tz = next.z - prev.z;
    const len = Math.hypot(tx, ty, tz) || 1;
    tx /= len;
    ty /= len;
    tz /= len;
    let rx = -tz;
    let rz = tx;
    const rl = Math.hypot(rx, rz) || 1;
    rx /= rl;
    rz /= rl;
    if (i > 0) s += Math.hypot(p.x - prev.x, p.y - prev.y, p.z - prev.z);
    samples.push({ x: p.x, y: p.y, z: p.z, tx, ty, tz, rx, rz, s, curvature: 0 });
  }
  const hop = Math.max(3, Math.round(90 / SPACING));
  for (let i = 0; i < n; i++) {
    const a = samples[i]!;
    const b = samples[(i + hop) % n]!;
    const dot = Math.min(1, Math.max(-1, a.tx * b.tx + a.tz * b.tz));
    a.curvature = 1 - dot;
  }
  return samples;
}

export function buildTrack(def: TrackDef, spec: Spec): BuiltTrack {
  const filleted = filletClosed(spec.pts.map(([x, z]) => ({ x, z })), spec.radius);
  const yOf = (t: number) => elevAt(t, spec.elev);
  const shaped = scaleToLength(filleted, yOf, spec.length);
  let raw = resample3(shaped, SPACING);
  const shift = straightest(raw);
  raw = raw.map((_, i) => raw[(i + shift) % raw.length]!);
  const samples = toSamples(raw);
  const last = samples[samples.length - 1]!;
  const first = samples[0]!;
  const length = last.s + Math.hypot(first.x - last.x, first.y - last.y, first.z - last.z);
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of samples) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minZ = Math.min(minZ, p.z);
    maxZ = Math.max(maxZ, p.z);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  return { def, samples, length, elev: maxY - minY, minX, maxX, minZ, maxZ, minY, maxY };
}

function toDef(spec: Spec): TrackDef {
  return {
    id: spec.id,
    name: spec.name,
    vibe: spec.vibe,
    place: spec.place,
    blurb: spec.blurb,
    half: spec.half,
    laps: spec.laps,
    dirt: spec.dirt,
    grip: spec.dirt ? 0.8 : 1,
    lengthM: spec.length,
  };
}

export const TRACKS: TrackDef[] = SPECS.map(toDef);
export const DEFAULT_TRACK = "panora";

export const BUILDS: Record<string, BuiltTrack> = Object.fromEntries(
  SPECS.map((spec) => [spec.id, buildTrack(toDef(spec), spec)]),
);

export function cpIndex(slot: number, n: number): number {
  return Math.floor((((slot % CP_COUNT) + CP_COUNT) % CP_COUNT) * (n / CP_COUNT));
}

export function trackById(id: string): BuiltTrack {
  return BUILDS[id] ?? BUILDS[DEFAULT_TRACK]!;
}

export function auditTrack(built: BuiltTrack): number {
  const n = built.samples.length;
  const need = built.def.half * 2 + 8;
  let worst = Infinity;
  const step = Math.max(1, Math.floor(n / 180));
  for (let i = 0; i < n; i += step) {
    const a = built.samples[i]!;
    for (let k = Math.floor(n * 0.08); k < n / 2; k += step) {
      const b = built.samples[(i + k) % n]!;
      const d = Math.hypot(a.x - b.x, a.z - b.z);
      if (d < worst) worst = d;
    }
  }
  return worst < need ? worst : Infinity;
}
