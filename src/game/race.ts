import { CATALOG, DEFAULT_CAR, SHOWCASE, blueprint, resolveCar, type CarDef, type Stage } from "./cars";
import {
  CP_COUNT,
  DEFAULT_TRACK,
  cpIndex,
  trackById,
  type BuiltTrack,
  type Sample,
  type TrackDef,
} from "./track";

export type Actions = {
  throttle: number;
  brake: number;
  steer: number;
  drift: boolean;
};

export type Racer = {
  slot: number;
  carId: string;
  stage: Stage;
  isPlayer: boolean;
  aiMul: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  vx: number;
  vz: number;
  seg: number;
  nextCp: number;
  lap: number;
  finished: boolean;
  finishTime: number;
  lapTime: number;
  bestLap: number;
  lastLapStamp: number;
  drift: number;
  boost: number;
  boosting: boolean;
  wrong: number;
  off: boolean;
  spin: number;
  place: number;
  contact: boolean;
};

export type Mode = "attract" | "garage" | "race" | "done";

export type Tod = "dawn" | "day" | "dusk" | "night" | "dynamic";
export type Weather = "klar" | "regen" | "nebel" | "dynamisch";
export type Difficulty = "leicht" | "normal" | "hart" | "pro";

export type RaceSetup = {
  carId: string;
  stage: Stage;
  opponents: number;
  difficulty: Difficulty;
  tod: Tod;
  weather: Weather;
};

export const DEFAULT_SETUP: RaceSetup = {
  carId: DEFAULT_CAR,
  stage: 0,
  opponents: 5,
  difficulty: "normal",
  tod: "night",
  weather: "klar",
};

const DIFF_MUL: Record<Difficulty, number> = {
  leicht: 0.78,
  normal: 0.94,
  hart: 1.04,
  pro: 1.14,
};

const DIFF_STAGE: Record<Difficulty, number> = {
  leicht: 0,
  normal: 1,
  hart: 2,
  pro: 3,
};

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function angDiff(a: number, b: number) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

export function forwardOf(yaw: number) {
  return { x: -Math.sin(yaw), z: -Math.cos(yaw) };
}

export function rightOf(yaw: number) {
  return { x: Math.cos(yaw), z: -Math.sin(yaw) };
}

export class Race {
  samples: Sample[];
  built: BuiltTrack;
  track: TrackDef;
  half: number;
  racers: Racer[] = [];
  mode: Mode = "attract";
  time = 0;
  playerCar = DEFAULT_CAR;
  setup: RaceSetup = { ...DEFAULT_SETUP };
  showcaseYaw = 0;
  private cpOfSeg: number[];

  constructor() {
    this.built = trackById(DEFAULT_TRACK);
    this.track = this.built.def;
    this.samples = this.built.samples;
    this.half = this.track.half;
    this.cpOfSeg = [];
    this.bindCheckpoints();
    this.spawnAttract();
  }

  private bindCheckpoints() {
    this.cpOfSeg = Array.from({ length: this.samples.length }, () => -1);
    for (let c = 0; c < CP_COUNT; c++) this.cpOfSeg[cpIndex(c, this.samples.length)] = c;
  }

  load(id: string) {
    this.built = trackById(id);
    this.track = this.built.def;
    this.samples = this.built.samples;
    this.half = this.track.half;
    this.bindCheckpoints();
  }

  get player(): Racer | undefined {
    return this.racers.find((r) => r.isPlayer);
  }

  playerForwardSpeed(): number {
    const r = this.player;
    if (!r) return 0;
    const f = forwardOf(r.yaw);
    return r.vx * f.x + r.vz * f.z;
  }

  start(setup: RaceSetup) {
    const carId = blueprint(setup.carId).id;
    const opponents = Math.max(1, Math.min(11, Math.round(setup.opponents)));
    this.setup = { ...setup, carId, opponents, stage: clampStage(setup.stage) };
    this.playerCar = carId;
    this.time = 0;
    this.mode = "race";
    const pool = CATALOG.filter((car) => car.id !== carId);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const swap = pool[i]!;
      pool[i] = pool[j]!;
      pool[j] = swap;
    }
    const cap = DIFF_STAGE[this.setup.difficulty];
    const mul = DIFF_MUL[this.setup.difficulty];
    const grid: { id: string; stage: Stage; player: boolean; mul: number }[] = [
      { id: carId, stage: this.setup.stage, player: true, mul: 1 },
    ];
    for (let i = 0; i < opponents; i++) {
      const foe = pool[i] ?? pool[0]!;
      grid.push({
        id: foe.id,
        stage: (i % (cap + 1)) as Stage,
        player: false,
        mul: mul * (0.96 + (i % 3) * 0.02),
      });
    }
    this.racers = grid.map((entry, i) => this.makeRacer(i, entry.id, entry.stage, entry.player, entry.mul));
  }

  liveTod(): Exclude<Tod, "dynamic"> {
    if (this.setup.tod !== "dynamic") return this.setup.tod;
    const order = ["dawn", "day", "dusk", "night"] as const;
    return order[Math.floor(this.time / 40) % order.length]!;
  }

  liveWeather(): Exclude<Weather, "dynamisch"> {
    if (this.setup.weather !== "dynamisch") return this.setup.weather;
    const order = ["klar", "regen", "nebel"] as const;
    return order[Math.floor(this.time / 35) % order.length]!;
  }

  weatherMul() {
    return this.liveWeather() === "regen" ? 0.86 : 1;
  }

  spawnAttract() {
    this.mode = "attract";
    this.time = 0;
    this.racers = SHOWCASE.map((id, i) => this.makeRacer(i, id, 0, false, 0.94 + (i % 3) * 0.02));
    for (const r of this.racers) {
      const f = forwardOf(r.yaw);
      const sp = 22 + r.slot * 1.5;
      r.vx = f.x * sp;
      r.vz = f.z * sp;
    }
  }

  enterGarage() {
    this.mode = "garage";
  }

  leaveGarageToAttract() {
    this.spawnAttract();
  }

  private makeRacer(slot: number, carId: string, stage: Stage, isPlayer: boolean, aiMul: number): Racer {
    const N = this.samples.length;
    const row = Math.floor(slot / 2);
    const side = slot % 2 === 0 ? -1 : 1;
    const seg = (N - 10 - row * 8 + N) % N;
    const p = this.samples[seg]!;
    const lat = side * Math.min(2.2, Math.max(1.4, (this.half - 1.5) * 0.4));
    const yaw = Math.atan2(-p.tx, -p.tz);
    return {
      slot,
      carId,
      stage,
      isPlayer,
      aiMul,
      x: p.x + p.rx * lat,
      y: p.y,
      z: p.z + p.rz * lat,
      yaw,
      pitch: 0,
      vx: 0,
      vz: 0,
      seg,
      nextCp: 1,
      lap: 0,
      finished: false,
      finishTime: 0,
      lapTime: 0,
      bestLap: Number.POSITIVE_INFINITY,
      lastLapStamp: 0,
      drift: 0,
      boost: 0,
      boosting: false,
      wrong: 0,
      off: false,
      spin: 0,
      place: slot + 1,
      contact: false,
    };
  }

  step(dt: number, actions: Actions) {
    if (this.mode === "garage") {
      this.showcaseYaw += dt * 0.7;
      return;
    }
    this.time += dt;
    for (const r of this.racers) {
      const act = r.isPlayer ? actions : this.ai(r);
      this.integrate(r, act, dt);
      this.updateSeg(r, dt);
      this.wall(r);
    }
    this.separate();
    this.rank();
    const player = this.player;
    if (player?.finished && this.mode === "race") this.mode = "done";
  }

  private ai(r: Racer): Actions {
    const N = this.samples.length;
    const speed = Math.hypot(r.vx, r.vz);
    const p = this.samples[r.seg]!;
    if (speed < 7 || r.wrong > 0.55) {
      r.yaw = Math.atan2(-p.tx, -p.tz);
      const f = forwardOf(r.yaw);
      const kick = Math.max(speed, 18);
      r.vx = f.x * kick;
      r.vz = f.z * kick;
      r.wrong = 0;
      return { throttle: 1, brake: 0, steer: 0, drift: false };
    }
    const curv = p.curvature;
    const ahead = curv > 0.55 ? 5 : curv > 0.22 ? 9 : clamp(10 + Math.floor(speed / 10), 10, 26);
    const target = this.samples[(r.seg + ahead) % N]!;
    const desired = Math.atan2(-(target.x - r.x), -(target.z - r.z));
    const diff = angDiff(desired, r.yaw);
    const steer = clamp(diff * 1.8, -1, 1);
    const hard = curv > 0.42 || Math.abs(diff) > 0.85;
    const soft = curv > 0.16 || Math.abs(diff) > 0.45;
    const brake = hard ? 0.72 : soft ? 0.28 : 0;
    const throttle = hard ? 0.42 : 1;
    return { throttle, brake, steer, drift: false };
  }

  private integrate(r: Racer, a: Actions, dt: number) {
    const car = resolveCar(r.carId, r.stage);
    const fwdDir = forwardOf(r.yaw);
    const right = rightOf(r.yaw);
    let fwd = r.vx * fwdDir.x + r.vz * fwdDir.z;
    let lat = r.vx * right.x + r.vz * right.z;
    const slip = Math.abs(lat);
    const mul = r.isPlayer ? 1 : r.aiMul;
    const maxSpeed = car.maxSpeed * mul * (this.track.dirt ? 0.94 : 1) * this.weatherMul() + (r.boost > 0 ? 9 : 0);

    if (a.brake > 0) {
      if (fwd > 0.4) fwd -= a.brake * 48 * dt;
      else fwd -= a.brake * 24 * dt;
    } else if (a.throttle > 0) {
      fwd += a.throttle * car.accel * mul * dt;
    }

    const drag = a.throttle > 0 && a.brake <= 0 ? 0.2 : 0.62;
    fwd *= Math.exp(-drag * dt);
    if (r.contact) fwd *= Math.exp(-1.8 * dt);
    if (r.off) fwd *= Math.exp(-2.6 * dt);
    if (r.boost > 0) {
      fwd += 20 * dt;
      r.boost = Math.max(0, r.boost - dt);
    } else {
      r.boosting = false;
    }
    fwd = clamp(fwd, -14, maxSpeed);

    const grip = (a.drift ? car.driftGrip : car.grip) * this.track.grip * this.weatherMul();
    lat *= Math.exp(-grip * dt);

    r.vx = fwdDir.x * fwd + right.x * lat;
    r.vz = fwdDir.z * fwd + right.z * lat;

    const speedFactor =
      clamp(Math.abs(fwd) / 16, 0.25, 1) *
      (1 - 0.2 * clamp(Math.abs(fwd) / Math.max(1, car.maxSpeed), 0, 1));
    const reverse = fwd >= -0.15 ? 1 : -1;
    r.yaw += a.steer * car.turn * speedFactor * reverse * dt;

    r.x += r.vx * dt;
    r.z += r.vz * dt;
    r.spin += (fwd * dt) / 0.33;

    const sliding = slip > 2.2 && Math.abs(fwd) > 10;
    if (a.drift && Math.abs(fwd) > 12) {
      if (sliding || Math.abs(a.steer) > 0.25) r.drift = Math.min(1, r.drift + dt * 0.7);
      else r.drift = Math.max(0, r.drift - dt * 0.15);
    } else if (!a.drift) {
      if (r.drift > 0.38) {
        r.boost = 0.5 + r.drift * 1.2;
        r.boosting = true;
        r.drift = 0;
      } else {
        r.drift = Math.max(0, r.drift - dt * 1.6);
      }
    }

    const sample = this.samples[r.seg]!;
    r.y = sample.y;
    r.pitch = Math.asin(clamp(sample.ty, -1, 1));
  }

  respawn(r: Racer) {
    const prev = (r.nextCp - 1 + CP_COUNT) % CP_COUNT;
    const seg = cpIndex(prev, this.samples.length);
    const p = this.samples[seg]!;
    r.seg = seg;
    r.x = p.x;
    r.y = p.y;
    r.z = p.z;
    r.yaw = Math.atan2(-p.tx, -p.tz);
    const f = forwardOf(r.yaw);
    r.vx = f.x * 18;
    r.vz = f.z * 18;
    r.off = false;
    r.wrong = 0;
    r.contact = false;
  }

  private updateSeg(r: Racer, dt: number) {
    const N = this.samples.length;
    let best = r.seg;
    let bestD = Infinity;
    const span = 36;
    for (let k = -span; k <= span; k++) {
      const i = (r.seg + k + N) % N;
      const p = this.samples[i]!;
      const d = (p.x - r.x) ** 2 + (p.z - r.z) ** 2;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    let di = best - r.seg;
    if (di > N / 2) di -= N;
    if (di < -N / 2) di += N;
    if (bestD > (this.half + 22) ** 2 || Math.abs(di) > 28) {
      r.off = true;
      const p = this.samples[r.seg]!;
      r.vx += (p.x - r.x) * 4 * dt;
      r.vz += (p.z - r.z) * 4 * dt;
      return;
    }
    r.off = false;
    if (di > 0) this.walk(r, r.seg, best);
    else if (di < -2) r.wrong = Math.min(1.2, r.wrong + 0.08);
    else r.wrong = Math.max(0, r.wrong - 0.04);
    r.seg = best;
  }

  private walk(r: Racer, from: number, to: number) {
    const N = this.samples.length;
    let i = from;
    let guard = 0;
    while (i !== to && guard++ < 48) {
      i = (i + 1) % N;
      const slot = this.cpOfSeg[i] ?? -1;
      if (slot !== r.nextCp) continue;
      r.nextCp = (r.nextCp + 1) % CP_COUNT;
      if (slot === 0) {
        const lapT = this.time - r.lastLapStamp;
        r.lapTime = lapT;
        if (lapT < r.bestLap) r.bestLap = lapT;
        r.lastLapStamp = this.time;
        r.lap += 1;
        if (r.lap >= this.track.laps && !r.finished) {
          r.finished = true;
          r.finishTime = this.time;
        }
      }
    }
  }

  private wall(r: Racer) {
    const p = this.samples[r.seg]!;
    const lat = (r.x - p.x) * p.rx + (r.z - p.z) * p.rz;
    const limit = this.half - 1.15;
    r.contact = Math.abs(lat) > limit;
    if (!r.contact) return;
    const sign = Math.sign(lat);
    const overflow = Math.abs(lat) - limit;
    r.x -= p.rx * sign * overflow;
    r.z -= p.rz * sign * overflow;
    const vn = r.vx * p.rx + r.vz * p.rz;
    if (vn * sign > 0) {
      r.vx -= p.rx * vn;
      r.vz -= p.rz * vn;
    }
  }

  private separate() {
    const rad = 1.2;
    for (let i = 0; i < this.racers.length; i++) {
      for (let j = i + 1; j < this.racers.length; j++) {
        const a = this.racers[i]!;
        const b = this.racers[j]!;
        let dx = b.x - a.x;
        let dz = b.z - a.z;
        const d = Math.hypot(dx, dz);
        if (d >= rad * 2 || d < 1e-4) continue;
        const push = (rad * 2 - d) / 2;
        dx /= d;
        dz /= d;
        a.x -= dx * push;
        a.z -= dz * push;
        b.x += dx * push;
        b.z += dz * push;
        const rel = (b.vx - a.vx) * dx + (b.vz - a.vz) * dz;
        if (rel < 0) {
          a.vx += dx * rel * 0.5;
          a.vz += dz * rel * 0.5;
          b.vx -= dx * rel * 0.5;
          b.vz -= dz * rel * 0.5;
        }
      }
    }
  }

  private rank() {
    const scored = this.racers.map((r) => ({ r, key: this.progress(r) }));
    scored.sort((a, b) => {
      if (a.r.finished && b.r.finished) return a.r.finishTime - b.r.finishTime;
      if (a.r.finished) return -1;
      if (b.r.finished) return 1;
      return b.key - a.key;
    });
    scored.forEach((s, i) => {
      s.r.place = i + 1;
    });
  }

  progress(r: Racer) {
    const N = this.samples.length;
    const completed = (r.nextCp - 1 + CP_COUNT) % CP_COUNT;
    const from = cpIndex(completed, N);
    let along = r.seg - from;
    if (along < 0) along += N;
    return r.lap * CP_COUNT + completed + Math.min(0.999, along / (N / CP_COUNT));
  }
}

export function carOf(r: Racer): CarDef {
  return resolveCar(r.carId, r.stage);
}

function clampStage(stage: number): Stage {
  if (stage <= 0) return 0;
  if (stage >= 3) return 3;
  return stage as Stage;
}
