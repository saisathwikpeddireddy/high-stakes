"use client";

// Tiny procedural Web Audio SFX manager — no assets, no licensing.
// All sounds synthesized from oscillators + noise so it works offline.

let ctx = null;
let master = null;
let muted = false;

function ac() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function setMuted(m) {
  muted = m;
  if (master) master.gain.value = m ? 0 : 0.35;
}
export function isMuted() {
  return muted;
}
export function toggleMute() {
  setMuted(!muted);
  return muted;
}

function tone({ freq = 440, type = "sine", dur = 0.15, gain = 0.3, decay = true, glideTo = null }) {
  const c = ac();
  if (!c || muted) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, c.currentTime + dur);
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + 0.008);
  if (decay) g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  osc.connect(g);
  g.connect(master);
  osc.start();
  osc.stop(c.currentTime + dur + 0.05);
}

function noise({ dur = 0.12, gain = 0.25, hp = 800, lp = 6000 }) {
  const c = ac();
  if (!c || muted) return;
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const hpF = c.createBiquadFilter();
  hpF.type = "highpass";
  hpF.frequency.value = hp;
  const lpF = c.createBiquadFilter();
  lpF.type = "lowpass";
  lpF.frequency.value = lp;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  src.connect(hpF);
  hpF.connect(lpF);
  lpF.connect(g);
  g.connect(master);
  src.start();
}

export const sfx = {
  click: () => tone({ freq: 320, type: "triangle", dur: 0.06, gain: 0.18 }),
  chip: () => {
    noise({ dur: 0.05, gain: 0.15, hp: 3000, lp: 9000 });
    tone({ freq: 1200, type: "sine", dur: 0.05, gain: 0.08 });
  },
  card: () => noise({ dur: 0.14, gain: 0.12, hp: 1500, lp: 7000 }),
  win: () => {
    [523, 659, 784, 1046].forEach((f, i) =>
      setTimeout(() => tone({ freq: f, type: "triangle", dur: 0.28, gain: 0.22 }), i * 90)
    );
  },
  lose: () => {
    tone({ freq: 180, type: "sawtooth", dur: 0.5, gain: 0.28, glideTo: 60 });
    noise({ dur: 0.35, gain: 0.15, hp: 100, lp: 900 });
  },
  alarm: () => {
    tone({ freq: 440, type: "square", dur: 0.18, gain: 0.14, glideTo: 660 });
    setTimeout(() => tone({ freq: 440, type: "square", dur: 0.18, gain: 0.14, glideTo: 660 }), 220);
  },
  tick: () => tone({ freq: 900, type: "square", dur: 0.03, gain: 0.06 }),
  spin: () => tone({ freq: 200, type: "sawtooth", dur: 0.9, gain: 0.12, glideTo: 520 }),
};
