import React, { useEffect, useState } from "react";
import { all, get, withTransaction, lastInsertId, onChange } from "../db/database.js";
import { money, qty, fmtFecha, ahoraLocal } from "../lib/format.js";
import Modal from "./Modal.jsx";

export default function Ventas() {
  const [tick, setTick] = useState(0);
  useEffect(() => onChange(() => setTick((t) => t + 1)), []);

  const [abierta, setAbierta] = useState(false);
  const [detalle, setDetalle] = useState(null); // ventaId en detalle

  const ventas = all(
    `SELECT v.id, v.fecha, v.total,
            c.nombre AS cliente,
            (SELECT COUNT(*) FROM venta_items vi WHERE vi.venta_id = v.id) AS items
       FROM ventas v
       LEFT JOIN clientes c ON c.id = v.cliente_id
      ORDER BY v.fecha DESC, v.id DESC
      LIMIT 40`
  );

  const totalPeriodo = get(
    "SELECT COALESCE(SUM(total), 0) AS t, COUNT(*) AS n FROM ventas"
  );

  return (
    <div>
      <div className="toolbar">
        <p className="toolbar-info">
          {qty(totalPeriodo.n)} venta(s) · facturado total: <strong>{money(totalPeriodo.t)}</strong>
        </p>
        <button className="btn primary" onClick={() => setAbierta(true)}>+ Nueva venta</button>
      </div>

      <div className="ventas-lista">
        {ventas.map((v) => (
          <details key={v.id} className="venta card" open={detalle === v.id} onToggle={(e) => setDetalle(e.target.open ? v.id : null)}>
            <summary>
              <span className="fecha muted">{fmtFecha(v.fecha)}</span>
              <span className="cliente">{v.cliente || "Consumidor final"}</span>
              <span className="chip sm">{v.items} ítem(s)</span>
              <span className="total">{money(v.total)}</span>
            </summary>
            <VentaDetalle ventaId={v.id} />
          </details>
        ))}
        {ventas.length === 0 && <p className="empty card">Todavía no hay ventas registradas.</p>}
      </div>

      {abierta && <NuevaVentaModal onClose={() => setAbierta(false)} />}
    </div>
  );
}

function VentaDetalle({ ventaId }) {
  const items = all(
    `SELECT vi.cantidad, vi.precio_unit,
            p.nombre AS producto
       FROM venta_items vi
       JOIN productos p ON p.id = vi.producto_id
      WHERE vi.venta_id = ?
      ORDER BY vi.id`,
    [ventaId]
  );
  return (
    <table className="table tabla-detalle">
      <thead>
        <tr>
          <th>Producto</th>
          <th className="num">Cant.</th>
          <th className="num">Precio</th>
          <th className="num">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        {items.map((it, i) => (
          <tr key={i}>
            <td>{it.producto}</td>
            <td className="num">{it.cantidad}</td>
            <td className="num muted">{money(it.precio_unit)}</td>
            <td className="num">{money(it.cantidad * it.precio_unit)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function NuevaVentaModal({ onClose }) {
  const [clientes] = useState(() => all("SELECT id, nombre FROM clientes ORDER BY nombre"));
  const productos = get("SELECT COALESCE(SUM(stock), 0) AS s FROM productos")?.s ?? 0;

  const [clienteId, setClienteId] = useState("");
  const [items, setItems] = useState([{ productoId: "", cant: "" }]);

  const catalogo = all("SELECT id, nombre, precio, stock FROM productos WHERE stock > 0 ORDER BY nombre");

  function setItem(i, k, v) {
    setItems((prev) => prev.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
  }

  function agregarFila() {
    setItems((prev) => [...prev, { productoId: "", cant: "" }]);
  }

  function quitarFila(i) {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, j) => j !== i)));
  }

  function cantUsada(productoId, excepto) {
    return items.reduce(
      (t, it, j) => t + (it.productoId === productoId && j !== excepto ? Number(it.cant) || 0 : 0),
      0
    );
  }

  function lineasValidas() {
    const validas = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.productoId && !it.cant) continue; // fila vacía
      const prod = catalogo.find((p) => String(p.id) === String(it.productoId));
      if (!prod) return { error: `Fila ${i + 1}: elegí un producto.` };
      const cant = Number(it.cant);
      if (!Number.isInteger(cant) || cant <= 0) return { error: `Fila ${i + 1}: cantidad inválida.` };
      const restante = prod.stock - cantUsada(prod.id, i);
      if (cant > restante) {
        return { error: `Fila ${i + 1}: stock insuficiente de "${prod.nombre}" (disponible contando otras filas: ${restante}).` };
      }
      validas.push({ prod, cant });
    }
    if (!validas.length) return { error: "Agregá al menos un producto." };
    return { validas };
  }

  const total = items.reduce((t, it) => {
    const prod = catalogo.find((p) => String(p.id) === String(it.productoId));
    return prod ? t + prod.precio * (Number(it.cant) || 0) : t;
  }, 0);

  function guardar(e) {
    e.preventDefault();
    const check = lineasValidas();
    if (check.error) return alert(check.error);

    try {
      withTransaction((txn) => {
        txn("INSERT INTO ventas (cliente_id, fecha, total) VALUES (?, ?, ?)", [
          clienteId ? Number(clienteId) : null,
          ahoraLocal(),
          check.validas.reduce((t, { prod, cant }) => t + prod.precio * cant, 0),
        ]);
        const ventaId = lastInsertId();
        check.validas.forEach(({ prod, cant }) => {
          txn("INSERT INTO venta_items (venta_id, producto_id, cantidad, precio_unit) VALUES (?, ?, ?, ?)", [
            ventaId, prod.id, cant, prod.precio,
          ]);
          txn("UPDATE productos SET stock = stock - ? WHERE id = ?", [cant, prod.id]);
        });
      });
      onClose();
    } catch (err) {
      alert("No se pudo registrar la venta: " + err.message);
    }
  }

  return (
    <Modal title="🧾 Nueva venta" wide onClose={onClose}>
      {productos > 0 ? (
        <form onSubmit={guardar} className="form">
          <label>Cliente
            <select className="select" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
              <option value="">Consumidor final</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </label>

          <div className="lineas">
            {items.map((it, i) => {
              const prod = catalogo.find((p) => String(p.id) === String(it.productoId));
              const restante = prod ? prod.stock - cantUsada(prod.id, i) : null;
              return (
                <div className="linea" key={i}>
                  <select
                    className="select grow"
                    value={it.productoId}
                    onChange={(e) => setItem(i, "productoId", e.target.value)}
                  >
                    <option value="">— Elegí un producto —</option>
                    {catalogo.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} · {money(p.precio)} · stock {p.stock}
                      </option>
                    ))}
                  </select>
                  <input
                    className="input cant"
                    type="number"
                    min="1"
                    placeholder="Cant."
                    value={it.cant}
                    onChange={(e) => setItem(i, "cant", e.target.value)}
                  />
                  <span className="linea-sub muted">{prod ? money(prod.precio * (Number(it.cant) || 0)) : "—"}</span>
                  {restante !== null && (Number(it.cant) || 0) > restante && (
                    <span className="badge bad">!</span>
                  )}
                  <button type="button" className="btn ghost sm" onClick={() => quitarFila(i)} title="Quitar fila">✕</button>
                </div>
              );
            })}
          </div>

          <button type="button" className="btn ghost sm" onClick={agregarFila}>+ Agregar ítem</button>

          <div className="total-linea">
            <strong>TOTAL</strong>
            <span>{money(total)}</span>
          </div>

          <div className="form-actions">
            <button type="button" className="btn ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn primary">Confirmar venta</button>
          </div>
        </form>
      ) : (
        <p className="empty">No hay productos con stock para vender.</p>
      )}
    </Modal>
  );
}
