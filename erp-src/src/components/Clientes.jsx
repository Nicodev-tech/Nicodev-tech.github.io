import React, { useEffect, useState } from "react";
import { run, onChange } from "../db/database.js";
import { money, qty } from "../lib/format.js";
import Modal from "./Modal.jsx";

const VACIO = { nombre: "", email: "", telefono: "" };

export default function Clientes() {
  const [tick, setTick] = useState(0);
  useEffect(() => onChange(() => setTick((t) => t + 1)), []);

  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null); // null | cliente | 'nuevo'

  const clientes = all(
    `SELECT c.*,
            (SELECT COUNT(*) FROM ventas v WHERE v.cliente_id = c.id)             AS compras,
            (SELECT COALESCE(SUM(v.total), 0) FROM ventas v WHERE v.cliente_id = c.id) AS gastado
       FROM clientes c
      WHERE ? = '' OR c.nombre LIKE '%' || ? || '%' OR c.email LIKE '%' || ? || '%'
      ORDER BY c.nombre COLLATE NOCASE`,
    [q.trim(), q.trim(), q.trim()]
  );

  function eliminar(c) {
    if (c.compras > 0) return alert(`${c.nombre} tiene ${c.compras} venta(s) registradas y no se puede eliminar.`);
    if (!confirm(`¿Eliminar a "${c.nombre}"?`)) return;
    run("DELETE FROM clientes WHERE id = ?", [c.id]);
  }

  return (
    <div>
      <div className="toolbar">
        <input
          className="input grow"
          placeholder="🔍 Buscar por nombre o email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn primary" onClick={() => setEditing("nuevo")}>+ Cliente</button>
      </div>

      <table className="table card">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th className="num">Compras</th>
            <th className="num">Facturado</th>
            <th className="num">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((c) => (
            <tr key={c.id}>
              <td>{c.nombre}</td>
              <td className="muted">{c.email || "—"}</td>
              <td className="muted">{c.telefono || "—"}</td>
              <td className="num">{qty(c.compras)}</td>
              <td className="num">{money(c.gastado)}</td>
              <td className="num row-actions">
                <button className="btn ghost sm" onClick={() => setEditing(c)} title="Editar">✏️</button>
                <button className="btn ghost sm" onClick={() => eliminar(c)} title="Eliminar">🗑️</button>
              </td>
            </tr>
          ))}
          {clientes.length === 0 && (
            <tr><td colSpan="6" className="empty">Sin clientes.</td></tr>
          )}
        </tbody>
      </table>
      <p className="table-foot">{qty(clientes.length)} cliente(s)</p>

      {editing && (
        <ClienteModal
          cliente={editing === "nuevo" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function ClienteModal({ cliente, onClose }) {
  const [f, setF] = useState(cliente ? { ...cliente } : { ...VACIO });

  function set(k, v) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  function guardar(e) {
    e.preventDefault();
    const nombre = f.nombre.trim();
    if (!nombre) return alert("El nombre es obligatorio.");

    const params = [nombre, f.email.trim(), f.telefono.trim()];
    if (cliente) {
      run("UPDATE clientes SET nombre = ?, email = ?, telefono = ? WHERE id = ?", [...params, cliente.id]);
    } else {
      run("INSERT INTO clientes (nombre, email, telefono) VALUES (?, ?, ?)", params);
    }
    onClose();
  }

  return (
    <Modal title={cliente ? "✏️ Editar cliente" : "👥 Nuevo cliente"} onClose={onClose}>
      <form onSubmit={guardar} className="form">
        <label>Nombre
          <input className="input" value={f.nombre} onChange={(e) => set("nombre", e.target.value)} autoFocus placeholder="Ej: Ignacio Torres" required />
        </label>
        <label>Email
          <input className="input" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="opcional" />
        </label>
        <label>Teléfono
          <input className="input" value={f.telefono} onChange={(e) => set("telefono", e.target.value)} placeholder="opcional" />
        </label>
        <div className="form-actions">
          <button type="button" className="btn ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn primary">Guardar</button>
        </div>
      </form>
    </Modal>
  );
}
