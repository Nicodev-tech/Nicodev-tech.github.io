import React, { useEffect, useState } from "react";
import { initDb, isReady, onChange, resetDb } from "./db/database.js";
import Dashboard from "./components/Dashboard.jsx";
import Productos from "./components/Productos.jsx";
import Clientes from "./components/Clientes.jsx";
import Ventas from "./components/Ventas.jsx";

const SECTIONS = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "productos", label: "Productos", icon: "📦" },
  { id: "clientes", label: "Clientes", icon: "👥" },
  { id: "ventas", label: "Ventas", icon: "🧾" },
];

const TITLES = {
  dashboard: "Dashboard",
  productos: "Productos & Inventario",
  clientes: "Clientes",
  ventas: "Ventas",
};

export default function App() {
  const [section, setSection] = useState("dashboard");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    initDb()
      .then(() => alive && setReady(true))
      .catch((e) => alive && setError(String(e)));
    const off = onChange(() => setTick((t) => t + 1));
    return () => {
      alive = false;
      off();
    };
  }, []);

  function handleReset() {
    if (!confirm("¿Restaurar la base con los datos de ejemplo? Se pierden los cambios que hiciste.")) return;
    try {
      resetDb();
    } catch (e) {
      alert("Error al reiniciar la base: " + e.message);
    }
  }

  if (error) {
    return (
      <div className="erp-error">
        <h2>😵 No se pudo iniciar la base de datos</h2>
        <pre>{error}</pre>
        <a href="../index.html">← Volver al portafolio</a>
      </div>
    );
  }

  return (
    <div className="erp">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-logo">🧊</span>
          <div>
            <strong>NicoStore</strong>
            <small>ERP · SQLite WASM</small>
          </div>
        </div>
        <nav className="side-nav">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              className={`side-link ${section === s.id ? "active" : ""}`}
              onClick={() => setSection(s.id)}
            >
              <span>{s.icon}</span> {s.label}
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <span className="db-chip">{isReady() ? "SQLite ✓ WASM" : "⏳ Cargando…"}</span>
          <a href="../index.html">← Portafolio</a>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <h1>{TITLES[section]}</h1>
          <button className="btn ghost sm" onClick={handleReset} title="Vuelve a los datos de ejemplo">
            ↺ Datos demo
          </button>
        </header>

        {!ready ? (
          <div className="loading">
            <div className="spinner" />
            <p>Abriendo la base de datos SQLite (WebAssembly)…</p>
          </div>
        ) : (
          <>
            {section === "dashboard" && <Dashboard />}
            {section === "productos" && <Productos />}
            {section === "clientes" && <Clientes />}
            {section === "ventas" && <Ventas />}
            <footer className="erp-foot">
              React + sql.js → SQLite compilado a WebAssembly · persiste en localStorage
            </footer>
          </>
        )}
      </main>
    </div>
  );
}
