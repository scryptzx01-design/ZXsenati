"use strict";
/* ============================================================
   PRINCIPAL.JS — Estados del juego, bucle principal e interacciones
   ============================================================ */

const lienzo = document.getElementById("lienzo");
const g = lienzo.getContext("2d");

const JUEGO = {
  estado: "cargando",     // cargando | titulo | play | final | victoria
  nivel: null,
  jugador: null,
  t: 0,                   // tiempo global de animación
  tiempoJuego: 0,         // cronómetro
  caidas: 0,
  npcCercano: null,
  transicionando: false,
  avisoPuertaT: 0
};
window.npcCercano = null;

/* ---------------- Tamaño del lienzo ---------------- */
function redimensionar() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  view.w = window.innerWidth;
  view.h = window.innerHeight;
  lienzo.width = Math.round(view.w * dpr);
  lienzo.height = Math.round(view.h * dpr);
  lienzo.style.width = view.w + "px";
  lienzo.style.height = view.h + "px";
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (JUEGO.nivel && JUEGO.estado !== "titulo") ajustarCamara(JUEGO.nivel, JUEGO.jugador);
}
window.addEventListener("resize", redimensionar);
window.addEventListener("orientationchange", () => setTimeout(redimensionar, 250));

/* ---------------- Carga de mapa ---------------- */
function cargarNivel(id) {
  const base = NIVELES[id];
  const nivel = JSON.parse(JSON.stringify(base));
  nivel.capa = construirCapaEstatica(nivel);
  JUEGO.nivel = nivel;
  JUEGO.jugador = nuevoJugador(nivel);
  JUEGO.npcCercano = null;
  window.npcCercano = null;
  particulas = [];
  ajustarCamara(nivel, JUEGO.jugador);
  return nivel;
}

/* ---------------- Interacciones ---------------- */
function abrirPuertaSiCorresponde(quiz) {
  const d = JUEGO.nivel.puertas.find(p => p.quizDe === quiz.puerta);
  if (!d || d.abierta) return;
  d.abierta = true;
  AudioFX.sfx("abrir");
  AudioFX.sfx("puertaOk");
  polvo(d.tx * TILE + TILE, d.ty * TILE + TILE * 2, 12);
  const abrirAnim = setInterval(() => {
    d.anim += 0.05;
    if (d.anim >= 1) { d.anim = 1; clearInterval(abrirAnim); }
  }, 30);
  UI.toast("¡La puerta " + (d.id + 1) + " de madera se ha abierto!");
}

function hablarCon(npc) {
  npc.visto = true;
  window.npcCercano = null;
  JUEGO.npcCercano = null;
  if (npc.tipo === "info") {
    UI.mostrarDialogo(npc.nombre, "aldeano_gey.png", DIALOGOS_INFO[npc.info], null);
  } else {
    const quiz = QUIZZES[npc.quiz];
    if (npc.hecho) {
      UI.mostrarDialogo(npc.nombre, "aldeano_gey.png", [npc.charla], null);
    } else {
      UI.mostrarDialogo(npc.nombre, "aldeano_gey.png",
        ["¡Alto ahí! Soy " + npc.nombre + ", guardián de la puerta " + (npc.quiz + 1) + " de madera.",
         "Tienes que responder " + quiz.preguntas.length + " preguntas sobre la historia de SENATI. Si fallas alguna, puedes reintentarla. ¿Listo?"],
        () => {
          UI.abrirQuiz(quiz, (q, fallos) => {
            const npcReal = JUEGO.nivel.npcs.find(n => n.id === q.npc);
            if (npcReal) npcReal.hecho = true;
            abrirPuertaSiCorresponde(q);
            UI.mostrarDialogo(q.nombre, "aldeano_gey.png",
              [fallos === 0 ? "¡Perfecto! Ni una sola falla. La puerta es tuya, joven técnico."
                            : "¡Bien hecho! Con " + fallos + (fallos === 1 ? " error" : " errores") + " pasaste mi prueba. La puerta está abierta."],
              null);
          });
        });
    }
  }
}

function tocarPuerta(d) {
  if (JUEGO.t - JUEGO.avisoPuertaT < 4) return;
  JUEGO.avisoPuertaT = JUEGO.t;
  const quiz = QUIZZES[d.quizDe];
  UI.toast("La puerta está sellada con candado. Habla con " + quiz.nombre + " y responde sus preguntas.");
}

/* ---------------- Muerte y reaparición ---------------- */
function morir(causa) {
  const p = JUEGO.jugador;
  if (p.muerto > 0 || p.invuln > 0) return;
  JUEGO.caidas++;
  AudioFX.sfx(causa === "pincho" ? "herir" : "caida");
  UI.flash("rgba(200, 30, 30, 0.45)");
  p.muerto = 0.9;
  p.vy = -350;
  setTimeout(() => {
    if (JUEGO.estado === "cargando") return;
    const cps = JUEGO.nivel.checkpoints || [];
    let cp = cps[0];
    cps.forEach(c => { if (c.tocado) cp = c; });
    p.x = cp.x; p.y = cp.y; p.vx = 0; p.vy = 0; p.muerto = 0; p.invuln = 1.2;
    polvo(p.x, p.y - 10, 8);
    ajustarCamara(JUEGO.nivel, p);
  }, 900);
}

/* ---------------- Final con la novia ---------------- */
function iniciarFinal() {
  JUEGO.estado = "final";
  AudioFX.sfx("corazon");
  const nv = JUEGO.nivel.novia;
  const p = JUEGO.jugador;
  p.x = nv.x - 62; p.vx = 0; p.mirando = 1;
  for (let i = 0; i < 14; i++) {
    setTimeout(() => corazonParticula(nv.x + (Math.random() - 0.5) * 90, nv.y - 60 - Math.random() * 60), i * 130);
  }
  setTimeout(() => {
    UI.mostrarDialogo("Su novia", "novia.png", DIALOGOS_NOVIA, () => victoria());
  }, 900);
}

function fmtTiempo(s) {
  return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(Math.floor(s % 60)).padStart(2, "0");
}

function victoria() {
  JUEGO.estado = "victoria";
  AudioFX.sfx("win");
  const p = JUEGO.jugador;
  confeti(p.x, p.y - 120, 70);
  confeti(p.x + 90, p.y - 170, 50);
  const t = JUEGO.tiempoJuego;
  const mejorPrevio = parseFloat(localStorage.getItem("senati_mejor") || "0");
  if (!mejorPrevio || t < mejorPrevio) localStorage.setItem("senati_mejor", String(t));
  const mejor = parseFloat(localStorage.getItem("senati_mejor") || String(t));
  $("victoria-tiempo").textContent = fmtTiempo(t);
  $("victoria-caidas").textContent = JUEGO.caidas;
  $("victoria-mejor").textContent = fmtTiempo(mejor);
  $("victoria").classList.remove("oculto");
}

/* ---------------- Transición pueblo → parkour ---------------- */
function irAlParkour() {
  const f = $("fundido");
  f.classList.add("activo");
  AudioFX.sfx("zoom");
  setTimeout(() => {
    cargarNivel("parkour");
    const p = JUEGO.jugador;
    // arranca con el zoom del pueblo y se aleja suavemente
    const z0 = zoomPueblo();
    cam.x = p.x - view.w / (2 * z0);
    cam.y = p.y - view.h / (2 * z0);
    cam.z = z0;
    ajustarCamara(JUEGO.nivel, p);   // define el destino (todo el mapa a la vista)
    JUEGO.estado = "play";
    JUEGO.transicionando = false;
    f.classList.remove("activo");
    UI.banner("¡GRAN PARKOUR!");
    UI.toast("La cámara se aleja para mostrar todo el circuito. ¡Cuidado con las plantas pincho!");
  }, 650);
}

/* ---------------- Bucle principal ---------------- */
let tPrevio = 0;

function actualizar(dt) {
  JUEGO.t += dt;
  const p = JUEGO.jugador, nivel = JUEGO.nivel;
  const pausa = UI.hayPausa();

  if (JUEGO.estado === "play") {
    JUEGO.tiempoJuego += dt;
    const ent = UI.entrada;

    // acción (hablar / avanzar diálogo)
    if (ent.accion) {
      ent.accion = false;
      if (!pausa && !UI.avanzarDialogo() && JUEGO.npcCercano) hablarCon(JUEGO.npcCercano);
      else if (pausa && UI.hayDialogo()) UI.avanzarDialogo();
    }

    if (!pausa) {
      actualizarJugador(p, nivel, ent, dt);

      // NPCs cercanos
      JUEGO.npcCercano = null;
      let mejorDist = 70;
      nivel.npcs.forEach(n => {
        const d = Math.abs(n.x - p.x);
        if (d < mejorDist && Math.abs(n.y - p.y) < 220) { mejorDist = d; JUEGO.npcCercano = n; }
      });
      window.npcCercano = JUEGO.npcCercano;

      // puertas cerradas cercanas (aviso)
      if (!JUEGO.npcCercano && p.enSuelo) {
        nivel.puertas.forEach(d => {
          if (!d.abierta && Math.abs((d.tx + 1) * TILE - p.x) < 44) tocarPuerta(d);
        });
      }

      // pinchos
      if (p.muerto <= 0 && p.invuln <= 0) {
        const r = rectJugador(p);
        for (const pin of nivel.pinchos) {
          const haz = { x: pin.x - 24, y: pin.y - 46, w: 48, h: 46 };
          if (aabb(r, haz)) { morir("pincho"); break; }
        }
      }

      // caída al vacío
      if (p.y > (nivel.h + 2) * TILE) morir("vacio");

      // checkpoints
      (nivel.checkpoints || []).forEach(c => {
        if (!c.tocado && Math.abs(c.x - p.x) < 44 && Math.abs(c.y - p.y) < 130) {
          c.tocado = true;
          AudioFX.sfx("checkpoint");
          UI.toast("¡Punto de control alcanzado!");
        }
      });

      // salida del pueblo → parkour
      if (nivel.salida && p.x > nivel.salida.x && !JUEGO.transicionando) {
        JUEGO.transicionando = true;
        irAlParkour();
      }

      // meta: la novia
      if (nivel.novia && Math.abs(nivel.novia.x - p.x) < 60 && Math.abs(nivel.novia.y - p.y) < 90) {
        iniciarFinal();
      }
    }
  } else if (JUEGO.estado === "final") {
    if (UI.entrada.accion) { UI.entrada.accion = false; UI.avanzarDialogo(); }
    p.vx = 0;
  }

  if (JUEGO.estado === "play" || JUEGO.estado === "final") {
    actualizarParticulas(dt);
    objetivoCamara(nivel, p);
    actualizarCamara(dt);
  }

  // HUD
  if (JUEGO.estado === "play" || JUEGO.estado === "final") {
    const puertasAbiertas = nivel.puertas.filter(d => d.abierta).length;
    UI.hud(nivel.nombre, puertasAbiertas, fmtTiempo(JUEGO.tiempoJuego), JUEGO.caidas, nivel.id === "pueblo");
  }
}

function cuadro(ts) {
  const dt = Math.min((ts - tPrevio) / 1000 || 0, 1 / 30);
  tPrevio = ts;
  if (JUEGO.estado === "play" || JUEGO.estado === "final") {
    actualizar(dt);
    render(g, JUEGO.nivel, JUEGO.jugador, JUEGO.t);
  } else if (JUEGO.estado === "victoria") {
    JUEGO.t += dt;
    actualizarParticulas(dt);
    render(g, JUEGO.nivel, JUEGO.jugador, JUEGO.t);
  }
  requestAnimationFrame(cuadro);
}

/* ---------------- Inicio ---------------- */
function iniciarJuego() {
  AudioFX.ensure();
  AudioFX.sfx("inicio");
  $("titulo").classList.add("oculto");
  $("hud").classList.remove("oculto-suave");
  cargarNivel("pueblo");
  JUEGO.estado = "play";
  JUEGO.tiempoJuego = 0;
  JUEGO.caidas = 0;
  UI.banner("PUEBLO SENATI");
  UI.toast("Habla con los aldeanos para conocer la historia de SENATI.");
  if (UI.esMovil) $("controles").classList.add("visible");
  tPrevio = performance.now();
  requestAnimationFrame(cuadro);
}

$("btn-jugar").addEventListener("click", iniciarJuego);
$("btn-rejugar").addEventListener("click", () => {
  $("victoria").classList.add("oculto");
  $("hud").classList.remove("oculto-suave");
  cargarNivel("pueblo");
  JUEGO.estado = "play";
  JUEGO.tiempoJuego = 0;
  JUEGO.caidas = 0;
  UI.banner("PUEBLO SENATI");
});

/* ---------------- Arranque ---------------- */
cargarTexturas(() => {
  redimensionar();
  JUEGO.estado = "titulo";
  // fondo animado del título (paneo suave por el pueblo)
  const nivelDemo = NIVELES.pueblo;
  const capaDemo = construirCapaEstatica(nivelDemo);
  const demo = { ...nivelDemo, capa: capaDemo, npcs: nivelDemo.npcs.map(n => ({ ...n, visto: true })) };
  const pDemo = nuevoJugador(nivelDemo);
  ajustarCamara(demo, pDemo);
  cam.x = 0;
  (function dibujarTitulo() {
    JUEGO.t += 1 / 60;
    cam.x += 26 / 60 * cam.z;
    if (cam.x > nivelDemo.w * TILE - view.w / cam.z) cam.x = 0;
    render(g, demo, { ...pDemo, x: -99999 }, JUEGO.t);
    if (JUEGO.estado === "titulo") requestAnimationFrame(dibujarTitulo);
  })();
});

// desbloquear audio con el primer toque
window.addEventListener("pointerdown", () => AudioFX.ensure(), { once: true });
