"use strict";
/* ============================================================
   AUDIO.JS — Efectos de sonido generados con Web Audio API
   (sin archivos externos, funciona en GitHub Pages y Vercel)
   ============================================================ */

const AudioFX = (() => {
  let ctx = null;
  let desbloqueado = false;

  function ensure() {
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
      desbloqueado = true;
    } catch (e) { desbloqueado = false; }
    return desbloqueado;
  }

  function tono(freq, dur, tipo, vol, slideA, retardo) {
    if (!ctx) return;
    const t0 = ctx.currentTime + (retardo || 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = tipo || "square";
    osc.frequency.setValueAtTime(freq, t0);
    if (slideA) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideA), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.08, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  }

  function arpegio(notas, paso, dur, tipo, vol) {
    notas.forEach((f, i) => tono(f, dur, tipo || "triangle", vol || 0.09, null, i * paso));
  }

  function sfx(nombre) {
    if (!ensure()) return;
    switch (nombre) {
      case "salto":   tono(300, 0.14, "square", 0.05, 560); break;
      case "hablar":  tono(620, 0.035, "square", 0.022); break;
      case "abrir":   tono(200, 0.5, "sawtooth", 0.07, 70);
                      tono(400, 0.35, "triangle", 0.05, 900, 0.15); break;
      case "ok":      arpegio([523, 659, 784], 0.08, 0.12, "triangle", 0.09); break;
      case "mal":     tono(200, 0.22, "square", 0.07, 110);
                      tono(150, 0.25, "square", 0.06, 90, 0.12); break;
      case "herir":   tono(320, 0.3, "sawtooth", 0.09, 70); break;
      case "caida":   tono(400, 0.4, "square", 0.06, 80); break;
      case "checkpoint": arpegio([659, 880], 0.09, 0.14, "triangle", 0.08); break;
      case "puertaOk": arpegio([392, 523, 659, 784], 0.09, 0.16, "triangle", 0.09); break;
      case "zoom":    tono(180, 0.9, "sawtooth", 0.05, 900); break;
      case "win":     arpegio([523, 659, 784, 1047, 784, 1047], 0.12, 0.22, "triangle", 0.1); break;
      case "corazon": tono(880, 0.1, "sine", 0.07, 1320); break;
      case "inicio":  arpegio([392, 523, 659], 0.09, 0.15, "square", 0.05); break;
    }
  }

  return { sfx, ensure };
})();
