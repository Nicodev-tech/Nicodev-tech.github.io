import React, { useEffect, useState } from "react";
import { all, get, isReady, onChange } from "../db/database.js";
import { money, qty, fmtDia, fmtFecha } from "../lib/format.js";

const DIAS_VENTANA = 14;

/* "YYYY-MM-DD" a N días de hoy */
function dayKey(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/* Ventas por día, últimos N días (incluye días sin ventas como 0) */
function ventasPorDia() {
  const rows = all(
    `SELECT substr(fecha, 1, 10) AS dia, SUM(total) AS total
       FROM ventas
      WHERE substr(fecha, 1, 10) >= ?
      GROUP BY substr(fecha, 1, 10)
      ORDER BY dia`,
    [dayKey(DIAS_VENTANA - 1)]
  );
  const mapa = new Map(rows.map((r) => [r.dia, r.total]));
  const dias = [];
  for (let i = DIAS_VENTANA - 1; i >= 0; i--) {
    const key = dayKey(i);
    dias.push({ dia: key, total: mapa.get(key) ?? 0 });
  }
  return dias;
}

export default function Dashboard() {
  const [tick, setTick] = useState(0);
  useEffect(() => onChange(() => setTick((t) => t + 1)), []);

  const [kpi, setKpi] = useState(null);
  const [series, setSeries] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [recientes, setRecientes] = useState([]);

  useEffect(() => {
    if (!isReady()) return;

    setKpi(
      get(`
        SELECT
          (SELECT COUNT(*) FROM productos)                         AS productos,
          (SELECT COUNT(*) FROM clientes)                          AS clientes,
          (SELECT COUNT(*) FROM ventas)                            AS ventas,
          (SELECT COALESCE(SUM(total), 0) FROM ventas)             AS ingresos,
          (SELECT COALESCE(SUM(precio * stock), 0) FROM productos) AS valor_stock,
          (SELECT COUNT(*) FROM productos WHERE stock <= stock_min) AS stock_bajo
      `)
    );
    setSeries(ventasPorDia());
    setLowStock(
      all(
        "SELECT id, nombre, stock, stock_min FROM productos WHERE stock <= stock_min ORDER BY stock LIMIT 6"
      )
    );
    setRecientes(
      all(
        `SELECT v.fecha, v.total, c.nombre AS cliente
           FROM ventas v
           LEFT JOIN clientes c ON c.id = v.cliente_id
          ORDER BY v.fecha DESC
          LIMIT 6`
      )
    );
  }, [tick]);

  if (!kpi) return null;

  return (
    <div className="dashboard">
      <div className="kpis">
        <Kpi icon="📦" label="Productos" value={qty(kpi.productos)} />
        <Kpi icon="💰" label="Valor de stock" value={money(kpi.valor_stock)} />
        <Kpi icon="🧾" label="Ventas" value={qty(kpi.ventas)} />
        <Kpi icon="📈" label="Ingresos" value={money(kpi.ingresos)} />
        <Kpi icon="👥" label="Clientes" value={qty(kpi.clientes)} />
        <Kpi icon="⚠️" label="Stock bajo" value={qty(kpi.stock_bajo)} danger={kpi.stock_bajo > 0} />
      </div>

      <div className="dash-grid">
        <section className="card">
          <h3>Ventas — últimos {DIAS_VENTANA} días</h3>
          <Chart series={series} />
        </section>

        <section className="card">
          <h3>⚠️ Stock bajo</h3>
          {lowStock.length === 0 ? (
            <p className="empty">Todo por encima del mínimo. 👌</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="num">Stock</th>
                  <th className="num">Mín</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((p) => (
                  <tr key={p.id}>
                    <td>{p.nombre}</td>
                    <td className="num"><span className="badge bad">{p.stock}</span></td>
                    <td className="num muted">{p.stock_min}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card">
          <h3>🧾 Últimas ventas</h3>
          {recientes.length === 0 ? (
            <p className="empty">Todavía no hay ventas.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th className="num">Total</th>
                </tr>
              </thead>
              <tbody>
                {recientes.map((v, i) => (
                  <tr key={i}>
                    <td className="muted">{fmtFecha(v.fecha)}</td>
                    <td>{v.cliente || "Consumidor final"}</td>
                    <td className="num">{money(v.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, danger }) {
  return (
    <div className={`card kpi ${danger ? "kpi-danger" : ""}`}>
      <span className="kpi-icon">{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

/* Gráfico de barras en SVG puro (sin librerías) */
function Chart({ series }) {
  const W = 560;
  const H = 170;
  const P = { top: 14, bottom: 22 };
  const max = Math.max(...series.map((s) => s.total), 1);
  const usable = H - P.top - P.bottom;
  const bw = W / series.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Ventas por día">
      {series.map((s, i) => {
        const h = s.total > 0 ? Math.max((s.total / max) * usable, 4) : 2;
        const x = i * bw + bw * 0.18;
        const y = H - P.bottom - h;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={bw * 0.64}
              height={h}
              rx={3}
              className={`bar ${s.total > 0 ? "" : "bar-zero"}`}
            >
              <title>{`${fmtDia(s.dia)}: ${money(s.total)}`}</title>
            </rect>
            {i % 2 === 0 && (
              <text x={i * bw + bw / 2} y={H - 6} className="axis">
                {fmtDia(s.dia)}
              </text>
            )}
          </g>
        );
      })}
      <line x1="0" y1={H - P.bottom} x2={W} y2={H - P.bottom} className="axis-line" />
    </svg>
  );
}
