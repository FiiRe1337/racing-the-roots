import { a as DEFAULT_TRACK, c as CATALOG, d as resolveCar, i as saveProfile, l as SHOWCASE, n as applyDrive, o as cpIndex, r as loadProfile, s as trackById, u as blueprint } from "./routes-DuRhc2-3.mjs";
import { C as RepeatWrapping, D as Vector3, E as SphereGeometry, S as PlaneGeometry, T as Scene, _ as MeshBasicMaterial, a as BufferGeometry, b as Object3D, c as CylinderGeometry, d as FogExp2, f as Group, g as Mesh, h as LinearMipmapLinearFilter, i as BufferAttribute, l as DirectionalLight, m as LinearFilter, n as AmbientLight, o as CanvasTexture, p as InstancedMesh, r as BoxGeometry, s as Color, t as WebGLRenderer, u as Float32BufferAttribute, v as MeshStandardMaterial, w as SRGBColorSpace, x as PerspectiveCamera, y as NearestFilter } from "../_libs/three.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/world-DY1qoXmw.js
function createAudio() {
	let ctx = null;
	let osc = null;
	let filter = null;
	let gain = null;
	let noiseGain = null;
	let wasBoost = false;
	function unlock() {
		if (typeof window === "undefined") return;
		const AC = window.AudioContext || window.webkitAudioContext;
		if (!AC) return;
		if (!ctx) {
			ctx = new AC();
			osc = ctx.createOscillator();
			osc.type = "sawtooth";
			filter = ctx.createBiquadFilter();
			filter.type = "lowpass";
			filter.frequency.value = 720;
			gain = ctx.createGain();
			gain.gain.value = 0;
			osc.connect(filter);
			filter.connect(gain);
			gain.connect(ctx.destination);
			osc.start();
			const buffer = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate);
			const data = buffer.getChannelData(0);
			for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
			const noise = ctx.createBufferSource();
			noise.buffer = buffer;
			noise.loop = true;
			const band = ctx.createBiquadFilter();
			band.type = "bandpass";
			band.frequency.value = 900;
			noiseGain = ctx.createGain();
			noiseGain.gain.value = 0;
			noise.connect(band);
			band.connect(noiseGain);
			noiseGain.connect(ctx.destination);
			noise.start();
		}
		if (ctx.state !== "running") ctx.resume();
	}
	function update(speed, throttle, drift, boost) {
		if (!ctx || !osc || !filter || !gain || !noiseGain) return;
		const now = ctx.currentTime;
		const freq = 42 + Math.min(220, Math.abs(speed) * 2.4) + throttle * 36;
		osc.frequency.setTargetAtTime(freq, now, .06);
		filter.frequency.setTargetAtTime(680 + Math.abs(speed) * 18 + throttle * 400, now, .08);
		const vol = Math.min(.07, .012 + Math.abs(speed) / 1400 + throttle * .02);
		gain.gain.setTargetAtTime(vol, now, .05);
		noiseGain.gain.setTargetAtTime(drift > .15 ? .03 : 0, now, .05);
		if (boost && !wasBoost) blip();
		wasBoost = boost;
	}
	function blip() {
		if (!ctx) return;
		const o = ctx.createOscillator();
		const g = ctx.createGain();
		o.type = "square";
		o.frequency.value = 520;
		g.gain.setValueAtTime(.05, ctx.currentTime);
		g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .18);
		o.connect(g);
		g.connect(ctx.destination);
		o.start();
		o.stop(ctx.currentTime + .2);
	}
	function silence() {
		if (!ctx || !gain || !noiseGain) return;
		gain.gain.setTargetAtTime(0, ctx.currentTime, .05);
		noiseGain.gain.setTargetAtTime(0, ctx.currentTime, .05);
	}
	return {
		unlock,
		update,
		silence
	};
}
var DEFAULT_SETUP = {
	carId: "q40",
	stage: 0,
	opponents: 5,
	difficulty: "normal",
	tod: "night",
	weather: "klar"
};
var DIFF_MUL = {
	leicht: .78,
	normal: .94,
	hart: 1.04,
	pro: 1.14
};
var DIFF_STAGE = {
	leicht: 0,
	normal: 1,
	hart: 2,
	pro: 3
};
function clamp(v, a, b) {
	return Math.max(a, Math.min(b, v));
}
function angDiff(a, b) {
	return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}
function forwardOf(yaw) {
	return {
		x: -Math.sin(yaw),
		z: -Math.cos(yaw)
	};
}
function rightOf(yaw) {
	return {
		x: Math.cos(yaw),
		z: -Math.sin(yaw)
	};
}
var Race = class {
	samples;
	built;
	track;
	half;
	racers = [];
	mode = "attract";
	time = 0;
	playerCar = "q40";
	setup = { ...DEFAULT_SETUP };
	showcaseYaw = 0;
	cpOfSeg;
	constructor() {
		this.built = trackById(DEFAULT_TRACK);
		this.track = this.built.def;
		this.samples = this.built.samples;
		this.half = this.track.half;
		this.cpOfSeg = [];
		this.bindCheckpoints();
		this.spawnAttract();
	}
	bindCheckpoints() {
		this.cpOfSeg = Array.from({ length: this.samples.length }, () => -1);
		for (let c = 0; c < 8; c++) this.cpOfSeg[cpIndex(c, this.samples.length)] = c;
	}
	load(id) {
		this.built = trackById(id);
		this.track = this.built.def;
		this.samples = this.built.samples;
		this.half = this.track.half;
		this.bindCheckpoints();
	}
	get player() {
		return this.racers.find((r) => r.isPlayer);
	}
	playerForwardSpeed() {
		const r = this.player;
		if (!r) return 0;
		const f = forwardOf(r.yaw);
		return r.vx * f.x + r.vz * f.z;
	}
	start(setup) {
		const carId = blueprint(setup.carId).id;
		const opponents = Math.max(1, Math.min(11, Math.round(setup.opponents)));
		this.setup = {
			...setup,
			carId,
			opponents,
			stage: clampStage(setup.stage)
		};
		this.playerCar = carId;
		this.time = 0;
		this.mode = "race";
		const pool = CATALOG.filter((car) => car.id !== carId);
		for (let i = pool.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			const swap = pool[i];
			pool[i] = pool[j];
			pool[j] = swap;
		}
		const cap = DIFF_STAGE[this.setup.difficulty];
		const mul = DIFF_MUL[this.setup.difficulty];
		const grid = [{
			id: carId,
			stage: this.setup.stage,
			player: true,
			mul: 1
		}];
		for (let i = 0; i < opponents; i++) {
			const foe = pool[i] ?? pool[0];
			grid.push({
				id: foe.id,
				stage: i % (cap + 1),
				player: false,
				mul: mul * (.96 + i % 3 * .02)
			});
		}
		this.racers = grid.map((entry, i) => this.makeRacer(i, entry.id, entry.stage, entry.player, entry.mul));
	}
	liveTod() {
		if (this.setup.tod !== "dynamic") return this.setup.tod;
		const order = [
			"dawn",
			"day",
			"dusk",
			"night"
		];
		return order[Math.floor(this.time / 40) % order.length];
	}
	liveWeather() {
		if (this.setup.weather !== "dynamisch") return this.setup.weather;
		const order = [
			"klar",
			"regen",
			"nebel"
		];
		return order[Math.floor(this.time / 35) % order.length];
	}
	weatherMul() {
		return this.liveWeather() === "regen" ? .86 : 1;
	}
	spawnAttract() {
		this.mode = "attract";
		this.time = 0;
		this.racers = SHOWCASE.map((id, i) => this.makeRacer(i, id, 0, false, .94 + i % 3 * .02));
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
	makeRacer(slot, carId, stage, isPlayer, aiMul) {
		const N = this.samples.length;
		const row = Math.floor(slot / 2);
		const side = slot % 2 === 0 ? -1 : 1;
		const seg = (N - 10 - row * 8 + N) % N;
		const p = this.samples[seg];
		const lat = side * Math.min(2.2, Math.max(1.4, (this.half - 1.5) * .4));
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
			contact: false
		};
	}
	step(dt, actions) {
		if (this.mode === "garage") {
			this.showcaseYaw += dt * .7;
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
		if (this.player?.finished && this.mode === "race") this.mode = "done";
	}
	ai(r) {
		const N = this.samples.length;
		const speed = Math.hypot(r.vx, r.vz);
		const p = this.samples[r.seg];
		if (speed < 7 || r.wrong > .55) {
			r.yaw = Math.atan2(-p.tx, -p.tz);
			const f = forwardOf(r.yaw);
			const kick = Math.max(speed, 18);
			r.vx = f.x * kick;
			r.vz = f.z * kick;
			r.wrong = 0;
			return {
				throttle: 1,
				brake: 0,
				steer: 0,
				drift: false
			};
		}
		const curv = p.curvature;
		const ahead = curv > .55 ? 5 : curv > .22 ? 9 : clamp(10 + Math.floor(speed / 10), 10, 26);
		const target = this.samples[(r.seg + ahead) % N];
		const diff = angDiff(Math.atan2(-(target.x - r.x), -(target.z - r.z)), r.yaw);
		const steer = clamp(diff * 1.8, -1, 1);
		const hard = curv > .42 || Math.abs(diff) > .85;
		return {
			throttle: hard ? .42 : 1,
			brake: hard ? .72 : curv > .16 || Math.abs(diff) > .45 ? .28 : 0,
			steer,
			drift: false
		};
	}
	integrate(r, a, dt) {
		const car = resolveCar(r.carId, r.stage);
		const fwdDir = forwardOf(r.yaw);
		const right = rightOf(r.yaw);
		let fwd = r.vx * fwdDir.x + r.vz * fwdDir.z;
		let lat = r.vx * right.x + r.vz * right.z;
		const slip = Math.abs(lat);
		const mul = r.isPlayer ? 1 : r.aiMul;
		const maxSpeed = car.maxSpeed * mul * (this.track.dirt ? .94 : 1) * this.weatherMul() + (r.boost > 0 ? 9 : 0);
		if (a.brake > 0) {
			if (fwd > .4) fwd -= a.brake * 48 * dt;
			else fwd -= a.brake * 24 * dt;
		} else if (a.throttle > 0) fwd += a.throttle * car.accel * mul * dt;
		const drag = a.throttle > 0 && a.brake <= 0 ? .2 : .62;
		fwd *= Math.exp(-drag * dt);
		if (r.contact) fwd *= Math.exp(-1.8 * dt);
		if (r.off) fwd *= Math.exp(-2.6 * dt);
		if (r.boost > 0) {
			fwd += 20 * dt;
			r.boost = Math.max(0, r.boost - dt);
		} else r.boosting = false;
		fwd = clamp(fwd, -14, maxSpeed);
		const grip = (a.drift ? car.driftGrip : car.grip) * this.track.grip * this.weatherMul();
		lat *= Math.exp(-grip * dt);
		r.vx = fwdDir.x * fwd + right.x * lat;
		r.vz = fwdDir.z * fwd + right.z * lat;
		const speedFactor = clamp(Math.abs(fwd) / 16, .25, 1) * (1 - .2 * clamp(Math.abs(fwd) / Math.max(1, car.maxSpeed), 0, 1));
		const reverse = fwd >= -.15 ? 1 : -1;
		r.yaw += a.steer * car.turn * speedFactor * reverse * dt;
		r.x += r.vx * dt;
		r.z += r.vz * dt;
		r.spin += fwd * dt / .33;
		const sliding = slip > 2.2 && Math.abs(fwd) > 10;
		if (a.drift && Math.abs(fwd) > 12) {
			if (sliding || Math.abs(a.steer) > .25) r.drift = Math.min(1, r.drift + dt * .7);
			else r.drift = Math.max(0, r.drift - dt * .15);
		} else if (!a.drift) {
			if (r.drift > .38) {
				r.boost = .5 + r.drift * 1.2;
				r.boosting = true;
				r.drift = 0;
			} else r.drift = Math.max(0, r.drift - dt * 1.6);
		}
		const sample = this.samples[r.seg];
		r.y = sample.y;
		r.pitch = Math.asin(clamp(sample.ty, -1, 1));
	}
	respawn(r) {
		const prev = (r.nextCp - 1 + 8) % 8;
		const seg = cpIndex(prev, this.samples.length);
		const p = this.samples[seg];
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
	updateSeg(r, dt) {
		const N = this.samples.length;
		let best = r.seg;
		let bestD = Infinity;
		const span = 36;
		for (let k = -36; k <= span; k++) {
			const i = (r.seg + k + N) % N;
			const p = this.samples[i];
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
			const p = this.samples[r.seg];
			r.vx += (p.x - r.x) * 4 * dt;
			r.vz += (p.z - r.z) * 4 * dt;
			return;
		}
		r.off = false;
		if (di > 0) this.walk(r, r.seg, best);
		else if (di < -2) r.wrong = Math.min(1.2, r.wrong + .08);
		else r.wrong = Math.max(0, r.wrong - .04);
		r.seg = best;
	}
	walk(r, from, to) {
		const N = this.samples.length;
		let i = from;
		let guard = 0;
		while (i !== to && guard++ < 48) {
			i = (i + 1) % N;
			const slot = this.cpOfSeg[i] ?? -1;
			if (slot !== r.nextCp) continue;
			r.nextCp = (r.nextCp + 1) % 8;
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
	wall(r) {
		const p = this.samples[r.seg];
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
	separate() {
		const rad = 1.2;
		for (let i = 0; i < this.racers.length; i++) for (let j = i + 1; j < this.racers.length; j++) {
			const a = this.racers[i];
			const b = this.racers[j];
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
				a.vx += dx * rel * .5;
				a.vz += dz * rel * .5;
				b.vx -= dx * rel * .5;
				b.vz -= dz * rel * .5;
			}
		}
	}
	rank() {
		const scored = this.racers.map((r) => ({
			r,
			key: this.progress(r)
		}));
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
	progress(r) {
		const N = this.samples.length;
		const completed = (r.nextCp - 1 + 8) % 8;
		const from = cpIndex(completed, N);
		let along = r.seg - from;
		if (along < 0) along += N;
		return r.lap * 8 + completed + Math.min(.999, along / (N / 8));
	}
};
function clampStage(stage) {
	if (stage <= 0) return 0;
	if (stage >= 3) return 3;
	return stage;
}
var SAVE_KEY = "grid90-tracks-v1";
var KITS = {
	tokyo: {
		fog: 1053727,
		density: .0032,
		ambient: 10134712,
		sun: 12965119,
		asphalt: 1316380,
		shoulder: 790034,
		rumbleA: 16731420,
		rumbleB: 15986660,
		line: 4063208,
		barrierA: 2764344,
		barrierB: 16731420,
		buildings: [
			1316898,
			1708080,
			1054752,
			2234400
		],
		neons: [
			16731420,
			4063208,
			16732067
		],
		canopy: 1915442,
		trunk: 2760984,
		water: 793646,
		words: [
			"NITE",
			"DRIFT",
			"GRID",
			"90"
		]
	},
	vice: {
		fog: 14715506,
		density: .0016,
		ambient: 16763054,
		sun: 16769732,
		asphalt: 3948616,
		shoulder: 6969960,
		rumbleA: 15986660,
		rumbleB: 16731420,
		line: 15909198,
		barrierA: 15901639,
		barrierB: 8249032,
		buildings: [
			15901639,
			15983296,
			8249032,
			9425128
		],
		neons: [
			16732067,
			4063208,
			15909198
		],
		canopy: 3116878,
		trunk: 7029800,
		water: 1736356,
		words: [
			"VICE",
			"PALM",
			"HEAT",
			"BAY"
		]
	},
	bali: {
		fog: 14271652,
		density: .0024,
		ambient: 16769728,
		sun: 16773330,
		asphalt: 8015406,
		shoulder: 6195772,
		rumbleA: 12887412,
		rumbleB: 7029800,
		line: 6044194,
		barrierA: 9067058,
		barrierB: 12887412,
		buildings: [
			12035210,
			9083490,
			7178826,
			14206112
		],
		neons: [
			16731420,
			15909198,
			15986660
		],
		canopy: 3111482,
		trunk: 5913122,
		water: 3837846,
		words: [
			"DUST",
			"TEMPLE",
			"SLOW",
			"90"
		]
	}
};
function rng(seed) {
	let a = seed >>> 0;
	return () => {
		a |= 0;
		a = a + 1831565813 | 0;
		let t = Math.imul(a ^ a >>> 15, 1 | a);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
function hash(s) {
	let h = 2166136261;
	for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
	return h >>> 0;
}
function loadSave() {
	try {
		const raw = localStorage.getItem(SAVE_KEY);
		if (!raw) return {};
		const parsed = JSON.parse(raw);
		return parsed && typeof parsed === "object" ? parsed : {};
	} catch {
		return {};
	}
}
function formatTime(t) {
	if (!Number.isFinite(t) || t <= 0) return "--:--.--";
	const m = Math.floor(t / 60);
	const s = Math.floor(t % 60);
	const cs = Math.floor(t % 1 * 100);
	return `${m}:${s.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`;
}
function fillSlot(parts, slot) {
	const positions = [];
	const normals = [];
	const colors = [];
	for (const part of parts) {
		if (part.slot !== slot) continue;
		const g = new BoxGeometry(Math.max(.06, part.sx), Math.max(.06, part.sy), Math.max(.06, part.sz));
		g.translate(part.x, part.y, part.z);
		const idx = g.getIndex();
		const pos = g.getAttribute("position");
		const nor = g.getAttribute("normal");
		if (!idx) {
			g.dispose();
			continue;
		}
		const col = new Color(part.color);
		for (let i = 0; i < idx.count; i++) {
			const vi = idx.getX(i);
			positions.push(pos.getX(vi), pos.getY(vi), pos.getZ(vi));
			normals.push(nor.getX(vi), nor.getY(vi), nor.getZ(vi));
			colors.push(col.r, col.g, col.b);
		}
		g.dispose();
	}
	if (!positions.length) return null;
	const geo = new BufferGeometry();
	geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
	geo.setAttribute("normal", new Float32BufferAttribute(normals, 3));
	geo.setAttribute("color", new Float32BufferAttribute(colors, 3));
	return geo;
}
function makeCar(def) {
	const group = new Group();
	group.rotation.order = "YXZ";
	const bodyGeo = fillSlot(def.parts, "body");
	const glassGeo = fillSlot(def.parts, "glass");
	const chunks = [bodyGeo, fillSlot(def.parts, "trim")].filter((g) => !!g);
	if (chunks.length) {
		const merged = mergeGeos(chunks);
		chunks.forEach((g) => g.dispose());
		group.add(new Mesh(merged, new MeshStandardMaterial({
			vertexColors: true,
			roughness: .38,
			metalness: .62
		})));
	}
	if (glassGeo) group.add(new Mesh(glassGeo, new MeshStandardMaterial({
		color: 10406108,
		roughness: .08,
		metalness: .2,
		transparent: true,
		opacity: .45
	})));
	const tailGeo = fillSlot(def.parts, "tail");
	const tails = new MeshBasicMaterial({ color: 16720408 });
	if (tailGeo) group.add(new Mesh(tailGeo, tails));
	const headGeo = fillSlot(def.parts, "head");
	const heads = new MeshBasicMaterial({ color: 16773572 });
	if (headGeo) group.add(new Mesh(headGeo, heads));
	const wheels = [];
	const tire = new MeshStandardMaterial({
		color: 1710618,
		roughness: .92,
		metalness: 0
	});
	const rim = new MeshStandardMaterial({
		color: def.rim,
		roughness: .28,
		metalness: .85
	});
	const tireGeo = new CylinderGeometry(.33, .33, .24, 18);
	const rimGeo = new CylinderGeometry(.18, .18, .26, 12);
	tireGeo.rotateZ(Math.PI / 2);
	rimGeo.rotateZ(Math.PI / 2);
	for (const w of def.wheels) for (const sign of [1, -1]) {
		const pivot = new Group();
		pivot.position.set(w.x * sign, .33, w.z);
		pivot.add(new Mesh(tireGeo, tire));
		pivot.add(new Mesh(rimGeo, rim));
		group.add(pivot);
		wheels.push(pivot);
	}
	return {
		group,
		wheels,
		tails,
		heads
	};
}
function mergeGeos(list) {
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
		pos.set(p.array, o * 3);
		nor.set(n.array, o * 3);
		col.set(c.array, o * 3);
		o += p.count;
	}
	const geo = new BufferGeometry();
	geo.setAttribute("position", new BufferAttribute(pos, 3));
	geo.setAttribute("normal", new BufferAttribute(nor, 3));
	geo.setAttribute("color", new BufferAttribute(col, 3));
	return geo;
}
function signTexture(title, accent) {
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
	const tex = new CanvasTexture(c);
	tex.magFilter = NearestFilter;
	tex.minFilter = NearestFilter;
	tex.colorSpace = SRGBColorSpace;
	return tex;
}
function makeTex(draw) {
	const c = document.createElement("canvas");
	c.width = 512;
	c.height = 512;
	const g = c.getContext("2d");
	if (!g) return null;
	draw(g, 512, 512);
	const tex = new CanvasTexture(c);
	tex.colorSpace = SRGBColorSpace;
	tex.wrapS = RepeatWrapping;
	tex.wrapT = RepeatWrapping;
	tex.anisotropy = 8;
	tex.magFilter = LinearFilter;
	tex.minFilter = LinearMipmapLinearFilter;
	return tex;
}
function speckle(g, w, h, color, n, alpha) {
	g.fillStyle = color;
	for (let i = 0; i < n; i++) {
		g.globalAlpha = alpha * (.4 + Math.random());
		const s = 1 + Math.random() * 2.4;
		g.fillRect(Math.random() * w, Math.random() * h, s, s);
	}
	g.globalAlpha = 1;
}
var TEX = {
	wet: makeTex((g, w, h) => {
		g.fillStyle = "#16181e";
		g.fillRect(0, 0, w, h);
		g.fillStyle = "#0e1014";
		g.fillRect(w * .18, 0, w * .22, h);
		g.fillRect(w * .6, 0, w * .22, h);
		speckle(g, w, h, "#6e7684", 9e3, .35);
		speckle(g, w, h, "#9fb4c8", 1800, .18);
		g.strokeStyle = "rgba(180,200,220,0.18)";
		g.lineWidth = 2;
		for (let i = 0; i < 8; i++) {
			g.beginPath();
			g.moveTo(0, i / 8 * h + 10);
			g.lineTo(w, i / 8 * h + 40);
			g.stroke();
		}
	}),
	dry: makeTex((g, w, h) => {
		g.fillStyle = "#3a3d44";
		g.fillRect(0, 0, w, h);
		g.fillStyle = "#2c2f35";
		g.fillRect(w * .2, 0, w * .2, h);
		g.fillRect(w * .58, 0, w * .2, h);
		speckle(g, w, h, "#6a6e76", 8e3, .4);
		speckle(g, w, h, "#d7c4a8", 1200, .15);
	}),
	dirt: makeTex((g, w, h) => {
		g.fillStyle = "#6b4428";
		g.fillRect(0, 0, w, h);
		g.fillStyle = "#4e3018";
		g.fillRect(w * .16, 0, w * .24, h);
		g.fillRect(w * .58, 0, w * .22, h);
		speckle(g, w, h, "#c4a574", 7e3, .35);
		speckle(g, w, h, "#2a1a10", 2500, .3);
	}),
	grass: makeTex((g, w, h) => {
		g.fillStyle = "#2f6a34";
		g.fillRect(0, 0, w, h);
		speckle(g, w, h, "#1d4a24", 6e3, .45);
		speckle(g, w, h, "#8fb86a", 4e3, .28);
	}),
	jungle: makeTex((g, w, h) => {
		g.fillStyle = "#3d6a32";
		g.fillRect(0, 0, w, h);
		speckle(g, w, h, "#23441e", 5e3, .4);
		speckle(g, w, h, "#c4a574", 1800, .2);
	}),
	sand: makeTex((g, w, h) => {
		g.fillStyle = "#d7c4a4";
		g.fillRect(0, 0, w, h);
		speckle(g, w, h, "#f3efe4", 4e3, .25);
		speckle(g, w, h, "#a88862", 3e3, .3);
	}),
	windows: makeTex((g, w, h) => {
		g.fillStyle = "#1a1e28";
		g.fillRect(0, 0, w, h);
		for (let y = 8; y < h; y += 18) for (let x = 8; x < w; x += 16) {
			g.fillStyle = Math.random() > .42 ? Math.random() > .7 ? "#ffd2a8" : "#9fd7ff" : "#10141c";
			g.fillRect(x, y, 8, 10);
		}
	})
};
function ribbon(samples, left, right, lift, material, along) {
	const n = samples.length;
	const pos = new Float32Array(n * 2 * 3);
	const uv = new Float32Array(n * 2 * 2);
	const idx = [];
	for (let i = 0; i < n; i++) {
		const s = samples[i];
		const offs = [left, right];
		for (let k = 0; k < 2; k++) {
			const o = (i * 2 + k) * 3;
			pos[o] = s.x + s.rx * offs[k];
			pos[o + 1] = s.y + lift;
			pos[o + 2] = s.z + s.rz * offs[k];
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
	const geo = new BufferGeometry();
	geo.setAttribute("position", new BufferAttribute(pos, 3));
	geo.setAttribute("uv", new BufferAttribute(uv, 2));
	geo.setIndex(idx);
	geo.computeVertexNormals();
	return new Mesh(geo, material);
}
function roadMat(map, rough, metal) {
	return new MeshStandardMaterial({
		map: map ?? void 0,
		roughness: rough,
		metalness: metal,
		color: 16777215
	});
}
function buildWorld(built) {
	const root = new Group();
	const kit = KITS[built.def.vibe];
	const samples = built.samples;
	const n = samples.length;
	const half = built.def.half;
	const vibe = built.def.vibe;
	const dirt = built.def.dirt;
	const verge = dirt ? TEX.jungle : vibe === "vice" ? TEX.sand : TEX.grass;
	const surface = dirt ? TEX.dirt : vibe === "tokyo" ? TEX.wet : TEX.dry;
	if (verge) root.add(ribbon(samples, -half - 26, -half + .2, 0, roadMat(verge, .95, 0), 8));
	if (verge) root.add(ribbon(samples, half - .2, half + 26, 0, roadMat(verge, .95, 0), 8));
	if (surface) root.add(ribbon(samples, -half, half, .03, roadMat(surface, dirt ? .94 : vibe === "tokyo" ? .38 : .72, vibe === "tokyo" ? .18 : .02), dirt ? 7 : 5));
	const edge = new MeshBasicMaterial({ color: dirt ? 12887412 : 15986660 });
	root.add(ribbon(samples, -half + .15, -half + .38, .045, edge, 40));
	root.add(ribbon(samples, half - .38, half - .15, .045, edge, 40));
	const rand = rng(hash(built.def.id));
	const dummy = new Object3D();
	const length = Math.max(1, built.length);
	const barSpacing = 16;
	const barCount = Math.min(2400, Math.ceil(length / barSpacing) * 2);
	const bar = new InstancedMesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial({
		color: dirt ? 9067058 : 12041412,
		roughness: dirt ? .8 : .35,
		metalness: dirt ? .05 : .65
	}), barCount);
	let bi = 0;
	let walked = 0;
	for (let i = 0; i < n && bi < barCount - 1; i++) {
		const a = samples[i];
		const b = samples[(i + 1) % n];
		walked += Math.hypot(b.x - a.x, b.z - a.z);
		if (walked < barSpacing) continue;
		walked = 0;
		const len = barSpacing * .92;
		const yaw = Math.atan2(a.tx, a.tz);
		for (const side of [-1, 1]) {
			dummy.position.set(a.x + a.rx * side * (half + .55), a.y + .42, a.z + a.rz * side * (half + .55));
			dummy.scale.set(dirt ? .28 : .18, dirt ? .7 : .55, len);
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
		const dashes = new InstancedMesh(new BoxGeometry(.16, .02, 2.4), new MeshBasicMaterial({ color: 15986660 }), dashN);
		for (let i = 0; i < dashN; i++) {
			const s = samples[Math.floor(i / dashN * n)];
			dummy.position.set(s.x, s.y + .06, s.z);
			dummy.scale.set(1, 1, 1);
			dummy.rotation.set(0, Math.atan2(s.tx, s.tz), 0);
			dummy.updateMatrix();
			dashes.setMatrixAt(i, dummy.matrix);
		}
		root.add(dashes);
	}
	const buildSpacing = Math.max(vibe === "tokyo" ? 26 : vibe === "vice" ? 48 : 90, length / (vibe === "tokyo" ? 420 : 180));
	const buildings = [];
	walked = buildSpacing * .5;
	for (let i = 0; i < n && buildings.length < (vibe === "bali" ? 80 : 520); i++) {
		const a = samples[i];
		const b = samples[(i + 1) % n];
		walked += Math.hypot(b.x - a.x, b.z - a.z);
		if (walked < buildSpacing) continue;
		walked = 0;
		if (rand() < (vibe === "bali" ? .55 : .12)) continue;
		const side = rand() < .5 ? -1 : 1;
		const dist = half + (vibe === "tokyo" ? 14 : 18) + rand() * (vibe === "tokyo" ? 22 : 14);
		const h = vibe === "tokyo" ? 16 + rand() * 70 : vibe === "vice" ? 8 + rand() * 22 : 4 + rand() * 7;
		buildings.push({
			x: a.x + a.rx * side * dist,
			y: a.y,
			z: a.z + a.rz * side * dist,
			w: 8 + rand() * 14,
			h,
			d: 8 + rand() * 14,
			color: kit.buildings[Math.floor(rand() * kit.buildings.length)] ?? kit.buildings[0],
			neon: kit.neons[Math.floor(rand() * kit.neons.length)] ?? kit.neons[0]
		});
	}
	if (buildings.length && TEX.windows) {
		const bodyMat = new MeshStandardMaterial({
			color: 16777215,
			roughness: vibe === "tokyo" ? .45 : .7,
			metalness: vibe === "tokyo" ? .2 : .04
		});
		const mesh = new InstancedMesh(new BoxGeometry(1, 1, 1), bodyMat, buildings.length);
		const wins = new InstancedMesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial({ color: 16773572 }), buildings.length);
		buildings.forEach((b, i) => {
			dummy.position.set(b.x, b.y + b.h / 2, b.z);
			dummy.scale.set(b.w, b.h, b.d);
			dummy.rotation.set(0, 0, 0);
			dummy.updateMatrix();
			mesh.setMatrixAt(i, dummy.matrix);
			mesh.setColorAt(i, new Color(b.color));
			dummy.position.set(b.x, b.y + b.h * .62, b.z);
			dummy.scale.set(b.w * .92, b.h * .45, b.d * .92);
			dummy.updateMatrix();
			wins.setMatrixAt(i, dummy.matrix);
			wins.setColorAt(i, new Color(vibe === "tokyo" ? b.neon : 16769728));
		});
		root.add(mesh);
		if (vibe !== "bali") root.add(wins);
	}
	const treeN = Math.min(vibe === "tokyo" ? 80 : 700, Math.floor(length / (vibe === "bali" ? 22 : 40)));
	if (treeN > 0) {
		const trunks = new InstancedMesh(new CylinderGeometry(.25, .4, 1, 6), new MeshStandardMaterial({
			color: kit.trunk,
			roughness: .9
		}), treeN);
		const tops = new InstancedMesh(new SphereGeometry(1, 7, 5), new MeshStandardMaterial({
			color: kit.canopy,
			roughness: .85
		}), treeN);
		for (let i = 0; i < treeN; i++) {
			const s = samples[Math.floor(i / treeN * n)];
			const side = i % 2 === 0 ? 1 : -1;
			const dist = half + 6 + i % 5 * 3.2;
			const x = s.x + s.rx * side * dist;
			const z = s.z + s.rz * side * dist;
			const th = vibe === "vice" ? 7.5 : vibe === "bali" ? 8.5 : 5;
			dummy.position.set(x, s.y + th / 2, z);
			dummy.scale.set(1, th, 1);
			dummy.rotation.set(0, 0, 0);
			dummy.updateMatrix();
			trunks.setMatrixAt(i, dummy.matrix);
			dummy.position.set(x, s.y + th + (vibe === "vice" ? 1.2 : 2.4), z);
			dummy.scale.set(vibe === "vice" ? 1.6 : 3.2, vibe === "vice" ? .7 : 2.6, vibe === "vice" ? 1.6 : 3.2);
			dummy.updateMatrix();
			tops.setMatrixAt(i, dummy.matrix);
		}
		root.add(trunks, tops);
	}
	const lampN = Math.min(420, Math.floor(length / 28));
	if (lampN > 0) {
		const poles = new InstancedMesh(new CylinderGeometry(.08, .12, 1, 6), new MeshStandardMaterial({
			color: 2764344,
			metalness: .4,
			roughness: .45
		}), lampN);
		const heads = new InstancedMesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial(), lampN);
		for (let i = 0; i < lampN; i++) {
			const s = samples[Math.floor(i / lampN * n)];
			const side = i % 2 === 0 ? 1 : -1;
			const x = s.x + s.rx * side * (half + 1.8);
			const z = s.z + s.rz * side * (half + 1.8);
			dummy.position.set(x, s.y + 3.2, z);
			dummy.scale.set(1, 6.4, 1);
			dummy.rotation.set(0, 0, 0);
			dummy.updateMatrix();
			poles.setMatrixAt(i, dummy.matrix);
			dummy.position.set(x, s.y + 6.5, z);
			dummy.scale.set(.9, .18, .45);
			dummy.updateMatrix();
			heads.setMatrixAt(i, dummy.matrix);
			heads.setColorAt(i, new Color(vibe === "vice" ? 16769732 : vibe === "bali" ? 15909198 : kit.neons[i % kit.neons.length]));
		}
		root.add(poles, heads);
	}
	const start = samples[2] ?? samples[0];
	const tex = signTexture(built.def.name, vibe === "vice" ? "#ff4fa3" : vibe === "bali" ? "#f2c14e" : "#3dffe8");
	if (tex) {
		const board = new Mesh(new PlaneGeometry(Math.min(28, half * 2.2), 3.2), new MeshStandardMaterial({
			map: tex,
			roughness: .6
		}));
		board.position.set(start.x, start.y + 5.4, start.z);
		board.rotation.y = Math.atan2(-start.tx, -start.tz);
		root.add(board);
	}
	return {
		root,
		kit
	};
}
function disposeTree(obj) {
	obj.traverse((node) => {
		const mesh = node;
		mesh.geometry?.dispose();
		const mat = mesh.material;
		const mats = Array.isArray(mat) ? mat : mat ? [mat] : [];
		for (const m of mats) {
			m.map?.dispose();
			m.dispose();
		}
	});
}
function startGame(canvas, touch, hooks) {
	const renderer = new WebGLRenderer({
		canvas,
		antialias: true,
		alpha: false,
		powerPreference: "high-performance"
	});
	renderer.setPixelRatio(Math.min(1.25, window.devicePixelRatio || 1));
	renderer.outputColorSpace = SRGBColorSpace;
	renderer.toneMapping = 4;
	renderer.toneMappingExposure = 1.05;
	const scene = new Scene();
	const camera = new PerspectiveCamera(58, 1, .4, 2600);
	const hemi = new AmbientLight(16777215, 1);
	const sun = new DirectionalLight(16777215, 1.35);
	sun.position.set(-80, 140, 40);
	scene.add(hemi, sun);
	const sky = new Mesh(new SphereGeometry(900, 24, 16), new MeshBasicMaterial({
		side: 1,
		vertexColors: true
	}));
	paintSky(sky.geometry, 1053727, 460812);
	scene.add(sky);
	const race = new Race();
	const visuals = /* @__PURE__ */ new Map();
	let shown = "";
	let world = buildWorld(race.built);
	scene.add(world.root);
	let atmoKey = "";
	applyAtmo(true);
	const sparks = [];
	const sparkGeo = new BoxGeometry(.18, .18, .18);
	for (let i = 0; i < 20; i++) {
		const mesh = new Mesh(sparkGeo, new MeshBasicMaterial({ color: 16731420 }));
		mesh.visible = false;
		scene.add(mesh);
		sparks.push({
			mesh,
			life: 0,
			vx: 0,
			vy: 0,
			vz: 0
		});
	}
	let sparkI = 0;
	const rain = [];
	const rainGeo = new BoxGeometry(.05, .45, .05);
	const rainMat = new MeshBasicMaterial({ color: 14017774 });
	for (let i = 0; i < 28; i++) {
		const drop = new Mesh(rainGeo, rainMat);
		drop.visible = false;
		scene.add(drop);
		rain.push(drop);
	}
	const audio = createAudio();
	const keys = /* @__PURE__ */ new Set();
	let override = null;
	let steerLock = null;
	let told = false;
	let previewId = "q40";
	let previewStage = 0;
	let save = loadSave();
	let bestShown = save[race.track.id]?.bestLap ?? null;
	let session = {
		km: 0,
		walls: 0,
		off: 0,
		wrong: 0,
		contact: false
	};
	let sessionOpen = false;
	const camPos = new Vector3();
	const lookPos = new Vector3();
	const desired = new Vector3();
	const lookTarget = new Vector3();
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
		let top = race.track.vibe === "tokyo" ? 460820 : race.track.vibe === "vice" ? 5909090 : 8302808;
		if (tod === "day") {
			fog = 12965604;
			density = .0032;
			ambient = 16774890;
			sunColor = 16777215;
			ambInt = 1.15;
			sunInt = 1.45;
			top = 9352926;
		} else if (tod === "dawn") {
			fog = 15773840;
			density = .0045;
			ambient = 16763054;
			sunColor = 16765096;
			top = 6965880;
		} else if (tod === "dusk") {
			fog = 14715490;
			density = .0048;
			ambient = 16761504;
			sunColor = 16756864;
			top = 4859992;
		}
		if (weather === "nebel") density *= 2.6;
		if (weather === "regen") {
			density *= 1.45;
			ambInt *= .8;
			sunInt *= .7;
		}
		scene.background = new Color(fog);
		scene.fog = new FogExp2(fog, density);
		hemi.color.setHex(ambient);
		hemi.intensity = ambInt;
		sun.color.setHex(sunColor);
		sun.intensity = sunInt;
		paintSky(sky.geometry, fog, top);
	}
	function rebuild(id) {
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
	function remember(kind, value) {
		const id = race.track.id;
		const row = save[id] ?? {
			bestLap: null,
			bestRace: null
		};
		if (kind === "lap") {
			if (row.bestLap == null || value < row.bestLap) row.bestLap = value;
		} else if (row.bestRace == null || value < row.bestRace) row.bestRace = value;
		save = {
			...save,
			[id]: row
		};
		try {
			localStorage.setItem(SAVE_KEY, JSON.stringify(save));
		} catch {}
		bestShown = row.bestLap;
		hooks.onSave(id, row.bestLap, row.bestRace);
	}
	function readActions() {
		const down = (code) => override ? override.has(code) : keys.has(code);
		if (!override && race.mode !== "race" && race.mode !== "done") return {
			throttle: 0,
			brake: 0,
			steer: 0,
			drift: false
		};
		let steer = 0;
		if (down("KeyA") || down("ArrowLeft") || !override && touch.left) steer += 1;
		if (down("KeyD") || down("ArrowRight") || !override && touch.right) steer -= 1;
		if (steerLock != null) steer = steerLock;
		const throttle = down("KeyW") || down("ArrowUp") || !override && touch.gas ? 1 : 0;
		const brake = down("KeyS") || down("ArrowDown") || !override && touch.brake ? 1 : 0;
		const drift = down("Space") || !override && touch.drift;
		return {
			throttle,
			brake,
			steer: Math.max(-1, Math.min(1, steer)),
			drift
		};
	}
	const onKeyDown = (e) => {
		const target = e.target;
		if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")) return;
		keys.add(e.code);
		if ([
			"Space",
			"ArrowUp",
			"ArrowDown",
			"ArrowLeft",
			"ArrowRight"
		].includes(e.code)) e.preventDefault();
		if (e.code === "KeyR") {
			const player = race.player;
			if (player && !player.finished) race.respawn(player);
		}
	};
	const onKeyUp = (e) => keys.delete(e.code);
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
		}
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
	function frame(now) {
		raf = requestAnimationFrame(frame);
		const dt = Math.min(.05, (now - last) / 1e3);
		last = now;
		acc += dt;
		const actions = readActions();
		let steps = 0;
		while (acc >= 1 / 60 && steps < 5) {
			const before = race.player?.lap ?? 0;
			race.step(1 / 60, actions);
			const player = race.player;
			if (player && player.lap > before && player.lapTime > 1 && player.lapTime < player.bestLap + .001) remember("lap", player.bestLap);
			if (player && player.lap > seenLap) seenLap = player.lap;
			if (sessionOpen && race.mode === "race" && player) {
				session.km += Math.abs(race.playerForwardSpeed()) * (1 / 60) / 1e3;
				if (player.contact && !session.contact) session.walls += 1;
				session.contact = player.contact;
				if (player.off) session.off += 1 / 60;
				if (player.wrong > .45) session.wrong += 1 / 60;
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
				vis.group.position.set(showcase.x, showcase.y + .05, showcase.z);
				vis.group.rotation.y = race.showcaseYaw;
				vis.group.rotation.x = 0;
				for (const w of vis.wheels) w.rotation.x = race.showcaseYaw * 2;
			}
			const ang = race.showcaseYaw * .65;
			camera.position.set(showcase.x + Math.sin(ang) * 8, showcase.y + 2.5, showcase.z + Math.cos(ang) * 8);
			camera.lookAt(showcase.x, showcase.y + .7, showcase.z);
			audio.silence();
		} else {
			for (const r of race.racers) {
				const vis = visuals.get(visKey(r.carId, r.stage));
				if (!vis) continue;
				vis.group.visible = true;
				vis.group.position.set(r.x, r.y + .05, r.z);
				vis.group.rotation.y = r.yaw;
				vis.group.rotation.x = r.pitch;
				for (const w of vis.wheels) w.rotation.x = r.spin;
				const bright = r.isPlayer && actions.brake > 0 || r.boost > 0;
				vis.tails.color.setHex(bright ? 16773360 : 16719384);
				if ((r.drift > .2 || race.track.dirt && Math.hypot(r.vx, r.vz) > 16) && Math.random() < .4) {
					const f = forwardOf(r.yaw);
					const spark = sparks[sparkI++ % sparks.length];
					spark.life = .32;
					spark.mesh.visible = true;
					spark.mesh.position.set(r.x - f.x * 1.4, r.y + .25, r.z - f.z * 1.4);
					spark.vx = -f.x * 2 + (Math.random() - .5) * 3;
					spark.vy = 1.5 + Math.random();
					spark.vz = -f.z * 2 + (Math.random() - .5) * 3;
					spark.mesh.material.color.setHex(race.track.dirt && r.drift < .2 ? 12887412 : 16731420);
				}
			}
			let focus = race.racers[0];
			if ((race.mode === "race" || race.mode === "done") && race.player) focus = race.player;
			else for (const r of race.racers) if (focus && r.place < focus.place) focus = r;
			if (focus) {
				const f = forwardOf(focus.yaw);
				const speed = Math.hypot(focus.vx, focus.vz);
				desired.set(focus.x - f.x * 6.4, focus.y + 2.45, focus.z - f.z * 6.4);
				lookTarget.set(focus.x + f.x * 7, focus.y + .85, focus.z + f.z * 7);
				const k = 1 - Math.exp(-5.2 * Math.max(dt, .016));
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
				if (Math.abs(camera.fov - fov) > .3) {
					camera.fov = fov;
					camera.updateProjectionMatrix();
				}
				audio.update(speed, focus.isPlayer ? actions.throttle : .7, focus.drift, focus.boost > 0);
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
			if (drop.position.y < camera.position.y - 1) drop.position.set(camera.position.x + (Math.random() - .5) * 26, camera.position.y + 6 + Math.random() * 8, camera.position.z + (Math.random() - .5) * 26);
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
				bestRace: row?.bestRace ?? player.finishTime
			});
		}
		writeHud(player, actions);
		drawMap();
		sky.position.copy(camera.position);
		renderer.render(scene, camera);
	}
	function visKey(id, stage) {
		return `${id}:${stage}`;
	}
	function syncCars() {
		const need = race.mode === "garage" ? [{
			id: previewId,
			stage: previewStage
		}] : race.racers.map((r) => ({
			id: r.carId,
			stage: r.stage
		}));
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
		session = {
			km: 0,
			walls: 0,
			off: 0,
			wrong: 0,
			contact: false
		};
	}
	function samplesAt(i) {
		return race.samples[i % race.samples.length];
	}
	function writeHud(player, _actions) {
		const p = player;
		if (!p || race.mode !== "race" && race.mode !== "done") return;
		const speed = Math.abs(race.playerForwardSpeed()) * 3.6;
		if (hooks.speed.current) hooks.speed.current.textContent = `${Math.round(speed)}`;
		if (hooks.lap.current) hooks.lap.current.textContent = `${Math.min(race.track.laps, p.lap + (p.finished ? 0 : 1))}/${race.track.laps}`;
		if (hooks.place.current) hooks.place.current.textContent = `P${p.place}`;
		if (hooks.time.current) hooks.time.current.textContent = formatTime(p.finished ? p.finishTime : race.time);
		if (hooks.best.current) hooks.best.current.textContent = formatTime(bestShown ?? (Number.isFinite(p.bestLap) ? p.bestLap : 0));
		if (hooks.drift.current) hooks.drift.current.style.width = `${Math.round(p.drift * 100)}%`;
		hooks.wrong.current?.classList.toggle("hidden", p.wrong < .45);
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
			const x = (s.x - b.minX) / spanX * 144 + 8;
			const y = (s.z - b.minZ) / spanZ * 144 + 8;
			if (i === 0) g.moveTo(x, y);
			else g.lineTo(x, y);
		});
		g.closePath();
		g.stroke();
		for (const r of race.racers) {
			const x = (r.x - b.minX) / spanX * 144 + 8;
			const y = (r.z - b.minZ) / spanZ * 144 + 8;
			g.fillStyle = r.isPlayer ? "#ff4d1c" : "#d7d2c8";
			g.beginPath();
			g.arc(x, y, r.isPlayer ? 4 : 2.5, 0, Math.PI * 2);
			g.fill();
		}
	}
	raf = requestAnimationFrame(frame);
	return {
		start(setup) {
			commit();
			previewId = setup.carId;
			previewStage = setup.stage;
			told = false;
			seenLap = 0;
			camReady = false;
			shown = "";
			session = {
				km: 0,
				walls: 0,
				off: 0,
				wrong: 0,
				contact: false
			};
			sessionOpen = true;
			race.start(setup);
		},
		preview(carId, stage) {
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
		setTrack(id) {
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
		}
	};
}
function paintSky(geo, horizon, top) {
	const pos = geo.getAttribute("position");
	const colors = new Float32Array(pos.count * 3);
	const a = new Color(horizon);
	const b = new Color(top);
	const mix = new Color();
	const radius = 900;
	for (let i = 0; i < pos.count; i++) {
		const y = pos.getY(i) / radius;
		const t = Math.min(1, Math.max(0, y * .5 + .5));
		mix.copy(a).lerp(b, t);
		colors[i * 3] = mix.r;
		colors[i * 3 + 1] = mix.g;
		colors[i * 3 + 2] = mix.b;
	}
	geo.setAttribute("color", new BufferAttribute(colors, 3));
}
//#endregion
export { startGame };
