"use strict";
/* ============================================================
   DATOS.JS — Niveles, diálogos y preguntas del juego SENATI
   Tiles: 0 aire | 1 suelo | 2 bloque | 3 madera | 4 escalera
          5 pared (fondo) | 6 pared blanca (fondo)
   ============================================================ */

const TILE = 32;
const SOLIDOS = new Set([1, 2, 3]);

function mapaVacio(w, h) {
  return Array.from({ length: h }, () => new Array(w).fill(0));
}
function rectT(m, x0, y0, x1, y1, id) {
  for (let y = y0; y <= y1; y++) {
    if (!m[y]) continue;
    for (let x = x0; x <= x1; x++) if (m[y][x] !== undefined) m[y][x] = id;
  }
}
function colT(m, x, y0, y1, id) {
  for (let y = y0; y <= y1; y++) if (m[y] && m[y][x] !== undefined) m[y][x] = id;
}

/* ---------------- NIVEL 1: PUEBLO SENATI ---------------- */
function construirPueblo() {
  const w = 104, h = 15;
  const t = mapaVacio(w, h);
  rectT(t, 0, 12, w - 1, 14, 1);            // suelo de pasto/tierra

  // decoraciones (se dibujan en la capa estática)
  const pasto = [8, 12, 17, 21, 25, 33, 38, 43, 47, 54, 61, 68, 75, 82, 87, 95, 99]
    .map(x => ({ x: x * TILE, y: 12 * TILE }));
  const arboles = [20, 41, 68, 88].map(x => ({ img: "arbol_1", x: x * TILE, y: 12 * TILE, esc: 2 }));
  const casas = [
    { x: 9, w: 9 }, { x: 33, w: 9 }, { x: 56, w: 9 }, { x: 79, w: 8 }
  ];
  const decor = [
    { img: "arbol_2", x: 94 * TILE, y: 12 * TILE, esc: 2 }
  ].concat(pasto.map(p => ({ img: "pasto", x: p.x, y: p.y - 26, esc: 1.6 })))
   .concat(arboles);

  return {
    id: "pueblo",
    nombre: "PUEBLO SENATI",
    w, h, tiles: t,
    fondo: "cielo",
    spawn: { x: 3.2 * TILE, y: 12 * TILE },
    decor, casas,
    npcs: [
      { tipo: "info", id: "alfredo", nombre: "Don Alfredo", x: 14.5 * TILE, y: 12 * TILE, info: "alfredo", charla: "Presiona HABLAR otra vez si quieres que te repita la historia, joven." },
      { tipo: "quiz", id: "bruno", nombre: "Guardián Bruno", x: 22.5 * TILE, y: 12 * TILE, quiz: 0, hecho: false, charla: "¡Mi puerta solo se abre si demuestras que aprendiste la historia! ¿Empezamos?" },
      { tipo: "info", id: "rosa", nombre: "Doña Rosa", x: 36.5 * TILE, y: 12 * TILE, info: "rosa", charla: "Qué bueno que te interese, joven. Vuelve a hablarme cuando quieras." },
      { tipo: "quiz", id: "rocco", nombre: "Guardián Rocco", x: 44.5 * TILE, y: 12 * TILE, quiz: 1, hecho: false, charla: "Doña Rosa te contó la época dorada, ¿no? ¡Demuéstralo!" },
      { tipo: "info", id: "tico", nombre: "Ing. Tico", x: 58.5 * TILE, y: 12 * TILE, info: "tico", charla: "El SENATI de hoy es gigante. Pregúntame cuantas veces quieras." },
      { tipo: "quiz", id: "lila", nombre: "Guardiana Lila", x: 66.5 * TILE, y: 12 * TILE, quiz: 2, hecho: false, charla: "Última prueba, valiente: responde bien y el parkour te espera." }
    ],
    puertas: [
      { id: 0, tx: 28, ty: 8, tw: 2, th: 4, abierta: false, anim: 0, quizDe: 0 },
      { id: 1, tx: 50, ty: 8, tw: 2, th: 4, abierta: false, anim: 0, quizDe: 1 },
      { id: 2, tx: 72, ty: 8, tw: 2, th: 4, abierta: false, anim: 0, quizDe: 2 }
    ],
    pinchos: [],
    checkpoints: [],
    salida: { x: 78 * TILE },
    novia: null
  };
}

/* ---------------- NIVEL 2: PARKOUR ---------------- */
function construirParkour() {
  const w = 96, h = 26;
  const t = mapaVacio(w, h);

  rectT(t, 30, 24, 75, 25, 1);      // piso inferior
  rectT(t, 0, 23, 7, 23, 2);        // inicio
  rectT(t, 10, 23, 11, 23, 2);
  rectT(t, 14, 21, 15, 21, 2);
  rectT(t, 18, 19, 19, 19, 2);
  rectT(t, 22, 19, 30, 19, 2);      // torre 1
  colT(t, 25, 9, 18, 4);            // escalera torre 1
  rectT(t, 26, 10, 31, 10, 2);      // repisa arriba de la escalera
  rectT(t, 33, 10, 37, 10, 2);
  rectT(t, 40, 9, 43, 9, 2);
  rectT(t, 45, 11, 55, 11, 3);      // puente de madera
  rectT(t, 47, 11, 48, 11, 0);      // huecos
  rectT(t, 51, 11, 52, 11, 0);
  rectT(t, 56, 14, 58, 14, 2);      // descenso
  rectT(t, 61, 17, 63, 17, 2);
  rectT(t, 66, 20, 68, 20, 2);
  rectT(t, 69, 12, 76, 12, 2);      // torre 2
  colT(t, 72, 11, 23, 4);           // escalera torre 2
  rectT(t, 79, 10, 82, 10, 2);
  rectT(t, 85, 8, 88, 8, 2);        // torre final
  rectT(t, 91, 8, 95, 8, 3);        // plataforma de la novia

  const pinchos = [
    { x: 40.5 * TILE, y: 24 * TILE },   // piso
    { x: 52.5 * TILE, y: 24 * TILE },
    { x: 63.5 * TILE, y: 24 * TILE },
    { x: 29.5 * TILE, y: 19 * TILE },   // torre 1
    { x: 42.5 * TILE, y: 9 * TILE },    // camino alto
    { x: 62.5 * TILE, y: 17 * TILE },   // descenso
    { x: 81.5 * TILE, y: 10 * TILE },   // antes de la torre final
    { x: 85.5 * TILE, y: 8 * TILE }     // torre final
  ].map(p => ({ x: p.x, y: p.y, t: 0 }));

  return {
    id: "parkour",
    nombre: "GRAN PARKOUR",
    w, h, tiles: t,
    fondo: "pared",
    spawn: { x: 2.5 * TILE, y: 23 * TILE },
    decor: [],
    casas: [],
    npcs: [],
    puertas: [],
    pinchos,
    checkpoints: [
      { x: 2.5 * TILE, y: 23 * TILE, tocado: true },
      { x: 23 * TILE, y: 19 * TILE, tocado: false },
      { x: 70 * TILE, y: 12 * TILE, tocado: false }
    ],
    salida: null,
    novia: { x: 93.5 * TILE, y: 8 * TILE }
  };
}

/* ---------------- DIÁLOGOS INFORMATIVOS ---------------- */
window.DIALOGOS_INFO = {
  alfredo: [
    "¡Hola, joven! Bienvenido al Pueblo SENATI, el lugar donde nacen los grandes técnicos del Perú.",
    "A fines de los años 50, a las fábricas les faltaban trabajadores calificados. Un grupo de empresarios tuvo una gran idea...",
    "En 1961, con el impulso de la Sociedad Nacional de Industrias (SNI), nació SENATI por ley: el Servicio Nacional de Adiestramiento en Trabajo Industrial.",
    "Para avanzar al pueblo, pasa a hablar con el Guardián Bruno. Si respondes bien sus preguntas, la puerta de madera se abrirá. ¡Éxitos!"
  ],
  rosa: [
    "Bienvenido otra vez, joven. Yo te contaré cómo creció nuestra querida institución.",
    "En 1965, el presidente Fernando Belaúnde Terry inauguró la sede central de SENATI en el distrito de San Martín de Porres, en Lima.",
    "Un año después, en 1966, SENATI ya contaba con 440 alumnos. ¡Los talleres no daban abasto!",
    "Desde entonces, miles de jóvenes técnicos salen cada año a impulsar la industria peruana. Ahora ve con el Guardián Rocco."
  ],
  tico: [
    "¡Qué gusto verte por aquí! Te presentaré al SENATI de hoy, que ya lleva más de 60 años formando técnicos.",
    "Hoy SENATI tiene 65 sedes en todo el Perú y más de 85 carreras técnicas: mecatrónica automotriz, electricidad industrial, software con inteligencia artificial y muchas más.",
    "Más de 500 mil egresados trabajan en la industria, y su 'Modelo Dual' permite aprender estudiando y trabajando en empresas.",
    "¿Y sabes cómo se financia? Las empresas industriales aportan el 0.75% de las remuneraciones de sus trabajadores, según la Ley 26272. ¡Impresionante, verdad?",
    "Ya casi lo tienes: la Guardiana Lila custodia la última puerta. ¡Tú puedes!"
  ]
};

/* ---------------- CUESTIONARIOS (3 preguntas por guardián) ---------------- */
window.QUIZZES = [
  {
    npc: "bruno", nombre: "Guardián Bruno", puerta: 0,
    preguntas: [
      {
        q: "¿Qué significa la sigla SENATI?",
        ops: [
          "Servicio Nacional de Adiestramiento en Trabajo Industrial",
          "Sistema Nacional de Talleres Industriales",
          "Servicio Nocturno de Artes y Oficios",
          "Sociedad Nacional de Trabajadores Industriales"
        ], ok: 0
      },
      {
        q: "¿Qué institución impulsó la creación de SENATI?",
        ops: [
          "El Congreso de la República",
          "La Sociedad Nacional de Industrias (SNI)",
          "Una universidad de España",
          "La Municipalidad de Lima"
        ], ok: 1
      },
      {
        q: "¿En qué año se constituyó SENATI por ley?",
        ops: ["1950", "1821", "1961", "1985"], ok: 2
      }
    ]
  },
  {
    npc: "rocco", nombre: "Guardián Rocco", puerta: 1,
    preguntas: [
      {
        q: "¿Quién inauguró la sede central de SENATI en 1965?",
        ops: [
          "Simón Bolívar",
          "Alan García",
          "Fernando Belaúnde Terry",
          "Jorge Basadre"
        ], ok: 2
      },
      {
        q: "¿En qué distrito de Lima quedó la sede central?",
        ops: [
          "San Martín de Porres",
          "Miraflores",
          "San Isidro",
          "Los Olivos"
        ], ok: 0
      },
      {
        q: "¿Cuántos alumnos tenía SENATI en 1966?",
        ops: ["90", "440", "1 000", "5 600"], ok: 1
      }
    ]
  },
  {
    npc: "lila", nombre: "Guardiana Lila", puerta: 2,
    preguntas: [
      {
        q: "¿Cuántas sedes tiene SENATI en todo el Perú?",
        ops: ["12", "30", "65", "200"], ok: 2
      },
      {
        q: "¿Cuál de estas carreras SÍ se estudia en SENATI?",
        ops: [
          "Crianza de dragones",
          "Mecatrónica automotriz",
          "Arqueología espacial",
          "Magia y hechicería"
        ], ok: 1
      },
      {
        q: "¿Qué porcentaje de las remuneraciones aportan las empresas industriales para financiar SENATI (Ley 26272)?",
        ops: ["0.75%", "5%", "15%", "50%"], ok: 0
      }
    ]
  }
];

/* ---------------- DIÁLOGOS DE LA NOVIA ---------------- */
window.DIALOGOS_NOVIA = [
  "¡Mi amor, lo lograste! Superaste todas las pruebas del pueblo y el gran parkour de SENATI.",
  "Estoy muy orgullosa de ti. ¡Ya eres todo un técnico de corazón SENATI!",
  "Te lo mereces, campeón. ¡FELICITACIONES!"
];

/* ---------------- NIVELES ---------------- */
window.NIVELES = {
  pueblo: construirPueblo(),
  parkour: construirParkour()
};
