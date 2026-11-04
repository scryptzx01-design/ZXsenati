"use strict";
/* ============================================================
   MOTOR.JS — Física, colisiones, cámara y render (Canvas 2D)
   ============================================================ */

const IMG = {};          // texturas cargadas (carpeta IMGS, nombres del usuario)
const LISTA_IMG = [
  // personajes creados para el juego
  "jugador_idle", "jugador_paso1", "jugador_paso2", "jugador_paso3", "jugador_salto",
  "novia",
  // imágenes de la carpeta IMGS del usuario (mismos nombres)
  "aldeano_gey", "suelo", "descarga (1)", "escalera", "pared", "pared_blanca",
  "pasto", "pincho", "arbol_1", "arbol_2"
];
const MADERA = "descarga (1)";   // textura de madera (puertas, puentes, techos)

function cargarTexturas(cb) {
  let faltan = LISTA_IMG.length;
  LISTA_IMG.forEach(n => {
    const im = new Image();
    im.onload = () => { if (--faltan === 0) cb(); };
    im.onerror = () => { console.error("No se pudo cargar", n); if (--faltan === 0) cb(); };
    im.src = "IMGS/" + encodeURIComponent(n) + ".png";
    IMG[n] = im;
  });
}

/* ---------------- Utilidades ---------------- */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

// polyfill roundRect para navegadores antiguos
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    r = Math.min(r || 0, w / 2, h / 2);
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/* ---------------- Capa estática del mapa ---------------- */
function construirCapaEstatica(nivel) {
  const c = document.createElement("canvas");
  c.width = nivel.w * TILE; c.height = nivel.h * TILE;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;

  // fondo de pared de concreto para el parkour
  if (nivel.fondo === "pared") {
    for (let y = 0; y < nivel.h; y++)
      for (let x = 0; x < nivel.w; x++)
        g.drawImage(IMG.pared, x * TILE, y * TILE, TILE, TILE);
  }

  // casas del pueblo (fondo)
  nivel.casas.forEach(cs => {
    const X = cs.x * TILE, W = cs.w * TILE;
    g.drawImage(IMG[MADERA], X - 6, 7 * TILE - 14, W + 12, 18);          // techo
    for (let x = cs.x; x < cs.x + cs.w; x++)
      for (let y = 8; y <= 11; y++)
        g.drawImage(IMG.pared_blanca, x * TILE, y * TILE, TILE, TILE);  // pared
    g.drawImage(IMG[MADERA], X + W / 2 - 14, 10 * TILE, 28, 64);         // puerta
    g.drawImage(IMG.suelo, X + 10, 9 * TILE, 22, 22);                    // ventana
    g.drawImage(IMG.suelo, X + W - 32, 9 * TILE, 22, 22);
  });

  // tiles sólidos y escaleras
  for (let y = 0; y < nivel.h; y++) {
    for (let x = 0; x < nivel.w; x++) {
      const t = nivel.tiles[y][x];
      if (t === 0 || t === 5 || t === 6) continue;
      const px = x * TILE, py = y * TILE;
      if (t === 1) g.drawImage(IMG.suelo, px, py, TILE, TILE);
      else if (t === 2) g.drawImage(IMG.suelo, px, py, TILE, TILE);
      else if (t === 3) g.drawImage(IMG[MADERA], px, py, TILE, TILE);
      else if (t === 4) g.drawImage(IMG.escalera, px, py, TILE, TILE);
    }
  }

  // decoraciones
  nivel.decor.forEach(d => {
    const im = IMG[d.img];
    if (!im) return;
    const w = im.width * (d.esc || 1), h = im.height * (d.esc || 1);
    g.drawImage(im, d.x, d.y - h + (d.img === "pasto" ? 6 : 0), w, h);
  });

  // cartel de bienvenida del pueblo (dibujado por código)
  if (nivel.id === "pueblo") {
    const X = 6.2 * TILE, Y = 9.2 * TILE;
    g.fillStyle = "#8a5f2e";
    g.fillRect(X + 22, Y + 30, 6, 50);
    g.fillStyle = "#b98a4a";
    g.beginPath(); g.roundRect(X - 16, Y - 4, 82, 40, 5); g.fill();
    g.strokeStyle = "#7a5228"; g.lineWidth = 3; g.stroke();
    g.fillStyle = "#1d4f8f";
    g.font = "bold 15px 'Courier New', monospace";
    g.textAlign = "center";
    g.fillText("PUEBLO", X + 25, Y + 15);
    g.fillText("SENATI", X + 25, Y + 30);
  }

  // cartel de salida al parkour
  if (nivel.salida) {
    const X = nivel.salida.x + 60, Y = 9.2 * TILE;
    g.fillStyle = "#8a5f2e";
    g.fillRect(X, Y + 18, 6, 46);
    g.fillStyle = "#b98a4a"; g.fillRect(X - 52, Y - 12, 110, 34);
    g.fillStyle = "#8a5f2e"; g.fillRect(X - 52, Y - 12, 110, 4);
    g.fillStyle = "#1d4f8f";
    g.font = "bold 20px 'Courier New', monospace";
    g.textAlign = "center";
    g.fillText("PARKOUR →", X + 3, Y + 12);
  }

  // letrero en el piso del parkour
  if (nivel.id === "parkour") {
    g.fillStyle = "rgba(255,255,255,0.55)";
    g.font = "bold 26px 'Courier New', monospace";
    g.textAlign = "left";
    g.fillText("META: llega con la novia de tu personaje", 8 * TILE, 22.4 * TILE);
  }

  // franja de meta en el parkour
  if (nivel.novia) {
    g.fillStyle = "rgba(255,255,255,0.25)";
    g.fillRect(nivel.novia.x - 40, nivel.novia.y - 200, 8, 200);
  }

  return c;
}

/* ---------------- Jugador ---------------- */
function nuevoJugador(nivel) {
  return {
    x: nivel.spawn.x, y: nivel.spawn.y,   // x = centro, y = pies
    w: 36, h: 62,
    vx: 0, vy: 0,
    enSuelo: false, enEscalera: false, mirando: 1,
    fase: 0, tFase: 0, saltoBuf: 0, coyote: 0, muerto: 0, invuln: 0
  };
}

function rectJugador(p) { return { x: p.x - p.w / 2, y: p.y - p.h, w: p.w, h: p.h }; }

/* ---------------- Física ---------------- */
function esSolido(nivel, tx, ty) {
  if (tx < 0 || tx >= nivel.w) return true;              // bordes laterales
  if (ty < 0 || ty >= nivel.h) return false;
  return SOLIDOS.has(nivel.tiles[ty][tx]);
}

function rectPuertasSolidas(nivel) {
  const rs = [];
  nivel.puertas.forEach(p => {
    if (!p.abierta && p.anim < 0.85) rs.push({ x: p.tx * TILE, y: p.ty * TILE, w: p.tw * TILE, h: p.th * TILE });
  });
  return rs;
}

function actualizarJugador(p, nivel, entrada, dt) {
  if (p.muerto > 0) {          // pequeña caída dramática
    p.vy += 2300 * dt;
    p.y += p.vy * dt;
    p.muerto -= dt;
    return;
  }
  if (p.invuln > 0) p.invuln -= dt;

  const VEL = 340, GRAV = 2300, SALTO = 700, VEL_ESC = 250;
  const r0 = rectJugador(p);

  // ¿hay escalera en el cuerpo?
  const tx = Math.floor(p.x / TILE);
  const tyC = Math.floor((p.y - p.h / 2) / TILE);
  p.enEscalera = nivel.tiles[tyC] && nivel.tiles[tyC][tx] === 4;

  // escalera
  if (p.enEscalera && (entrada.arriba || entrada.abajo || entrada.agarrar)) {
    p.vy = (entrada.arriba ? -VEL_ESC : 0) + (entrada.abajo ? VEL_ESC : 0);
    p.vx = entrada.izq ? -VEL * 0.6 : (entrada.der ? VEL * 0.6 : 0);
    if (entrada.salto) { p.vy = -SALTO * 0.9; p.enEscalera = false; AudioFX.sfx("salto"); entrada.salto = false; }
  } else {
    // horizontal
    const dir = (entrada.der ? 1 : 0) - (entrada.izq ? 1 : 0);
    p.vx = lerp(p.vx, dir * VEL, 1 - Math.pow(0.0001, dt));
    if (Math.abs(p.vx) < 4) p.vx = 0;
    if (dir !== 0) p.mirando = dir;

    // gravedad
    p.vy += GRAV * dt;
    if (p.vy > 1100) p.vy = 1100;

    // salto (con coyote-time y buffer)
    p.coyote = p.enSuelo ? 0.09 : Math.max(0, p.coyote - dt);
    p.saltoBuf = entrada.salto ? 0.12 : Math.max(0, p.saltoBuf - dt);
    if (entrada.salto) entrada.salto = false;
    if (p.saltoBuf > 0 && p.coyote > 0) {
      p.vy = -SALTO; p.saltoBuf = 0; p.coyote = 0;
      AudioFX.sfx("salto");
    }
  }

  // ---- mover eje X ----
  p.x += p.vx * dt;
  let r = rectJugador(p);
  let t0 = Math.floor(r.y / TILE), t1 = Math.floor((r.y + r.h - 1) / TILE);
  if (p.vx > 0) {
    const txr = Math.floor((r.x + r.w - 1) / TILE);
    for (let ty = t0; ty <= t1; ty++) if (esSolido(nivel, txr, ty)) { p.x = txr * TILE - p.w / 2; p.vx = 0; break; }
  } else if (p.vx < 0) {
    const txl = Math.floor(r.x / TILE);
    for (let ty = t0; ty <= t1; ty++) if (esSolido(nivel, txl, ty)) { p.x = (txl + 1) * TILE + p.w / 2; p.vx = 0; break; }
  }
  // puertas cerradas (eje X)
  r = rectJugador(p);
  for (const pr of rectPuertasSolidas(nivel)) {
    if (aabb(r, pr)) {
      const centro = p.x;
      if (centro < pr.x + pr.w / 2) p.x = pr.x - p.w / 2 - 0.1;
      else p.x = pr.x + pr.w + p.w / 2 + 0.1;
      p.vx = 0;
    }
  }

  // ---- mover eje Y ----
  p.y += p.vy * dt;
  r = rectJugador(p);
  p.enSuelo = false;
  const xc0 = Math.floor(r.x / TILE), xc1 = Math.floor((r.x + r.w - 1) / TILE);
  if (p.vy > 0) {
    const tyb = Math.floor((r.y + r.h - 1) / TILE);
    for (let tx2 = xc0; tx2 <= xc1; tx2++) if (esSolido(nivel, tx2, tyb)) {
      p.y = tyb * TILE; p.vy = 0; p.enSuelo = true; break;
    }
  } else if (p.vy < 0) {
    const tyt = Math.floor(r.y / TILE);
    for (let tx2 = xc0; tx2 <= xc1; tx2++) if (esSolido(nivel, tx2, tyt)) {
      p.y = (tyt + 1) * TILE + p.h; p.vy = 0; break;
    }
  }
  // puertas cerradas (eje Y, caer encima)
  r = rectJugador(p);
  if (p.vy >= 0) {
    for (const pr of rectPuertasSolidas(nivel)) {
      if (aabb(r, pr) && r.y + r.h - p.vy * dt <= pr.y + 2) {
        p.y = pr.y; p.vy = 0; p.enSuelo = true;
      }
    }
  }

  // animación
  if (!p.enSuelo && !p.enEscalera) p.fase = 4;
  else if (Math.abs(p.vx) > 20) {
    p.tFase += dt * Math.abs(p.vx) / 26;
    if (p.tFase > 1) { p.tFase = 0; p.fase = (p.fase + 1) % 4; }
  } else { p.fase = 0; p.tFase = 0; }

  // límites del mapa
  p.x = clamp(p.x, p.w / 2 + 2, nivel.w * TILE - p.w / 2 - 2);
}

/* ---------------- Cámara ---------------- */
const cam = {
  x: 0, y: 0, z: 1.6,
  destX: 0, destY: 0, destZ: 1.6,
  activa: false
};

function zoomPueblo() {
  return clamp(view.h / (10.5 * TILE), 1.15, 2.4);
}
function zoomParkour(nivel) {
  return Math.min(view.w / (nivel.w * TILE), view.h / (nivel.h * TILE)) * 0.97;
}

function objetivoCamara(nivel, p) {
  if (nivel.id === "parkour") {
    const z = zoomParkour(nivel);
    cam.destZ = z;
    cam.destX = (nivel.w * TILE - view.w / z) / 2;
    cam.destY = (nivel.h * TILE - view.h / z) / 2;
  } else {
    const z = zoomPueblo();
    cam.destZ = z;
    const vw = view.w / z, vh = view.h / z;
    let x = p.x + p.mirando * 50 - vw / 2;
    let y = p.y - vh * 0.62;
    cam.destX = clamp(x, 0, Math.max(0, nivel.w * TILE - vw));
    cam.destY = clamp(y, -vh * 0.5, Math.max(0, nivel.h * TILE - vh));
  }
}

function actualizarCamara(dt) {
  const k = 1 - Math.pow(0.0015, dt);
  cam.x = lerp(cam.x, cam.destX, k);
  cam.y = lerp(cam.y, cam.destY, k);
  cam.z = lerp(cam.z, cam.destZ, k);
}

function ajustarCamara(nivel, p) {
  objetivoCamara(nivel, p);
  cam.x = cam.destX; cam.y = cam.destY; cam.z = cam.destZ;
}

/* ---------------- Partículas ---------------- */
let particulas = [];

function corazonParticula(x, y) {
  particulas.push({ corazon: true, x, y, vx: (Math.random() - 0.5) * 60, vy: -90 - Math.random() * 70,
    vida: 1.6, t: 0, tam: 22 + Math.random() * 16, osc: Math.random() * 6.28 });
}

function confeti(x, y, n) {
  const colores = ["#1d6fd6", "#ffffff", "#7ec8f5", "#ffd34d", "#eb82af"];
  for (let i = 0; i < n; i++) {
    particulas.push({ rect: true, color: colores[i % colores.length], x, y,
      vx: (Math.random() - 0.5) * 420, vy: -260 - Math.random() * 300,
      vida: 2.2 + Math.random(), t: 0, tam: 5 + Math.random() * 6, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 9 });
  }
}

function polvo(x, y, n) {
  for (let i = 0; i < n; i++) {
    particulas.push({ rect: true, color: "rgba(200,200,200,0.8)", x, y,
      vx: (Math.random() - 0.5) * 160, vy: -40 - Math.random() * 90,
      vida: 0.5 + Math.random() * 0.3, t: 0, tam: 4 + Math.random() * 4, rot: 0, vr: 0 });
  }
}

function actualizarParticulas(dt) {
  particulas = particulas.filter(pt => {
    pt.t += dt;
    pt.x += pt.vx * dt; pt.y += pt.vy * dt;
    if (pt.rect) { pt.vy += 500 * dt; pt.rot += pt.vr * dt; }
    else { pt.vy += 24 * dt; pt.vx *= 0.99; }
    return pt.t < pt.vida;
  });
}

/* ---------------- Render ---------------- */
const view = { w: 960, h: 540 };

function dibujarJugador(g, p) {
  if (p.muerto > 0) return;
  if (p.invuln > 0 && Math.floor(p.invuln * 12) % 2 === 0) return;  // parpadeo
  const imgs = ["jugador_idle", "jugador_paso1", "jugador_paso2", "jugador_paso3", "jugador_salto"];
  const im = IMG[imgs[p.fase]] || IMG.jugador_idle;
  const sx = (p.x - cam.x) * cam.z, sy = (p.y - cam.y) * cam.z;
  const w = im.width * cam.z, h = im.height * cam.z;
  g.save();
  g.translate(sx, sy);
  g.scale(p.mirando, 1);
  g.drawImage(im, -w * 0.48, -h * 0.97, w, h);
  g.restore();
}

function dibujarNPC(g, n, tGlobal) {
  const im = IMG.aldeano_gey;
  const bob = Math.sin(tGlobal * 2.2 + n.x) * 3;
  const w = im.width * 1.15 * cam.z, h = im.height * 1.15 * cam.z;
  const sx = (n.x - cam.x) * cam.z, sy = (n.y - cam.y) * cam.z;
  // cartel de "!" si no ha sido hablado
  if (!n.visto) {
    const bs = 26 * cam.z;
    g.fillStyle = "#ffd34d";
    g.strokeStyle = "rgba(0,0,0,0.6)"; g.lineWidth = 2;
    g.beginPath();
    g.roundRect(sx - bs / 2, sy - h * 0.97 - bs * 1.35 + bob, bs, bs, 5 * cam.z);
    g.fill(); g.stroke();
    g.fillStyle = "#233"; g.font = "bold " + Math.round(18 * cam.z) + "px monospace";
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("!", sx, sy - h * 0.97 - bs * 0.85 + bob);
  }
  g.drawImage(im, sx - w * 0.5, sy - h + bob, w, h);
}

function dibujarPincho(g, p, tGlobal) {
  const im = IMG.pincho;
  const osc = Math.sin(tGlobal * 3 + p.x) * 0.06;
  const w = im.width * 1.3 * cam.z, h = im.height * 1.3 * cam.z * (1 + osc * 0.2);
  const sx = (p.x - cam.x) * cam.z, sy = (p.y - cam.y) * cam.z;
  g.drawImage(im, sx - w / 2, sy - h, w, h);
}

function dibujarPuerta(g, d) {
  const im = IMG[MADERA];
  const X = d.tx * TILE, Y = d.ty * TILE, W = d.tw * TILE, H = d.th * TILE;
  const a = d.abierta ? 1 - d.anim : 1;
  if (a <= 0) return;
  const sx = (X - cam.x) * cam.z, sy = (Y - cam.y) * cam.z - d.anim * H * cam.z;
  const w = W * cam.z, h = H * cam.z;
  g.save();
  g.globalAlpha = a;
  g.drawImage(im, sx, sy, w, h);
  // juntas de tablones
  g.strokeStyle = "rgba(60,38,14,0.55)"; g.lineWidth = Math.max(1, 2 * cam.z);
  g.beginPath();
  g.moveTo(sx + w * 0.5, sy); g.lineTo(sx + w * 0.5, sy + h);
  g.moveTo(sx, sy + h * 0.33); g.lineTo(sx + w, sy + h * 0.33);
  g.moveTo(sx, sy + h * 0.66); g.lineTo(sx + w, sy + h * 0.66);
  g.stroke();
  // marco
  g.strokeStyle = "#6b4a26"; g.lineWidth = Math.max(2, 5 * cam.z);
  g.strokeRect(sx, (Y - cam.y) * cam.z, w, h);
  g.restore();
  if (!d.abierta) {
    // candado dibujado
    const cx = sx + W * cam.z / 2, cy = (Y - cam.y) * cam.z + H * cam.z * 0.42;
    const s = 16 * cam.z;
    g.fillStyle = "#f2c94c"; g.strokeStyle = "rgba(0,0,0,0.5)"; g.lineWidth = 2;
    g.beginPath(); g.roundRect(cx - s / 2, cy - s / 2, s, s, 3); g.fill(); g.stroke();
    g.strokeStyle = "#8a6510"; g.lineWidth = 3;
    g.beginPath(); g.arc(cx, cy - s * 0.15, s * 0.26, Math.PI, 0); g.stroke();
  }
}

function dibujarNovia(g, nv, tGlobal) {
  const im = IMG.novia;
  const bob = Math.sin(tGlobal * 2.4) * 4;
  const w = im.width * 1.15 * cam.z, h = im.height * 1.15 * cam.z;
  const sx = (nv.x - cam.x) * cam.z, sy = (nv.y - cam.y) * cam.z;
  g.drawImage(im, sx - w * 0.5, sy - h + bob, w, h);
  // corazones flotando
  if (Math.random() < 0.05) corazonParticula(nv.x + (Math.random() - 0.5) * 60, nv.y - 90);
}

function render(g, nivel, jugador, tGlobal) {
  const W = view.w, H = view.h;
  g.imageSmoothingEnabled = false;

  // fondo
  if (nivel.fondo === "cielo") {
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#6db9f2"); grad.addColorStop(0.65, "#a8dcf7"); grad.addColorStop(1, "#d7f1fc");
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    // sol
    g.fillStyle = "rgba(255,236,150,0.9)";
    g.beginPath(); g.arc(W - 110, 90, 46, 0, 7); g.fill();
    // nubes con parallax
    g.fillStyle = "rgba(255,255,255,0.85)";
    for (let i = 0; i < 5; i++) {
      const cxp = ((i * 430 + tGlobal * 12 - cam.x * 0.25 * cam.z) % (W + 340)) - 170;
      const cyp = 50 + (i % 3) * 70;
      g.beginPath();
      g.ellipse(cxp, cyp, 52, 18, 0, 0, 7);
      g.ellipse(cxp + 30, cyp - 12, 34, 15, 0, 0, 7);
      g.ellipse(cxp - 34, cyp + 4, 30, 13, 0, 0, 7);
      g.fill();
    }
  } else {
    g.fillStyle = "#3a3d42"; g.fillRect(0, 0, W, H);   // borde fuera del mapa
    // viñeta
    const vg = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.4)");
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }

  // capa estática del mapa
  if (nivel.capa) {
    const sx = (0 - cam.x) * cam.z, sy = (0 - cam.y) * cam.z;
    g.drawImage(nivel.capa, 0, 0, nivel.capa.width, nivel.capa.height, sx, sy,
      nivel.capa.width * cam.z, nivel.capa.height * cam.z);
  }

  // puertas
  nivel.puertas.forEach(d => dibujarPuerta(g, d));

  // checkpoints (banderitas)
  if (nivel.checkpoints) {
    nivel.checkpoints.forEach(c => {
      if (!c.tocado) return;
      const sx = (c.x - cam.x) * cam.z, sy = (c.y - cam.y) * cam.z;
      g.fillStyle = "#8a5f2e"; g.fillRect(sx - 2 * cam.z, sy - 56 * cam.z, 4 * cam.z, 56 * cam.z);
      g.fillStyle = "#2ecc71";
      g.beginPath();
      g.moveTo(sx + 2 * cam.z, sy - 56 * cam.z);
      g.lineTo(sx + 26 * cam.z, sy - 48 * cam.z);
      g.lineTo(sx + 2 * cam.z, sy - 40 * cam.z);
      g.closePath(); g.fill();
    });
  }

  // pinchos
  nivel.pinchos.forEach(p => dibujarPincho(g, p, tGlobal));

  // NPCs
  nivel.npcs.forEach(n => dibujarNPC(g, n, tGlobal));

  // novia
  if (nivel.novia) dibujarNovia(g, nivel.novia, tGlobal);

  // jugador
  dibujarJugador(g, jugador);

  // partículas
  particulas.forEach(pt => {
    const sx = (pt.x - cam.x) * cam.z, sy = (pt.y - cam.y) * cam.z;
    const alfa = clamp(1 - pt.t / pt.vida, 0, 1);
    g.save(); g.globalAlpha = alfa;
    if (pt.corazon) {
      // corazón dibujado por código (dos círculos + triángulo)
      const s = pt.tam;
      g.fillStyle = "#ef476f";
      g.beginPath();
      g.arc(sx - s * 0.18, sy - s * 0.10, s * 0.28, 0, 7);
      g.arc(sx + s * 0.18, sy - s * 0.10, s * 0.28, 0, 7);
      g.moveTo(sx - s * 0.44, sy + s * 0.02);
      g.lineTo(sx, sy + s * 0.45);
      g.lineTo(sx + s * 0.44, sy + s * 0.02);
      g.closePath();
      g.fill();
    } else {
      g.translate(sx, sy); g.rotate(pt.rot || 0);
      g.fillStyle = pt.color;
      g.fillRect(-pt.tam / 2, -pt.tam / 2, pt.tam, pt.tam);
    }
    g.restore();
  });

  // indicador de interacción
  if (window.npcCercano) {
    const n = window.npcCercano;
    const sx = (n.x - cam.x) * cam.z, sy = (n.y - cam.y) * cam.z;
    const im = IMG.aldeano_gey, w = im.width * 1.15 * cam.z, h = im.height * 1.15 * cam.z;
    const bob = Math.sin(tGlobal * 4) * 3;
    const bs = 30 * cam.z;
    g.fillStyle = "#fff"; g.strokeStyle = "rgba(0,0,0,0.55)"; g.lineWidth = 2;
    g.beginPath();
    g.roundRect(sx - bs * 1.4, sy - h * 0.97 - bs * 1.6 + bob, bs * 2.8, bs, 6);
    g.fill(); g.stroke();
    g.fillStyle = "#233"; g.font = "bold " + Math.round(15 * cam.z) + "px 'Courier New', monospace";
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(window.esMovil ? "TOCA HABLAR" : "PRESIONA E", sx - bs * 1.4 + bs * 1.4, sy - h * 0.97 - bs * 1.1 + bob);
  }
}
