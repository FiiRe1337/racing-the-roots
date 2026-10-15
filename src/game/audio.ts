export function createAudio() {
  let ctx: AudioContext | null = null;
  let osc: OscillatorNode | null = null;
  let filter: BiquadFilterNode | null = null;
  let gain: GainNode | null = null;
  let noiseGain: GainNode | null = null;
  let wasBoost = false;

  function unlock() {
    if (typeof window === "undefined") return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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
    if (ctx.state !== "running") void ctx.resume();
  }

  function update(speed: number, throttle: number, drift: number, boost: boolean) {
    if (!ctx || !osc || !filter || !gain || !noiseGain) return;
    const now = ctx.currentTime;
    const freq = 42 + Math.min(220, Math.abs(speed) * 2.4) + throttle * 36;
    osc.frequency.setTargetAtTime(freq, now, 0.06);
    filter.frequency.setTargetAtTime(680 + Math.abs(speed) * 18 + throttle * 400, now, 0.08);
    const vol = Math.min(0.07, 0.012 + Math.abs(speed) / 1400 + throttle * 0.02);
    gain.gain.setTargetAtTime(vol, now, 0.05);
    noiseGain.gain.setTargetAtTime(drift > 0.15 ? 0.03 : 0, now, 0.05);
    if (boost && !wasBoost) blip();
    wasBoost = boost;
  }

  function blip() {
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.value = 520;
    g.gain.setValueAtTime(0.05, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.2);
  }

  function silence() {
    if (!ctx || !gain || !noiseGain) return;
    gain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
    noiseGain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
  }

  return { unlock, update, silence };
}

export type AudioBus = ReturnType<typeof createAudio>;
