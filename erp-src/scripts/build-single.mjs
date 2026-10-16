// ============================================================
//  build-single.mjs — Vuelve a erp/index.html un UNICO archivo:
//  inyecta el CSS (<style>), el JS compilado (<script>) y el
//  WASM de SQLite como data-URI embebido.Así funciona igual
//  abierto por file:// que servido por GitHub Pages.
//  Uso: corre automáticamente después de `vite build`.
// ============================================================

import { readFileSync, writeFileSync, readdirSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";

const erp = resolve(import.meta.dirname, "../../erp");
const htmlPath = join(erp, "index.html");

let html = readFileSync(htmlPath, "utf8");

/* ---------- Busca los assets emitidos ---------- */
const assets = readdirSync(join(erp, "assets"));
const jsFile = assets.find((f) => f.endsWith(".js"));
const cssFile = assets.find((f) => f.endsWith(".css"));
const wasmFile = assets.find((f) => f.endsWith(".wasm"));
if (!jsFile || !cssFile) throw new Error("No se encontraron los assets del build");

/* ---------- CSS inline ---------- */
const css = readFileSync(join(erp, "assets", cssFile), "utf8");
html = html.replace(
  new RegExp(`\\s*<link rel="stylesheet"[^>]*href="[^"]*${cssFile}"[^>]*>`),
  () => `\n<style>${css}</style>`
);

/* ---------- JS inline (formato IIFE: script clásico) ---------- */
let js = readFileSync(join(erp, "assets", jsFile), "utf8");

/* WASM embebido como data-URI: reemplaza new URL("sql-wasm-*.wasm", import.meta.url[\).href]
   El generador emite el sufijo ".href"; si no se consume, la expresión queda como
   "data:...".href  →  undefined  →  "both async and sync fetching of the wasm failed". */
if (wasmFile) {
  const b64 = readFileSync(join(erp, "assets", wasmFile)).toString("base64");
  const dataUri = `data:application/wasm;base64,${b64}`;
  js = js.replace(
    /new URL\("sql-wasm-[A-Za-z0-9_-]+\.wasm",\s*import\.meta\.url\)(?:\.href)?/g,
    `"${dataUri}"`
  );
}

/* Control: el data-URI no puede estar seguido de acceso a propiedad (".href", ["..."]) */
{
  const i = js.indexOf("data:application/wasm;base64,");
  if (i === -1) throw new Error("El data-URI del wasm no quedó embebido");
  let end = i + 30;
  while (end < js.length && /[A-Za-z0-9+/=]/.test(js[end])) end++;
  const after = js.slice(end, end + 12);
  if (/^\s*(?:\.\s*\w+|\[)/.test(after)) {
    throw new Error("El data-URI quedó con acceso a propiedad colgante (bug de reemplazo)");
  }
}

/* Evita que el propio código rompa el tag <script> contenedor */
js = js.replace(/<\/script/gi, "<\\/script");

/* El JS pasa a ser script clásico: no tolera imports */
if (/\bimport\.meta\b/.test(js) || /\bimport\s*\(/.test(js) || /(^|\n)\s*import\s+["']/.test(js)) {
  throw new Error("El bundle todavía usa sintaxis de módulo ESM (import/import.meta)");
}

/* Quita el tag original (Vite lo puso en el <head>) */
html = html.replace(
  new RegExp(`\\s*<script type="module"[^>]*src="[^"]*${jsFile}"[^>]*>\\s*</script>`),
  () => ""
);

/* Script clásico al FINAL del <body>: el DOM (#root) ya existe cuando corre */
if (!html.includes('<div id="root"></div>')) {
  throw new Error("No se encontró el div#root en el HTML compilado");
}
html = html.replace(
  '  <div id="root"></div>',
  () => `${'  <div id="root"></div>'}\n  <script>${js}</script>`
)

/* ---------- Chequeo antes de escribir ---------- */
if (html.includes('type="module"')) throw new Error("Quedó un script type=module sin inyectar");
if (!html.includes("<style>")) throw new Error("El CSS no fue inyectado");
if (!html.includes("<script>")) throw new Error("El JS no fue inyectado");
if (wasmFile && !html.includes("data:application/wasm")) {
  throw new Error("El WASM no fue embebido");
}

writeFileSync(htmlPath, html);

/* ---------- Limpia los assets ya embebidos ---------- */
rmSync(join(erp, "assets"), { recursive: true, force: true });

const kb = (readFileSync(htmlPath).length / 1024).toFixed(0);
console.log(`✅ erp/index.html autocontenido (${kb} kB): CSS + JS + WASM adentro`);
