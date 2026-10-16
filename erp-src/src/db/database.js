// ============================================================
//  database.js — SQLite real en el navegador (sql.js / WASM)
//  La DB vive en memoria y se persiste completa en localStorage
//  después de cada operación de escritura.
// ============================================================

import initSqlJs from "sql.js";
// Vite copia el .wasm como asset y nos da la URL con base relativa
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import { SCHEMA, buildSeedStatements } from "./schema.js";

const STORAGE_KEY = "erp_nico_sqlite_v1";

let SQL = null;      // módulo sql.js ya inicializado
let db = null;       // instancia de la base
const listeners = new Set();

export function isReady() {
  return db !== null;
}

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  listeners.forEach((fn) => fn());
}

function persist() {
  try {
    // Exporta TODA la base (binario SQLite) como array de bytes
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(db.export())));
  } catch (e) {
    console.warn("[ERP] No se pudo guardar la base en localStorage:", e);
  }
}

/* ---------- API de consultas ---------- */

export function all(sql, params = []) {
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

export function get(sql, params = []) {
  return all(sql, params)[0] ?? null;
}

/* Escritura simple (auto-persiste y notifica) */
export function run(sql, params = []) {
  db.run(sql, params);
  persist();
  emit();
}

/* Escritura en bloque transaccional: si algo explota, hace ROLLBACK */
export function withTransaction(fn) {
  db.run("BEGIN");
  try {
    fn((sql, params) => db.run(sql, params));
    db.run("COMMIT");
  } catch (e) {
    try { db.run("ROLLBACK"); } catch { /* ya no hay txn */ }
    throw e;
  }
  persist();
  emit();
}

export function lastInsertId() {
  return get("SELECT last_insert_rowid() AS id").id;
}

/* ---------- Inicialización y reset ---------- */

function createFreshDb() {
  db = new SQL.Database();
  db.run("PRAGMA foreign_keys = ON");
  db.exec(SCHEMA);
  buildSeedStatements().forEach(({ sql, params }) => db.run(sql, params));
  persist();
  emit();
}

export function resetDb() {
  if (!SQL) return;
  if (db) db.close();
  localStorage.removeItem(STORAGE_KEY);
  createFreshDb();
}

export async function initDb() {
  if (db) return;
  SQL = await initSqlJs({ locateFile: () => wasmUrl });

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const bytes = new Uint8Array(JSON.parse(saved));
      db = new SQL.Database(bytes);
      db.run("PRAGMA foreign_keys = ON");
      // Escribe el esquema por si la versión es más nueva
      db.exec(SCHEMA);
      persist();
    } catch (e) {
      console.warn("[ERP] Base guardada corrupta, se regeneran datos demo:", e);
      createFreshDb();
    }
  } else {
    createFreshDb();
  }
  emit();
}
