import { useEffect, useRef, useState } from "react";
import { CATALOG, CLASSES, STAGE_LABEL, blueprint, resolveCar, type CarClass, type Stage } from "./cars";
import { gradeOf, loadProfile, saveProfile, type Profile } from "./profile";
import { paintCar, paintTrack } from "./previews";
import { DEFAULT_TRACK, TRACKS, VIBES, trackById } from "./track";
import type { Difficulty, RaceSetup, Tod, Weather } from "./race";
import type { GameApi, ResultInfo, TouchState } from "./world";

type Screen = "menu" | "single" | "profile" | "server" | "settings" | "open" | "exit" | "race" | "results";

function formatTime(t: number | null | undefined) {
  if (t == null || !Number.isFinite(t) || t <= 0) return "--:--.--";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  const cs = Math.floor((t % 1) * 100);
  return `${m}:${s.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`;
}

function HoldButton({ label, set }: { label: string; set: (down: boolean) => void }) {
  return (
    <button
      type="button"
      className="min-h-14 min-w-14 rounded-2xl border border-white/15 bg-black/50 px-3 text-sm font-medium text-fg backdrop-blur-md"
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        set(true);
      }}
      onPointerUp={() => set(false)}
      onPointerCancel={() => set(false)}
    >
      {label}
    </button>
  );
}

function Bars({ value }: { value: number }) {
  return (
    <div className="flex gap-1" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < value ? "h-1.5 flex-1 rounded-full bg-primary" : "h-1.5 flex-1 rounded-full bg-white/15"} />
      ))}
    </div>
  );
}

function Dead({ title, line, onBack }: { title: string; line: string; onBack: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col gap-3 rounded-3xl border border-white/10 bg-black/60 p-5 shadow-2xl backdrop-blur-xl">
        <p className="text-sm text-primary">NOCH ZU</p>
        <h2 className="text-2xl">{title}</h2>
        <p className="text-sm text-muted">{line}</p>
        <button type="button" className="min-h-11 rounded-xl border border-white/15 px-4" onClick={onBack}>
          Zurück
        </button>
      </div>
    </div>
  );
}

const panel = "rounded-3xl border border-white/10 bg-black/55 shadow-2xl backdrop-blur-xl";
const idle = "min-h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-medium";
const on = "min-h-11 rounded-xl bg-primary px-3 text-sm font-medium text-bg";

const DIFFS: { id: Difficulty; label: string }[] = [
  { id: "leicht", label: "Leicht" },
  { id: "normal", label: "Normal" },
  { id: "hart", label: "Hart" },
  { id: "pro", label: "Pro" },
];

const TODS: { id: Tod; label: string }[] = [
  { id: "dawn", label: "Dämmerung" },
  { id: "day", label: "Tag" },
  { id: "dusk", label: "Abend" },
  { id: "night", label: "Nacht" },
  { id: "dynamic", label: "Dynamisch" },
];

const WEATHERS: { id: Weather; label: string }[] = [
  { id: "klar", label: "Klar" },
  { id: "regen", label: "Regen" },
  { id: "nebel", label: "Nebel" },
  { id: "dynamisch", label: "Dynamisch" },
];

export function Grid90() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [carId, setCarId] = useState("q40");
  const [stage, setStage] = useState<Stage>(0);
  const [klass, setKlass] = useState<CarClass>("super");
  const [trackId, setTrackId] = useState(DEFAULT_TRACK);
  const [opponents, setOpponents] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [tod, setTod] = useState<Tod>("night");
  const [weather, setWeather] = useState<Weather>("klar");
  const [touchUi, setTouchUi] = useState(false);
  const [result, setResult] = useState<ResultInfo | null>(null);
  const [profile, setProfile] = useState<Profile>({ name: "FAHRER", number: "27", tag: "RTS", km: 0, rating: 50 });
  const [glError, setGlError] = useState("");

  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<GameApi | null>(null);
  const touchRef = useRef<TouchState>({ left: false, right: false, gas: false, brake: false, drift: false });
  const carRef = useRef(carId);
  const stageCarRef = useRef(stage);
  const trackRef = useRef(trackId);
  const setupRef = useRef<RaceSetup>({ carId, stage, opponents, difficulty, tod, weather });
  const pending = useRef<Screen | null>(null);
  carRef.current = carId;
  stageCarRef.current = stage;
  trackRef.current = trackId;
  setupRef.current = { carId, stage, opponents, difficulty, tod, weather };

  const speedRef = useRef<HTMLSpanElement>(null);
  const lapRef = useRef<HTMLSpanElement>(null);
  const placeRef = useRef<HTMLSpanElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const bestRef = useRef<HTMLSpanElement>(null);
  const driftRef = useRef<HTMLDivElement>(null);
  const wrongRef = useRef<HTMLParagraphElement>(null);
  const boostRef = useRef<HTMLParagraphElement>(null);
  const mapRef = useRef<HTMLCanvasElement>(null);
  const trackCanvasRef = useRef<HTMLCanvasElement>(null);
  const carCanvasRef = useRef<HTMLCanvasElement>(null);
  const doneRef = useRef<(info: ResultInfo) => void>(() => {});
  const saveRef = useRef<(id: string, lap: number | null, raceTime: number | null) => void>(() => {});
  const profileRef = useRef<(next: Profile) => void>(() => {});

  doneRef.current = (info) => {
    setResult(info);
    setScreen("results");
  };
  saveRef.current = () => {};
  profileRef.current = (next) => setProfile(next);

  useEffect(() => {
    setProfile(loadProfile());
    const mq = window.matchMedia("(pointer: coarse)");
    const apply = () => setTouchUi(mq.matches || window.innerWidth < 900);
    apply();
    mq.addEventListener("change", apply);
    window.addEventListener("resize", apply);
    return () => {
      mq.removeEventListener("change", apply);
      window.removeEventListener("resize", apply);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let dead = false;
    let destroy = () => {};
    void import("./world")
      .then(({ startGame }) => {
        if (dead) return;
        const game = startGame(canvas, touchRef.current, {
          speed: speedRef,
          lap: lapRef,
          place: placeRef,
          time: timeRef,
          best: bestRef,
          drift: driftRef,
          wrong: wrongRef,
          boost: boostRef,
          map: mapRef,
          stage: stageRef,
          onDone: (info) => doneRef.current(info),
          onSave: (id, lap, raceTime) => saveRef.current(id, lap, raceTime),
          onProfile: (next) => profileRef.current(next),
        });
        if (dead) {
          game.destroy();
          return;
        }
        apiRef.current = game;
        destroy = () => game.destroy();
        if (pending.current === "race") {
          game.unlock();
          game.setTrack(trackRef.current);
          game.start(setupRef.current);
        } else if (pending.current === "single") game.preview(carRef.current, stageCarRef.current);
      })
      .catch(() => {
        if (!dead) setGlError("3D konnte nicht starten.");
      });
    return () => {
      dead = true;
      destroy();
      apiRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (screen !== "single") return;
    const trackCanvas = trackCanvasRef.current;
    const carCanvas = carCanvasRef.current;
    if (trackCanvas) paintTrack(trackCanvas, trackId);
    if (carCanvas) paintCar(carCanvas, blueprint(carId), stage);
  }, [screen, trackId, carId, stage]);

  const bp = blueprint(carId);
  const car = resolveCar(carId, stage);
  const list = CATALOG.filter((item) => item.klass === klass);
  const grade = gradeOf(profile);
  const showHud = screen === "race" || screen === "results";

  function chooseTrack(id: string) {
    setTrackId(id);
    apiRef.current?.setTrack(id);
  }

  function chooseCar(id: string, nextStage = stage) {
    setCarId(id);
    apiRef.current?.preview(id, nextStage);
  }

  function chooseStage(next: Stage) {
    setStage(next);
    apiRef.current?.preview(carId, next);
  }

  function chooseClass(next: CarClass) {
    setKlass(next);
    if (blueprint(carId).klass !== next) {
      const first = CATALOG.find((item) => item.klass === next);
      if (first) chooseCar(first.id);
    }
  }

  function startRace() {
    pending.current = "race";
    apiRef.current?.unlock();
    apiRef.current?.setTrack(trackRef.current);
    apiRef.current?.start(setupRef.current);
    setScreen("race");
  }

  function openSingle() {
    pending.current = "single";
    apiRef.current?.preview(carRef.current, stageCarRef.current);
    setScreen("single");
  }

  function openMenu() {
    pending.current = "menu";
    apiRef.current?.menu();
    setScreen("menu");
  }

  function editProfile(next: Profile) {
    const saved = saveProfile(next);
    setProfile(saved);
  }

  return (
    <main className={`relative h-dvh w-full select-none overflow-hidden bg-bg text-fg ${screen === "race" ? "touch-none" : ""}`}>
      <div ref={stageRef} className="absolute inset-0 flex items-center justify-center">
        <canvas ref={canvasRef} />
      </div>

      <div className={showHud ? `pointer-events-none absolute inset-0 z-10 flex flex-col p-3 ${screen === "race" && touchUi ? "pb-24" : ""}` : "hidden"}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted">
              {profile.tag} {profile.number.padStart(2, "0")} · Runde <span ref={lapRef}>1/3</span>
            </p>
            <p className="text-2xl">
              <span ref={placeRef}>P1</span>
            </p>
            <canvas ref={mapRef} width={160} height={160} className="mt-2 h-28 w-28 rounded-2xl border border-white/10" />
          </div>
          <div className="text-right">
            <p className="text-sm text-muted">km/h</p>
            <p className="text-4xl font-semibold tracking-tight">
              <span ref={speedRef}>0</span>
            </p>
            <p className="text-sm text-muted">
              Zeit <span ref={timeRef}>0:00.00</span>
            </p>
            <p className="text-sm text-muted">
              Beste <span ref={bestRef}>--:--.--</span>
            </p>
          </div>
        </div>
        <div className="mt-3 max-w-xs">
          <div className="hud-meter h-3 w-full">
            <div ref={driftRef} className="h-3 bg-primary" style={{ width: "0%" }} />
          </div>
          <p ref={boostRef} className="hidden text-sm text-primary">
            DRIFT
          </p>
          <p ref={wrongRef} className="hidden text-sm text-primary">
            Falsche Richtung
          </p>
        </div>
        <div className="pointer-events-auto mt-auto flex justify-end gap-2 pb-2">
          <button type="button" className="min-h-11 rounded-xl border border-white/15 bg-black/50 px-4 text-sm backdrop-blur-md" onClick={openMenu}>
            Menü
          </button>
          <button type="button" className="min-h-11 rounded-xl border border-white/15 bg-black/50 px-4 text-sm backdrop-blur-md" onClick={() => apiRef.current?.respawn()}>
            Reset
          </button>
        </div>
      </div>

      {screen === "menu" ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
          <div className={`flex w-full max-w-md flex-col gap-3 p-6 ${panel}`}>
            <p className="text-xs font-semibold tracking-[0.22em] text-primary">BUILD V0.3</p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight">Racing the Roots</h1>
            <button type="button" className={on} onClick={openSingle}>
              Singleplayer
            </button>
            <button type="button" className={idle} onClick={() => setScreen("server")}>
              Server Browser
            </button>
            <button type="button" className={idle} onClick={() => setScreen("open")}>
              Open World
            </button>
            <button type="button" className={idle} onClick={() => setScreen("profile")}>
              Profil
            </button>
            <button type="button" className={idle} onClick={() => setScreen("settings")}>
              Settings
            </button>
            <button type="button" className={idle} onClick={() => setScreen("exit")}>
              Exit
            </button>
            {glError ? <p className="text-sm text-primary">{glError}</p> : null}
          </div>
        </div>
      ) : null}

      {screen === "single" ? (
        <div className="absolute inset-0 z-20 flex items-stretch justify-center p-3 sm:items-center">
          <div className={`flex max-h-full w-full max-w-3xl flex-col gap-3 overflow-y-auto p-4 ${panel}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Singleplayer</h2>
                <p className="text-sm text-muted">
                  {bp.name} · {STAGE_LABEL[stage]} · {bp.house}
                </p>
              </div>
              <button type="button" className={idle} onClick={openMenu}>
                Zurück
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <figure>
                <canvas ref={trackCanvasRef} width={640} height={360} className="aspect-video w-full rounded-2xl" />
                <figcaption className="mt-1 text-xs text-muted">
                  {trackById(trackId).def.name} · {(trackById(trackId).length / 1000).toFixed(1)} km
                </figcaption>
              </figure>
              <figure>
                <canvas ref={carCanvasRef} width={640} height={360} className="aspect-video w-full rounded-2xl" />
                <figcaption className="mt-1 text-xs text-muted">
                  {bp.name} · {STAGE_LABEL[stage]}
                </figcaption>
              </figure>
            </div>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Strecke</span>
              <select className="min-h-11 rounded-xl border border-white/10 bg-black/40 px-3 text-fg" value={trackId} onChange={(e) => chooseTrack(e.target.value)}>
                {VIBES.map((vibe) => (
                  <optgroup key={vibe.id} label={vibe.label}>
                    {TRACKS.filter((track) => track.vibe === vibe.id).map((track) => (
                      <option key={track.id} value={track.id}>
                        {track.name} · {track.place}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-2">
              {CLASSES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={klass === item.id ? on : idle}
                  onClick={() => chooseClass(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
              {list.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => chooseCar(item.id)}
                  className={item.id === carId ? "rounded-xl border border-primary bg-primary px-3 py-2 text-left text-bg" : "rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left"}
                >
                  <span className="block text-sm">{item.name}</span>
                  <span className={item.id === carId ? "block text-sm" : "block text-sm text-muted"}>{item.house}</span>
                </button>
              ))}
            </div>
            <p className="text-sm text-muted">{bp.blurb}</p>
            <div className="flex flex-wrap gap-2">
              {STAGE_LABEL.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  className={stage === index ? on : idle}
                  onClick={() => chooseStage(index as Stage)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-muted">Tempo</p>
                <Bars value={car.tempo} />
              </div>
              <div>
                <p className="text-muted">Grip</p>
                <Bars value={car.gripStat} />
              </div>
              <div>
                <p className="text-muted">Drift</p>
                <Bars value={car.driftStat} />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted">Gegner {opponents}</span>
              <button type="button" className="min-h-11 min-w-11 rounded-xl border border-white/10 px-3" onClick={() => setOpponents((n) => Math.max(1, n - 1))}>
                −
              </button>
              <button type="button" className="min-h-11 min-w-11 rounded-xl border border-white/10 px-3" onClick={() => setOpponents((n) => Math.min(11, n + 1))}>
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {DIFFS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={difficulty === item.id ? on : idle}
                  onClick={() => setDifficulty(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {TODS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={tod === item.id ? on : idle}
                  onClick={() => setTod(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {WEATHERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={weather === item.id ? on : idle}
                  onClick={() => setWeather(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button type="button" className={`${on} w-full`} onClick={startRace}>
              Start
            </button>
          </div>
        </div>
      ) : null}

      {screen === "profile" ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
          <div className={`flex w-full max-w-md flex-col gap-3 p-5 ${panel}`}>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-2xl font-semibold">Profil</h2>
              <button type="button" className={idle} onClick={openMenu}>
                Zurück
              </button>
            </div>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Name</span>
              <input className="min-h-11 select-text rounded-xl border border-white/10 bg-black/40 px-3 text-fg" maxLength={16} value={profile.name} onChange={(e) => editProfile({ ...profile, name: e.target.value })} />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-muted">Startnummer</span>
                <input className="min-h-11 select-text rounded-xl border border-white/10 bg-black/40 px-3 text-fg" inputMode="numeric" maxLength={2} value={profile.number} onChange={(e) => editProfile({ ...profile, number: e.target.value })} />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-muted">Kürzel</span>
                <input className="min-h-11 select-text rounded-xl border border-white/10 bg-black/40 px-3 text-fg" maxLength={3} value={profile.tag} onChange={(e) => editProfile({ ...profile, tag: e.target.value })} />
              </label>
            </div>
            <p className="text-sm">
              {profile.km.toFixed(1)} km
            </p>
            <p className="text-4xl font-semibold">{grade.grade}</p>
            <p className="text-sm text-muted">{grade.line}</p>
            <p className="text-sm text-muted">Die Linie wertet Wände, Abflüge und Falschfahrten. Server können später dieses Rating als Minimum filtern.</p>
          </div>
        </div>
      ) : null}

      {screen === "server" ? <Dead title="Server Browser" line="Die Liste ist noch nicht am Netz. Kein Host, kein Beitritt." onBack={openMenu} /> : null}
      {screen === "settings" ? <Dead title="Settings" line="Grafik, Ton und Steuerung folgen. Noch nichts zu stellen." onBack={openMenu} /> : null}
      {screen === "open" ? <Dead title="Open World" line="Die offene Karte ist noch zu." onBack={openMenu} /> : null}
      {screen === "exit" ? <Dead title="Exit" line="Beenden geht noch nicht." onBack={openMenu} /> : null}

      {screen === "results" && result ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
          <div className={`flex w-full max-w-md flex-col gap-3 p-5 ${panel}`}>
            <p className="text-xs font-semibold tracking-[0.22em] text-primary">ZIEL</p>
            <h2 className="text-3xl font-semibold">
              P{result.place}
              <span className="text-muted"> / {result.total}</span>
            </h2>
            <p className="text-sm">{result.trackName}</p>
            <p className="text-sm text-muted">{result.carName}</p>
            <p className="text-sm">Rennen {formatTime(result.time)}</p>
            <p className="text-sm">Beste Runde {formatTime(result.bestLap)}</p>
            <p className="text-sm text-muted">Safety {grade.grade}</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="button" className={on} onClick={startRace}>
                Nochmal
              </button>
              <button type="button" className={idle} onClick={openMenu}>
                Menü
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {screen === "race" && touchUi ? (
        <div className="absolute inset-x-0 bottom-0 z-30 flex items-end justify-between p-3">
          <div className="flex gap-2">
            <HoldButton label="←" set={(v) => (touchRef.current.left = v)} />
            <HoldButton label="→" set={(v) => (touchRef.current.right = v)} />
          </div>
          <div className="flex gap-2">
            <HoldButton label="Drift" set={(v) => (touchRef.current.drift = v)} />
            <HoldButton label="Brems" set={(v) => (touchRef.current.brake = v)} />
            <HoldButton label="Gas" set={(v) => (touchRef.current.gas = v)} />
          </div>
        </div>
      ) : null}
    </main>
  );
}
