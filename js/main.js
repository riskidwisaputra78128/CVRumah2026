import { loadData, openDocument } from "./store.js";

const $ = (s) => document.querySelector(s);
const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safeUrl = (u = "") => (/^(https?:|mailto:|tel:|data:image\/|data:application\/pdf)/i.test(u.trim()) ? u.trim() : (u && !u.includes(":") ? "https://" + u.trim() : ""));
const shade = (hex, amt) => {
  const n = parseInt(hex.replace("#", ""), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + (amt > 0 ? (255 - v) * amt : v * amt))));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
};

let data, world;

async function boot() {
  // cek WebGL
  const test = document.createElement("canvas");
  if (!(test.getContext("webgl2") || test.getContext("webgl"))) { $("#noWebgl").classList.remove("hidden"); $("#loader").classList.add("done"); return; }

  const [d] = await Promise.all([
    loadData(),
    Promise.race([Promise.all([document.fonts.load("700 40px Fredoka"), document.fonts.load("600 40px Fredoka")]), new Promise((r) => setTimeout(r, 2500))]),
  ]);
  data = d;
  const name = data.profile.name || "Saya";
  document.title = `Rumah ${name} · CV Interaktif`;
  $("#brandName").textContent = `Rumah ${name}`;
  $("#introName").textContent = `Rumah ${name}`;
  $("#introTitle").textContent = data.profile.tagline || data.profile.title || "";

  const { HouseWorld } = await import("./scene.js");
  world = new HouseWorld($("#world"), data, {
    onReady: showIntro,
    onEnterStart: () => { hideIntro(); burstAt(innerWidth / 2, innerHeight * 0.55, 18); },
    onEntered: () => { showDock(); $("#btnExit").classList.remove("hidden"); },
    onExitStart: () => { $("#dock").classList.add("hidden"); $("#insideHint").classList.add("hidden"); $("#btnExit").classList.add("hidden"); },
    onExited: showIntro,
    onOpen: (sec) => openPanel(sec),
    onHover: (h) => setTooltip(h),
    onBackground: () => { closePanel(); world.unfocus(); },
    fade: (to, ms) => fade(to, ms),
    onProgress: (p) => { $("#loader p").textContent = `Membangun rumah… ${Math.round(p * 100)}%`; },
  });
  window.__world = world;
  await world.ready;
  setTimeout(() => { $("#loader").classList.add("done"); world.start(); }, 250);
}

// ---------------- UI dasar ----------------
function fade(to, ms) {
  const f = $("#fade"); f.style.transition = `opacity ${ms}ms ease`; requestAnimationFrame(() => (f.style.opacity = to));
}
function showIntro() { const i = $("#intro"); i.classList.remove("hidden", "leave"); i.classList.add("reveal"); }
function hideIntro() { const i = $("#intro"); i.classList.add("leave"); setTimeout(() => i.classList.add("hidden"), 500); }
$("#btnEnter").addEventListener("click", () => world && world.enter());
$("#btnExit").addEventListener("click", () => { closePanel(true); world && world.exit(); });

function showDock() {
  const dock = $("#dock"); dock.innerHTML = "";
  data.sections.forEach((s, i) => {
    const b = document.createElement("button");
    b.innerHTML = `<span class="ic">${esc(s.icon)}</span>${esc(s.title)}`;
    b.style.animationDelay = `${0.08 * i}s`;
    b.onclick = () => { if (world.mode === "focus") { closePanel(false); world.unfocus(() => world.focusFrame(i)); } else world.focusFrame(i); };
    dock.appendChild(b);
  });
  dock.classList.remove("hidden"); $("#insideHint").classList.remove("hidden");
}

let mouse = { x: 0, y: 0 };
addEventListener("pointermove", (e) => { mouse = { x: e.clientX, y: e.clientY }; const t = $("#tooltip"); t.style.left = mouse.x + "px"; t.style.top = mouse.y + "px"; });
function setTooltip(h) {
  const t = $("#tooltip");
  if (!h || matchMedia("(pointer: coarse)").matches) return t.classList.add("hidden");
  t.textContent = h === "door" ? "✨ Klik untuk masuk" : `${h.icon} ${h.title}`;
  t.classList.remove("hidden");
}

function burstAt(x, y, n = 12) {
  for (let i = 0; i < n; i++) {
    const s = document.createElement("span"); s.className = "burst"; s.textContent = ["✦", "✧", "★", "✨"][i % 4];
    const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 110;
    s.style.left = x + "px"; s.style.top = y + "px"; s.style.setProperty("--dx", Math.cos(a) * d + "px"); s.style.setProperty("--dy", Math.sin(a) * d + "px");
    s.style.fontSize = 10 + Math.random() * 14 + "px";
    document.body.appendChild(s); setTimeout(() => s.remove(), 950);
  }
}

// ---------------- Panel ----------------
function openPanel(sec) {
  const wrap = $("#panelWrap"), panel = $("#panel");
  const c1 = sec.color || "#5b8def", c2 = shade(c1, -0.28);
  panel.style.setProperty("--c1", c1); panel.style.setProperty("--c2", c2);
  panel.classList.remove("out");
  $("#panelBody").innerHTML = header(sec) + `<div class="p-body">${render(sec)}</div>`;
  // stagger delay
  panel.querySelectorAll(".stagger").forEach((el) => [...el.children].forEach((ch, i) => (ch.style.animationDelay = `${0.15 + i * 0.07}s`)));
  wrap.classList.remove("hidden"); document.body.classList.add("panel-open");
  // restart animasi
  panel.style.animation = "none"; panel.offsetHeight; panel.style.animation = "";
  $("#panelBody").scrollTop = 0;
  setTooltip(null);
  setTimeout(() => panel.querySelectorAll(".bar i").forEach((b) => (b.style.width = b.dataset.w + "%")), 350);
  burstAt(innerWidth > 900 ? innerWidth - 300 : innerWidth / 2, innerWidth > 900 ? 120 : innerHeight * 0.3, 14);
  // klik gambar -> lightbox, dokumen
  panel.querySelectorAll("[data-zoom]").forEach((el) => el.addEventListener("click", () => zoom(el.dataset.zoom, el.dataset.cap)));
  panel.querySelectorAll("[data-doc]").forEach((el) => el.addEventListener("click", () => openDocument(data.documents[+el.dataset.doc].url)));
}
function closePanel(silent) {
  const wrap = $("#panelWrap"), panel = $("#panel");
  if (wrap.classList.contains("hidden")) return;
  panel.classList.add("out"); document.body.classList.remove("panel-open");
  setTimeout(() => wrap.classList.add("hidden"), 330);
  if (!silent) return;
}
$("#panelClose").addEventListener("click", () => { closePanel(); world.unfocus(); });
addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!$("#lightbox").classList.contains("hidden")) return $("#lightbox").classList.add("hidden");
  if (!$("#panelWrap").classList.contains("hidden")) { closePanel(); world.unfocus(); }
});
function zoom(src, cap) { const lb = $("#lightbox"); lb.querySelector("img").src = src; lb.querySelector("p").textContent = cap || ""; lb.classList.remove("hidden"); }
$("#lightbox").addEventListener("click", () => $("#lightbox").classList.add("hidden"));

function header(sec) {
  const p = data.profile;
  const subtitle = { about: p.title, contact: "Mari terhubung!", skills: "Hal-hal yang saya kuasai", timeline: "Jejak perjalanan", cards: "", gallery: "Potongan cerita" }[sec.type] || "";
  return `<header class="p-head">
    <span class="orb" style="width:160px;height:160px;right:-40px;top:-50px"></span>
    <span class="orb" style="width:70px;height:70px;right:90px;bottom:-20px"></span>
    <span class="p-icon">${esc(sec.icon)}</span>
    <h2>${esc(sec.title)}</h2>${subtitle ? `<p>${esc(subtitle)}</p>` : ""}
  </header>`;
}

const img = (src, cap, cls = "thumb") => (src ? `<img class="${cls}" src="${esc(safeUrl(src))}" alt="${esc(cap)}" loading="lazy" data-zoom="${esc(safeUrl(src))}" data-cap="${esc(cap)}">` : "");
const link = (u, label = "Lihat") => (safeUrl(u) ? `<a class="link" href="${esc(safeUrl(u))}" target="_blank" rel="noopener">🔗 ${esc(label)} →</a>` : "");
const empty = `<p class="empty">Belum ada isi. Tambahkan lewat halaman Admin ✨</p>`;

function render(sec) {
  const p = data.profile, items = sec.items || [];
  switch (sec.type) {
    case "about":
      return `<div class="stagger">
        <div class="about-top"><div class="avatar">${p.photo ? `<img src="${esc(safeUrl(p.photo))}" alt="${esc(p.name)}" data-zoom="${esc(safeUrl(p.photo))}" data-cap="${esc(p.name)}">` : "🙂"}</div>
          <div><h3>${esc(p.name)}</h3><p class="role">${esc(p.title)}</p>${p.tagline ? `<p class="tag">“${esc(p.tagline)}”</p>` : ""}</div></div>
        <p class="prose">${esc(p.about)}</p>
        ${items.length ? `<div class="facts">${items.map((f) => `<div class="fact"><b>${esc(f.title)}</b><span>${esc(f.subtitle)}</span></div>`).join("")}</div>` : ""}
      </div>`;
    case "timeline":
      if (!items.length) return empty;
      return `<div class="timeline stagger">${items.map((it) => `<div class="t-item">
        ${it.period ? `<span class="period">${esc(it.period)}</span>` : ""}
        <h4>${esc(it.title)}</h4>${it.subtitle ? `<p class="org">${esc(it.subtitle)}</p>` : ""}
        ${it.desc ? `<p class="d">${esc(it.desc)}</p>` : ""}${img(it.image, it.title)}${link(it.link)}</div>`).join("")}</div>`;
    case "skills":
      if (!items.length) return empty;
      return `<div class="stagger">${items.map((it) => `<div class="skill"><div class="skill-top"><span>${esc(it.title)}</span><small>${esc(it.subtitle || "")} ${it.level != null && it.level !== "" ? `· ${+it.level}%` : ""}</small></div>
        <div class="bar"><i data-w="${Math.max(0, Math.min(100, +it.level || 0))}"></i></div></div>`).join("")}</div>`;
    case "cards":
      if (!items.length) return empty;
      return `<div class="cards stagger">${items.map((it) => `<div class="card">
        <div class="cover">${it.image ? img(it.image, it.title, "") : esc(sec.icon)}</div>
        <div class="inner">${it.period ? `<span class="period">${esc(it.period)}</span>` : ""}<h4>${esc(it.title)}</h4>
        ${it.subtitle ? `<p class="org">${esc(it.subtitle)}</p>` : ""}${it.desc ? `<p class="d">${esc(it.desc)}</p>` : ""}${link(it.link, "Kunjungi")}</div></div>`).join("")}</div>`;
    case "gallery":
      if (!items.length) return empty;
      return `<div class="gallery stagger">${items.map((it) => `<figure class="g-item" style="margin:0" ${it.image ? `data-zoom="${esc(safeUrl(it.image))}" data-cap="${esc(it.title)}"` : ""}>
        ${it.image ? `<img src="${esc(safeUrl(it.image))}" alt="${esc(it.title)}" loading="lazy">` : "🖼️"}<figcaption>${esc(it.title)}</figcaption></figure>`).join("")}</div>`;
    case "contact": {
      const rows = [
        p.email && `<a class="c-row" href="mailto:${esc(p.email)}"><span class="ic">✉️</span><div><small>Email</small><b>${esc(p.email)}</b></div></a>`,
        p.phone && `<a class="c-row" href="https://wa.me/${esc(p.phone.replace(/\D/g, "").replace(/^0/, "62"))}" target="_blank" rel="noopener"><span class="ic">📱</span><div><small>WhatsApp / Telepon</small><b>${esc(p.phone)}</b></div></a>`,
        p.location && `<div class="c-row"><span class="ic">📍</span><div><small>Lokasi</small><b>${esc(p.location)}</b></div></div>`,
      ].filter(Boolean).join("");
      const links = (data.links || []).filter((l) => safeUrl(l.url));
      const docs = (data.documents || []).map((d, i) => ({ ...d, i })).filter((d) => d.url);
      return `<div class="stagger">
        <div class="c-list">${rows || empty}</div>
        ${links.length ? `<h5 class="sub-h">Temukan saya di</h5><div class="chips">${links.map((l) => `<a class="chip" href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener">${esc(l.icon || "🔗")} ${esc(l.label)}</a>`).join("")}</div>` : ""}
        ${docs.length ? `<h5 class="sub-h">Dokumen</h5>${docs.map((d) => `<button class="doc-btn" data-doc="${d.i}">📄 ${esc(d.label)}</button>`).join("")}` : ""}
        ${items.map((it) => `<div class="c-row" style="margin-top:10px"><span class="ic">⭐</span><div><small>${esc(it.title)}</small><b>${esc(it.subtitle)}</b></div></div>`).join("")}
      </div>`;
    }
    default:
      return empty;
  }
}

boot().catch((e) => { console.error(e); $("#loader p").textContent = "Ups, gagal memuat: " + e.message; });
