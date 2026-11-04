"use strict";
/* ============================================================
   UI.JS — Diálogos, cuestionarios, HUD y controles táctiles
   ============================================================ */

const $ = id => document.getElementById(id);

const UI = (() => {
  const esMovil = window.matchMedia("(pointer: coarse)").matches
               || navigator.maxTouchPoints > 0
               || "ontouchstart" in window;
  window.esMovil = esMovil;

  let alContinuar = null;     // callback cuando el diálogo termina
  let alCerrarQuiz = null;
  let escribiendo = false, timerEscritura = null;
  let paginasActuales = [], paginaIdx = 0;

  /* ---------------- DIÁLOGO ---------------- */
  function mostrarDialogo(nombre, retrato, paginas, cb) {
    paginasActuales = paginas; paginaIdx = 0;
    alContinuar = cb || null;
    $("dialogo-nombre").textContent = nombre;
    $("dialogo-retrato").style.backgroundImage = "url(IMGS/" + retrato + ")";
    $("dialogo").classList.remove("oculto");
    escribirPagina();
  }

  function escribirPagina() {
    const texto = paginasActuales[paginaIdx];
    const el = $("dialogo-texto");
    el.textContent = "";
    $("dialogo-pagina").textContent = (paginaIdx + 1) + " / " + paginasActuales.length;
    escribiendo = true;
    let i = 0;
    clearInterval(timerEscritura);
    timerEscritura = setInterval(() => {
      i += 1;
      el.textContent = texto.slice(0, i);
      if (i % 3 === 0) AudioFX.sfx("hablar");
      if (i >= texto.length) { clearInterval(timerEscritura); escribiendo = false; }
    }, 18);
  }

  function avanzarDialogo() {
    if ($("dialogo").classList.contains("oculto")) return false;
    if (escribiendo) {           // completar la página de golpe
      clearInterval(timerEscritura);
      $("dialogo-texto").textContent = paginasActuales[paginaIdx];
      escribiendo = false;
      return true;
    }
    paginaIdx++;
    if (paginaIdx >= paginasActuales.length) {
      $("dialogo").classList.add("oculto");
      const cb = alContinuar; alContinuar = null;
      if (cb) cb();
      return true;
    }
    escribirPagina();
    return true;
  }

  /* ---------------- QUIZ ---------------- */
  let quizActual = null, preguntaIdx = 0, fallosQuiz = 0;

  function abrirQuiz(quiz, alTerminar) {
    quizActual = quiz; preguntaIdx = 0; fallosQuiz = 0;
    alCerrarQuiz = alTerminar || null;
    $("quiz-npc").textContent = quiz.nombre;
    $("quiz").classList.remove("oculto");
    pintarPregunta();
  }

  function pintarPuntos() {
    const cont = $("quiz-puntos");
    cont.innerHTML = "";
    quizActual.preguntas.forEach((_, i) => {
      const s = document.createElement("span");
      s.className = "punto" + (i < preguntaIdx ? " listo" : i === preguntaIdx ? " actual" : "");
      cont.appendChild(s);
    });
  }

  function pintarPregunta() {
    const p = quizActual.preguntas[preguntaIdx];
    pintarPuntos();
    $("quiz-pregunta").textContent = p.q;
    $("quiz-feedback").textContent = "";
    $("quiz-feedback").className = "";
    const cont = $("quiz-opciones");
    cont.innerHTML = "";
    p.ops.forEach((op, i) => {
      const b = document.createElement("button");
      b.className = "opcion";
      b.innerHTML = "<span class='letra'>" + "ABCD"[i] + "</span> " + op;
      b.onclick = () => responder(i, b);
      cont.appendChild(b);
    });
  }

  function responder(i, btn) {
    const p = quizActual.preguntas[preguntaIdx];
    if (i === p.ok) {
      btn.classList.add("correcta");
      AudioFX.sfx("ok");
      $("quiz-feedback").textContent = "¡Correcto!";
      $("quiz-feedback").className = "bien";
      bloquearOpciones();
      setTimeout(() => {
        preguntaIdx++;
        if (preguntaIdx >= quizActual.preguntas.length) cerrarQuiz(true);
        else pintarPregunta();
      }, 750);
    } else {
      btn.classList.add("incorrecta");
      btn.disabled = true;
      AudioFX.sfx("mal");
      fallosQuiz++;
      $("quiz-feedback").textContent = "Incorrecto. ¡Vuelve a intentarlo!";
      $("quiz-feedback").className = "mal";
    }
  }

  function bloquearOpciones() {
    document.querySelectorAll("#quiz-opciones .opcion").forEach(b => b.disabled = true);
  }

  function cerrarQuiz(terminado) {
    $("quiz").classList.add("oculto");
    const q = quizActual; quizActual = null;
    if (terminado && alCerrarQuiz) { const cb = alCerrarQuiz; alCerrarQuiz = null; cb(q, fallosQuiz); }
  }

  $("quiz-cerrar").onclick = () => cerrarQuiz(false);

  function hayPausa() {
    return !$("dialogo").classList.contains("oculto") || !$("quiz").classList.contains("oculto");
  }

  function hayDialogo() {
    return !$("dialogo").classList.contains("oculto");
  }

  /* ---------------- TOAST / BANNER / FLASH ---------------- */
  let toastTimer = null;
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("visible"), 2600);
  }

  function banner(msg) {
    const b = $("banner");
    b.textContent = msg;
    b.classList.remove("animar");
    void b.offsetWidth;      // reinicia la animación
    b.classList.add("animar");
  }

  function flash(color) {
    const f = $("flash");
    f.style.background = color;
    f.classList.remove("animar");
    void f.offsetWidth;
    f.classList.add("animar");
  }

  /* ---------------- HUD ---------------- */
  function hud(zona, puertas, tiempo, caidas, mostrarPuertas) {
    $("hud-zona").textContent = zona;
    $("hud-tiempo").textContent = "Tiempo " + tiempo;
    $("hud-caidas").textContent = "Caídas " + caidas;
    $("hud-puertas").style.display = mostrarPuertas ? "inline-block" : "none";
    $("hud-puertas").textContent = "Puertas " + puertas + "/3";
  }

  /* ---------------- ENTRADA (teclado + táctil) ---------------- */
  const entrada = { izq: false, der: false, arriba: false, abajo: false, salto: false, accion: false, agarrar: false };

  window.addEventListener("keydown", e => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key)) e.preventDefault();
    switch (e.key) {
      case "ArrowLeft": case "a": case "A": entrada.izq = true; break;
      case "ArrowRight": case "d": case "D": entrada.der = true; break;
      case "ArrowUp": case "w": case "W": entrada.arriba = true; break;
      case "ArrowDown": case "s": case "S": entrada.abajo = true; break;
      case " ": case "Spacebar": entrada.salto = true; break;
      case "e": case "E": case "Enter": entrada.accion = true; break;
    }
  });
  window.addEventListener("keyup", e => {
    switch (e.key) {
      case "ArrowLeft": case "a": case "A": entrada.izq = false; break;
      case "ArrowRight": case "d": case "D": entrada.der = false; break;
      case "ArrowUp": case "w": case "W": entrada.arriba = false; break;
      case "ArrowDown": case "s": case "S": entrada.abajo = false; break;
    }
  });

  function botonTactil(id, alPresionar, alSoltar) {
    const b = $(id);
    const down = e => { e.preventDefault(); b.classList.add("presionado"); AudioFX.ensure(); alPresionar(); };
    const up = e => { e.preventDefault(); b.classList.remove("presionado"); if (alSoltar) alSoltar(); };
    b.addEventListener("pointerdown", down);
    b.addEventListener("pointerup", up);
    b.addEventListener("pointercancel", up);
    b.addEventListener("pointerleave", up);
    b.addEventListener("contextmenu", e => e.preventDefault());
  }

  botonTactil("btn-izq", () => entrada.izq = true, () => entrada.izq = false);
  botonTactil("btn-der", () => entrada.der = true, () => entrada.der = false);
  botonTactil("btn-salto", () => { entrada.salto = true; }, null);
  botonTactil("btn-accion", () => { entrada.accion = true; }, null);

  // tocar el cuadro de diálogo avanza
  $("dialogo").addEventListener("pointerdown", e => { e.preventDefault(); entrada.accion = true; });

  return { entrada, mostrarDialogo, avanzarDialogo, abrirQuiz, toast, banner, flash, hud, esMovil, hayPausa, hayDialogo };
})();
