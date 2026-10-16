import React, { useEffect, useState } from "react";
import { all, get, run, onChange } from "../db/database.js";
import { money, qty } from "../lib/format.js";
import Modal from "./Modal.jsx";

const VACIO = { nombre: "", categoria: "", precio: "", stock: "", stock_min: "" };

export default function Productos() {
  const [tick, setTick] = useState(0);
  useEffect(() => onChange(() => setTick((t) => t + 1)), []);

  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [editing, setEditing] = useState(null); // null | producto | 'nuevo'
  const [categorias, setCategorias] = useState([]);

  const productos = all(
    `SELECT * FROM productos
      WHERE (? = '' OR nombre LIKE '%' || ? || '%' OR categoria LIKE '%' || ? || '%')
        AND (? = '' OR categoria = ?)
      ORDER BY nombre COLLATE NOCASE`,
    [q.trim(), q.trim(), q.trim(), cat, cat]
  );

  useEffect(() => {
    setCategorias(all("SELECT DISTINCT categoria FROM productos WHERE categoria <> '' ORDER BY categoria").map((r) => r.categoria));
  }, [tick]);

  function eliminar(p) {
    const vendido = get("SELECT COUNT(*) AS n FROM venta_items WHERE producto_id = ?", [p.id]).n;
    if (vendido > 0) {
      return alert(`"${p.nombre}" tiene ${vendido} línea(s) de venta asociadas y no puede eliminarse (el historial quedaría inconsistente). Podés ponerle stock 0 si querés dejar de ofrecerlo.`);
    }
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return;
    run("DELETE FROM productos WHERE id = ?", [p.id]);
  }

  return (
    <div>
      <div className="toolbar">
        <input
          className="input grow"
          placeholder="🔍 Buscar por nombre o categoría…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="select" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button className="btn primary" onClick={() => setEditing("nuevo")}>
          + Producto
        </button>
      </div>

      <table className="table card">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Categoría</th>
            <th className="num">Precio</th>
            <th className="num">Stock</th>
            <th className="num">Mín</th>
            <th className="num">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((p) => (
            <tr key={p.id}>
              <td>{p.nombre}</td>
              <td><span className="chip sm">{p.categoria}</span></td>
              <td className="num">{money(p.precio)}</td>
              <td className="num"><span className={`badge ${p.stock === 0 ? "bad" : p.stock <= p.stock_min ? "warn" : "ok"}`}>{p.stock}</span></td>
              <td className="num muted">{p.stock_min}</td>
              <td className="num row-actions">
                <button className="btn ghost sm" onClick={() => setEditing(p)} title="Editar">✏️</button>
                <button className="btn ghost sm" onClick={() => eliminar(p)} title="Eliminar">🗑️</button>
              </td>
            </tr>
          ))}
          {productos.length === 0 && (
            <tr><td colSpan="6" className="empty">Sin resultados.</td></tr>
          )}
        </tbody>
      </table>
      <p className="table-foot">
        {qty(productos.length)} producto(s) listado(s) · valor de stock filtrado:{" "}
        <strong>{money(productos.reduce((t, p) => t + p.precio * p.stock, 0))}</strong>
      </p>

      {editing && (
        <ProductoModal
          producto={editing === "nuevo" ? null : editing}
          categorias={categorias}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function ProductoModal({ producto, categorias, onClose }) {
  const [f, setF] = useState(producto ? { ...producto } : { ...VACIO });

  function set(k, v) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  function guardar(e) {
    e.preventDefault();
    const nombre = f.nombre.trim();
    if (!nombre) return alert("El nombre es obligatorio.");
    const precio = Number(f.precio);
    const stock = Number(f.stock);
    const stockMin = Number(f.stock_min);
    if (Number.isNaN(precio) || precio < 0) return alert("Precio inválido.");
    if (!Number.isInteger(stock) || stock < 0) return alert("El stock debe ser un entero ≥ 0.");
    if (!Number.isInteger(stockMin) || stockMin < 0) return alert("El stock mínimo debe ser un entero ≥ 0.");

    const categoria = f.categoria.trim() || "General";
    const params = [nombre, categoria, precio, stock, stockMin];

    if (producto) {
      run("UPDATE productos SET nombre = ?, categoria = ?, precio = ?, stock = ?, stock_min = ? WHERE id = ?", [...params, producto.id]);
    } else {
      run("INSERT INTO productos (nombre, categoria, precio, stock, stock_min) VALUES (?, ?, ?, ?, ?)", params);
    }
    onClose();
  }

  return (
    <Modal title={producto ? "✏️ Editar producto" : "📦 Nuevo producto"} onClose={onClose}>
      <form onSubmit={guardar} className="form">
        <label>Nombre
          <input className="input" value={f.nombre} onChange={(e) => set("nombre", e.target.value)} autoFocus placeholder="Ej: Teclado mecánico" required />
        </label>
        <div className="form-row">
          <label>Categoría
            <input className="input" list="cats" value={f.categoria} onChange={(e) => set("categoria", e.target.value)} placeholder="Ej: Periféricos" />
            <datalist id="cats">{categorias.map((c) => <option key={c} value={c} />)}</datalist>
          </label>
          <label>Precio
            <input className="input" type="number" step="0.01" min="0" value={f.precio} onChange={(e) => set("precio", e.target.value)} required />
          </label>
        </div>
        <div className="form-row">
          <label>Stock actual
            <input className="input" type="number" min="0" value={f.stock} onChange={(e) => set("stock", e.target.value)} required />
          </label>
          <label>Stock mínimo (alerta)
            <input className="input" type="number" min="0" value={f.stock_min} onChange={(e) => set("stock_min", e.target.value)} required />
          </label>
        </div>
        <div className="form-actions">
          <button type="button" className="btn ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn primary">Guardar</button>
        </div>
      </form>
    </Modal>
  );
}
