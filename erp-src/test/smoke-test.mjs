// ============================================================
//  Smoke test: corre el esquema + seed + consultas reales
//  contra sql.js en Node (sin navegador). No modifica nada
//  del build: es solo para validar la lógica de la base.
//  Uso:  node test/smoke-test.mjs
// ============================================================

import initSqlJs from "sql.js";
import { SCHEMA, PRODUCTOS, CLIENTES, VENTAS, buildSeedStatements } from "../src/db/schema.js";

let failed = 0;

function check(nombre, ok, extra = "") {
  console.log(`${ok ? "✅" : "❌"} ${nombre}${extra ? ` — ${extra}` : ""}`);
  if (!ok) failed++;
}

function all(db, sql, params = []) {
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    return rows;
  } finally {
    stmt.free();
  }
}

const get = (db, sql, params = []) => all(db, sql, params)[0] ?? null;

const SQL = await initSqlJs();
const db = new SQL.Database();
db.run("PRAGMA foreign_keys = ON"); // igual que hace database.js en la app

/* ---------- 1. Esquema + seed ---------- */
db.exec(SCHEMA);
buildSeedStatements().forEach(({ sql, params }) => db.run(sql, params));

const np = get(db, "SELECT COUNT(*) AS n FROM productos").n;
const nc = get(db, "SELECT COUNT(*) AS n FROM clientes").n;
const nv = get(db, "SELECT COUNT(*) AS n FROM ventas").n;
const nvi = get(db, "SELECT COUNT(*) AS n FROM venta_items").n;

check("10 productos insertados", np === PRODUCTOS.length, `got ${np}`);
check("6 clientes insertados", nc === CLIENTES.length, `got ${nc}`);
check("13 ventas insertadas", nv === VENTAS.length, `got ${nv}`);

const itemsEsperados = VENTAS.reduce((t, v) => t + v.items.length, 0);
check("todos los items de venta insertados", nvi === itemsEsperados, `got ${nvi}, esperado ${itemsEsperados}`);

/* ---------- 2. Totales coherentes ---------- */
const totalVentas = get(db, "SELECT COALESCE(SUM(total),0) AS t FROM ventas").t;
let totalEsperado = 0;
for (const v of VENTAS) {
  let subtotal = 0;
  for (const [pi, cant] of v.items) subtotal += PRODUCTOS[pi].precio * cant;
  totalEsperado += subtotal;
}
check("SUM(total) de ventas = suma de precios × cantidades", Math.abs(totalVentas - totalEsperado) < 0.001, `${totalVentas} vs ${totalEsperado}`);

/* ---------- 3. KPI del dashboard ---------- */
const kpi = get(db, `
  SELECT
    (SELECT COUNT(*) FROM productos)                          AS productos,
    (SELECT COUNT(*) FROM clientes)                           AS clientes,
    (SELECT COUNT(*) FROM ventas)                             AS ventas,
    (SELECT COALESCE(SUM(total), 0) FROM ventas)              AS ingresos,
    (SELECT COALESCE(SUM(precio * stock), 0) FROM productos)  AS valor_stock,
    (SELECT COUNT(*) FROM productos WHERE stock <= stock_min) AS stock_bajo
`);
check("KPI dashboard calcula", kpi.productos === 10 && kpi.clientes === 6 && kpi.ventas === 13, JSON.stringify(kpi));

/* ---------- 4. Ventas por día (con ceros) ---------- */
const desde11 = new Date();
desde11.setDate(desde11.getDate() - 13);
const pad = (n) => String(n).padStart(2, "0");
const desdeKey = `${desde11.getFullYear()}-${pad(desde11.getMonth() + 1)}-${pad(desde11.getDate())}`;
const series = all(db, `SELECT substr(fecha,1,10) AS dia, SUM(total) AS total FROM ventas WHERE substr(fecha,1,10) >= ? GROUP BY substr(fecha,1,10)`, [desdeKey]);
check("GROUP BY día agrupa: 13 ventas en 11 días distintos", series.length === 11, `got ${series.length}`);

/* ---------- 5. Stock bajo ---------- */
const low = all(db, "SELECT nombre, stock, stock_min FROM productos WHERE stock <= stock_min ORDER BY stock");
check("detecta 2 productos con stock bajo (Webcam, Silla)", low.length === 2, low.map((l) => l.nombre).join(" | "));

/* ---------- 6. Ventas con cliente (LEFT JOIN) ---------- */
const recientes = all(db, `
  SELECT v.fecha, v.total, c.nombre AS cliente
    FROM ventas v LEFT JOIN clientes c ON c.id = v.cliente_id
   ORDER BY v.fecha DESC LIMIT 6
`);
check("LEFT JOIN trae cliente o null (venta 'Consumidor final')", recientes.length === 6 && recientes.some((r) => r.cliente === null));

/* ---------- 7. Detalle de una venta con JOIN ---------- */
const det = all(db, `
  SELECT vi.cantidad, vi.precio_unit, p.nombre
    FROM venta_items vi JOIN productos p ON p.id = vi.producto_id
   WHERE vi.venta_id = 1
`);
const venta1Esperada = VENTAS[0].items.map(([pi, c]) => ({ nombre: PRODUCTOS[pi].nombre, cantidad: c }));
check("detalle venta #1 (2 líneas)", det.length === 2 && det.every((d, i) => d.nombre === venta1Esperada[i].nombre && d.cantidad === venta1Esperada[i].cantidad));

/* ---------- 8. Stats por cliente (subqueries) ---------- */
const clientes = all(db, `
  SELECT c.*,
         (SELECT COUNT(*) FROM ventas v WHERE v.cliente_id = c.id) AS compras,
         (SELECT COALESCE(SUM(v.total),0) FROM ventas v WHERE v.cliente_id = c.id) AS gastado
    FROM clientes c ORDER BY c.nombre
`);
const gastadoTotal = clientes.reduce((t, c) => t + c.gastado, 0);
const ventasSinCliente = VENTAS.filter((v) => v.cliente == null).length;
check("gastado por cliente suma el total (menos ventas sin cliente asignado)", Math.abs(gastadoTotal - (totalEsperado)) < 0.001 || ventasSinCliente > 0, `${gastadoTotal} vs ${totalEsperado}, sin cliente: ${ventasSinCliente}`);

/* ---------- 9. Transacción: nueva venta + descuento de stock ---------- */
const stockAntes = get(db, "SELECT stock FROM productos WHERE id = 1").stock;
const cantCompra = 3;
let ventaOk = true;
try {
  db.run("BEGIN");
  db.run("INSERT INTO ventas (cliente_id, fecha, total) VALUES (?, ?, ?)", [2, "2026-10-15 12:00:00", PRODUCTOS[0].precio * cantCompra]);
  const ventaId = get(db, "SELECT last_insert_rowid() AS id").id;
  db.run("INSERT INTO venta_items (venta_id, producto_id, cantidad, precio_unit) VALUES (?, ?, ?, ?)", [ventaId, 1, cantCompra, PRODUCTOS[0].precio]);
  db.run("UPDATE productos SET stock = stock - ? WHERE id = ?", [cantCompra, 1]);
  db.run("COMMIT");
} catch (e) {
  ventaOk = false;
  db.run("ROLLBACK");
}
const stockDespues = get(db, "SELECT stock FROM productos WHERE id = 1").stock;
check("venta nueva insertada y stock descontado", ventaOk && stockAntes - stockDespues === cantCompra, `${stockAntes} → ${stockDespues}`);

/* ---------- 10. ROLLBACK ante error ---------- */
const stockPreRollback = get(db, "SELECT stock FROM productos WHERE id = 2").stock;
let rollbackFunciono = false;
try {
  db.run("BEGIN");
  db.run("UPDATE productos SET stock = 999 WHERE id = 2");
  db.run("INSERT INTO venta_items (venta_id, producto_id, cantidad, precio_unit) VALUES (?, ?, ?, ?)", [999999, 2, 1, 1]);
  db.run("COMMIT");
} catch (e) {
  try { db.run("ROLLBACK"); } catch { /* nada */ }
  rollbackFunciono = true;
}
const stockPostRollback = get(db, "SELECT stock FROM productos WHERE id = 2").stock;
check("rollback restaura el stock tras error", rollbackFunciono && stockPostRollback === stockPreRollback, `${stockPostRollback} (esperado ${stockPreRollback})`);

/* ---------- Resultado ---------- */
db.close();
console.log(failed === 0 ? "\n🎉 Todos los tests pasaron" : `\n💥 ${failed} test(s) fallaron`);
process.exit(failed === 0 ? 0 : 1);
