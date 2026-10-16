/* ============================================================
   Editor de Pixel-Art — Canvas puro, sin librerías
   ============================================================ */

(function () {
  "use strict";

  /* ---------- Referencias ---------- */
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const paletteEl = document.getElementById("palette");
  const colorInput = document.getElementById("colorInput");
  const colorChip = document.getElementById("colorChip");
  const mirrorChk = document.getElementById("mirrorChk");
  const gridChk = document.getElementById("gridChk");
  const undoBtn = document.getElementById("undoBtn");
  const redoBtn = document.getElementById("redoBtn");
  const saveBtn = document.getElementById("saveBtn");
  const clearBtn = document.getElementById("clearBtn");
  const exportBtn = document.getElementById("exportBtn");
  const exportScale = document.getElementById("exportScale");
  const statusEl = document.getElementById("status");
  const sizeSeg = document.getElementById("sizeSeg");
  const toolSeg = document.getElementById("toolSeg");

  /* ---------- Estado ---------- */
  const STORAGE_KEY = "pixelart_v2";

  const PALETTE = [
    "#000000", "#ffffff", "#64748b", "#ef4444", "#f97316", "#facc15",
    "#22c55e", "#14b8a6", "#eab308", "#3b82f6", "#a3e635", "#a855f7",
    "#ec4899", "#92400e", "#0ea674", "#1e293b",
  ];

  const TOOLS = { pencil: "lápiz", eraser: "goma", bucket: "balde", picker: "cuentagotas" };

  let size = 16;
  let cells = [];            // array de color hex o null
  let color = "#22c55e";
  let tool = "pencil";
  let mirror = false;
  let showGrid = true;
  let undoStack = [];
  let redoStack = [];
  let painting = false;

  /* ---------- Utilidades ---------- */
  const idx = (x, y) => y * size + x;

  function emptyGrid() {
    return new Array(size * size).fill(null);
  }

  // px de canvas por celda (se fija al cambiar el tamaño)
  let cellPx = 32;
  function computeCellPx() {
    cellPx = size <= 8 ? 64 : size <= 16 ? 34 : 20;
    canvas.width = size * cellPx;
    canvas.height = size * cellPx;
  }

  function cellFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    const gx = Math.floor(((e.clientX - rect.left) * scale) / cellPx);
    const gy = Math.floor(((e.clientY - rect.top) * scale) / cellPx);
    if (gx < 0 || gy < 0 || gx >= size || gy >= size) return null;
    return { x: gx, y: gy };
  }

  /* ---------- Historial ---------- */
  function snapshot() {
    return JSON.stringify(cells);
  }

  function pushState() {
    undoStack.push(snapshot());
    if (undoStack.length > 80) undoStack.shift();
    redoStack.length = 0;
    updateHistoryButtons();
  }

  function undo() {
    if (!undoStack.length) return;
    redoStack.push(snapshot());
    cells = JSON.parse(undoStack.pop());
    render();
    updateHistoryButtons();
  }

  function redo() {
    if (!redoStack.length) return;
    undoStack.push(snapshot());
    cells = JSON.parse(redoStack.pop());
    render();
    updateHistoryButtons();
  }

  function updateHistoryButtons() {
    undoBtn.disabled = !undoStack.length;
    redoBtn.disabled = !redoStack.length;
  }

  /* ---------- Dibujo ---------- */
  function setCell(x, y, what) {
    cells[idx(x, y)] = what;
    if (mirror) cells[idx(size - 1 - x, y)] = what;
    render();
  }

  function drawLine(x0, y0, x1, y1, what) {
    // Interpolación simple para no dejar huevos al mover rápido el mouse
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= steps; i++) {
      const x = Math.round(x0 + ((x1 - x0) * i) / steps);
      const y = Math.round(y0 + ((y1 - y0) * i) / steps);
      cells[idx(x, y)] = what;
      if (mirror) cells[idx(size - 1 - x, y)] = what;
    }
    render();
  }

  function floodFill(sx, sy, target) {
    const replacement = color;
    if (target === replacement) return;
    const stack = [[sx, sy]];
    while (stack.length) {
      const [x, y] = stack.pop();
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      if (cells[idx(x, y)] !== target) continue;
      cells[idx(x, y)] = replacement;
      if (mirror) cells[idx(size - 1 - x, y)] = replacement;
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    render();
  }

  function applyTool(x, y) {
    if (tool === "pencil") setCell(x, y, color);
    else if (tool === "eraser") setCell(x, y, null);
    else if (tool === "bucket") floodFill(x, y, cells[idx(x, y)]);
    else if (tool === "picker") {
      const picked = cells[idx(x, y)];
      if (picked) selectColor(picked, true);
    }
  }

  /* ---------- Render ---------- */
  function render() {
    ctx.fillStyle = "#0e1220";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const c = cells[idx(x, y)];
        if (c) {
          ctx.fillStyle = c;
          ctx.fillRect(x * cellPx, y * cellPx, cellPx, cellPx);
        }
      }
    }

    if (showGrid) {
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= size; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellPx + 0.5, 0);
        ctx.lineTo(i * cellPx + 0.5, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * cellPx + 0.5);
        ctx.lineTo(canvas.width, i * cellPx + 0.5);
        ctx.stroke();
      }
    }
    updateStatus();
  }

  function updateStatus() {
    statusEl.textContent = `${size}×${size} · ${TOOLS[tool]} · ${color}`;
  }

  /* ---------- Eventos de dibujo ---------- */
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    const cell = cellFromEvent(e);
    if (!cell) return;
    canvas.setPointerCapture(e.pointerId);
    painting = true;
    pushState();
    applyTool(cell.x, cell.y);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!painting || (tool !== "pencil" && tool !== "eraser")) return;
    const cell = cellFromEvent(e);
    if (!cell) return;
    const i = idx(cell.x, cell.y);
    if (cells[i] === (tool === "eraser" ? null : color)) return;
    cells[i] = tool === "eraser" ? null : color;
    if (mirror) cells[idx(size - 1 - cell.x, cell.y)] = cells[i];
    render();
  });

  canvas.addEventListener("pointerup", () => {
    painting = false;
  });

  canvas.addEventListener("pointercancel", () => {
    painting = false;
  });

  /* ---------- Controles ---------- */
  function buildPalette() {
    paletteEl.innerHTML = PALETTE.map(
      (c) => `<button class="swatch" data-color="${c}" style="background:${c}" title="${c}"></button>`
    ).join("");
    paletteEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-color]");
      if (btn) selectColor(btn.dataset.color, true);
    });
  }

  function selectColor(c, fromPaint) {
    color = c;
    colorInput.value = isShortHex(c) ? normalizeHex(c) : c;
    document.querySelectorAll(".palette .swatch").forEach((s) => {
      s.classList.toggle("active", s.dataset.color.toLowerCase() === color.toLowerCase());
    });
    updateStatus();
    if (fromPaint) void fromPaint;
  }

  function isShortHex(c) {
    return typeof c === "string" && c.length === 4 && c[0] === "#";
  }

  function normalizeHex(c) {
    return "#" + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
  }

  colorInput.addEventListener("input", () => selectColor(colorInput.value, false));

  toolSeg.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-tool]");
    if (!btn) return;
    tool = btn.dataset.tool;
    toolSeg.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === btn));
    updateStatus();
  });

  sizeSeg.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-size]");
    if (!btn) return;
    const n = Number(btn.dataset.size);
    if (n === size) return;
    sizeSeg.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === btn));
    resizeGrid(n);
  });

  function resizeGrid(n) {
    pushState();
    const oldCells = cells;
    const oldSize = size;
    size = n;
    cells = emptyGrid();
    // Reescala conservando el dibujo (nearest neighbor)
    if (oldCells.some(Boolean)) {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const src = oldCells[Math.floor((y * oldSize) / size) * oldSize + Math.floor((x * oldSize) / size)];
          cells[idx(x, y)] = src || null;
        }
      }
    }
    computeCellPx();
    render();
  }

  mirrorChk.addEventListener("change", () => {
    mirror = mirrorChk.checked;
  });

  gridChk.addEventListener("change", () => {
    showGrid = gridChk.checked;
    render();
  });

  undoBtn.addEventListener("click", undo);
  redoBtn.addEventListener("click", redo);

  clearBtn.addEventListener("click", () => {
    if (!cells.some(Boolean) || !confirm("¿Borrar todo el dibujo?")) return;
    pushState();
    cells = emptyGrid();
    render();
  });

  saveBtn.addEventListener("click", () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ size, cells }));
      const old = saveBtn.textContent;
      saveBtn.textContent = "✓ Guardado";
      setTimeout(() => (saveBtn.textContent = old), 1200);
    } catch {
      alert("No se pudo guardar (almacenamiento lleno o bloqueado).");
    }
  });

  exportBtn.addEventListener("click", () => {
    const factor = Number(exportScale.value);
    const out = document.createElement("canvas");
    out.width = size * factor;
    out.height = size * factor;
    const octx = out.getContext("2d");
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const c = cells[idx(x, y)];
        if (c) {
          octx.fillStyle = c;
          octx.fillRect(x * factor, y * factor, factor, factor);
        }
      }
    }
    const a = document.createElement("a");
    a.download = `pixel-art-${size}x${size}.png`;
    a.href = out.toDataURL("image/png");
    a.click();
  });

  /* ---------- Atajos de teclado ---------- */
  document.addEventListener("keydown", (e) => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && !e.shiftKey && e.key.toLowerCase() === "z") {
      e.preventDefault();
      undo();
    } else if (ctrl && (e.shiftKey && e.key.toLowerCase() === "z" || e.key.toLowerCase() === "y")) {
      e.preventDefault();
      redo();
    }
  });

  /* ---------- Arranque ---------- */
  function boot() {
    computeCellPx();
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (
        saved &&
        saved.size &&
        Array.isArray(saved.cells) &&
        saved.cells.length === saved.size * saved.size
      ) {
        size = saved.size;
        cells = saved.cells;
        sizeSeg.querySelectorAll("button").forEach((b) =>
          b.classList.toggle("active", Number(b.dataset.size) === size)
        );
        computeCellPx();
      }
    } catch {
      /* guardado inválido: ignorar */
    }
    if (!cells.length) cells = emptyGrid();
    buildPalette();
    selectColor(color, false);
    render();
    updateHistoryButtons();
  }

  boot();
})();
