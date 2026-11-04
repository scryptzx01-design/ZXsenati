# 🎮 La Aventura SENATI — Juego 2D de plataformas

Juego 2D estilo Minecraft sobre la **historia de SENATI**, hecho 100% con **HTML, CSS y JavaScript** (sin PHP ni frameworks). Funciona en **PC (teclado)** y **celular (botones táctiles)**.

## 🕹️ Cómo se juega

1. **Pueblo SENATI:** habla con los 3 aldeanos (Don Alfredo, Doña Rosa e Ing. Tico) para conocer la historia real de SENATI.
2. **Guardianes:** los 3 guardiacias (Bruno, Rocco y Lila) te hacen 3 preguntas cada uno. Si respondes bien, se abre la **puerta de madera** correspondiente.
3. **Gran Parkour:** al salir del pueblo la cámara se aleja para mostrar todo el circuito. Supera los saltos, escaleras y plantas pincho (con puntos de control).
4. **Final:** tu novia te felicita al llegar a la meta. 🎉

**PC:** flechas o `A`/`D` para moverte · `W`/`ESPACIO` para saltar · `E` para hablar
**Celular:** botones en pantalla (◀ ▶ HABLAR SALTAR)

## 📁 Estructura

```
juego_senati/
├── index.html          ← página principal
├── css/estilos.css     ← estilos (HUD, quiz, controles táctiles…)
├── js/
│   ├── datos.js        ← niveles, diálogos y preguntas
│   ├── audio.js        ← efectos de sonido (Web Audio, sin archivos)
│   ├── motor.js        ← física, cámara y render (Canvas)
│   ├── ui.js           ← diálogos, quiz, HUD y controles
│   └── principal.js    ← bucle principal y estados
└── IMGS/               ← TODAS las imágenes del juego
```

## 🖼️ Imágenes (carpeta `IMGS/`)

El juego carga las imágenes **por nombre exacto**. Si quieres usar tus propias texturas, solo reemplaza los archivos respetando estos nombres:

| Archivo | Uso |
| --- | --- |
| `aldeano_gey.png` | aldeanos / guardianes |
| `suelo.png` | piso y plataformas |
| `pared.png` | fondo del parkour |
| `pared_blanca.png` | paredes de las casas |
| `descarga (1).png` | madera: puertas, puentes, techos |
| `escalera.png` | escaleras |
| `pasto.png` | pasto decorativo |
| `pincho.png` | planta pincho (peligro) |
| `arbol_1.png`, `arbol_2.png` | árboles del pueblo |
| `jugador_idle/paso1/paso2/paso3/salto.png` | animación del jugador (creado para el juego) |
| `novia.png` | la novia del final (creada para el juego) |

## ▶️ Probar en tu PC

Opción 1: abre `index.html` con doble clic.
Opción 2 (recomendada):

```bash
npx serve .
# o
python3 -m http.server 8000
```

## 🚀 Publicar en GitHub + Vercel

1. Sube el proyecto a un repositorio en GitHub:

```bash
git init
git add .
git commit -m "Juego 2D de la historia de SENATI"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/juego-senati.git
git push -u origin main
```

2. Entra a [vercel.com/new](https://vercel.com/new), inicia sesión con GitHub y **importa** el repositorio.
3. Deja todo por defecto (no necesita build ni configuración: es un sitio estático) y pulsa **Deploy**.
4. Listo: Vercel te dará un link público tipo `https://juego-senati.vercel.app` para compartir.

> También funciona en **GitHub Pages**: Settings → Pages → rama `main` → Save.

## 📚 Datos históricos usados (reales)

- 1961: se constituye SENATI por ley, impulsado por la Sociedad Nacional de Industrias (SNI).
- 1965: el presidente Fernando Belaúnde Terry inaugura la sede central en San Martín de Porres (Lima).
- 1966: 440 alumnos.
- Hoy: 65 sedes, más de 85 carreras técnicas y +500 mil egresados.
- Financiamiento: 0.75% de las remuneraciones (Ley 26272).
