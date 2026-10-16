/* ============================================================
   main.js — Renderiza el portafolio leyendo js/data.js
   (Este archivo casi nunca hace falta tocar)
   ============================================================ */

(function () {
  "use strict";

  const D = window.PORTFOLIO_DATA;
  const $ = (sel) => document.querySelector(sel);

  /* ---------- SEO dinámico ---------- */
  document.title = `${D.name} — ${D.role}`;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute("content", D.tagline);

  /* ---------- Avatar (foto de GitHub con fallback a iniciales) ---------- */
  function setAvatar(el, imgClass) {
    if (D.avatarUrl) {
      const img = new Image();
      img.className = imgClass;
      img.alt = ""; // decorativa; el nombre ya está al lado
      img.onload = () => {
        el.textContent = "";
        el.appendChild(img);
      };
      img.onerror = () => {
        el.textContent = D.avatarInitials; // sin foto → iniciales
      };
      img.src = D.avatarUrl;
    } else {
      el.textContent = D.avatarInitials;
    }
  }

  setAvatar($("#heroAvatar"), "avatar-img");
  setAvatar($("#navLogo"), "nav-avatar");
  $("#footName").textContent = D.name;

  const navMenu = $("#navMenu");
  $("#navToggle").addEventListener("click", () => navMenu.classList.toggle("open"));
  navMenu.addEventListener("click", (e) => {
    if (e.target.tagName === "A") navMenu.classList.remove("open");
  });

  /* ---------- Hero ---------- */
  $("#heroGreeting").textContent = D.home.greeting;
  $("#heroName").textContent = D.name;
  $("#heroRole").textContent = D.role;
  $("#heroTagline").textContent = D.tagline;

  $("#heroCta").innerHTML = D.home.cta
    .map((c) => `<a class="btn ${c.primary ? "primary" : "ghost"}" href="${c.href}">${c.label}</a>`)
    .join("");

  $("#heroBadges").innerHTML = D.home.badges
    .map((s) => `<span class="chip sm">${s}</span>`)
    .join("");

  /* ---------- Sobre mí + Skills ---------- */
  $("#aboutTitle").textContent = D.about.title;
  $("#aboutText").innerHTML = D.about.text.map((p) => `<p>${p}</p>`).join("");

  $("#skillsList").innerHTML = D.skillsList
    .map((s) => `<span class="chip">${s}</span>`)
    .join("");

  /* ---------- Proyectos ---------- */
  $("#contactTitle").textContent = D.contact.title;

  $("#projectsGrid").innerHTML = D.projects
    .map((p) => {
      const isLink = !!p.href;
      const open = `<a class="card project ${p.featured ? "featured" : ""}" href="${p.href}" ${
        p.external ? 'target="_blank" rel="noopener"' : ""
      }>`;
      const close = "</a>";
      const tags = p.tags.map((t) => `<span class="chip sm">${t}</span>`).join("");
      const body = `
        <div class="project-icon">${p.icon}</div>
        <h3>${p.title}</h3>
        <p>${p.desc}</p>
        <div class="project-tags">${tags}</div>
        <span class="project-cta">${p.cta} →</span>
      `;
      return isLink ? open + body + close : `<article class="project">${body}</article>`;
    })
    .join("");

  /* ---------- Contacto ---------- */
  const links = [];
  if (D.contact.email) {
    links.push({ icon: "✉️", value: D.contact.email, href: `mailto:${D.contact.email}` });
  }
  if (D.contact.github) {
    links.push({ icon: "🐙", value: "GitHub", href: D.contact.github, external: true });
  }
  if (D.contact.linkedin) {
    links.push({ icon: "💼", value: "LinkedIn", href: D.contact.linkedin, external: true });
  }

  $("#contactLinks").innerHTML = links
    .map(
      (l) =>
        `<a class="contact-card" href="${l.href}" ${
          l.external ? 'target="_blank" rel="noopener"' : ""
        }><span class="ci">${l.icon}</span><span class="cv">${l.value}</span></a>`
    )
    .join("");

  /* ---------- Año del footer ---------- */
  $("#year").textContent = new Date().getFullYear();

  /* ---------- Animación al scrollear ---------- */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("on");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
})();
