/* Formateadores compartidos */

export function money(n) {
  return "$ " + Number(n || 0).toLocaleString("es-AR", { maximumFractionDigits: 2 });
}

export function qty(n) {
  return Number(n || 0).toLocaleString("es-AR");
}

/* "2026-10-16 14:45:00" → "16/10/2026 14:45" */
export function fmtFecha(s) {
  if (!s) return "";
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2}).(\d{2}:\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}` : s;
}

/* "2026-10-16 ..." → "16/10" */
export function fmtDia(s) {
  if (!s) return "";
  const parts = String(s).slice(0, 10).split("-");
  return `${parts[2]}/${parts[1]}`;
}

const pad = (n) => String(n).padStart(2, "0");

/* Fecha local ahora → "YYYY-MM-DD HH:MM:SS" (mismo formato que la seed) */
export function ahoraLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

/* Fecha local → "YYYY-MM-DD" */
export function hoyLocal() {
  return ahoraLocal().slice(0, 10);
}
