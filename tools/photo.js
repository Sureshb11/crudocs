#!/usr/bin/env node
/**
 * Swap a placeholder SVG illustration for a real photograph.
 *
 *   node tools/photo.js <slot> <path-to-image> ["alt text"]
 *
 * Slots: spices · grains · pulses · produce · eggs · naturals · chemicals
 *        food · manpower · sourcing · globe · shipband · about
 *
 * What it does:
 *   1. Resizes and crops the photo to the slot's aspect ratio
 *   2. Writes an optimised WebP plus a JPEG fallback into assets/img/
 *   3. Rewrites every reference in src/pages/ to a <picture> element,
 *      preserving the existing alt, loading, style and fetchpriority
 *   4. Runs the site build
 *
 * Needs `sips` (built into macOS) and `cwebp`. Install cwebp with:
 *   brew install webp
 *
 * To go back to the illustration for a slot:
 *   node tools/photo.js <slot> --revert
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const PAGES = path.join(ROOT, "src", "pages");
const IMG = path.join(ROOT, "assets", "img");

/* Each slot's target size matches the box it is rendered into. */
const SLOTS = {
  /* Product categories */
  spices:    { w: 1400, h: 875, art: "art/spices.svg" },
  grains:    { w: 1400, h: 875, art: "art/grains.svg" },
  pulses:    { w: 1400, h: 875, art: "art/pulses.svg" },
  produce:   { w: 1400, h: 875, art: "art/produce.svg" },
  eggs:      { w: 1400, h: 875, art: "art/eggs.svg" },
  naturals:  { w: 1400, h: 875, art: "art/naturals.svg" },
  chemicals: { w: 1400, h: 875, art: "art/chemicals.svg" },
  /* Cross-site */
  food:      { w: 1400, h: 875, art: "art/food.svg" },
  manpower:  { w: 1400, h: 875, art: "art/manpower.svg" },
  sourcing:  { w: 1400, h: 875, art: "art/sourcing.svg" },
  globe:     { w: 1440, h: 1080, art: "art/globe.svg" },
  shipband:  { w: 1600, h: 1000, art: "art/sourcing.svg" },
  about:     { w: 1200, h: 815, art: "about.jpg" }
};

function die(msg) {
  console.error("✗ " + msg);
  process.exit(1);
}

function have(cmd) {
  try {
    execFileSync("which", [cmd], { stdio: "ignore" });
    return true;
  } catch (_) {
    return false;
  }
}

/** Resize to cover the target box, then centre-crop to it. */
function encode(src, slot, spec) {
  const tmp = path.join(IMG, "." + slot + ".tmp.jpg");
  const jpg = path.join(IMG, "photo-" + slot + ".jpg");
  const webp = path.join(IMG, "photo-" + slot + ".webp");

  const dims = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", src])
    .toString()
    .match(/pixel(?:Width|Height):\s*(\d+)/g)
    .map((m) => parseInt(m.split(":")[1], 10));
  const [sw, sh] = dims;

  // Scale so the shorter side still covers the target, then crop.
  // Never upscale: a source smaller than the slot is encoded at the largest
  // size it can fill honestly, and the browser scales it up from there.
  // Faking resolution only produces a soft image in a bigger file.
  const cover = Math.max(spec.w / sw, spec.h / sh);
  const scale = Math.min(cover, 1);
  const outW = Math.round(spec.w * (scale / cover));
  const outH = Math.round(spec.h * (scale / cover));
  const rw = Math.ceil(sw * scale);
  const rh = Math.ceil(sh * scale);

  if (outW < spec.w) {
    console.log("  note: source is " + sw + "x" + sh + ", below the " + spec.w + "x" + spec.h +
                " slot — encoding at " + outW + "x" + outH + " rather than upscaling.");
  }

  execFileSync("sips", ["-z", String(rh), String(rw), src, "--out", tmp], { stdio: "ignore" });
  execFileSync("sips", ["-c", String(outH), String(outW), tmp, "--out", tmp], { stdio: "ignore" });
  execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "78", tmp, "--out", jpg], { stdio: "ignore" });
  execFileSync("cwebp", ["-quiet", "-q", "76", tmp, "-o", webp], { stdio: "ignore" });
  fs.unlinkSync(tmp);

  const kb = (p) => (fs.statSync(p).size / 1024).toFixed(0) + " KB";
  console.log("  " + outW + "×" + outH + "  webp " + kb(webp) + "  jpeg " + kb(jpg));
  return { jpg: "assets/img/photo-" + slot + ".jpg", webp: "assets/img/photo-" + slot + ".webp" };
}

/** Pull one attribute out of a tag string. */
const attr = (tag, name) => {
  const m = tag.match(new RegExp(name + '="([^"]*)"'));
  return m ? m[1] : null;
};

function rewriteToPhoto(slot, spec, out, newAlt) {
  const imgRe = new RegExp(
    '<img\\b[^>]*src="assets/img/' + spec.art.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + '"[^>]*>',
    "g"
  );
  let touched = 0;

  for (const file of fs.readdirSync(PAGES).filter((f) => f.endsWith(".html"))) {
    const p = path.join(PAGES, file);
    let s = fs.readFileSync(p, "utf8");
    if (!imgRe.test(s)) continue;
    imgRe.lastIndex = 0;

    s = s.replace(imgRe, (tag) => {
      const alt = newAlt !== null && newAlt !== undefined ? newAlt : attr(tag, "alt") || "";
      const keep = ["style", "loading", "decoding", "fetchpriority", "class"]
        .map((a) => {
          const v = attr(tag, a);
          return v === null ? "" : ' ' + a + '="' + v + '"';
        })
        .join("");

      return (
        '<picture>\n' +
        '        <source srcset="' + out.webp + '" type="image/webp">\n' +
        '        <img src="' + out.jpg + '" alt="' + alt + '" width="' + spec.w +
        '" height="' + spec.h + '"' + keep + '>\n' +
        '      </picture>'
      );
    });

    fs.writeFileSync(p, s);
    touched++;
    console.log("  updated src/pages/" + file);
  }
  return touched;
}

function revert(slot, spec) {
  const picRe = new RegExp(
    '<picture>\\s*<source srcset="assets/img/photo-' + slot + '\\.webp"[^>]*>\\s*(<img\\b[^>]*>)\\s*</picture>',
    "g"
  );
  let touched = 0;

  for (const file of fs.readdirSync(PAGES).filter((f) => f.endsWith(".html"))) {
    const p = path.join(PAGES, file);
    let s = fs.readFileSync(p, "utf8");
    if (!picRe.test(s)) continue;
    picRe.lastIndex = 0;

    s = s.replace(picRe, (_all, tag) => {
      const alt = attr(tag, "alt") || "";
      const keep = ["style", "loading", "decoding", "fetchpriority", "class"]
        .map((a) => {
          const v = attr(tag, a);
          return v === null ? "" : ' ' + a + '="' + v + '"';
        })
        .join("");
      const wh = spec.art.endsWith(".svg")
        ? ' width="900" height="560"'
        : ' width="900" height="611"';
      return '<img src="assets/img/' + spec.art + '" alt="' + alt + '"' + wh + keep + '>';
    });

    fs.writeFileSync(p, s);
    touched++;
    console.log("  reverted src/pages/" + file);
  }
  return touched;
}

/** How many pages already point at this slot's photograph. */
function countPhotoRefs(slot) {
  const needle = 'assets/img/photo-' + slot + '.';
  let n = 0;
  for (const file of fs.readdirSync(PAGES).filter((f) => f.endsWith(".html"))) {
    if (fs.readFileSync(path.join(PAGES, file), "utf8").includes(needle)) n++;
  }
  return n;
}

/** Replace the alt text on an already-deployed photo slot. */
function updateAlt(slot, alt) {
  const re = new RegExp('(<img\\b[^>]*src="assets/img/photo-' + slot + '\\.jpg"[^>]*?alt=")[^"]*(")', "g");
  for (const file of fs.readdirSync(PAGES).filter((f) => f.endsWith(".html"))) {
    const p = path.join(PAGES, file);
    const s = fs.readFileSync(p, "utf8");
    if (!re.test(s)) continue;
    re.lastIndex = 0;
    fs.writeFileSync(p, s.replace(re, "$1" + alt + "$2"));
    console.log("  alt updated in src/pages/" + file);
  }
}

function main() {
  const [slot, src, altText] = process.argv.slice(2);

  if (!slot || !SLOTS[slot]) {
    die("usage: node tools/photo.js <" + Object.keys(SLOTS).join("|") + "> <image> [\"alt text\"]");
  }
  const spec = SLOTS[slot];

  if (src === "--revert") {
    const n = revert(slot, spec);
    console.log(n ? "✓ reverted " + slot + " to the illustration" : "nothing to revert for " + slot);
  } else {
    if (!src) die("no image given");
    if (!fs.existsSync(src)) die("no such file: " + src);
    if (!have("sips")) die("sips not found (macOS only)");
    if (!have("cwebp")) die("cwebp not found — run: brew install webp");

    console.log("Encoding " + slot + " from " + src);
    const out = encode(src, slot, spec);
    const n = rewriteToPhoto(slot, spec, out, altText);

    if (!n) {
      // A slot already carrying a photo has no illustration left to swap, so
      // there is nothing to rewrite — the re-encode above already replaced the
      // files in place. Only refresh the alt text if a new one was given.
      const already = countPhotoRefs(slot);
      if (!already) {
        die("no references to assets/img/" + spec.art + " or to photo-" + slot +
            " found in src/pages/");
      }
      console.log("  slot already carries a photograph — " + already +
                  " reference(s) refreshed in place");
      if (altText) updateAlt(slot, altText);
    }
  }

  execFileSync("node", [path.join(ROOT, "build.js")], { stdio: "inherit", cwd: ROOT });
}

main();
