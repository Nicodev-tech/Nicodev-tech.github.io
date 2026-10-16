// ============================================================
//  Esquema de la base de datos + datos de ejemplo
//  (Archivo "puro": sin dependencias del bundler)
// ============================================================

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS productos (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre    TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'General',
  precio    REAL NOT NULL DEFAULT 0,
  stock     INTEGER NOT NULL DEFAULT 0,
  stock_min INTEGER NOT NULL DEFAULT 0,
  creado_el TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clientes (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre    TEXT NOT NULL,
  email     TEXT DEFAULT '',
  telefono  TEXT DEFAULT '',
  creado_el TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ventas (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER REFERENCES clientes(id),
  fecha      TEXT NOT NULL,
  total      REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS venta_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  venta_id    INTEGER NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  cantidad    INTEGER NOT NULL,
  precio_unit REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ventas_fecha   ON ventas(fecha);
CREATE INDEX IF NOT EXISTS idx_items_venta    ON venta_items(venta_id);
CREATE INDEX IF NOT EXISTS idx_items_producto ON venta_items(producto_id);
`;

/* ---------- Datos de ejemplo ---------- */

export const PRODUCTOS = [
  { nombre: "Teclado mecánico RGB", categoria: "Periféricos", precio: 25999, stock: 14, stock_min: 5 },
  { nombre: "Mouse inalámbrico 2.4GHz", categoria: "Periféricos", precio: 8999, stock: 37, stock_min: 10 },
  { nombre: 'Monitor 24" IPS 75Hz', categoria: "Monitores", precio: 128499, stock: 6, stock_min: 3 },
  { nombre: 'Notebook 14" 16GB/512GB', categoria: "Notebooks", precio: 789999, stock: 4, stock_min: 2 },
  { nombre: "Disco SSD 1TB NVMe", categoria: "Storage", precio: 45999, stock: 22, stock_min: 8 },
  { nombre: "Pendrive 64GB USB-C", categoria: "Storage", precio: 6499, stock: 60, stock_min: 20 },
  { nombre: "Auriculares BT con ANC", categoria: "Audio", precio: 38999, stock: 9, stock_min: 4 },
  { nombre: "Webcam 1080p", categoria: "Periféricos", precio: 17999, stock: 2, stock_min: 5 },
  { nombre: "Hub USB-C 6 en 1", categoria: "Accesorios", precio: 21999, stock: 15, stock_min: 5 },
  { nombre: "Silla ergonómica", categoria: "Oficina", precio: 189999, stock: 2, stock_min: 2 },
];

export const CLIENTES = [
  { nombre: "Ignacio Torres", email: "itorres@mail.com", telefono: "11-5555-1020" },
  { nombre: "Marina Sosa", email: "msosa@mail.com", telefono: "11-5555-3344" },
  { nombre: "Estudio Molina", email: "hola@estudiomolina.com", telefono: "351-555-8899" },
  { nombre: "Ciber Café Centro", email: "admin@cibercentro.com", telefono: "11-5555-7411" },
  { nombre: "Fernanda Ruiz", email: "fruiz@mail.com", telefono: "" },
  { nombre: "Taller Bitmanía", email: "contacto@bitmania.dev", telefono: "11-5555-9090" },
];

/* Ventas de ejemplo: { dia: días atrás, cliente: índice o null, items: [[prodIdx, cant], ...] } */
export const VENTAS = [
  { dia: 12, cliente: 0, items: [[0, 2], [1, 3]] },
  { dia: 11, cliente: 1, items: [[4, 1]] },
  { dia: 11, cliente: null, items: [[5, 2]] },
  { dia: 10, cliente: 2, items: [[2, 1], [8, 2]] },
  { dia: 9,  cliente: null, items: [[1, 1], [6, 1]] },
  { dia: 7,  cliente: 3, items: [[5, 4]] },
  { dia: 6,  cliente: 4, items: [[0, 1], [7, 1]] },
  { dia: 5,  cliente: 2, items: [[3, 1]] },
  { dia: 4,  cliente: 5, items: [[4, 2], [5, 3], [8, 1]] },
  { dia: 2,  cliente: 0, items: [[6, 1], [9, 1]] },
  { dia: 1,  cliente: 1, items: [[5, 2]] },
  { dia: 1,  cliente: 3, items: [[1, 2]] },
  { dia: 0,  cliente: null, items: [[7, 2]] },
];

function isoDayAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/* Devuelve la lista de statements { sql, params } para sembrar la base vacía */
export function buildSeedStatements() {
  const stmts = [];

  PRODUCTOS.forEach((p) => {
    stmts.push({
      sql: "INSERT INTO productos (nombre, categoria, precio, stock, stock_min) VALUES (?, ?, ?, ?, ?)",
      params: [p.nombre, p.categoria, p.precio, p.stock, p.stock_min],
    });
  });

  CLIENTES.forEach((c) => {
    stmts.push({
      sql: "INSERT INTO clientes (nombre, email, telefono) VALUES (?, ?, ?)",
      params: [c.nombre, c.email, c.telefono],
    });
  });

  VENTAS.forEach((v, vi) => {
    const ventaId = vi + 1;
    const hora = `${String(9 + (vi % 9)).padStart(2, "0")}:${vi % 2 ? "15" : "45"}:00`;
    const total = v.items.reduce((t, [pi, cant]) => t + PRODUCTOS[pi].precio * cant, 0);
    stmts.push({
      sql: "INSERT INTO ventas (cliente_id, fecha, total) VALUES (?, ?, ?)",
      params: [v.cliente == null ? null : v.cliente + 1, `${isoDayAgo(v.dia)} ${hora}`, total],
    });
    v.items.forEach(([pi, cant]) => {
      stmts.push({
        sql: "INSERT INTO venta_items (venta_id, producto_id, cantidad, precio_unit) VALUES (?, ?, ?, ?)",
        params: [ventaId, pi + 1, cant, PRODUCTOS[pi].precio],
      });
    });
  });

  return stmts;
}
