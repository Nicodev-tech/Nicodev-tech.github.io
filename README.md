# 🚀 Portafolio personal + demos

Sitio estático para GitHub Pages con tres proyectos:

| Sección | Qué es | Stack | Link |
|---|---|---|---|
| Portafolio | Página principal | HTML/CSS/JS puro | [`/`](https://nicodev-tech.github.io/) |
| 🗄️ NicoStore ERP | Inventario, clientes y ventas con una base de datos **SQLite real (sql.js / WASM)** corriendo en el navegador, persistida en localStorage | React + Vite | [`/erp/`](https://nicodev-tech.github.io/erp/) |
| 🎨 Pixel-Art | Editor de pixel-art, hecho a mano con la API Canvas | Vanilla JS | [`/pixel-art/`](https://nicodev-tech.github.io/pixel-art/) |

---

## ✏️ Editar el contenido del portafolio

Todo el texto vive en **`js/data.js`**: nombre, bio, skills, tarjetas de
proyectos, email y links. Cambiando ese archivo actualizás la página completa —
no hace falta tocar el HTML ni el JS.

## 🔨 Se recompila el ERP

El código fuente está en `erp-src/` (React + Vite + sql.js). El compilado ya
listo para servir vive en `erp/`.

```bash
cd erp-src
npm install      # solo la primera vez
npm run build    # output directo → ../erp/
```

> Requisito: Node 18+. Config detallado en [`erp-src/vite.config.js`](erp-src/vite.config.js)
> (`base: './'` para rutas relativas de GitHub Pages).

## 🚫 Deploy

GitHub Pages sirve desde la raíz del repo: los tres puntos de entrada son
`index.html`, `erp/index.html` y `pixel-art/index.html`. Sin Actions ni
backend — push y listo.
