// ============================================================
//  DATOS DEL PORTAFOLIO
//  Editando SOLO este archivo actualizás todo el sitio:
//  nombre, bio, skills, proyectos y contacto.
// ============================================================

window.PORTFOLIO_DATA = {
  name: "Nico Dev",
  role: "Desarrollador Full-Stack",
  avatarInitials: "ND",
  // Foto de perfil GitHub: se actualiza sola cuando cambiás tu foto ahí.
  // Dejá "" y mostrás iniciales si algún día no la querés.
  avatarUrl: "https://github.com/Nicodev-tech.png",
  tagline:
    "Construyo aplicaciones de punta a punta: desde la base de datos hasta la última línea de interfaz.",

  home: {
    greeting: "👋 Hola, soy",
    cta: [
      { label: "Ver proyectos", href: "#proyectos", primary: true },
      { label: "Contacto", href: "#contacto" },
    ],
    badges: ["JavaScript", "React", "SQL", "Node.js", "Git", "Linux"],
  },

  about: {
    title: "Sobre mí",
    text: [
      "Soy desarrollador full-stack. Me gusta armar software útil y tangible: herramientas que resuelven un problema real y se pueden usar al instante, no demos olvidadas en una carpeta.",
      "En esta página vas a encontrar dos muestras de eso funcionando en vivo: un ERP con una base de datos SQLite de verdad corriendo en tu navegador (WebAssembly), y un editor de pixel-art hecho a mano con la API de Canvas. Todo estático, sin backend, listo para correr en GitHub Pages.",
    ],
  },

  skillsList: [
    "JavaScript (ES6+)",
    "React",
    "Vite",
    "SQLite / IndexedDB",
    "Node.js",
    "HTML5",
    "CSS3",
    "Canvas 2D",
    "Git & GitHub",
    "Linux",
  ],

  projects: [
    {
      icon: "🗄️",
      title: "NicoStore ERP",
      desc: "Mini ERP con inventario, clientes y facturación. La base de datos es SQLite de verdad (sql.js compilado a WebAssembly) que corre 100% en tu navegador y persiste localmente. Incluye dashboard, control de stock y ventas que descuentan inventario.",
      tags: ["React", "SQLite (WASM)", "Vite"],
      href: "erp/index.html",
      cta: "Abrir el ERP",
      featured: true,
      external: false,
    },
    {
      icon: "🎨",
      title: "Editor de Pixel-Art",
      desc: "Mini editor estilo los sprites de antes: lápiz, balde de pintura, cuentagotas, modo espejo, undo/redo y export a PNG. Hecho desde cero con la API Canvas, sin librerías.",
      tags: ["Canvas", "Vanilla JS"],
      href: "pixel-art/index.html",
      cta: "Abrir el editor",
      external: false,
    },
    {
      icon: "🚀",
      title: "Más proyectos en camino",
      desc: "Siempre estoy armando algo nuevo. Mirá mis repos para ver lo que hay de más reciente.",
      tags: ["GitHub"],
      href: "https://github.com/Nicodev-tech",
      cta: "Ver GitHub",
      external: true,
    },
  ],

  contact: {
    title: "Contacto",
    email: "hola@nicodev.dev",
    github: "https://github.com/Nicodev-tech",
    linkedin: "",
  },
};
