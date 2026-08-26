#!/usr/bin/env node
/**
 * Generate one distinct SVG panel per product category.
 *
 *   node tools/make-art.js
 *
 * They share a composition (overhead bowls on a warm ground) so the set reads
 * as one family, but each category gets its own palette and contents so the
 * catalogue does not look like the same picture six times.
 *
 * Replace any of these with a real photograph using:
 *   node tools/photo.js <slot> <image>
 */

"use strict";

const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "assets", "img", "art");

/* Bowl fills: [rim highlight, centre, edge] */
const P = {
  turmeric: ["#f7c94b", "#c8860e"],
  chilli:   ["#e2542f", "#96240f"],
  cream:    ["#fdf6e6", "#d9c8a4"],
  green:    ["#9dbf58", "#5a7a2a"],
  lentil:   ["#f0a355", "#b8641a"],
  pepper:   ["#5a4a3c", "#241a12"],
  rice:     ["#fbf5e4", "#ddd0ae"],
  wheat:    ["#e8c887", "#b08b3a"],
  maroon:   ["#a8455c", "#6d2233"],
  olive:    ["#b9c17a", "#7c8339"],
  brown:    ["#c08b5c", "#7d4f27"],
  leaf:     ["#7fc06a", "#3d7a33"],
  mango:    ["#ffc martial", "#e08a12"],
  amber:    ["#f2b134", "#b2740c"],
  coconut:  ["#f6efe2", "#cbbb9c"],
  honey:    ["#f0b03a", "#a86a0d"],
  cocoa:    ["#8a6240", "#4d3320"]
};
delete P.mango;
P.mango = ["#ffc93c", "#e08a12"];

const GROUNDS = {
  warm:  ["#241a10", "#3d2c17", "#5c421d"],
  straw: ["#2a2415", "#463c1f", "#6b5a28"],
  earth: ["#241d13", "#3b3120", "#57472a"],
  fresh: ["#14210f", "#24361a", "#3a5427"],
  pale:  ["#2b2418", "#4a3d26", "#6e5a34"],
  nut:   ["#231a12", "#3c2b1c", "#5a4227"]
};

/* Small helper: a scatter of dots inside a bowl. */
function dots(list, colour, opacity) {
  return list
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`)
    .join("");
}

function bowl(x, y, r, key, inner, id) {
  const [c0, c1] = P[key];
  return `
    <g transform="translate(${x} ${y})">
      <circle r="${r + 7}" fill="#1a120a" fill-opacity=".55"/>
      <circle r="${r}" fill="url(#g${id})"/>
      <circle r="${r}" fill="none" stroke="#fff3d6" stroke-opacity=".38" stroke-width="2.4"/>
      ${inner}
    </g>`;
}

function grad(id, key) {
  const [c0, c1] = P[key];
  return `<radialGradient id="g${id}" cx="36%" cy="30%" r="72%"><stop offset="0%" stop-color="${c0}"/><stop offset="100%" stop-color="${c1}"/></radialGradient>`;
}

/* Inner-content generators ------------------------------------------------ */

const seeds = (col, op, list) =>
  `<g fill="${col}" fill-opacity="${op}">${dots(list)}</g>`;

const flakes = (col, op, list) =>
  `<g fill="${col}" fill-opacity="${op}">` +
  list.map(([x, y, rx, ry, rot]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${x} ${y})"/>`).join("") +
  "</g>";

const eggs = (list) =>
  `<g fill="#fffdf7" stroke="#b9a37a" stroke-opacity=".45">` +
  list.map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`).join("") +
  "</g>";

const grains = (col, op, list) =>
  `<g fill="${col}" fill-opacity="${op}">` +
  list.map(([x, y, rot]) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="3.4" transform="rotate(${rot} ${x} ${y})"/>`).join("") +
  "</g>";

/* Category definitions ---------------------------------------------------- */

const CATS = [
  {
    slug: "spices",
    ground: "warm",
    title: "Spices and seasonings",
    bowls: [
      [200, 210, 88, "turmeric", seeds("#7a4d06", ".34", [[-30,-22,7],[12,-38,6],[34,6,7],[-14,26,6],[-48,14,5]])],
      [400, 150, 68, "chilli",   flakes("#5e1608", ".4", [[-22,-16,16,6,-28],[18,-28,14,5,22],[26,14,15,6,-14],[-12,28,13,5,38]])],
      [578, 244, 76, "pepper",   seeds("#0f0a06", ".5", [[-20,-14,8],[12,-24,7],[26,10,8],[-8,24,7],[-36,8,6]])],
      [318, 372, 64, "amber",    seeds("#7d3f0c", ".34", [[-18,-12,6],[10,-22,5],[22,8,6],[-6,20,5]])],
      [516, 424, 56, "brown",    grains("#3d2412", ".42", [[-14,-8,20],[12,4,-30],[-2,18,60]])],
      [716, 152, 50, "green",    seeds("#3c5418", ".38", [[-14,-10,5],[8,-18,4],[16,6,5]])]
    ]
  },
  {
    slug: "grains",
    ground: "straw",
    title: "Rice and food grains",
    bowls: [
      [210, 200, 90, "rice",   grains("#a89361", ".5", [[-30,-20,18],[6,-34,-12],[30,4,40],[-12,24,-25],[-46,10,8],[18,34,60]])],
      [410, 148, 66, "wheat",  grains("#7a5716", ".45", [[-20,-14,22],[10,-24,-18],[20,10,50],[-6,20,-40]])],
      [590, 236, 78, "cream",  grains("#b19a68", ".45", [[-24,-16,10],[8,-28,-30],[26,6,45],[-10,22,-15]])],
      [330, 372, 62, "olive",  seeds("#4c5321", ".4", [[-18,-12,6],[10,-20,5],[20,8,6],[-6,18,5]])],
      [520, 418, 54, "amber",  grains("#7d3f0c", ".4", [[-14,-8,15],[10,6,-35],[-2,18,55]])],
      [720, 150, 48, "brown",  seeds("#4d3320", ".4", [[-12,-8,5],[8,-14,4],[14,6,5]])]
    ]
  },
  {
    slug: "pulses",
    ground: "earth",
    title: "Pulses and lentils",
    bowls: [
      [205, 205, 88, "lentil", seeds("#7d3f0c", ".36", [[-28,-20,7],[10,-32,6],[30,6,7],[-12,24,6],[-44,12,5],[18,30,5]])],
      [402, 152, 66, "green",  seeds("#3c5418", ".4", [[-20,-14,6],[10,-22,5],[20,8,6],[-6,18,5]])],
      [582, 240, 76, "cream",  seeds("#b19a68", ".4", [[-24,-16,7],[8,-26,6],[26,6,7],[-10,22,6]])],
      [322, 374, 62, "pepper", seeds("#0f0a06", ".45", [[-18,-12,6],[10,-20,5],[20,8,6],[-6,18,5]])],
      [518, 420, 56, "maroon", seeds("#4a1522", ".42", [[-16,-10,6],[10,4,6],[-2,18,5]])],
      [718, 154, 48, "olive",  seeds("#4c5321", ".4", [[-12,-8,5],[8,-14,4],[14,6,5]])]
    ]
  },
  {
    slug: "produce",
    ground: "fresh",
    title: "Fresh fruits and vegetables",
    bowls: [
      [200, 208, 86, "leaf",   flakes("#255018", ".38", [[-24,-16,18,8,-25],[14,-26,16,7,20],[24,12,17,7,-12]])],
      [398, 150, 68, "chilli", flakes("#5e1608", ".38", [[-20,-12,18,6,-30],[16,10,16,6,25]])],
      [578, 242, 74, "mango",  seeds("#a3610a", ".34", [[-20,-14,8],[12,-22,7],[22,10,8]])],
      [320, 372, 62, "brown",  seeds("#4d3320", ".4", [[-16,-10,6],[10,-18,5],[18,8,6]])],
      [516, 422, 56, "olive",  flakes("#3f4a1c", ".4", [[-14,-8,14,5,-20],[12,8,13,5,30]])],
      [716, 152, 50, "maroon", seeds("#4a1522", ".4", [[-12,-8,6],[8,-14,5],[14,8,5]])]
    ]
  },
  {
    slug: "eggs",
    ground: "pale",
    title: "Eggs and poultry products",
    bowls: [
      [220, 210, 92, "cream", eggs([[-30,-16,22,29],[14,-28,21,28],[26,16,21,28],[-16,26,20,27]])],
      [430, 158, 70, "rice",  eggs([[-18,-10,17,23],[16,-16,16,22],[4,20,16,22]])],
      [608, 250, 78, "cream", eggs([[-22,-12,19,25],[16,-20,18,24],[8,20,18,24]])],
      [340, 380, 60, "wheat", eggs([[-14,-8,14,19],[12,-12,13,18]])],
      [538, 424, 54, "coconut", seeds("#b0a084", ".4", [[-14,-8,6],[10,4,6],[-2,16,5]])],
      [724, 158, 46, "amber", seeds("#a3610a", ".35", [[-10,-6,5],[8,-12,4],[12,6,5]])]
    ]
  },
  {
    slug: "naturals",
    ground: "nut",
    title: "Oilseeds, nuts and natural products",
    bowls: [
      [205, 205, 88, "coconut", seeds("#a3927a", ".42", [[-28,-20,7],[10,-30,6],[28,6,7],[-12,24,6],[-42,12,5]])],
      [400, 150, 66, "cocoa",   flakes("#3a2415", ".45", [[-18,-12,15,7,-25],[14,10,14,6,25]])],
      [580, 240, 76, "honey",   seeds("#8a5407", ".3", [[-22,-14,8],[12,-24,7],[24,8,8]])],
      [320, 372, 62, "brown",   flakes("#4d3320", ".42", [[-16,-10,14,6,-30],[12,8,13,6,20]])],
      [518, 420, 56, "cream",   seeds("#b19a68", ".42", [[-14,-8,6],[10,4,6],[-2,16,5]])],
      [716, 152, 48, "olive",   seeds("#4c5321", ".4", [[-12,-8,5],[8,-14,4],[14,6,5]])]
    ]
  }
];

/* Render ------------------------------------------------------------------ */

function render(cat) {
  const [c0, c1, c2] = GROUNDS[cat.ground];
  const gradients = cat.bowls.map((b, i) => grad(i, b[3])).join("\n    ");
  const shapes = cat.bowls.map((b, i) => bowl(b[0], b[1], b[2], b[3], b[4], i)).join("");

  const scatter = [
    [120, 440, 4], [152, 470, 3], [96, 486, 3], [196, 462, 3],
    [632, 112, 3], [672, 86, 3], [452, 272, 3], [486, 300, 2.5],
    [240, 316, 3], [790, 300, 3], [820, 400, 3.5], [60, 300, 3]
  ].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 560" role="img" aria-labelledby="t-${cat.slug}" preserveAspectRatio="xMidYMid slice">
  <title id="t-${cat.slug}">${cat.title}</title>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c0}"/><stop offset="48%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="28%" cy="18%" r="70%">
      <stop offset="0%" stop-color="#ffd98a" stop-opacity=".30"/><stop offset="100%" stop-color="#ffd98a" stop-opacity="0"/>
    </radialGradient>
    ${gradients}
    <filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3"/><feColorMatrix values="0 0 0 0 0.28 0 0 0 0 0.2 0 0 0 0 0.1 0 0 0 .24 0"/></filter>
  </defs>

  <rect width="900" height="560" fill="url(#bg)"/>
  <rect width="900" height="560" fill="url(#glow)"/>

  <g stroke="#e3bd68" stroke-opacity=".07" stroke-width="1" fill="none">
    <path d="M0 120h900M0 300h900M0 470h900M180 0v560M420 0v560M660 0v560"/>
  </g>
${shapes}

  <g fill="#ffe6a8" fill-opacity=".5">${scatter}</g>
  <rect width="900" height="560" filter="url(#n)" opacity=".48"/>
</svg>
`;
}

for (const cat of CATS) {
  const file = path.join(OUT, cat.slug + ".svg");
  fs.writeFileSync(file, render(cat));
  console.log("✓ assets/img/art/" + cat.slug + ".svg");
}
console.log(CATS.length + " category panels written");
