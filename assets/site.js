const SITE = window.__CONTENT__ || JSON.parse(document.getElementById("content").textContent);
const $ = (s, r=document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt = iso => new Date(iso+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const M = window.Motion || null;

/* Real paths on garciajp.com (garciajp.com/projects/research-agent/). Hash paths when opened as a file or in a preview. */
const HASH = location.protocol === "file:" || document.documentElement.dataset.mode === "hash";
const url = p => HASH ? "#" + p : p;

/* ===================== analytics =====================
   GoatCounter: cookieless, no consent banner needed. Counts page views, plus events for the
   actions that matter: contact clicks, resume downloads, finished explainers and shares.
   Runs only on the live domain, so local previews and the build's pre-render are not counted. */
const GA = (() => {
  const code = SITE.analytics && SITE.analytics.goatcounter;
  // Your own devices: open any page with #notrack once to stop counting this browser, #track to resume.
  let mine = false;
  try {
    if (location.hash === "#notrack") localStorage.setItem("skipgc", "t");
    if (location.hash === "#track") localStorage.removeItem("skipgc");
    mine = localStorage.getItem("skipgc") === "t";
  } catch(_){}
  if (/^#(no)?track$/.test(location.hash)) history.replaceState(history.state, "", location.pathname + location.search);
  const live = code && !mine && !HASH && location.hostname === new URL(SITE.domain).hostname;
  const queue = []; let ready = false, first = true;
  const send = v => { if (ready && window.goatcounter && goatcounter.count) goatcounter.count(v); else queue.push(v); };
  if (live){
    window.goatcounter = { no_onload: true, no_events: true };
    const sc = document.createElement("script");
    sc.async = true; sc.src = "https://gc.zgo.at/count.js"; sc.dataset.goatcounter = `https://${code}.goatcounter.com/count`;
    sc.onload = () => { ready = true; queue.splice(0).forEach(send); };
    document.head.appendChild(sc);
  }
  const campaign = () => { const q = new URLSearchParams(location.search); return q.get("ref") || q.get("utm_source") || null; };
  return {
    view(){
      if (!live) return;
      // the first view keeps the visitor's real referrer (or ?ref= tag); later in-site views have none
      const v = { path: location.pathname, title: document.title };
      if (first){ const c = campaign(); if (c) v.referrer = c; first = false; } else v.referrer = "";
      send(v);
    },
    event(name){ if (live) send({ path: name, title: name, event: true }); },
  };
})();
document.addEventListener("click", e => {
  const a = e.target.closest("a[href]"); if (!a) return;
  const href = a.getAttribute("href");
  if (href.startsWith("mailto:")) return GA.event("contact/email");
  if (/\.pdf(\?|$)/i.test(href)) return GA.event("download/resume-pdf");
  if (a.dataset.ev) return GA.event(a.dataset.ev);
  if (/^https?:/.test(href)){ try { const h = new URL(href).hostname.replace(/^www\./, ""); if (h !== new URL(SITE.domain).hostname) GA.event("out/" + h); } catch(_){} }
}, true);
const asset = p => HASH ? p : "/" + p;
const TABS = [["/","Home","home"],["/projects/","Projects","projects"],["/writing/","Writing","writing"],["/resume/","Resume","resume"],["/stack/","Stack","stack"],["/services/","Services","services"],["/book/","Contact","book"]];

const ICONS = {
  github: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.82 1.19 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z"/></svg>',
  arrow: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>',
  ext: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h7v7M13 3 4 12"/></svg>',
  mail: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3.5" width="12" height="9" rx="1.5"/><path d="m2.5 4.5 5.5 4 5.5-4"/></svg>',
  link: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.6 9.4a3 3 0 0 0 4.3 0l2.2-2.2a3 3 0 0 0-4.3-4.3l-.9.9"/><path d="M9.4 6.6a3 3 0 0 0-4.3 0L2.9 8.8a3 3 0 0 0 4.3 4.3l.9-.9"/></svg>',
  share: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 10V2M5 5l3-3 3 3"/><path d="M3 8v5h10V8"/></svg>',
  check: '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 8.5 3 3 7-7"/></svg>',
};

$("#nav").innerHTML = TABS.map(([p,l,k]) => `<a href="${url(p)}" data-k="${k}">${l}</a>`).join("");
$(".brand").href = url("/");
$("#foot").textContent = "© " + new Date().getFullYear() + " " + SITE.name + " · " + SITE.location;
$("#footMail").textContent = SITE.email; $("#footMail").href = "mailto:" + SITE.email;
addEventListener("scroll", () => $("#top").classList.toggle("scrolled", scrollY > 8), {passive:true});
const setHead = () => document.documentElement.style.setProperty("--hh", $("#top").offsetHeight + "px");
setHead(); addEventListener("resize", setHead);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(setHead);

/* ===================== the build stage ===================== */
const SQL = [
  ["kw","create table "],["","documents (\n"],
  ["","  id          "],["kw","uuid primary key"],["",",\n"],
  ["","  tenant_id   "],["kw","uuid not null references "],["","tenants,\n"],
  ["","  title       "],["kw","text not null"],["",",\n"],
  ["","  body        "],["kw","text not null"],["",",\n"],
  ["","  updated_at  "],["kw","timestamptz default "],["","now()\n);\n\n"],
  ["kw","create index on "],["","documents (tenant_id);"],
];
const API = [
  ["kw","POST "],["","/api/search\n"],
  ["","{ "],["str",'"query"'],["",": "],["str",'"Can I get a refund on an annual plan?"'],["",", "],["str",'"top_k"'],["",": "],["nm","3"],[""," }\n\n"],
  ["dim","200 OK · bm25 + dense · reranked\n"],
  ["","[\n"],
  ["","  { "],["str",'"score"'],["",": "],["nm","0.92"],["",", "],["str",'"text"'],["",": "],["str",'"Annual plans are refundable within 30 days…"'],[""," },\n"],
  ["","  { "],["str",'"score"'],["",": "],["nm","0.81"],["",", "],["str",'"text"'],["",": "],["str",'"Refunds go back to the original card…"'],[""," },\n"],
  ["","  { "],["str",'"score"'],["",": "],["nm","0.64"],["",", "],["str",'"text"'],["",": "],["str",'"Monthly plans renew on the same day…"'],[""," }\n"],
  ["","]"],
];
const lenOf = toks => toks.reduce((n,t) => n + t[1].length, 0);
function typed(toks, chars, caret){
  let out = "", left = chars;
  for (const [c,t] of toks){
    if (left <= 0) break;
    const s = t.slice(0, left); left -= s.length;
    out += c ? `<span class="${c}">${esc(s)}</span>` : esc(s);
  }
  return out + (caret ? '<span class="caret"></span>' : "");
}
const AGENTS = [
  ["Planner", "Split the question into 3 sub-questions", "0.8 s"],
  ["Researcher", "Searched 214 passages, kept 9", "2.1 s"],
  ["Critic", "One claim had no source, sent it back", "1.2 s", true],
  ["Synthesizer", "Wrote the answer with 6 citations", "1.6 s"],
];
const RUN = `
  <div class="run">
    <div class="run-head"><div><h4>Agent run</h4><span class="muted" style="font-size:14px">4 agents · 5.7 s</span></div><div class="run-score num">6/6<small>claims cited</small></div></div>
    ${AGENTS.map(([n,t,s,f]) => `<div class="agent" data-row><b>${n}</b><span class="t">${t}${f ? '<span class="flag">Revised</span>' : ""}</span><span class="muted num" style="font-size:14px">${s}</span></div>`).join("")}
  </div>`;
const SHIP = `
  <div class="ship">
    <div class="ship-url">${ICONS.check} help.yourcompany.com/ask</div>
    <div class="log"><span class="dim">$</span> git push origin main<br><span class="dim">Pipeline passed · 48 tests</span><br><span class="dim">gunicorn restarted · nginx reloaded</span><br><span class="ok">Live in production</span></div>
    <div class="mini-app"><div class="ask"><span>Can I get a refund on an annual plan?</span>${ICONS.arrow.replace('viewBox','width="14" height="14" viewBox')}</div>
      <p class="ans">Yes, within 30 days of purchase<sup>1</sup>. The money goes back to the original card<sup>2</sup>.</p></div>
  </div>`;
const STEPS = [
  { t:"Model the data", d:"Schemas that keep every customer's data apart and still make sense two years from now.", file:"schema.sql" },
  { t:"Retrieve the right context", d:"Hybrid search and reranking, so the model answers from the right passages.", file:"POST /api/search" },
  { t:"Let agents check the work", d:"A planner, researcher and critic catch unsupported answers before users see them.", file:"Agent run" },
  { t:"Ship it", d:"Deployed on a real server, tested, and handed over with docs.", file:"production" },
];

function buildStage(){
  const card = i => `<div class="card"><div class="bar"><span class="dots"><i></i><i></i><i></i></span><span class="file">${STEPS[i].file}</span></div><div class="in">${
    i===0 ? `<pre class="code">${typed(SQL, 1e4)}</pre>` : i===1 ? `<pre class="code">${typed(API, 1e4)}</pre>` : i===2 ? RUN : SHIP}</div></div>`;
  return `
  <section class="build" aria-label="How I build an AI feature, from database to production">
    <div class="build-track" id="track">
      <div class="pin">
        <ol class="steps" id="steps">${STEPS.map((s,i) => `<li class="step${i?"":" on"}"><span class="n">${i+1}</span><h3>${s.t}</h3><p>${s.d}</p></li>`).join("")}</ol>
        <div class="screen" aria-hidden="true">
          <div class="bar"><span class="dots"><i></i><i></i><i></i></span><span class="file" id="file">${STEPS[0].file}</span><span class="sample">Sample data</span></div>
          <div class="layer on" data-l="0"><pre class="code" id="sql"></pre></div>
          <div class="layer" data-l="1"><pre class="code" id="api"></pre></div>
          <div class="layer" data-l="2">${RUN}</div>
          <div class="layer" data-l="3">${SHIP}</div>
        </div>
        <div class="deck">
          <div class="deck-track" id="deck">${STEPS.map((s,i) => `<div class="still${i?"":" cur"}" data-i="${i}"><h3>${s.t}</h3><p>${s.d}</p>${card(i)}</div>`).join("")}</div>
          <div class="deck-nav"><div class="pips" id="pips">${STEPS.map((s,i) => `<button type="button" data-pip="${i}" aria-label="Step ${i+1}: ${s.t}" aria-current="${i===0}"><i></i></button>`).join("")}</div><span class="counter num" id="counter">1 / 4 · Sample data</span></div>
        </div>
        <div class="progress"><i id="bar"></i></div>
      </div>
    </div>
  </section>`;
}

let stageCleanup = null;
function initStage(){
  if (stageCleanup) { stageCleanup(); stageCleanup = null; }
  const track = $("#track"); if (!track) return;
  if (reduce){ track.closest(".build").classList.add("static"); initDeck(); return; }
  const steps = [...document.querySelectorAll("#steps .step")];
  const layers = [...document.querySelectorAll(".screen .layer")];
  const sqlEl = $("#sql"), apiEl = $("#api"), fileEl = $("#file"), bar = $("#bar");
  const sqlLen = lenOf(SQL), apiLen = lenOf(API);
  let cur = -1, rowsShown = false;

  function render(p){
    p = Math.min(1, Math.max(0, p));
    const idx = Math.min(3, Math.floor(p * 4));
    const local = p * 4 - idx;
    bar.style.transform = `scaleX(${p})`;
    if (idx === 0) sqlEl.innerHTML = typed(SQL, Math.round(sqlLen * Math.min(1, local / .85)), true);
    if (idx === 1) apiEl.innerHTML = typed(API, Math.round(apiLen * Math.min(1, local / .8)), local < .8);
    if (idx > 0 && cur === 0) sqlEl.innerHTML = typed(SQL, sqlLen);
    if (idx === cur) return;
    cur = idx;
    steps.forEach((s,i) => s.classList.toggle("on", i === idx));
    layers.forEach((l,i) => l.classList.toggle("on", i === idx));
    fileEl.textContent = STEPS[idx].file;
    if (idx === 2 && !rowsShown){
      rowsShown = true;
      if (M) M.animate(layers[2].querySelectorAll("[data-row]"), { opacity:[0,1], y:[14,0], scale:[.98,1] }, { delay: M.stagger(.12), type:"spring", duration:.5, bounce:.15 });
    }
    if (idx < 2) rowsShown = false;
    if (idx === 3 && M){
      M.animate(layers[3].querySelector(".mini-app"), { scale:[.94,1], opacity:[.4,1] }, { type:"spring", duration:.6, bounce:.2 });
      M.animate(layers[3].querySelector(".log .ok"), { clipPath:["inset(0 100% 0 0)","inset(0 0% 0 0)"] }, { duration:.6, ease:[.77,0,.175,1], delay:.15 });
    }
  }
  if (M && M.scroll){
    const stop = M.scroll(p => render(p), { target: track, offset: ["start start", "end end"] });
    stageCleanup = typeof stop === "function" ? stop : null;
  } else {
    const onScroll = () => { const r = track.getBoundingClientRect(); render(-r.top / (r.height - innerHeight)); };
    addEventListener("scroll", onScroll, {passive:true});
    stageCleanup = () => removeEventListener("scroll", onScroll);
  }
  render(0);
}

/* swipe deck for phones and tablets */
function initDeck(){
  const deck = $("#deck"); if (!deck) return;
  const cards = [...deck.children], pips = [...document.querySelectorAll("#pips [data-pip]")], counter = $("#counter");
  let cur = 0;
  const go = i => cards[i].scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest", inline: "start" });
  const set = i => {
    if (i === cur) return; cur = i;
    cards.forEach((c,k) => c.classList.toggle("cur", k === i));
    pips.forEach((p,k) => p.setAttribute("aria-current", k === i));
    counter.textContent = `${i+1} / ${cards.length} · Sample data`;
    if (M && !reduce && i === 2) M.animate(cards[2].querySelectorAll("[data-row]"), { opacity:[0,1], y:[10,0] }, { delay: M.stagger(.08), type:"spring", duration:.45, bounce:.12 });
  };
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && e.intersectionRatio > .6) set(+e.target.dataset.i); }), { root: deck, threshold: [.6] });
  cards.forEach(c => io.observe(c));
  pips.forEach(p => p.addEventListener("click", () => go(+p.dataset.pip)));
  cards.forEach((c,i) => c.addEventListener("click", () => { if (i !== cur) go(i); }));
  deck.addEventListener("keydown", e => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft"){ go(Math.max(0, Math.min(cards.length-1, cur + (e.key === "ArrowRight" ? 1 : -1)))); e.preventDefault(); }
  });
  deck.tabIndex = 0; deck.setAttribute("aria-label", "Build steps. Swipe or use the arrow keys.");
}

/* ===================== explainers: scroll-driven drawings ===================== */
/* Each scene draws into a 120 x 100 unit space. S runs from 0 to the number of steps:
   the integer part is the step, the fraction is how far through that step the reader is. */
const EXF = {
  sans: '"Funnel Sans", Inter, Helvetica, Arial, sans-serif',
  disp: '"Funnel Display", "Inter Display", Helvetica, Arial, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace',
};
function exRng(seed){ return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }
function exColors(){
  const s = getComputedStyle(document.documentElement), g = n => s.getPropertyValue(n).trim();
  return { ink:g("--ink"), muted:g("--muted"), line:g("--line"), strong:g("--line-strong"), surface:g("--surface"), raised:g("--raised"),
           bg:g("--bg"), accent:g("--accent"), fill:g("--accent-fill"), ok:g("--ok"), warn:g("--warn"), white:"#FFFFFF" };
}
function exKit(ctx, C, fsc = 1){
  const K = { C, ctx };
  K.clamp = (v,a=0,b=1) => Math.max(a, Math.min(b, v));
  K.seg = (S,a,b) => K.clamp((S - a) / (b - a));
  K.ease = t => 1 - Math.pow(1 - K.clamp(t), 3);
  K.io = t => { t = K.clamp(t); return t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2; };
  K.lerp = (a,b,t) => a + (b - a) * t;
  K.alpha = a => { ctx.globalAlpha = K.clamp(a); };
  K.rect = (x,y,w,h,r=2,o={}) => {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, Math.min(r, w/2, h/2)); else ctx.rect(x, y, w, h);
    if (o.fill){ ctx.fillStyle = o.fill; ctx.fill(); }
    if (o.stroke){ ctx.strokeStyle = o.stroke; ctx.lineWidth = o.lw || .3; ctx.stroke(); }
  };
  K.font = (o={}) => `${o.weight || 500} ${(o.size || 3.6) * fsc}px ${o.mono ? EXF.mono : o.display ? EXF.disp : EXF.sans}`;
  K.text = (s,x,y,o={}) => {
    ctx.font = K.font(o); ctx.fillStyle = o.color || C.ink;
    ctx.textAlign = o.align || "left"; ctx.textBaseline = o.base || "middle";
    if (o.halo){ ctx.lineJoin = "round"; ctx.lineWidth = o.halo === true ? 1 : o.halo; ctx.strokeStyle = C.surface; ctx.strokeText(s, x, y); }
    ctx.fillText(s, x, y);
  };
  K.width = (s,o={}) => { ctx.font = K.font(o); return ctx.measureText(s).width; };
  K.line = (x1,y1,x2,y2,o={}) => {
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
    ctx.strokeStyle = o.color || C.strong; ctx.lineWidth = o.lw || .35; ctx.setLineDash(o.dash || []); ctx.stroke(); ctx.setLineDash([]);
  };
  K.arrow = (x1,y1,x2,y2,o={}) => {
    const p = o.p == null ? 1 : K.clamp(o.p); if (p <= 0) return;
    const x = x1 + (x2 - x1) * p, y = y1 + (y2 - y1) * p;
    K.line(x1, y1, x, y, o);
    if (p > .97 && o.head !== false){
      const a = Math.atan2(y2 - y1, x2 - x1), h = o.hs || 1.6;
      ctx.beginPath(); ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - h*Math.cos(a - .45), y2 - h*Math.sin(a - .45));
      ctx.lineTo(x2 - h*Math.cos(a + .45), y2 - h*Math.sin(a + .45));
      ctx.closePath(); ctx.fillStyle = o.color || C.strong; ctx.fill();
    }
  };
  K.dot = (x,y,r,o={}) => {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
    if (o.fill !== false){ ctx.fillStyle = o.fill || C.accent; ctx.fill(); }
    if (o.stroke){ ctx.strokeStyle = o.stroke; ctx.lineWidth = o.lw || .35; ctx.stroke(); }
  };
  K.packet = (x1,y1,x2,y2,t,o={}) => {
    if (t <= 0 || t >= 1) return;
    const e = K.io(t); K.dot(K.lerp(x1,x2,e), K.lerp(y1,y2,e), o.r || 1.3, { fill: o.color || C.accent });
  };
  K.node = (x,y,w,h,label,o={}) => {
    K.rect(x - w/2, y - h/2, w, h, o.r || 2.4, { fill: o.fill || C.surface, stroke: o.stroke || C.strong, lw: o.lw || .35 });
    K.text(label, x, o.sub ? y - 1.7 : y, { align:"center", size:o.size || 3.4, weight:600, color:o.color || C.ink });
    if (o.sub) K.text(o.sub, x, y + 2.5, { align:"center", size:2.6, weight:400, color:o.subColor || C.muted });
  };
  K.check = (x,y,s,color) => {
    ctx.beginPath(); ctx.moveTo(x - s*.5, y); ctx.lineTo(x - s*.1, y + s*.4); ctx.lineTo(x + s*.55, y - s*.45);
    ctx.strokeStyle = color || C.ok; ctx.lineWidth = .55; ctx.lineCap = "round"; ctx.stroke(); ctx.lineCap = "butt";
  };
  K.typed = (lines, t, x, y, lh, o={}) => {
    const total = lines.reduce((n, l) => n + l.length, 0); let left = Math.round(total * K.clamp(t));
    lines.forEach((l, i) => { if (left <= 0) return; K.text(l.slice(0, left), x, y + i*lh, o); left -= l.length; });
  };
  return K;
}

const EX_DATA = (() => {
  /* RAG: three documents, three chunks each, plus background chunks from the rest of the corpus */
  const r = exRng(11);
  const centers = [[70, 30], [100, 46], [80, 74]];
  const ragChunks = [];
  for (let d = 0; d < 3; d++) for (let c = 0; c < 3; c++)
    ragChunks.push({ d, c, x: centers[d][0] + (r() - .5) * 13, y: centers[d][1] + (r() - .5) * 12 });
  const q = [72, 34];
  const ragBg = [];
  while (ragBg.length < 16){
    const x = 54 + r() * 60, y = 12 + r() * 76;
    if (Math.hypot(x - q[0], y - q[1]) > 15) ragBg.push({ x, y });
  }
  const order = ragChunks.map((p, i) => [i, Math.hypot(p.x - q[0], p.y - q[1])]).sort((a, b) => a[1] - b[1]).map(a => a[0]);
  /* neural network weights */
  const r2 = exRng(5), layers = [3, 5, 5, 2], weights = [];
  for (let l = 0; l < 3; l++){ const m = []; for (let i = 0; i < layers[l]; i++){ const row = []; for (let j = 0; j < layers[l+1]; j++) row.push({ w: r2()*2 - 1, g: r2()*2 - 1 }); m.push(row); } weights.push(m); }
  const acts = layers.map(n => Array.from({ length: n }, () => .25 + r2() * .75));
  /* transformer token vectors */
  const r3 = exRng(23), vecs = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => r3()*2 - 1));
  return { ragChunks, ragBg, q, order, layers, weights, acts, vecs };
})();

const SCENES = {
  /* ---------- RAG ---------- */
  rag(K, S){
    const C = K.C, D = EX_DATA, ctx = K.ctx;
    const docs = ["Refund policy", "Shipping", "Pricing"];
    const texts = [["Annual: refund in 30 days", "Refund goes to your card", "Monthly: no refunds"],
                   ["Ships in 2 business days", "Free shipping over $50", "Tracking link by email"],
                   ["Annual plan: $96 a year", "Monthly plan: $10", "Volume discounts for teams"]];
    const docY = i => 10 + i * 29;
    // vector space frame
    const space = K.seg(S, .6, 1.2) * (1 - .65 * K.seg(S, 3.9, 4.3)) * (1 - .6 * K.seg(S, 4.9, 5.2));
    K.alpha(space);
    K.rect(50, 8, 66, 86, 3, { stroke: C.line, lw: .3 });
    K.text("vector space", 53, 12, { size: 2.6, color: C.muted, weight: 400 });
    // background chunks
    K.alpha(K.seg(S, 1.3, 1.9) * space);
    D.ragBg.forEach(p => K.dot(p.x, p.y, 1, { fill: C.strong }));
    // documents
    const docA = 1 - K.seg(S, 1.5, 1.9);
    D.ragChunks.forEach((p, i) => {
      const y0 = docY(p.d);
      if (p.c === 0 && docA > 0){
        K.alpha(docA * K.seg(S, 0, .25));
        K.rect(4, y0, 26, 23, 2, { fill: C.surface, stroke: C.strong });
        K.text(docs[p.d], 6.5, y0 + 4, { size: 2.9, weight: 600 });
      }
      // chunk: inside the doc -> column beside it -> a dot in vector space
      const split = K.ease(K.seg(S, .15, .9)), fly = K.io(K.seg(S, 1 + (i % 9) * .03, 1.75 + (i % 9) * .03));
      const ax = K.lerp(6.5, 34, split), ay = K.lerp(y0 + 8.5 + p.c * 4.6, y0 + 1 + p.c * 7.5, split);
      const x = K.lerp(ax, p.x - 1.2, fly), y = K.lerp(ay, p.y - 1.2, fly);
      const w = K.lerp(K.lerp(20, 14, split), 2.4, fly), h = K.lerp(3, 2.4, fly);
      const near = D.order.indexOf(i) < 5;   // top-k = 5 candidates go to the reranker
      const lit = near && S >= 3 ? K.seg(S, 3.3, 3.8) : 0;
      K.alpha(K.seg(S, .1, .4) * (fly > .5 ? space : 1));
      K.rect(x, y, w, h, 1.2, { fill: lit > 0 ? C.accent : (fly > .5 ? C.muted : C.strong) });
      if (lit > 0){ K.alpha(lit * space); K.dot(p.x, p.y, 2.2, { fill: false, stroke: C.accent, lw: .4 }); }
    });
    // question
    const qa = K.seg(S, 2, 2.3) * (1 - K.seg(S, 3.8, 4.1));
    if (qa > 0){
      K.alpha(qa);
      K.rect(4, 10, 40, 14, 2.4, { fill: C.raised, stroke: C.accent, lw: .4 });
      K.text("Can I get a refund", 7, 15, { size: 3.1, weight: 600 });
      K.text("on an annual plan?", 7, 19.5, { size: 3.1, weight: 600 });
    }
    K.alpha(space);
    K.packet(44, 17, D.q[0], D.q[1], K.seg(S, 2.35, 2.9), { r: 1.4 });
    const qd = K.seg(S, 2.85, 3);
    if (qd > 0){
      K.alpha(qd * space); K.dot(D.q[0], D.q[1], 1.8, { fill: C.accent });
      K.text("question", D.q[0] + 3, D.q[1] - 3, { size: 2.6, color: C.accent, weight: 600 });
    }
    // nearest neighbours
    const grow = K.ease(K.seg(S, 3, 3.6));
    if (grow > 0){
      K.alpha(space * .9);
      D.order.slice(0, 5).forEach(i => { const p = D.ragChunks[i]; K.arrow(D.q[0], D.q[1], p.x, p.y, { p: K.seg(S, 3.4, 3.9), color: C.accent, head: false, lw: .3 }); });
    }
    // rerank list
    const listA = K.seg(S, 3.95, 4.05);
    const rr = [[.94, .81, .52], [.05, .04, .03], [.33, .12, .21]]; // reranker score per [doc][chunk]
    const cand = D.order.slice(0, 5).map(i => [D.ragChunks[i].d, D.ragChunks[i].c, rr[D.ragChunks[i].d][D.ragChunks[i].c], D.ragChunks[i]]);
    const reranked = cand.map((c, i) => [i, c[2]]).sort((a, b) => b[1] - a[1]).map(a => a[0]);
    if (listA > 0){
      K.alpha(listA);
      const mv = K.io(K.seg(S, 4.25, 4.9));
      K.text(mv < .5 ? "Top 5 by vector search" : "Reranked by the cross-encoder", 4, 30, { size: 2.8, color: mv < .5 ? C.muted : C.accent, weight: 500 });
      const drawOrder = cand.map((c, i) => i).sort((a, b) => (reranked.indexOf(b) - b) - (reranked.indexOf(a) - a));
      drawOrder.forEach(i => { const c = cand[i];
        const from = 36 + i * 10.5, to = 36 + reranked.indexOf(i) * 10.5, y = K.lerp(from, to, mv), sinks = reranked.indexOf(i) > i;
        const top = reranked.indexOf(i) < 2 && mv > .9;
        const g = K.io(K.seg(S, 3.95 + i * .05, 4.3 + i * .05));
        if (g < 1){
          K.alpha(1); K.rect(K.lerp(c[3].x - 1.2, 4, g), K.lerp(c[3].y - 1.2, y - 4.2, g), K.lerp(2.4, 44, g), K.lerp(2.4, 9, g), K.lerp(1.2, 1.8, g), { fill: K.lerp(0, 1, g) < .4 ? C.accent : C.surface, stroke: C.accent, lw: .3 });
          return;
        }
        K.alpha(K.seg(S, 4.3 + i * .05, 4.38 + i * .05) * (sinks ? 1 - .85 * Math.sin(Math.PI * mv) : 1));
        K.rect(4, y - 4.2, 44, 9, 1.8, { fill: C.surface, stroke: top ? C.accent : C.line, lw: top ? .45 : .3 });
        K.text(texts[c[0]][c[1]], 6, y - 1.1, { size: 2.6, weight: 500 });
        K.rect(6, y + 2, 30 * c[2] * K.seg(S, 4.1, 4.5), 1, .5, { fill: top ? C.accent : C.strong });
        K.text(c[2].toFixed(2), 46, y + 2.4, { size: 2.4, mono: true, align: "right", color: C.muted });
      });
    }
    // generation
    const gen = K.seg(S, 4.95, 5.2);
    if (gen > 0){
      K.alpha(gen);
      K.rect(54, 28, 62, 46, 3, { fill: C.raised, stroke: C.strong });
      K.text("Model", 58, 33.5, { size: 2.8, color: C.muted });
      K.arrow(48, 36, 54, 40, { p: K.seg(S, 5, 5.25), color: C.accent, lw: .35 });
      K.arrow(48, 46.5, 54, 44, { p: K.seg(S, 5.05, 5.3), color: C.accent, lw: .35 });
      K.typed(["Yes, within 30 days of", "purchase [1]. The money", "goes back to the original", "card [2]."],
        K.seg(S, 5.2, 5.9), 58, 41, 5.6, { size: 3.4, weight: 500 });
      K.alpha(gen * K.seg(S, 5.85, 5.95));
      K.text("[1] Annual plans · [2] Refund method", 58, 69, { size: 2.4, color: C.accent, weight: 500 });
    }
    K.alpha(1);
  },

  /* ---------- Agents ---------- */
  agents(K, S, time){
    const C = K.C, L = [58, 52], tools = [["Flight search", 30], ["Code runner", 52], ["Calendar", 74]];
    K.alpha(K.seg(S, 0, .3));
    K.rect(10, 4, 96, 11, 2.4, { fill: C.raised, stroke: C.accent, lw: .4 });
    K.text("Goal: find a flight under $400 and add it to my calendar", 58, 9.5, { size: 2.9, weight: 600, align: "center" });
    K.arrow(58, 15, 58, 40, { p: K.seg(S, .2, .7), color: C.strong });
    // tools
    const ta = K.seg(S, 1.6, 2);
    tools.forEach(([name, y]) => {
      K.alpha(ta * .7); K.line(L[0] + 10, L[1], 86, y, { dash: [1, 1], color: C.line });
      K.alpha(ta); K.node(101, y, 28, 10, name, { size: 3 });
    });
    // loop arc
    const la = K.seg(S, 3, 3.4);
    if (la > 0){
      K.alpha(la); K.ctx.beginPath(); K.ctx.arc(L[0], L[1], 15, Math.PI * .65, Math.PI * .65 + Math.PI * 1.7 * la);
      K.ctx.strokeStyle = C.accent; K.ctx.lineWidth = .4; K.ctx.setLineDash([1.2, 1]); K.ctx.stroke(); K.ctx.setLineDash([]);
      K.text("loop until done", L[0], L[1] + 19, { size: 2.6, align: "center", color: C.accent });
    }
    // model
    K.alpha(K.seg(S, .4, .8));
    K.dot(L[0], L[1], 10.5, { fill: C.fill });
    K.text("LLM", L[0], L[1], { size: 4, weight: 700, color: C.white, align: "center", display: true });
    // plan
    const plan = ["Search flights", "Pick the cheapest", "Add to calendar"];
    const pa = K.seg(S, 1, 1.25);
    if (pa > 0){
      K.alpha(pa); K.rect(2, 30, 38, 30, 2.4, { fill: C.surface, stroke: C.strong });
      K.text("Plan", 5, 35, { size: 2.8, color: C.muted });
      K.arrow(47.5, 50, 40.5, 46, { p: K.seg(S, 1, 1.3), color: C.strong });
      plan.forEach((s, i) => {
        K.alpha(K.seg(S, 1.15 + i * .2, 1.35 + i * .2));
        const done = K.seg(S, [2.9, 3.5, 3.97][i], [3, 3.6, 4.05][i]), ia = K.seg(S, 1.15 + i * .2, 1.35 + i * .2);   // ticked as each tool result comes back
        K.text(s, 9.5, 41 + i * 6.5, { size: 2.9, weight: 500 });
        K.alpha(ia * (1 - done)); K.text(String(i + 1), 5, 41 + i * 6.5, { size: 2.9, weight: 600, color: C.muted });
        if (done > 0){ K.alpha(done); K.check(6, 41 + i * 6.5, 2.4, C.ok); }
      });
    }
    // tool calls
    const call = (y, a, b, result) => {
      K.alpha(1);
      K.packet(L[0] + 10, L[1], 87, y, K.seg(S, a, a + (b - a) * .45), { r: 1.3 });
      K.packet(87, y, L[0] + 10, L[1], K.seg(S, a + (b - a) * .55, b), { r: 1.3, color: C.ok });
      const lit = K.seg(S, a + (b - a) * .4, a + (b - a) * .5);
      if (lit > 0){ K.alpha(lit); K.rect(87, y - 5, 28, 10, 2.4, { stroke: C.accent, lw: .5 }); K.text(result, 101, y + 8.5, { size: 2.6, align: "center", color: C.ok, weight: 500 }); }
    };
    call(30, 2.1, 2.9, "14 flights found");
    call(52, 3.05, 3.5, "cheapest: $342");
    call(74, 3.55, 3.97, "event created");
    // budget
    const ba = K.seg(S, 2.1, 2.4);
    if (ba > 0){
      const used = S < 2.95 ? 1 : S < 3.5 ? 2 : 3;
      K.alpha(ba); K.text(`tool calls ${used} / 10`, 2, 68, { size: 2.6, mono: true, color: C.muted });
      K.rect(2, 71, 38, 1.6, .8, { fill: C.line }); K.rect(2, 71, 3.8 * used, 1.6, .8, { fill: C.accent });
      // every tool result is appended to the context, so each loop costs more than the last
      const back = K.seg(S, 2.75, 2.9) + K.seg(S, 3.4, 3.5) + K.seg(S, 3.88, 3.97), tok = 1.2 + back * 1.6;
      K.text(`context ${tok.toFixed(1)}k tokens`, 2, 77, { size: 2.6, mono: true, color: C.muted });
      K.rect(2, 80, 38, 1.6, .8, { fill: C.line }); K.rect(2, 80, 38 * tok / 6, 1.6, .8, { fill: C.warn });
    }
    // answer
    const aa = K.seg(S, 4.4, 4.7);
    if (aa > 0){
      K.alpha(aa); K.rect(2, 87, 114, 11, 2.4, { fill: C.raised, stroke: C.ok, lw: .45 });
      K.check(7, 92.5, 3, C.ok);
      K.typed(["Found: Friday 9:40, $342. Added to your calendar."], K.seg(S, 4.5, 4.9), 11, 92.5, 0, { size: 2.9, weight: 600 });
    }
    K.alpha(1);
  },

  /* ---------- Transformers ---------- */
  transformer(K, S){
    const C = K.C, ctx = K.ctx, toks = ["The", "cat", "sat", "because", "it", "was", "tired"];
    const ids = [464, 3797, 3332, 780, 340, 373, 10032];
    const fs = 3.6, sp = K.ease(K.seg(S, .3, .95)), gap = K.lerp(.9, 2.2, sp), pad = K.lerp(.6, 2.4, sp);
    const ws = toks.map(t => K.width(t, { size: fs, weight: 600 }) + pad * 2);
    const extra = K.seg(S, 4.7, 4.9) > 0;
    const total = ws.reduce((a, b) => a + b, 0) + gap * (toks.length - 1) + (extra ? 6 + gap : 0);
    let x = 60 - total / 2; const xs = [];
    ws.forEach(w => { xs.push(x + w / 2); x += w + gap; });
    const Y = 44;
    // chips
    toks.forEach((t, i) => {
      const focus = (S >= 2 && S < 3 && i === 4) || (S >= 3 && S < 4 && headQuery(Math.min(2, Math.floor((S - 3) * 3))) === i);
      K.alpha(1);
      K.rect(xs[i] - ws[i] / 2, Y - 4, ws[i], 8, 1.8, { fill: focus ? C.fill : (sp > .1 ? C.surface : "transparent"), stroke: sp > .1 ? (focus ? C.fill : C.strong) : "transparent" });
      K.text(t, xs[i], Y, { size: fs, weight: 600, align: "center", color: focus ? C.white : C.ink });
      K.alpha(K.seg(S, .6, 1) * (1 - K.seg(S, 1, 1.3)));
      K.text(String(ids[i]), xs[i], Y + 7.5, { size: 2.3, mono: true, align: "center", color: C.muted });
    });
    if (extra){
      const ex = x, a = K.seg(S, 4.7, 4.9);
      K.alpha(a); K.rect(ex, Y - 4, 6, 8, 1.8, { fill: C.raised, stroke: C.accent, lw: .45 });
      K.text(".", ex + 3, Y - .5, { size: fs, weight: 700, align: "center", color: C.accent });
    }
    // embeddings
    const ea = K.seg(S, 1, 1.5) * (1 - K.seg(S, 1.85, 2.05));
    if (ea > 0){
      toks.forEach((t, i) => {
        EX_DATA.vecs[i].forEach((v, k) => {
          const g = K.ease(K.seg(S, 1 + i * .05, 1.45 + i * .05));
          K.alpha(ea); const bw = Math.min(ws[i] / 8 - .25, 1.1), bx = xs[i] - 4 * (bw + .25) + k * (bw + .25);
          const h = v * 6 * g; K.rect(bx, h > 0 ? Y + 12 - h : Y + 12, bw, Math.abs(h) || .01, .2, { fill: v > 0 ? C.accent : C.strong });
        });
      });
      K.alpha(ea * (1 - K.seg(S, 1.9, 2.2)));
      K.text("each token becomes a vector of learned numbers (8 of thousands shown)", 60, 26, { size: 2.6, align: "center", color: C.muted });
    }
    // attention arcs
    function headQuery(h){ return h === 2 ? 6 : 4; }
    const heads = [
      { q: 4, w: [.05, .7, .07, .05, .13, 0, 0], label: "head 1: who “it” refers to" },
      { prev: true, label: "head 2: the word just before" },
      { q: 6, w: [.02, .1, .04, .03, .5, .27, .04], label: "head 3: “tired” looks back at what it describes" },
    ];
    const arc = (i, j, wgt, a) => {
      if (i === j) return;
      const x1 = xs[i], x2 = xs[j], h = 5 + Math.abs(x1 - x2) * .42;
      ctx.beginPath(); ctx.moveTo(x1, Y - 4.5); ctx.quadraticCurveTo((x1 + x2) / 2, Y - 4.5 - h, x2, Y - 4.5);
      K.alpha(a * (.25 + wgt * 1.2)); ctx.strokeStyle = C.accent; ctx.lineWidth = .3 + wgt * 3.2; ctx.stroke();
    };
    if (S >= 2 && S < 4){
      let head = S < 3 ? 0 : Math.min(2, Math.floor((S - 3) * 3));
      const a = S < 3 ? K.seg(S, 2.05, 2.4) : K.seg((S - 3) * 3 - head, .05, .3);
      const H = heads[head];
      if (H.prev) toks.forEach((t, i) => { if (i > 0) arc(i, i - 1, .45, a); });
      else H.w.forEach((wgt, j) => { if (j < H.q) arc(H.q, j, wgt, a); });
      if (!H.prev){
        const top = H.w.map((w, j) => [w, j]).filter(p => p[1] !== H.q).sort((p, q) => q[0] - p[0]).slice(0, 2);
        top.forEach(([w, j]) => { K.alpha(a); K.text(Math.round(w * 100) + "%", xs[j], Y + 7, { size: 2.8, align: "center", color: C.accent, weight: 600 }); });
      }
      K.alpha(S < 3 ? K.seg(S, 2.1, 2.4) : a);
      K.text(S < 3 ? "attention from “it” (earlier tokens only)" : H.label, 60, 14, { size: 3, align: "center", color: C.muted, weight: 500 });
      // one layer: the heads run side by side, then a feed-forward network; dozens of layers are stacked
      if (S >= 3){
        const la = K.seg(S, 3.05, 3.2);
        ["head 1", "head 2", "head 3"].forEach((n, i) => {
          const on = i === head, x = 22 + i * 17;
          K.alpha(la); K.rect(x, 60, 14, 7, 1.6, { fill: on ? C.fill : C.surface, stroke: on ? C.fill : C.strong, lw: .35 });
          K.text(n, x + 7, 63.5, { size: 2.5, align: "center", weight: 600, color: on ? C.white : C.muted });
        });
        K.alpha(la); K.arrow(74, 63.5, 79, 63.5, { color: C.strong, hs: 1 });
        K.rect(80, 60, 22, 7, 1.6, { fill: C.surface, stroke: C.strong, lw: .35 });
        K.text("feed-forward", 91, 63.5, { size: 2.5, align: "center", weight: 600, color: C.muted });
        K.rect(18, 56, 88, 15, 2.4, { stroke: C.line, lw: .3 });
        K.text("one layer, run in parallel", 20, 75, { size: 2.4, color: C.muted });
        K.text("× 32 layers in an 8B model", 104, 75, { size: 2.4, align: "right", color: C.accent, weight: 600 });
      }
    }
    // next-token prediction
    const pa = K.seg(S, 4, 4.25);
    if (pa > 0){
      const cands = [[".", .46], [" and", .21], [" so", .12], [",", .09], [" after", .05]];
      K.alpha(pa); K.text("next token after “tired”", 60, 58, { size: 2.8, align: "center", color: C.muted });
      cands.forEach(([t, p], i) => {
        const y = 64 + i * 6, g = K.ease(K.seg(S, 4.1 + i * .05, 4.6 + i * .05));
        K.alpha(pa);
        K.text(t === "." ? "“.”" : t === "," ? "“,”" : `“${t.trim()}”`, 34, y, { size: 2.9, mono: true, align: "right", color: i === 0 ? C.accent : C.ink });
        K.rect(37, y - 1.6, 60 * p * g, 3.2, .8, { fill: i === 0 ? C.accent : C.strong });
        K.text(Math.round(p * 100 * g) + "%", 38 + 60 * p * g + 1, y, { size: 2.5, mono: true, color: C.muted });
      });
    }
    K.alpha(1);
  },

  /* ---------- Neural networks ---------- */
  neural(K, S){
    const C = K.C, D = EX_DATA, X = [16, 44, 72, 100];
    const ys = n => Array.from({ length: n }, (_, i) => 48 + (i - (n - 1) / 2) * 12);
    const fade = 1 - .94 * K.seg(S, 4, 4.3);
    const fw = S >= 1 && S < 2 ? (S - 1) * 3 : (S >= 2 ? 3 : -1);
    const bw = S >= 3 && S < 4 ? 3 - (S - 3) * 3 : (S >= 4 ? 0 : 4);
    // edges
    if (fade > .1) for (let l = 0; l < 3; l++){
      const a = ys(D.layers[l]), b = ys(D.layers[l + 1]);
      a.forEach((y1, i) => b.forEach((y2, j) => {
        const W = D.weights[l][i][j], w = W.w, grad = S >= 3 ? K.seg(S, 3 + (2 - l) * .25, 3.35 + (2 - l) * .25) : 0;
        K.alpha(K.seg(S, .2 + l * .15, .6 + l * .15) * fade * (.25 + Math.abs(w) * .55) * (1 - .6 * grad));
        K.line(X[l] + 3, y1, X[l + 1] - 3, y2, { color: w >= 0 ? C.accent : C.strong, lw: .15 + Math.abs(w) * .55 });
        if (grad > 0 && S < 4){ K.alpha(fade * grad * Math.abs(W.g) * .9); K.line(X[l] + 3, y1, X[l + 1] - 3, y2, { color: C.warn, lw: .2 + Math.abs(W.g) * .6 }); }
        if (fw > l && fw < l + 1){ K.alpha(fade); K.packet(X[l] + 3, y1, X[l + 1] - 3, y2, fw - l, { r: .7 }); }
        if (bw < l + 1 && bw > l){ K.alpha(fade); K.packet(X[l + 1] - 3, y2, X[l] + 3, y1, (l + 1) - bw, { r: .7, color: C.warn }); }
      }));
    }
    // nodes
    if (fade > .1) D.layers.forEach((n, l) => ys(n).forEach((y, i) => {
      const lit = fw >= l ? D.acts[l][i] : 0;
      K.alpha(K.seg(S, l * .12, .3 + l * .12) * fade);
      K.dot(X[l], y, 3, { fill: C.surface, stroke: C.strong, lw: .35 });
      if (lit > 0){ K.alpha(fade * lit); K.dot(X[l], y, 3, { fill: C.accent }); }
      if (bw <= l && S >= 3 && S < 4){ K.alpha(fade * .9); K.dot(X[l], y, 3.6, { fill: false, stroke: C.warn, lw: .4 }); }
    }));
    K.alpha(K.seg(S, .3, .6) * (1 - K.seg(S, 4, 4.15)));
    ["input", "hidden", "hidden", "output"].forEach((s, l) => K.text(s, X[l], 82, { size: 2.6, align: "center", color: C.muted }));
    // output vs target
    const oa = K.seg(S, 2, 2.3) * (1 - K.seg(S, 4, 4.2));
    if (oa > 0){
      const oy = ys(2);
      K.alpha(oa);
      [["cat", "0.71", "1"], ["dog", "0.29", "0"]].forEach(([n, v, t], i) => {
        K.text(`${n} ${v}`, 105, oy[i], { size: 2.9, weight: 600 });
        K.alpha(oa * K.seg(S, 2.3, 2.6)); K.text(`target ${t}`, 105, oy[i] + 3.6, { size: 2.4, color: C.muted });
        K.alpha(oa);
      });
      K.alpha(oa * K.seg(S, 2.5, 2.8));
      K.rect(80, 88, 30, 8, 2, { fill: C.raised, stroke: C.warn, lw: .4 });
      K.text("loss 0.34", 95, 92, { size: 3, mono: true, align: "center", color: C.warn, weight: 600 });
    }
    if (S >= 3 && S < 4){ K.alpha(K.seg(S, 3.05, 3.3)); K.text("each weight gets a gradient: how the loss changes if it moves", 60, 12, { size: 2.8, align: "center", color: C.warn }); }
    // gradient descent plot
    const pa = K.seg(S, 4.1, 4.4);
    if (pa > 0){
      const f = x => .012 * (x - 72) * (x - 72), Y = x => 80 - (25.9 - f(x)) * 2;
      K.alpha(pa);
      K.line(20, 82, 106, 82, { color: C.strong }); K.line(20, 82, 20, 18, { color: C.strong });
      K.text("loss", 22, 20, { size: 2.6, color: C.muted }); K.text("weight value", 104, 86, { size: 2.6, color: C.muted, align: "right" });
      K.ctx.beginPath(); for (let x = 25; x <= 104; x += 1){ const y = 82 - f(x) * 2.3; x === 25 ? K.ctx.moveTo(x, y) : K.ctx.lineTo(x, y); }
      K.ctx.strokeStyle = C.strong; K.ctx.lineWidth = .45; K.ctx.stroke();
      const xs = [27, 45, 57, 64, 68, 70], losses = xs.map(x => f(x) / 10);
      const k = K.seg(S, 4.4, 4.95) * (xs.length - 1), i = Math.floor(k), fr = K.ease(k - i);
      for (let j = 0; j < Math.min(i, xs.length - 1); j++){
        K.alpha(pa * .8); K.arrow(xs[j], 82 - f(xs[j]) * 2.3, xs[j + 1], 82 - f(xs[j + 1]) * 2.3, { color: C.accent, lw: .3, hs: 1.2 });
      }
      const cx = i >= xs.length - 1 ? xs[xs.length - 1] : K.lerp(xs[i], xs[i + 1], fr);
      K.alpha(pa); K.dot(cx, 82 - f(cx) * 2.3 - 1.6, 1.6, { fill: C.accent });
      const li = Math.min(xs.length - 1, Math.round(k));
      K.text(`step ${li + 1} · loss ${losses[li].toFixed(3)}`, 60, 12, { size: 3, mono: true, align: "center", color: C.accent, weight: 600 });
    }
    K.alpha(1);
  },

  /* ---------- Embeddings & vector search ---------- */
  vectors(K, S){
    const C = K.C, O = [60, 56];
    const P = { dog: [24.7, 37.2], cat: [35.4, 24.5], kitten: [38.4, 35.2], horse: [26.3, 51.3], pizza: [76.9, 24.2], pasta: [91.7, 25.4], bread: [79.9, 39.3], cheese: [98.9, 40.3], car: [74.2, 91.2], truck: [62.4, 83.9], bus: [53.7, 91.5], bike: [77.2, 80.6] };
    const names = Object.keys(P), Q = [36.8, 40.3];
    const vec = p => [p[0] - O[0], p[1] - O[1]];
    const cos = (a, b) => { const u = vec(a), v = vec(b); return (u[0]*v[0] + u[1]*v[1]) / (Math.hypot(...u) * Math.hypot(...v)); };
    const ranked = names.map(n => [n, cos(Q, P[n])]).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const top3 = ranked.map(r => r[0]);
    const groups = [["animals", [32, 37], 17], ["food", [86, 30], 14], ["vehicles", [66, 86], 13]];
    const ga = K.seg(S, .7, 1);
    groups.forEach(([n, c, r]) => {
      K.alpha(ga * .5 * (1 - .6 * K.seg(S, 3, 3.3))); K.dot(c[0], c[1], r, { fill: false, stroke: C.line, lw: .3 });
      K.alpha(ga); K.text(n, c[0], c[1] - r - 2, { size: 2.6, align: "center", color: C.muted, halo: true });
    });
    // HNSW graph
    const gr = K.seg(S, 3, 3.3);
    if (gr > 0){
      const near = n => names.filter(m => m !== n).sort((a, b) => Math.hypot(P[a][0] - P[n][0], P[a][1] - P[n][1]) - Math.hypot(P[b][0] - P[n][0], P[b][1] - P[n][1])).slice(0, 2);
      K.alpha(gr * .55);
      names.forEach(n => near(n).forEach(m => K.line(P[n][0], P[n][1], P[m][0], P[m][1], { color: C.strong, lw: .25 })));
      // upper layer: a few nodes joined by long links; the search starts there, then drops to the full graph
      const upper = [["truck", "bread"], ["bread", "cat"], ["truck", "horse"]];
      K.alpha(gr * .8);
      upper.forEach(([a, b]) => K.line(P[a][0], P[a][1], P[b][0], P[b][1], { color: C.warn, lw: .35, dash: [1.2, .9] }));
      const path = [["truck", "bread", true], ["bread", "kitten", false], ["kitten", "dog", false]];
      const hp = K.seg(S, 3.3, 3.85) * path.length;
      path.forEach(([a, b, up], i) => {
        const p = K.clamp(hp - i); if (p <= 0) return;
        K.alpha(1); K.arrow(P[a][0], P[a][1], P[b][0], P[b][1], { p, color: up ? C.warn : C.accent, lw: .55, hs: 1.6, dash: up ? [1.2, .9] : undefined });
      });
      K.alpha(K.seg(S, 3.3, 3.45)); K.text("start", P.truck[0] - 2, P.truck[1] - 3.5, { size: 2.5, align: "center", color: C.warn, halo: true });
      const la = gr * K.seg(S, 3.15, 3.3);
      K.alpha(la); K.line(4, 4.5, 9, 4.5, { color: C.warn, lw: .45, dash: [1.2, .9] }); K.text("upper layer: few nodes, long links", 10.5, 4.5, { size: 2.3, color: C.muted });
      K.line(4, 8.5, 9, 8.5, { color: C.strong, lw: .45 }); K.text("bottom layer: every vector, local links", 10.5, 8.5, { size: 2.3, color: C.muted });
      K.alpha(K.seg(S, 3.85, 4)); K.text("a few hops instead of checking every vector", 4, 97, { size: 2.6, color: C.accent, weight: 600, halo: 1.4 });
    }
    // points
    names.forEach((n, i) => {
      const t = K.ease(K.seg(S, .05 + i * .03, .5 + i * .03)), x = K.lerp(O[0], P[n][0], t), y = K.lerp(O[1], P[n][1], t);
      const hit = (S >= 2 && S < 3 && top3.includes(n) && K.seg(S, 2.45, 2.6) > 0);
      const dim = S >= 2 && S < 3 && !top3.includes(n) ? 1 - .6 * K.seg(S, 2.45, 2.6) : 1;
      K.alpha(K.seg(S, i * .03, .2 + i * .03) * dim);
      K.dot(x, y, 1.3, { fill: hit ? C.accent : C.ink });
      K.text(n, x + 2, y - .2, { size: 2.8, weight: hit ? 600 : 500, color: hit ? C.accent : C.ink, halo: true });
    });
    // cosine similarity
    if (S >= 1 && S < 2){
      const a = K.seg(S, 1, 1.15), first = S < 1.55;
      const pair = first ? ["dog", "cat"] : ["dog", "pizza"], sim = (Math.abs(cos(P[pair[0]], P[pair[1]])) < .005 ? 0 : cos(P[pair[0]], P[pair[1]])).toFixed(2);
      K.alpha(1);
      K.dot(O[0], O[1], .9, { fill: C.muted });
      pair.forEach(n => K.arrow(O[0], O[1], P[n][0], P[n][1], { p: K.seg(S, first ? 1.05 : 1.6, first ? 1.3 : 1.85), color: C.accent, lw: .4 }));
      const a1 = Math.atan2(P[pair[0]][1] - O[1], P[pair[0]][0] - O[0]), a2 = Math.atan2(P[pair[1]][1] - O[1], P[pair[1]][0] - O[0]);
      K.alpha(K.seg(S, first ? 1.3 : 1.85, first ? 1.4 : 1.95));
      let lo = Math.min(a1, a2), hi = Math.max(a1, a2); if (hi - lo > Math.PI){ const t = lo; lo = hi; hi = t + Math.PI * 2; }
      K.ctx.beginPath(); K.ctx.arc(O[0], O[1], 7, lo, hi); K.ctx.strokeStyle = C.accent; K.ctx.lineWidth = .4; K.ctx.stroke();
      K.text(`${pair[0]} vs ${pair[1]}: cosine ${sim}`, 116, 5, { size: 2.9, align: "right", color: C.accent, weight: 600, halo: 1.4 });
      K.alpha(a); K.text("origin", O[0] + 2, O[1] + 3, { size: 2.4, color: C.muted, halo: true });
    }
    if (S >= 2 && S < 3){ K.alpha(1); K.dot(O[0], O[1], .9, { fill: C.muted }); K.arrow(O[0], O[1], Q[0], Q[1], { p: K.seg(S, 2.05, 2.3), color: C.accent, lw: .3, dash: [1, .8] }); }
    // query
    if (S >= 2 && S < 3){
      const qa = K.seg(S, 2, 2.2);
      K.alpha(qa * (1 - K.seg(S, 2.45, 2.6)) * .6);
      names.forEach(n => K.line(Q[0], Q[1], P[n][0], P[n][1], { color: C.strong, lw: .2, dash: [.8, .8] }));
      K.alpha(qa); K.dot(Q[0], Q[1], 1.9, { fill: C.fill, stroke: C.accent, lw: .4 });
      K.text("puppy", Q[0] + 2.6, Q[1] + 3.6, { size: 3, weight: 700, color: C.accent, halo: true });
      const ra = K.seg(S, 2.55, 2.8);
      if (ra > 0){
        K.alpha(ra); K.rect(3, 68, 46, 25, 2.4, { fill: C.surface, stroke: C.strong });
        K.text("closest to “puppy” (2-D sketch)", 5, 73, { size: 2.4, color: C.muted });
        ranked.forEach(([n, v], i) => {
          K.text(`${i + 1}  ${n}`, 6, 79 + i * 5, { size: 2.9, weight: 600 });
          K.text(v.toFixed(2), 46, 79 + i * 5, { size: 2.6, mono: true, align: "right", color: C.accent });
        });
      }
    }
    if (S >= 3){ K.alpha(1); K.dot(Q[0], Q[1], 1.6, { fill: C.fill, stroke: C.accent, lw: .4 }); }
    K.alpha(1);
  },

  /* ---------- Web request: load balancer, cache, database ---------- */
  web(K, S, time){
    const C = K.C, four = K.ease(K.seg(S, 4, 4.4));
    const sy = i => four > 0 ? K.lerp([26, 50, 74, 98][i], [20, 40, 60, 80][i], four) : [26, 50, 74, 98][i];
    const CL = [10, 50], LB = [34, 50], SX = 66, BUS = 82, CA = [104, 30], DB = [104, 72];
    const clR = CL[0] + 7.5, lbL = LB[0] - 10.5, lbR = LB[0] + 10.5, sL = SX - 9.5, sR = SX + 9.5, dL = CA[0] - 14;
    const n = four > 0 ? 4 : 3, top = Math.min(sy(0), CA[1]), bot = Math.max(DB[1], sy(2));
    // a packet that follows a path of points
    const along = (pts, t, o = {}) => {
      if (t <= 0 || t >= 1) return;
      const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
      let d = K.io(t) * seg.reduce((a, b) => a + b, 0), i = 0;
      while (i < seg.length - 1 && d > seg[i]){ d -= seg[i]; i++; }
      const f = seg[i] ? d / seg[i] : 0;
      K.dot(K.lerp(pts[i][0], pts[i + 1][0], f), K.lerp(pts[i][1], pts[i + 1][1], f), o.r || 1.3, { fill: o.color || C.accent });
    };
    const toData = (i, y) => [[sR, sy(i)], [BUS, sy(i)], [BUS, y], [dL, y]];
    const back = p => p.slice().reverse();
    // wires, each fading in with the nodes it connects
    const aIn = K.seg(S, 0, .25), aSrv = K.seg(S, .1, .35), aData = K.seg(S, .2, .45);
    K.alpha(aIn); K.line(clR, 50, lbL, 50, { color: C.line });
    for (let i = 0; i < n; i++){
      const a = i === 3 ? four : 1;
      K.alpha(aSrv * a); K.line(lbR, 50, sL, sy(i), { color: C.line });
      K.alpha(aData * a); K.line(sR, sy(i), BUS, sy(i), { color: C.line });
    }
    K.alpha(aData);
    K.line(BUS, top, BUS, bot, { color: C.line });
    if (four > 0){ K.alpha(aData * four); K.line(BUS, bot, BUS, sy(3), { color: C.line }); K.alpha(aData); }
    K.line(BUS, CA[1], dL, CA[1], { color: C.line });
    K.line(BUS, DB[1], dL, DB[1], { color: C.line });
    // nodes
    K.alpha(aIn);
    K.node(CL[0], CL[1], 15, 11, "Client", { sub: "browser" });
    K.node(LB[0], LB[1], 21, 11, "Load", { sub: "balancer", size: 3.2 });
    for (let i = 0; i < n; i++){ K.alpha((i === 3 ? four : 1) * aSrv); K.node(SX, sy(i), 19, 9, `Server ${i + 1}`, { size: 2.9 }); }
    K.alpha(aData);
    const hit = K.seg(S, 2.35, 2.45) * (1 - K.seg(S, 2.95, 3));
    K.node(CA[0], CA[1], 28, 11, "Cache", { sub: "in memory", stroke: hit > 0 ? C.ok : C.strong, lw: hit > 0 ? .55 : .35 });
    const dbLit = K.seg(S, 3.4, 3.5) * (1 - K.seg(S, 3.75, 3.8));
    K.node(DB[0], DB[1], 28, 11, "Database", { sub: "source of truth", stroke: dbLit > 0 ? C.warn : C.strong, lw: dbLit > 0 ? .55 : .35, size: 3 });
    K.alpha(1);
    // 1. request arrives
    K.packet(clR, 50, lbL, 50, K.seg(S, .3, .9));
    K.alpha(K.seg(S, .3, .5) * (1 - K.seg(S, 1.2, 1.4))); K.text("GET /products/42", 2.5, 40, { size: 2.7, mono: true, color: C.accent });
    // 2. round robin
    [0, 1, 2].forEach(i => { K.alpha(1); K.packet(lbR, 50, sL, sy(i), K.seg(S, 1.05 + i * .28, 1.4 + i * .28)); });
    K.alpha(K.seg(S, 1.1, 1.3) * (1 - K.seg(S, 1.9, 2)));
    K.text("spread across servers:", 2.5, 63, { size: 2.6, color: C.accent });
    K.text("round robin or least connections", 2.5, 67.5, { size: 2.4, color: C.accent });
    // 3. cache hit
    K.alpha(1);
    along(toData(0, CA[1]), K.seg(S, 2.05, 2.4));
    along(back(toData(0, CA[1])), K.seg(S, 2.5, 2.85), { color: C.ok });
    K.alpha(K.seg(S, 2.4, 2.5) * (1 - K.seg(S, 2.95, 3))); K.text("hit · 2 ms", CA[0], CA[1] - 9, { size: 2.9, align: "center", color: C.ok, weight: 600 });
    // 4. miss -> database -> write back
    K.alpha(1);
    along(toData(1, CA[1]), K.seg(S, 3.02, 3.2));
    K.alpha(K.seg(S, 3.18, 3.25) * (1 - K.seg(S, 3.95, 4))); K.text("miss", CA[0], CA[1] - 9, { size: 2.9, align: "center", color: C.warn, weight: 600 });
    K.alpha(1);
    along(toData(1, DB[1]), K.seg(S, 3.22, 3.45), { color: C.warn });
    along(back(toData(1, DB[1])), K.seg(S, 3.5, 3.72), { color: C.warn });
    K.alpha(K.seg(S, 3.45, 3.55) * (1 - K.seg(S, 3.95, 4))); K.text("38 ms", DB[0], DB[1] + 9, { size: 2.9, align: "center", color: C.warn, weight: 600 });
    K.alpha(1);
    along(toData(1, CA[1]), K.seg(S, 3.75, 3.95), { color: C.ok });
    K.alpha(K.seg(S, 3.8, 3.9) * (1 - K.seg(S, 3.97, 4))); K.text("saved for next time", 118, CA[1] + 9.5, { size: 2.6, align: "right", color: C.ok });
    // 5. scale out with live traffic
    if (four > 0){
      for (let k = 0; k < 8; k++){
        const tt = ((time * .45 + k / 8) % 1), srv = k % 4;
        K.alpha(four); K.packet(lbR, 50, sL, sy(srv), tt, { r: 1 });
        K.packet(clR, 50, lbL, 50, (tt * 2) % 1, { r: .8 });
      }
      // latency is a distribution: most requests hit the cache, a slow tail goes to the database
      const bins = [30, 22, 11, 5, 3, 2, 1.5, 1.2, 1, 1.4], bx0 = 4, bw = 3.6, base = 92;
      K.alpha(four); K.text("request latency", bx0, 70, { size: 2.4, color: C.muted });
      bins.forEach((v, i) => { K.alpha(four * K.seg(S, 4.2 + i * .03, 4.35 + i * .03)); K.rect(bx0 + i * bw, base - v * .55, bw - .5, v * .55, .3, { fill: i < 2 ? C.ok : i > 7 ? C.warn : C.strong }); });
      K.alpha(four * K.seg(S, 4.5, 4.65));
      K.line(bx0 + 1.5 * bw, base - 18, bx0 + 1.5 * bw, base, { color: C.ok, lw: .3, dash: [.7, .7] });
      K.text("p50 4 ms", bx0 + 1.5 * bw + 1, base - 16.5, { size: 2.2, mono: true, color: C.ok });
      K.line(bx0 + 9.6 * bw, base - 8, bx0 + 9.6 * bw, base, { color: C.warn, lw: .3, dash: [.7, .7] });
      K.text("p99 41 ms", bx0 + 9.6 * bw, base - 9.5, { size: 2.2, mono: true, align: "right", color: C.warn });
    }
    K.alpha(1);
  },

  /* ---------- LoRA ---------- */
  lora(K, S, time){
    const C = K.C, r = exRng(31), N = 12, cell = 3.6, wx = 6, wy = 24;
    const base = Array.from({ length: N * N }, () => r());
    const b = Array.from({ length: N }, () => r() * 2 - 1), a = Array.from({ length: N }, () => r() * 2 - 1);
    const frozen = K.seg(S, 2, 2.3), merge = K.io(K.seg(S, 4.5, 4.95));
    // W
    K.alpha(K.seg(S, 0, .3));
    K.text("W", wx, wy - 7, { size: 3.6, weight: 700, display: true });
    K.text("4096 × 4096, pretrained", wx + 5, wy - 7, { size: 2.6, color: C.muted });
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++){
      const k = i * N + j, appear = K.seg(S, (i + j) * .015, .2 + (i + j) * .015);
      let col = C.accent, al = .15 + base[k] * .55;
      if (S >= 1 && S < 2){ const fl = .5 + .5 * Math.sin(time * 6 + k * 1.7); col = C.warn; al = K.lerp(al, .25 + fl * .6, K.seg(S, 1, 1.15)); }
      if (frozen > 0){ col = frozen > .5 ? C.strong : col; al = K.lerp(al, .2 + base[k] * .5, frozen); }
      if (merge > 0){ const d = b[i] * a[j]; if (d > 0){ K.alpha(appear * merge * d * .9); K.rect(wx + j * cell, wy + i * cell, cell - .5, cell - .5, .5, { fill: C.accent }); } }
      K.alpha(appear * al); K.rect(wx + j * cell, wy + i * cell, cell - .5, cell - .5, .5, { fill: col });
    }
    // full fine-tuning
    const ft = K.seg(S, 1, 1.2) * (1 - K.seg(S, 1.85, 2)); const fz = 1 - K.seg(S, 4, 4.2);
    if (ft > 0){
      K.alpha(ft);
      K.text("every one of 16,777,216 weights changes", wx, wy + N * cell + 5, { size: 2.8, color: C.warn, weight: 600 });
      K.text("plus optimizer state for each: lots of GPU memory", wx, wy + N * cell + 10, { size: 2.6, color: C.muted });
    }
    // frozen lock
    if (frozen > 0){
      const lx = wx + N * cell / 2, ly = wy + N * cell / 2;
      K.alpha(frozen * (1 - merge));
      K.rect(lx - 4, ly - 1, 8, 6.5, 1, { fill: C.raised, stroke: C.muted, lw: .4 });
      K.ctx.beginPath(); K.ctx.arc(lx, ly - 1, 2.6, Math.PI, 0); K.ctx.strokeStyle = C.muted; K.ctx.lineWidth = .6; K.ctx.stroke();
      K.alpha(frozen * fz); K.text("frozen", lx, wy + N * cell + 5, { size: 2.8, color: C.muted, align: "center" });
    }
    // B and A
    const grow = K.ease(K.seg(S, 2.2, 2.8));
    if (grow > 0){
      const bx = 60, ax = 72, ay = wy;
      K.alpha(K.seg(S, 2.1, 2.3));
      K.text("+", 54, wy + N * cell / 2, { size: 5, weight: 700, align: "center", color: C.muted });
      K.text("B", bx, wy - 7, { size: 3.6, weight: 700, display: true, color: C.accent });
      K.text("A", ax, ay - 7, { size: 3.6, weight: 700, display: true, color: C.accent });
      K.text("×", 67.5, wy + 2, { size: 3.6, align: "center", color: C.muted });
      // several thin columns / rows: rank r > 1 (drawn 3 wide, really 8 of 4096, so not to scale)
      const rr = exRng(77), bv = Array.from({ length: N * 3 }, () => rr()), av = Array.from({ length: N * 3 }, () => rr());
      const learned = K.seg(S, 3.1, 3.7);   // B starts at zero and fills in as it trains
      for (let i = 0; i < N; i++) if (i / N < grow) for (let c = 0; c < 3; c++){
        K.alpha(.5); K.rect(bx + c * 1.15, wy + i * cell, .95, cell - .5, .3, { fill: false, stroke: C.accent, lw: .15 });
        if (learned > 0){ K.alpha(learned * (.3 + bv[i * 3 + c] * .7)); K.rect(bx + c * 1.15, wy + i * cell, .95, cell - .5, .3, { fill: C.accent }); }
      }
      for (let j = 0; j < N; j++) if (j / N < grow) for (let c = 0; c < 3; c++){
        K.alpha(.3 + av[j * 3 + c] * .7); K.rect(ax + j * cell, ay + c * 1.15, cell - .5, .95, .3, { fill: C.accent });
      }
      K.alpha(K.seg(S, 2.6, 2.9) * (1 - learned)); K.text("B = 0 at start", bx + 1.7, wy - 2.6, { size: 2.2, color: C.muted, align: "center" });
      K.alpha(K.seg(S, 2.6, 2.9));
      K.text("4096 × 8", bx + 1.5, wy + N * cell + 3.5, { size: 2.4, color: C.muted, align: "center" });
      K.text("8 × 4096", ax + N * cell / 2, ay + 6.5, { size: 2.4, color: C.muted, align: "center" });
      K.text("rank 8", 72, wy + 14, { size: 2.7, weight: 700, color: C.accent });
      K.text("3 of 8 drawn, not to scale", bx + 1.7, wy + N * cell + 7.5, { size: 2.1, color: C.muted, align: "center" });
      K.text("65,536 trainable, 0.4% of W", 72, wy + 18.5, { size: 2.7, weight: 600, color: C.accent });
    }
    // training pulses
    if (S >= 3 && S < 4.6){
      const tr = K.seg(S, 3, 3.2) * (1 - K.seg(S, 4.4, 4.6));
      for (let k = 0; k < 6; k++){
        const ph = (time * .5 + k / 6) % 1;
        K.alpha(tr); K.dot(61.5, wy + ph * N * cell, .9, { fill: C.ok });
        K.dot(72 + ph * N * cell, wy + 1.5, .9, { fill: C.ok });
      }
      K.alpha(tr);
      K.text("gradients update only A and B", 72, wy + 25, { size: 2.7, color: C.ok });
      const ls = K.lerp(2.31, 1.18, K.seg(S, 3.1, 3.95));
      K.text(`loss 2.31 → ${ls.toFixed(2)}`, 72, wy + 30.5, { size: 2.7, mono: true, color: C.muted });
    }
    // merge and adapters
    if (merge > 0 || S >= 4){
      const ma = K.seg(S, 4, 4.3);
      K.alpha(ma);
      K.text("W + B·A", wx, wy + N * cell + 9, { size: 3.2, weight: 700, color: C.accent, display: true });
      K.text("merged into W: no extra cost when serving", wx, wy + N * cell + 14, { size: 2.6, color: C.muted });
      K.text("or swap adapters per task:", 72, wy + 36, { size: 2.6, color: C.muted });
      ["support", "legal", "code"].forEach((n, i) => {
        const on = Math.floor(K.seg(S, 4.3, 4.99) * 3 - .001) === i;
        K.rect(72 + i * 15, wy + 40, 13.5, 7, 1.8, { fill: on ? C.fill : C.surface, stroke: on ? C.fill : C.strong });
        K.text(n, 72 + i * 15 + 6.75, wy + 43.5, { size: 2.6, align: "center", weight: 600, color: on ? C.white : C.ink });
      });
    }
    K.alpha(1);
  },

  /* ---------- Diffusion ---------- */
  diffusion(K, S, time){
    const C = K.C, GW = 16, GH = 12, ctx = K.ctx;
    const r = exRng(41), noise = Array.from({ length: GW * GH }, () => 40 + r() * 190);
    const img = (x, y) => {
      if (Math.hypot(x - 11.5, y - 3.2) < 2.1) return [253, 186, 116];
      const hill = 7.4 + Math.sin(x / 2.6) * 1.3 + Math.cos(x / 1.7) * .4;
      if (y > hill) return y > hill + 2 ? [38, 104, 78] : [62, 159, 120];
      return [26 + y * 3, 38 + y * 4, 72 + y * 5];
    };
    // the generated picture is a new one, not the training image: the model learns to denoise, not to copy
    const gen = (x, y) => {
      if ((x === 3 || x === 4) && (y === 2 || y === 3)) return [236, 232, 214];
      if (x >= 11 && x <= 12 && y >= 3 && y < 9) return (y % 2 < 1) ? [214, 76, 62] : [236, 236, 230];
      if (x >= 10.5 && x <= 12.5 && y >= 2 && y < 3) return [253, 214, 120];
      if (y >= 9 && x >= 10 && x <= 13 && !(y === 9 && (x === 10 || x === 13))) return [52, 58, 66];
      if (y >= 8) return (x + y) % 3 === 0 ? [40, 120, 140] : [24, 82, 104];
      return [14 + y * 2, 20 + y * 3, 46 + y * 5];
    };
    const grid = (x0, y0, w, lvl, al = 1, pic = img) => {
      const c = w / GW;
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++){
        const p = pic(x, y), n = noise[y * GW + x], m = v => Math.round(v * (1 - lvl) + n * lvl);
        K.alpha(al); ctx.fillStyle = `rgb(${m(p[0])},${m(p[1])},${m(p[2])})`; ctx.fillRect(x0 + x * c, y0 + y * c, c + .05, c + .05);
      }
      K.alpha(al); K.rect(x0, y0, w, GH * c, .6, { stroke: C.strong, lw: .3 });
    };
    // 1. forward process
    const f = K.seg(S, 0, .2) * (1 - K.seg(S, .85, 1.1));
    if (f > 0){
      [0, .25, .5, .75, 1].forEach((l, i) => {
        const x = 4 + i * 23.5, a = f * K.seg(S, .05 + i * .14, .2 + i * .14);
        grid(x, 34, 20, l, a);
        K.alpha(a); K.text(`step ${i * 250}`, x + 10, 52, { size: 2.5, align: "center", mono: true, color: C.muted });
        if (i) K.arrow(x - 3.2, 41.5, x - .6, 41.5, { color: C.strong, hs: 1.1 });
      });
      K.alpha(f); K.text("add a little noise at every step", 60, 24, { size: 3, align: "center", color: C.muted });
    }
    // 2. learn to predict the noise
    const l = K.seg(S, 1, 1.2) * (1 - K.seg(S, 1.85, 2.05));
    if (l > 0){
      grid(4, 30, 24, .5, l);
      K.alpha(l); K.text("noisy image", 16, 51.5, { size: 2.5, align: "center", color: C.muted }); K.text("+ step number", 16, 55, { size: 2.5, align: "center", color: C.muted });
      K.arrow(29, 39, 37, 39, { color: C.strong, p: K.seg(S, 1.15, 1.3) });
      K.alpha(l * K.seg(S, 1.2, 1.35)); K.node(52, 39, 28, 12, "denoiser", { sub: "a neural network", size: 3.2 });
      K.alpha(l); K.arrow(67, 39, 76, 33, { color: C.strong, p: K.seg(S, 1.35, 1.5) });
      const pn = K.seg(S, 1.45, 1.6) * l;
      if (pn > 0){
        const c = 24 / GW;
        for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++){ const n = noise[y * GW + x] + (exRng(x * 31 + y)() - .5) * 40; K.alpha(pn); ctx.fillStyle = `rgb(${n|0},${n|0},${n|0})`; ctx.fillRect(77 + x * c, 19 + y * c, c + .05, c + .05); }
        K.text("predicted noise", 89, 40.5, { size: 2.5, align: "center", color: C.muted });
      }
      const tn = K.seg(S, 1.55, 1.7) * l;
      if (tn > 0){
        const c = 24 / GW;
        for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++){ const n = noise[y * GW + x]; K.alpha(tn); ctx.fillStyle = `rgb(${n|0},${n|0},${n|0})`; ctx.fillRect(77 + x * c, 50 + y * c, c + .05, c + .05); }
        K.text("noise actually added", 89, 71.5, { size: 2.5, align: "center", color: C.muted });
        K.alpha(tn * K.seg(S, 1.65, 1.8)); K.text("loss: how far apart they are", 89, 79, { size: 2.7, align: "center", color: C.warn, weight: 600 });
      }
    }
    // 3-5. generate: big canvas
    const g = K.seg(S, 2, 2.25);
    if (g > 0){
      const steps = 50, k = S < 3 ? 0 : Math.min(steps, Math.floor(K.seg(S, 3.05, 3.9) * steps));
      const lvl = S < 3 ? 1 : 1 - k / steps;
      const top = K.lerp(16, 12, K.seg(S, 4, 4.3));
      grid(28, top, 64, lvl, g, gen);
      K.alpha(g);
      const label = S < 3 ? "start: pure random noise" : S < 4 ? `denoising step ${k} of ${steps}` : "guidance pushes every step toward the prompt";
      K.text(label, 60, top + 52, { size: 3, align: "center", mono: S >= 3 && S < 4, color: S >= 3 && S < 4 ? C.accent : C.muted, weight: 500 });
      // the prompt is there from the first denoising step, not added at the end
      const pa = K.seg(S, 2.6, 2.9);
      if (pa > 0){
        const pt = "“a lighthouse by the sea at night”", pw = K.width(pt, { size: 3, weight: 600 });
        K.alpha(pa);
        K.rect(60 - pw / 2 - 4, 76, pw + 8, 10, 2.4, { fill: C.raised, stroke: C.accent, lw: .4 });
        K.typed([pt], K.seg(S, 2.65, 3), 60 - pw / 2, 81, 0, { size: 3, weight: 600 });
        K.arrow(60, 75.5, 60, top + 56, { p: K.seg(S, 2.95, 3.1), color: C.accent });
        K.alpha(pa * K.seg(S, 3, 3.15));
        K.text("text encoder", 62, 71.5, { size: 2.5, color: C.accent });
      }
    }
    K.alpha(1);
  },

  /* ---------- MCP ---------- */
  mcp(K, S, time){
    const C = K.C, apps = [["Chat app", 25], ["IDE", 50], ["Agent", 75]], tools = [["GitHub", 20], ["Database", 40], ["Calendar", 60], ["Files", 80]];
    const focus = K.io(K.seg(S, 2, 2.4)), reuse = K.io(K.seg(S, 4.12, 4.45)), clear = K.seg(S, 4, 4.12);
    const hub = K.seg(S, 1, 1.3);
    // tangle
    const tangle = K.seg(S, 0, .3) * (1 - hub);
    apps.forEach(([, ay]) => tools.forEach(([, ty]) => { K.alpha(tangle * .7); K.line(28, ay, 91, ty, { color: C.warn, lw: .3 }); }));
    K.alpha(tangle * K.seg(S, .3, .5)); K.text("3 apps × 4 tools = 12 custom integrations", 60, 93, { size: 2.9, align: "center", color: C.warn, weight: 600 });
    // protocol in the middle
    const mid = hub * (1 - focus);
    if (mid > 0){
      K.alpha(mid);
      K.rect(53, 14, 14, 72, 3, { fill: C.raised, stroke: C.accent, lw: .45 });
      K.ctx.save(); K.ctx.translate(60, 50); K.ctx.rotate(-Math.PI / 2); K.text("MCP", 0, 0, { size: 4, weight: 700, align: "center", color: C.accent, display: true }); K.ctx.restore();
      apps.forEach(([, y]) => K.line(28, y, 53, y, { color: C.accent, lw: .35 }));
      tools.forEach(([, y]) => K.line(67, y, 91, y, { color: C.accent, lw: .35 }));
      K.alpha(mid * K.seg(S, 1.3, 1.5)); K.text("each side speaks the protocol once: 3 + 4 instead of 3 × 4", 60, 93, { size: 2.7, align: "center", color: C.accent, weight: 600 });
    }
    // nodes (IDE and GitHub move into the focused view)
    apps.forEach(([n, y], i) => {
      const isIDE = i === 1;
      const x = isIDE ? K.lerp(15, 18, focus) : 15, yy = isIDE ? y : y;
      const a = isIDE ? 1 : (1 - focus) + reuse;
      K.alpha(K.seg(S, 0, .2) * K.clamp(a));
      K.node(x, yy, 26, 10, n, { sub: S >= 1 ? "MCP client" : "app", size: 3 });
    });
    tools.forEach(([n, y], i) => {
      const isGH = i === 0;
      const x = isGH ? K.lerp(103, 100, focus) : 103, yy = isGH ? K.lerp(y, 50, focus) : y;
      K.alpha(K.seg(S, 0, .2) * (isGH ? 1 : 1 - K.seg(S, 2, 2.12)));
      K.node(x, yy, 24, 10, n, { sub: S >= 1 ? "MCP server" : "tool", size: 3 });
    });
    // focused conversation
    const msg = (text, dir, a, b, color) => {
      const t = K.seg(S, a, b); if (t <= 0 || t >= 1) return;
      const w = K.width(text, { size: 2.5, mono: true }) + 4, lo = 32 + w / 2, hi = 87 - w / 2;
      const x = dir > 0 ? K.lerp(lo, hi, K.io(t)) : K.lerp(hi, lo, K.io(t));
      K.alpha(1); K.rect(x - w / 2, 46.5, w, 7, 3.5, { fill: C.raised, stroke: color || C.accent, lw: .35 });
      K.text(text, x, 50, { size: 2.5, mono: true, align: "center", color: color || C.accent });
    };
    if (focus > 0 && clear < 1){
      K.alpha(focus * (1 - clear)); K.line(29, 50, 88, 50, { color: C.line, dash: [1, 1] });
      K.alpha(K.seg(S, 2.3, 2.45) * (1 - clear)); K.text("JSON-RPC over stdio or HTTP", 59, 41, { size: 2.5, align: "center", color: C.muted });
      msg("tools/list", 1, 2.3, 2.5); msg("2 tools", -1, 2.5, 2.75, C.ok);
      const ta = K.seg(S, 2.6, 2.75) * (1 - clear);
      if (ta > 0){
        [["search_issues", "query: string"], ["create_issue", "title, body: string"]].forEach(([n, sig], i) => {
          K.alpha(ta); K.rect(4, 64 + i * 11, 44, 9, 2, { fill: C.surface, stroke: S >= 3.3 && i === 1 ? C.accent : C.strong, lw: .35 });
          K.text(n, 7, 67.4 + i * 11, { size: 2.7, mono: true, weight: 500 });
          K.text(sig, 7, 70.8 + i * 11, { size: 2.3, mono: true, color: C.muted });
        });
        K.text("tools the model can now see", 4, 60, { size: 2.5, color: C.muted });
      }
      // call
      const ap = K.seg(S, 3.15, 3.3) * (1 - K.seg(S, 3.5, 3.6));
      if (ap > 0){ K.alpha(ap); K.rect(3, 28, 42, 8, 2, { fill: C.raised, stroke: C.warn, lw: .4 }); K.text("Allow create_issue? Yes", 24, 32, { size: 2.3, align: "center", color: C.warn, weight: 600 }); }
      msg('tools/call create_issue', 1, 3.45, 3.7);
      const run = K.seg(S, 3.68, 3.75) * (1 - K.seg(S, 3.82, 3.86));
      if (run > 0){ K.alpha(run); K.rect(88, 45, 24, 10, 2.4, { stroke: C.accent, lw: .6 }); }
      msg('{ "url": "…/issues/128" }', -1, 3.78, 3.95, C.ok);
      const done = K.seg(S, 3.93, 4) * (1 - clear);
      if (done > 0){ K.alpha(done); K.check(8, 32, 2.6, C.ok); K.text("Issue #128 created", 12, 32, { size: 2.8, color: C.ok, weight: 600 }); }
    }
    // reuse
    if (reuse > 0){
      apps.forEach(([, y]) => { K.alpha(reuse); K.line(28, y, 88, 50, { color: C.accent, lw: .4 }); K.packet(28, y, 88, 50, ((time * .4) + y / 100) % 1, { r: .9 }); });
      K.alpha(reuse * K.seg(S, 4.3, 4.5)); K.text("write a server once, use it from any MCP app", 60, 93, { size: 2.9, align: "center", color: C.accent, weight: 600 });
    }
    K.alpha(1);
  },

  /* ---------- Database indexes ---------- */
  btree(K, S, time){
    const C = K.C;
    const rows = ["mia", "ana", "zoe", "kai", "leo", "eva", "sam", "bea", "tom", "ivy", "ned", "uma"];
    const tx = 4, ty = 20, rh = 5.4;
    // table
    K.alpha(K.seg(S, 0, .2));
    K.text("users table (unsorted)", tx, ty - 6, { size: 2.6, color: C.muted });
    K.rect(tx, ty - 3, 34, rows.length * rh + 1, 1.8, { fill: C.surface, stroke: C.strong });
    const scan = S < 1 ? K.seg(S, .2, .9) * rows.length : -1;
    rows.forEach((n, i) => {
      const y = ty + i * rh + .2, read = scan > i, hit = n === "kai" && (scan > i || (S >= 2.6 && S < 3));
      if (read && S < 1){ K.alpha(.5); K.rect(tx + .4, y - 2.2, 33.2, rh - .6, 1, { fill: C.raised }); }
      if (hit){ K.alpha(1); K.rect(tx + .4, y - 2.2, 33.2, rh - .6, 1, { fill: C.fill }); }
      K.alpha(K.seg(S, 0, .2));
      K.text(`${n}@mail.com`, tx + 2.5, y + .4, { size: 2.5, mono: true, color: hit ? C.white : C.ink });
    });
    if (S >= 4.3){ // the new row lands in the table too
      const y = ty + rows.length * rh + .2;
      K.alpha(K.seg(S, 4.3, 4.45)); K.rect(tx, y - 2.6, 34, rh, 1.4, { fill: C.surface, stroke: C.warn, lw: .4 });
      K.text("jon@mail.com", tx + 2.5, y + .4, { size: 2.5, mono: true, color: C.warn, weight: 600 });
    }
    if (S < 1){ K.alpha(K.seg(S, .2, .3)); K.text(`find kai: ${Math.min(12, Math.ceil(Math.max(0, scan)))} of 12 rows read`, tx, ty + rows.length * rh + 4, { size: 2.6, mono: true, color: C.warn }); }
    // tree
    const split = K.io(K.seg(S, 4.3, 4.8));
    const leaves4 = [["ana", "bea", "eva"], ["ivy", "kai", "leo"], ["mia", "ned", "sam"], ["tom", "uma", "zoe"]];
    const leaves5 = [["ana", "bea", "eva"], ["ivy", "jon"], ["kai", "leo"], ["mia", "ned", "sam"], ["tom", "uma", "zoe"]];
    const L = split > .5 ? leaves5 : leaves4, n = L.length;
    const lw = K.lerp(17, 14.2, split), gap = K.lerp(19.6, 15.4, split), x0 = 42;
    const lx = i => x0 + i * gap, LY = 48;
    const ta = K.seg(S, 1, 1.3);
    if (ta > 0){
      const rootKeys = split > .5 ? "ivy · kai · mia · tom" : "ivy · mia · tom";
      const rw = Math.max(36, K.width(rootKeys, { size: 2.6, mono: true }) + 6);
      K.alpha(ta); K.rect(80 - rw / 2, 18, rw, 9, 2, { fill: C.surface, stroke: (S >= 2 && S < 3) ? C.accent : C.strong, lw: (S >= 2 && S < 3) ? .5 : .35 });
      K.text(rootKeys, 80, 22.5, { size: 2.6, mono: true, align: "center", weight: 500 });
      K.text("index on email", 80, 13, { size: 2.6, align: "center", color: C.muted });
      L.forEach((keys, i) => {
        const on = (S >= 2 && S < 3 && i === 1 && K.seg(S, 2.3, 2.4) > 0) || (S >= 3 && S < 4 && (i === 1 || i === 2) && K.seg(S, 3.2 + (i - 1) * .3, 3.3 + (i - 1) * .3) > 0);
        const isNew = split > .5 && (i === 1 || i === 2);
        K.alpha(ta * K.seg(S, 1.1 + i * .05, 1.3 + i * .05));
        K.line(80, 27, lx(i) + lw / 2, LY - 5, { color: (S >= 2 && S < 3 && i === 1) ? C.accent : C.line, lw: (S >= 2 && S < 3 && i === 1) ? .5 : .3 });
        K.rect(lx(i), LY - 5, lw, 14, 1.6, { fill: on ? C.fill : C.surface, stroke: isNew ? C.warn : (on ? C.fill : C.strong), lw: isNew ? .5 : .35 });
        keys.forEach((k, j) => K.text(k, lx(i) + lw / 2, LY - 1.4 + j * 4, { size: 2.5, mono: true, align: "center", color: on ? C.white : (k === "jon" ? C.warn : C.ink), weight: k === "jon" ? 700 : 400 }));
        if (i < n - 1){ const rs = S >= 3 && S < 4; K.alpha(ta * K.seg(S, 2.95, 3.1)); K.arrow(lx(i) + lw + .3, LY, lx(i + 1) - .3, LY, { color: rs ? C.accent : C.muted, hs: rs ? 1.3 : .9, lw: rs ? .5 : .25 }); }
      });
      const pa = ta * K.seg(S, 1.4, 1.6) * (1 - K.seg(S, 2, 2.1));
      if (pa > 0) leaves4.forEach((keys, i) => i === 1 && keys.forEach((k, j) => {
        const r = rows.indexOf(k), ky = LY - 1.4 + j * 4, ry = ty + r * rh + .2;
        K.alpha(pa * .45); K.line(lx(i) - .3, ky, tx + 34.6, ry, { color: C.accent, lw: .2, dash: [.6, .6] });
      }));
      K.alpha(ta * K.seg(S, 1.3, 1.5) * (1 - K.seg(S, 2, 2.1)));
      K.text("sorted keys in a tree, each pointing to its row", 80, 66, { size: 2.6, align: "center", color: C.muted });
    }
    // search
    if (S >= 2 && S < 3){
      K.alpha(K.seg(S, 2.05, 2.2)); K.text("kai: after ivy, before mia → second leaf", 80, 66, { size: 2.6, align: "center", color: C.accent });
      const pa = K.seg(S, 2.45, 2.65);
      if (pa > 0){
        const ry = ty + 3 * rh + .2;
        const bx = lx(1) + lw / 2, o = { color: C.accent, lw: .4 };
        K.alpha(pa); K.line(bx, LY + 9, bx, 60.5, o); K.line(bx, 60.5, 40.2, 60.5, o); K.line(40.2, 60.5, 40.2, ry, o); K.arrow(40.2, ry, tx + 34.6, ry, { ...o, hs: .9 });
        K.alpha(K.seg(S, 2.6, 2.75)); K.text("2 reads instead of 12", 80, 72, { size: 2.9, align: "center", color: C.accent, weight: 600 });
        K.text("a million rows: about 3 or 4 reads", 80, 77.5, { size: 2.6, align: "center", color: C.muted });
      }
    }
    // range scan
    if (S >= 3 && S < 4){
      K.alpha(K.seg(S, 3.05, 3.2)); K.text("range kai…ned: walk the linked leaves", 80, 66, { size: 2.6, align: "center", color: C.accent });
      K.alpha(1); K.packet(lx(1) + 2, LY + 11, lx(2) + lw - 2, LY + 11, K.seg(S, 3.2, 3.8), { r: 1 });
    }
    // insert with split
    if (S >= 4){
      const ia = K.seg(S, 4, 4.15);
      K.alpha(ia * (1 - K.seg(S, 4.3, 4.4))); K.rect(72, 33, 16, 7, 1.6, { fill: C.raised, stroke: C.warn, lw: .45 }); K.text("+ jon", 80, 36.5, { size: 2.6, mono: true, align: "center", color: C.warn, weight: 600 });
      K.alpha(ia); K.packet(80, 40, lx(1) + lw / 2, LY - 5, K.seg(S, 4.1, 4.3), { color: C.warn });
      K.alpha(K.seg(S, 4.5, 4.7)); K.text("leaf was full: it splits, the root gains a key", 80, 66, { size: 2.6, align: "center", color: C.warn });
      K.alpha(K.seg(S, 4.75, 4.9)); K.text("every index makes inserts and updates slower", 80, 72, { size: 2.7, align: "center", color: C.muted });
    }
    K.alpha(1);
  },

  /* ---------- Docker ---------- */
  docker(K, S, time){
    const C = K.C;
    const lines = ["FROM python:3.12-slim", "COPY requirements.txt .", "RUN pip install -r requirements.txt", "COPY . .", 'CMD ["python", "app.py"]'];
    const layers = [["python:3.12-slim", "base image"], ["requirements.txt", "1 KB"], ["installed packages", "48 MB"], ["your code", "2 MB"]];
    const run = K.io(K.seg(S, 3, 3.4)), ship = K.io(K.seg(S, 4, 4.4));
    // Dockerfile
    const df = K.seg(S, 0, .15) * (1 - K.seg(S, 2.9, 3.1));
    if (df > 0){
      K.alpha(df); K.rect(2, 14, 56, 40, 2.4, { fill: C.surface, stroke: C.strong });
      K.text("Dockerfile", 5, 18.5, { size: 2.6, color: C.muted });
      const lsz = Math.min(2.3, 2.3 * 51 / Math.max(...lines.map(l => K.width(l, { size: 2.3, mono: true }))));
      lines.forEach((l, i) => {
        const changed = i === 3 && S >= 2 && S < 3 && K.seg(S, 2.05, 2.15) > 0;
        if (changed){ K.alpha(df * .8); K.rect(3.5, 23.5 + i * 6.2 - 2.6, 53, 5, 1, { fill: "rgba(253,186,116,.12)" }); }
        K.alpha(df); K.typed([l], K.seg(S, .1 + i * .15, .25 + i * .15), 5, 23.5 + i * 6.2, 0, { size: lsz, mono: true, color: changed ? C.warn : C.ink });
      });
      K.alpha(df * K.seg(S, 2.05, 2.2) * (S < 3 ? 1 : 0)); K.text("you edited app.py", 5, 58, { size: 2.6, color: C.warn });
    }
    // image layers
    const sx = K.lerp(66, 6, run), sw = K.lerp(50, 34, run), sy = K.lerp(76, 80, run) - ship * 56;
    layers.forEach(([n, size], i) => {
      const a = K.seg(S, 1 + i * .18, 1.2 + i * .18) * (1 - K.seg(S, 4, 4.12));
      if (a <= 0) return;
      const y = sy - i * 9.5, rebuilt = i === 3 && S >= 2 && S < 3, flash = rebuilt ? K.seg(S, 2.3, 2.6) : 1;
      K.alpha(a); K.rect(sx, y - 4, sw, 8, 1.6, { fill: C.surface, stroke: rebuilt ? (flash < 1 ? C.warn : C.ok) : C.strong, lw: rebuilt ? .55 : .35 });
      K.text(n, sx + 2.5, y, { size: run > .5 ? 2.4 : 2.7, weight: 600 });
      if (run < .2 && !(S >= 2 && S < 3)){ K.alpha(a * (1 - run * 5)); K.text(size, sx + sw - 2.5, y, { size: 2.5, mono: true, align: "right", color: C.muted }); K.alpha(a); }
      if (S < 2 && S >= 1){ K.alpha(a * (1 - K.seg(S, 1.8, 1.95)) * .6); K.line(58, 23.5 + i * 6.2, sx, y, { color: C.line, dash: [.8, .8] }); }
      if (S >= 2 && S < 3){
        const tag = i < 3 ? "cached" : (flash < 1 ? "rebuilding…" : "rebuilt in 2 s");
        K.alpha(K.seg(S, 2.2 + i * .05, 2.3 + i * .05)); K.text(tag, sx + sw - 2.5, y, { size: 2.4, align: "right", color: i < 3 ? C.ok : (flash < 1 ? C.warn : C.ok), weight: 600 });
      }
    });
    if (S >= 1 && S < 4){
      K.alpha(K.seg(S, 1.8, 2) * (1 - run)); K.text("image = a stack of read-only layers", 91, 27, { size: 2.6, align: "center", color: C.muted });
      K.alpha(K.seg(S, 2.6, 2.8) * (1 - run)); K.text("put rarely changed steps first", 91, 32, { size: 2.6, align: "center", color: C.accent });
    }
    // containers on a host
    const ha = K.seg(run, .65, 1) * (1 - ship);
    if (ha > 0){
      K.alpha(ha); K.rect(46, 14, 72, 74, 3, { stroke: C.strong });
      K.text("one host", 49, 18.5, { size: 2.6, color: C.muted });
      K.rect(48, 78, 68, 8, 1.6, { fill: C.raised, stroke: C.strong });
      K.text("shared Linux kernel", 82, 82, { size: 2.6, align: "center", color: C.muted });
      ["web 1", "web 2", "worker"].forEach((n, i) => {
        const a = K.seg(S, 3.3 + i * .15, 3.5 + i * .15) * ha, x = 49 + i * 22.5;
        K.alpha(a); K.rect(x, 26, 20, 46, 2.4, { fill: C.surface, stroke: C.accent, lw: .45 });
        K.text(n, x + 10, 31, { size: 2.9, weight: 700, align: "center" });
        ["own files", "own processes", "own network", "own limits"].forEach((t, k) => K.text(t, x + 10, 38 + k * 5.6, { size: 2.1, align: "center", color: C.muted }));
        K.rect(x + 1.5, 61, 17, 5, 1, { fill: "rgba(253,186,116,.12)", stroke: C.warn, lw: .3 });
        K.text("writable layer", x + 10, 63.5, { size: 2, align: "center", color: C.warn });
        K.rect(x + 1.5, 66.5, 17, 4, 1, { fill: C.raised });
        K.text("image (shared)", x + 10, 68.5, { size: 1.9, align: "center", color: C.muted });
        K.alpha(ha); K.packet(40, sy - 14, x + 10, 26, K.seg(S, 3.15 + i * .15, 3.4 + i * .15), { r: 1 });
      });
      K.alpha(ha * K.seg(S, 3.7, 3.85)); K.text("isolated with namespaces, limited with cgroups", 82, 92.5, { size: 2.6, align: "center", color: C.accent });
    }
    // registry
    if (ship > 0){
      K.alpha(K.seg(S, 4.12, 4.3)); K.node(23, 12, 26, 9, "registry", { sub: "stores images", size: 3 });
      [["laptop", 34], ["CI", 64], ["cloud server", 96]].forEach(([n, x], i) => {
        const a = K.seg(S, 4.4 + i * .12, 4.6 + i * .12);
        K.alpha(ship); K.packet(23, 16.5, x, 78, K.seg(S, 4.35 + i * .12, 4.6 + i * .12), { r: 1.1 });
        K.alpha(a); K.node(x, 82, 24, 9, n, { size: 2.9 });
      });
      K.alpha(K.seg(S, 4.7, 4.85)); K.text("the same image runs the same way everywhere", 60, 93, { size: 2.8, align: "center", color: C.accent, weight: 600 });
    }
    K.alpha(1);
  },

  /* ---------- LLM evaluation ---------- */
  evals(K, S, time){
    const C = K.C;
    const cases = [["Refund on annual plans?", "30 days"], ["Do you ship to Chile?", "yes, 5 to 7 days"], ["Cancel a monthly plan?", "anytime, in settings"], ["Price for teams?", "volume discount"], ["Change my email?", "settings, account"]];
    // exact checks where the answer is fixed, a pass/fail judge where it isn't
    const outs = [["30 days", true, "exact match"], ["yes, 5 to 7 days", true, "judge: pass"], ["call support", false, "judge: fail"], ["$10 per seat", false, "judge: fail"], ["settings, account", true, "exact match"]];
    const chart = K.io(K.seg(S, 3.12, 3.4));
    const tab = 1 - K.seg(S, 3, 3.12);
    // cases
    if (tab > 0){
      K.alpha(tab * K.seg(S, 0, .2)); K.text("test cases", 4, 14, { size: 2.6, color: C.muted });
      K.text("expected", 34, 14, { size: 2.6, color: C.muted });
      cases.forEach(([q, e], i) => {
        const y = 21 + i * 13, a = tab * K.seg(S, .05 + i * .12, .25 + i * .12);
        K.alpha(a); K.rect(3, y - 4.5, 50, 10, 2, { fill: C.surface, stroke: C.strong });
        K.text(q, 5.5, y - 1, { size: 2.6, weight: 600 });
        K.text(e, 5.5, y + 2.8, { size: 2.3, color: C.muted });
      });
      // app
      const aa = tab * K.seg(S, 1, 1.2);
      if (aa > 0){
        K.alpha(aa); K.node(66, 47, 23, 12, "your app", { sub: "LLM + prompt", size: 2.9 });
        cases.forEach((c, i) => {
          const y = 21 + i * 13, st = 1.15 + i * .14;
          K.alpha(aa); K.packet(53, y, 55.5, 47, K.seg(S, st, st + .12), { r: .9 });
          K.packet(76.5, 47, 80, y, K.seg(S, st + .14, st + .28), { r: .9, color: C.ok });
          const oa = tab * K.seg(S, st + .25, st + .32);
          if (oa > 0){
            K.alpha(oa); K.rect(80, y - 4.5, 37, 10, 2, { fill: C.surface, stroke: C.strong });
            K.text(outs[i][0], 82.5, y - 1, { size: 2.5 });
          }
        });
        K.alpha(aa * K.seg(S, 1.2, 1.4)); K.text("output", 80, 14, { size: 2.6, color: C.muted });
      }
      // scores
      if (S >= 2){
        cases.forEach((c, i) => {
          const y = 21 + i * 13, sa = tab * K.seg(S, 2.05 + i * .12, 2.2 + i * .12);
          if (sa <= 0) return;
          K.alpha(sa);
          if (outs[i][1]) K.check(113.5, y, 2.4, C.ok);
          else { K.line(112.1, y - 1.4, 114.9, y + 1.4, { color: C.warn, lw: .55 }); K.line(114.9, y - 1.4, 112.1, y + 1.4, { color: C.warn, lw: .55 }); }
          K.text(outs[i][2], 82.5, y + 2.8, { size: 2.2, mono: true, color: C.muted });
        });
        K.alpha(tab * K.seg(S, 2.7, 2.85));
        K.text("3 of 5 pass: 2 by exact match, 1 by the judge", 66, 92, { size: 2.9, align: "center", color: C.accent, weight: 600 });
      }
    }
    // compare versions
    if (chart > 0){
      const metrics = [["accuracy", .72, .86, "%"], ["faithful answers", .81, .9, "%"], ["p95 latency", 2.1, 1.6, "s"]];
      const X0 = 12, W = 96, gw = W / 3;
      K.alpha(chart);
      K.text("same 200 cases, two versions", 60, 12, { size: 2.9, align: "center", color: C.muted });
      K.line(X0, 70, X0 + W, 70, { color: C.strong });
      metrics.forEach(([m, v1, v2, unit], i) => {
        const cx = X0 + gw * i + gw / 2, scale = unit === "s" ? 40 / 2.5 : 48;
        const g1 = K.ease(K.seg(S, 3.3 + i * .1, 3.6 + i * .1));
        const h1 = (unit === "s" ? v1 * scale : v1 * scale) * g1, h2 = (unit === "s" ? v2 * scale : v2 * scale) * g1;
        K.alpha(chart); K.rect(cx - 9, 70 - h1, 8, h1, .8, { fill: C.strong });
        K.rect(cx + 1, 70 - h2, 8, h2, .8, { fill: C.accent });
        const fmt = v => unit === "%" ? Math.round(v * 100) + "%" : unit === "/5" ? (v * 5).toFixed(1) : v.toFixed(1) + "s";
        K.alpha(chart * K.seg(S, 3.55, 3.7));
        K.text(fmt(v1), cx - 5, 66.5, { size: 2.3, mono: true, align: "center", color: C.ink });
        K.text(fmt(v2), cx + 5, 66.5, { size: 2.3, mono: true, align: "center", color: C.bg, weight: 700 });
        K.text(m, cx, 74.5, { size: 2.7, align: "center", weight: 600 });
        if (unit === "s") K.text("lower is better", cx, 78.5, { size: 2.3, align: "center", color: C.muted });
      });
      K.alpha(chart * K.seg(S, 3.4, 3.6));
      K.rect(X0, 16.5, 3, 3, .5, { fill: C.strong }); K.text("v1", X0 + 4.5, 18, { size: 2.6 });
      K.rect(X0 + 12, 16.5, 3, 3, .5, { fill: C.accent }); K.text("v2", X0 + 16.5, 18, { size: 2.6 });
      // gate
      const ga = K.seg(S, 4, 4.2);
      if (ga > 0){
        const ty = 70 - .8 * 48;
        // v3's accuracy, well below the line: outside the noise of 200 cases
        const cx0 = X0 + gw / 2, h3 = .71 * 48 * K.ease(K.seg(S, 4.05, 4.3));
        K.alpha(ga); K.rect(cx0 + 11, 70 - h3, 8, h3, .8, { fill: C.warn });
        K.alpha(ga * K.seg(S, 4.25, 4.35)); K.text("71%", cx0 + 15, 66.5, { size: 2.3, mono: true, align: "center", color: C.bg, weight: 700 });
        K.alpha(ga); K.rect(X0 + 22, 22, 3, 3, .5, { fill: C.warn }); K.text("v3", X0 + 26.5, 23.5, { size: 2.6 });
        K.line(X0, ty, cx0 + 21, ty, { color: C.warn, dash: [1.2, .8], lw: .45 });
        K.line(X0 + 24, 18, X0 + 29, 18, { color: C.warn, dash: [1.2, .8], lw: .45 }); K.text("minimum accuracy 80%", X0 + 30.5, 18, { size: 2.6, color: C.warn });
        const steps = [["commit", C.strong], ["run evals", C.strong], ["v3: 71%", C.warn], ["deploy", C.line]];
        steps.forEach(([n, col], i) => {
          const a = K.seg(S, 4.2 + i * .12, 4.35 + i * .12), x = 10 + i * 27;
          K.alpha(a); K.rect(x, 84, 23, 8, 1.8, { fill: C.surface, stroke: col, lw: i === 2 ? .55 : .35 });
          K.text(n, x + 11.5, 88, { size: 2.6, align: "center", color: i === 2 ? C.warn : (i === 3 ? C.muted : C.ink), weight: i === 2 ? 700 : 500 });
          if (i) K.arrow(x - 3.6, 88, x - .4, 88, { color: C.strong, hs: 1 });
        });
        K.alpha(K.seg(S, 4.75, 4.9)); K.text("v3 is blocked before it reaches users", 60, 96.5, { size: 2.8, align: "center", color: C.warn, weight: 600 });
      }
    }
    K.alpha(1);
  },
  /* ---------- Problem solving: break it down ---------- */
  decompose(K, S, time){
    const C = K.C, Y1 = 16, Y2 = 42, Y3 = 66;
    const L2 = [[32, "Customers", "how many buy", "−20%"], [88, "Spend", "per customer", "+1%"]];
    const L3 = [[17, "New", "customers", "−3%"], [45, "Returning", "customers", "−31%"], [75, "Items", "per order", "+1%"], [103, "Price", "per item", "0%"]];
    const focus = K.seg(S, 4.05, 4.4);
    const hl = on => on && focus > 0 ? { stroke: C.accent, lw: .5, color: C.accent } : { stroke: C.strong, lw: .35, color: C.strong };
    const note = (t, a, b, col) => { K.alpha(K.seg(S, a, a + .2) * (1 - K.seg(S, b, b + .1))); K.text(t, 60, 91, { size: 2.6, align: "center", color: col || C.muted }); };
    // loose guesses that settle into one statement
    const words = [["price?", 12, 31], ["season?", 92, 31], ["ads?", 26, 52], ["competitors?", 78, 55], ["the team?", 40, 75], ["the website?", 82, 78], ["shipping?", 8, 70]];
    const wa = K.seg(S, 0, .25) * (1 - K.seg(S, .5, .9) * .75) * (1 - K.seg(S, 1, 1.2));
    if (wa > 0) words.forEach(([w, x, y], i) => { K.alpha(wa); K.text(w, x + Math.sin(time * .6 + i) * 1.2, y + Math.cos(time * .5 + i * 2), { size: 2.8, color: C.muted }); });
    K.alpha(K.seg(S, .4, .75));
    K.node(60, Y1, 64, 10, "Revenue fell 19% this quarter", { size: 3, stroke: hl(true).stroke, lw: hl(true).lw });
    // first split
    L2.forEach(([x, t, sub, v], i) => {
      const on = i === 0, dim = 1 - focus * (on ? 0 : .65), h = hl(on);
      K.alpha(K.seg(S, 1.05 + i * .1, 1.35 + i * .1) * dim);
      K.line(60, Y1 + 5, x, Y2 - 5.5, { color: h.color, lw: h.lw });
      K.node(x, Y2, 36, 11, t, { sub, stroke: h.stroke, lw: h.lw });
      K.alpha(K.seg(S, 3.05 + i * .1, 3.25 + i * .1) * dim);
      K.text(v, i ? x + 19.5 : x - 19.5, Y2, { size: 2.8, mono: true, align: i ? "left" : "right", color: on ? C.warn : C.muted, weight: 600 });
    });
    K.alpha(K.seg(S, 1.3, 1.5) * (1 - focus * .65)); K.text("×", 60, Y2, { size: 3.4, align: "center", color: C.muted });
    // second split
    L3.forEach(([x, t, sub, v], i) => {
      const on = i === 1, dim = 1 - focus * (on ? 0 : .65), h = hl(on);
      K.alpha(K.seg(S, 2.05 + i * .08, 2.3 + i * .08) * dim);
      K.line(L2[i < 2 ? 0 : 1][0], Y2 + 5.5, x, Y3 - 5.5, { color: h.color, lw: h.lw });
      K.node(x, Y3, 25, 11, t, { sub, size: 3, stroke: h.stroke, lw: h.lw });
      K.alpha(K.seg(S, 3.15 + i * .1, 3.35 + i * .1) * dim);
      K.text(v, x, Y3 + 10, { size: 3, mono: true, align: "center", color: on ? C.warn : C.muted, weight: 600 });
    });
    K.alpha(K.seg(S, 2.3, 2.5) * (1 - focus * .65));
    K.text("+", 31, Y3, { size: 3, align: "center", color: C.muted }); K.text("×", 89, Y3, { size: 3, align: "center", color: C.muted });
    note("the parts multiply back to the whole", 1.3, 1.95);
    note("stop when a part is something you can measure", 2.35, 2.95);
    note("−20% customers × +1% spend ≈ −19% revenue", 3.45, 3.95, C.ink);
    // the specific question
    if (focus > 0){
      K.alpha(focus); K.arrow(45, Y3 + 12.5, 45, 83, { color: C.accent, hs: 1.2 });
      K.alpha(K.seg(S, 4.3, 4.6)); K.rect(16, 83.5, 72, 10, 2.4, { fill: C.raised, stroke: C.accent, lw: .5 });
      K.text("Why did returning customers stop buying?", 52, 88.5, { size: 2.7, align: "center", weight: 600 });
    }
    K.alpha(1);
  },

  /* ---------- Problem solving: five whys ---------- */
  whys(K, S, time){
    const C = K.C, X = 40, W = 66, y = i => 10 + i * 15;
    const chain = ["The delivery arrived late", "The truck left two hours late", "It waited for a missing package", "That package was packed last", "Packing follows arrival order", "The packing list shows no deadlines"];
    const when = [0, 1.05, 1.5, 2.05, 2.5, 3.05];
    chain.forEach((t, i) => {
      const a = K.seg(S, when[i], when[i] + .25);
      if (a <= 0) return;
      const top = i === 0, root = i === 5;
      if (i){
        K.alpha(a); K.arrow(X, y(i - 1) + 4.5, X, y(i) - 4.6, { color: C.strong, hs: 1 });
        K.text("why?", X + 2, y(i) - 7.5, { size: 2.4, color: C.accent, weight: 600 });
      }
      K.alpha(a); K.rect(X - W / 2, y(i) - 4.5, W, 9, 2, { fill: root ? C.fill : C.surface, stroke: top ? C.warn : root ? C.fill : C.strong, lw: top || root ? .5 : .35 });
      K.text(t, X, y(i), { size: 2.7, align: "center", weight: top || root ? 600 : 500, color: root ? C.white : C.ink });
    });
    K.alpha(K.seg(S, .2, .4)); K.text("symptom", X + W / 2 + 2.5, y(0), { size: 2.4, color: C.warn, weight: 600 });
    [["what", "order 2041, 2 hours late"], ["when", "Tuesday, afternoon route"], ["how often", "third time this month"]].forEach(([k, v], i) => {
      K.alpha(K.seg(S, .35 + i * .12, .55 + i * .12) * (1 - K.seg(S, 1, 1.2)));
      K.text(k, 8, 26 + i * 7, { size: 2.4, color: C.muted }); K.text(v, 26, 26 + i * 7, { size: 2.6 });
    });
    K.alpha(K.seg(S, 3.3, 3.5)); K.text("root cause", X + W / 2 + 2.5, y(5), { size: 2.4, color: C.accent, weight: 600 });
    // patch vs fix, over eight weeks
    const ta = K.seg(S, 4.05, 4.3);
    if (ta > 0){
      [["patch: rush this order", [0, 3, 6], 30, C.warn, "late again, twice"], ["fix: show the deadlines", [0], 54, C.accent, "no repeats"]].forEach(([label, late, ry, col, after], r) => {
        K.alpha(K.seg(S, 4.05 + r * .3, 4.3 + r * .3)); K.text(label, 78, ry - 6, { size: 2.5, weight: 600, color: col });
        for (let w = 0; w < 8; w++){
          K.alpha(K.seg(S, 4.1 + r * .3 + w * .04, 4.2 + r * .3 + w * .04));
          K.dot(80 + w * 5, ry, 1.3, { fill: late.includes(w) ? C.warn : C.ok });
        }
        K.alpha(K.seg(S, 4.5 + r * .3, 4.65 + r * .3)); K.text(after, 78, ry + 5, { size: 2.3, color: C.muted });
      });
      K.alpha(ta); K.text("one dot per week", 78, 69, { size: 2.2, color: C.muted });
    }
    K.alpha(1);
  },

  /* ---------- Problem solving: halving ---------- */
  bisect(K, S, time){
    const C = K.C, N = 16, Y = 34, cx = i => 8 + (i - 1) * 6.5, bx = k => cx(k) + 6.25;
    const tests = [[8, true, 1.05, 2], [12, false, 2.05, 3], [10, true, 3.05, 3.5], [11, false, 3.5, 4]];
    const clearAt = i => i <= 8 ? 1.5 : i >= 13 ? 2.5 : i <= 10 ? 3.25 : i === 12 ? 3.72 : 99;
    const table = K.io(K.seg(S, 4.12, 4.35)), logOut = K.seg(S, 4, 4.12), hit = K.seg(S, 3.8, 3.95);
    for (let i = 1; i <= N; i++){
      const dim = K.seg(S, clearAt(i), clearAt(i) + .3), on = i === 11 && hit > 0;
      K.alpha(K.seg(S, i * .02, .25 + i * .02) * (1 - dim * .7));
      K.rect(cx(i), Y - 4.5, 6, 9, 1.2, { fill: on ? C.fill : C.surface, stroke: on ? C.fill : C.strong });
      K.text(String(i), cx(i) + 3, Y, { size: 2.3, mono: true, align: "center", color: on ? C.white : C.ink });
    }
    K.alpha(K.seg(S, .3, .5));
    K.text("worked", cx(1), Y + 9.5, { size: 2.4, color: C.ok, weight: 600 });
    K.text("broken", cx(N) + 6, Y + 9.5, { size: 2.4, color: C.warn, weight: 600, align: "right" });
    // suspects bracket
    const lo = K.lerp(K.lerp(cx(1), cx(9), K.io(K.seg(S, 1.5, 1.8))), cx(11), K.io(K.seg(S, 3.25, 3.55)));
    const hi = K.lerp(K.lerp(cx(16) + 6, cx(12) + 6, K.io(K.seg(S, 2.5, 2.8))), cx(11) + 6, K.io(K.seg(S, 3.72, 4)));
    const n = S < 1.5 ? 16 : S < 2.5 ? 8 : S < 3.25 ? 4 : S < 3.72 ? 2 : 1;
    K.alpha(K.seg(S, .3, .5));
    K.line(lo, 25.5, hi, 25.5, { color: C.accent, lw: .4 }); K.line(lo, 25.5, lo, 27.5, { color: C.accent, lw: .4 }); K.line(hi, 25.5, hi, 27.5, { color: C.accent, lw: .4 });
    K.text(n > 1 ? `${n} suspects` : "change 11 broke it", Math.min(Math.max((lo + hi) / 2, 20), 100), 21.5, { size: 2.6, align: "center", color: n > 1 ? C.accent : C.ink, weight: 600 });
    // the current test
    tests.forEach(([k, ok, t0, t1]) => {
      const a = K.seg(S, t0, t0 + .15) * (1 - K.seg(S, t1 - .08, t1));
      if (a <= 0) return;
      K.alpha(a); K.line(bx(k), Y - 6.5, bx(k), Y + 6.5, { color: C.accent, lw: .55 });
      K.text("test", bx(k), Y + 9.5, { size: 2.4, mono: true, align: "center", color: C.accent });
    });
    // log
    tests.forEach(([k, ok, t0], j) => {
      const a = K.seg(S, t0 + .25, t0 + .4) * (1 - logOut);
      if (a <= 0) return;
      const ly = 56 + j * 7;
      K.alpha(a);
      K.text(`test ${j + 1}`, 20, ly, { size: 2.6, mono: true, color: C.muted });
      K.text(`as it was after change ${k}`, 36, ly, { size: 2.6 });
      K.text(ok ? "works" : "broken", 100, ly, { size: 2.6, weight: 600, align: "right", color: ok ? C.ok : C.warn });
    });
    K.alpha(K.seg(S, 3.6, 3.75) * (1 - logOut)); K.text("4 tests instead of up to 16", 60, 90, { size: 2.8, align: "center", color: C.accent, weight: 600 });
    // how it scales
    if (table > 0){
      const cols = [26, 62, 96];
      K.alpha(table); K.text("tests needed in the worst case", 60, 50, { size: 2.4, align: "center", color: C.muted });
      ["suspects", "one by one", "halving"].forEach((h, c) => K.text(h, cols[c], 57, { size: 2.5, align: "center", color: C.muted, weight: 600 }));
      [["16", "16", "4"], ["1,000", "1,000", "10"], ["1,000,000", "1,000,000", "20"]].forEach((r, j) => {
        K.alpha(K.seg(S, 4.25 + j * .15, 4.4 + j * .15) * table);
        r.forEach((v, c) => K.text(v, cols[c], 64 + j * 6.5, { size: 2.8, mono: true, align: "center", color: c === 2 ? C.accent : C.ink, weight: c === 2 ? 700 : 500 }));
      });
      K.alpha(table * K.seg(S, 4.75, 4.9)); K.text("code, recipes, settings, wiring: anything you can test", 60, 90, { size: 2.6, align: "center", color: C.muted });
    }
    K.alpha(1);
  },

  /* ---------- Problem solving: bottleneck ---------- */
  bottleneck(K, S, time){
    const C = K.C, X = [13, 43, 73, 103], Y = 40, W = 22;
    const prep = Math.round(K.lerp(12, 24, K.io(K.seg(S, 3.1, 3.4))));
    const pack = Math.round(K.lerp(25, 40, K.io(K.seg(S, 2.1, 2.4))));
    const demand = 30, deliver = 20, out = Math.min(demand, prep, pack, deliver);
    const st = [["Orders in", demand], ["Prepare", prep], ["Pack", pack], ["Deliver", deliver]];
    const a0 = K.seg(S, 0, .3);
    const note = (t, a, b, col) => { K.alpha(K.seg(S, a, a + .2) * (1 - K.seg(S, b, b + .1))); K.text(t, 60, 91, { size: 2.7, align: "center", color: col || C.muted, weight: 600 }); };
    // links with work moving through
    [demand, out, out].forEach((rate, k) => {
      const x1 = X[k] + W / 2, x2 = X[k + 1] - W / 2, n = Math.round(rate / 5);
      K.alpha(a0); K.line(x1, Y, x2, Y, { color: C.line });
      if (S >= .6) for (let j = 0; j < n; j++) K.dot(K.lerp(x1 + 1, x2 - 1, (time * .5 + j / n) % 1), Y, .75, { fill: C.accent });
    });
    // queue in front of Prepare
    const q = Math.round(12 * K.seg(S, 1.1, 1.9) * (1 - K.seg(S, 3.4, 3.9)));
    for (let j = 0; j < q; j++){ K.alpha(1); K.dot(25.6 + (j % 3) * 2.3, Y + 4.5 + Math.floor(j / 3) * 2.4, .85, { fill: C.warn }); }
    if (q > 0){ K.alpha(K.seg(S, 1.3, 1.5) * K.clamp(q / 4)); K.text("waiting", 28, Y + 19, { size: 2.2, align: "center", color: C.warn }); }
    // steps and how busy each one is
    st.forEach(([name, cap], i) => {
      const limit = (i === 1 && S >= 1.2 && S < 3.3) || (i === 3 && S >= 4.2);
      const lit = (i === 2 && S >= 2.1 && S < 3) || (i === 1 && S >= 3.1 && S < 4);
      K.alpha(K.seg(S, i * .08, .3 + i * .08));
      K.node(X[i], Y, W, 13, name, { sub: `${cap} / hour`, size: 3, stroke: limit ? C.warn : lit ? C.accent : C.strong, lw: limit || lit ? .55 : .35 });
      const ba = K.seg(S, .9, 1.2);
      if (!i){ K.alpha(ba); K.text("demand", X[0], Y + 11.5, { size: 2.4, align: "center", color: C.muted }); return; }
      const u = out / cap, full = u > .99;
      K.alpha(ba); K.rect(X[i] - W / 2, Y + 10, W, 2.4, 1.2, { fill: C.raised });
      K.rect(X[i] - W / 2, Y + 10, W * u, 2.4, 1.2, { fill: full ? C.warn : C.accent });
      K.text(`busy ${Math.round(u * 100)}%`, X[i], Y + 16, { size: 2.4, mono: true, align: "center", color: full ? C.warn : C.muted });
    });
    K.alpha(K.seg(S, 1.3, 1.5) * (1 - K.seg(S, 3.2, 3.3))); K.text("slowest step", X[1], Y - 10, { size: 2.4, align: "center", color: C.warn, weight: 600 });
    K.alpha(K.seg(S, 4.3, 4.5)); K.text("next limit", X[3], Y - 10, { size: 2.4, align: "center", color: C.warn, weight: 600 });
    // output
    K.alpha(K.seg(S, .6, .9));
    K.text("finished", 60, 72, { size: 2.6, align: "center", color: C.muted });
    K.text(`${out} orders per hour`, 60, 78.5, { size: 3.8, align: "center", weight: 700, color: C.accent });
    note("each step handles a different amount per hour", .35, .95);
    note("work piles up in front of the slowest step", 1.45, 1.95, C.warn);
    note("Pack got much faster: output didn't move", 2.5, 2.95, C.warn);
    note("Prepare doubled: output rose to 20", 3.5, 3.95, C.accent);
    note("Deliver is now 100% busy: it's the next limit", 4.4, 9, C.warn);
    K.alpha(1);
  },

  /* ---------- Problem solving: 80/20 ---------- */
  pareto(K, S, time){
    const C = K.C, X0 = 12, SL = 14, B = 74, sc = .54;
    const data = [["Billing", "", 8], ["Late", "delivery", 46], ["Login", "", 5], ["Damaged", "", 12], ["Other", "", 3], ["Wrong", "size", 22], ["Missing", "item", 4]];
    const after = data.map((d, i) => i === 1 ? 9 : d[2]);
    const rank = vals => { const r = []; vals.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).forEach(([, i], k) => { r[i] = k; }); return r; };
    const r1 = rank(data.map(d => d[2])), r2 = rank(after);
    const fix = K.io(K.seg(S, 4.1, 4.4)), sort1 = K.io(K.seg(S, 1.1, 1.7)), sort2 = K.io(K.seg(S, 4.5, 4.9));
    const val = i => K.lerp(data[i][2], after[i], fix);
    const pos = i => K.lerp(K.lerp(i, r1[i], sort1), r2[i], sort2);
    const cx = p => X0 + SL / 2 + p * SL;
    const top3 = K.seg(S, 3.05, 3.3) * (1 - K.seg(S, 4.05, 4.2));
    const note = (t, a, b, col) => { K.alpha(K.seg(S, a, a + .2) * (1 - K.seg(S, b, b + .1))); K.text(t, 60, 91, { size: 2.7, align: "center", color: col || C.muted, weight: 600 }); };
    K.alpha(K.seg(S, 0, .2)); K.line(X0, B, X0 + 7 * SL, B, { color: C.strong });
    data.forEach(([n1, n2], i) => {
      const x = cx(pos(i)), h = val(i) * sc * K.ease(K.seg(S, .1 + i * .06, .5 + i * .06));
      K.alpha(1); K.rect(x - 4.5, B - h, 9, h, .8, { fill: C.strong });
      K.alpha(1 - (r1[i] < 3 ? 0 : top3)); K.rect(x - 4.5, B - h, 9, h, .8, { fill: C.accent });
      const moving = K.clamp(1 - 2.2 * Math.max(Math.sin(Math.PI * sort1), Math.sin(Math.PI * sort2)));
      K.alpha(K.seg(S, .2, .5) * moving);
      K.text(n1, x, B + 3.5, { size: 2.2, align: "center" });
      if (n2) K.text(n2, x, B + 6.6, { size: 2.2, align: "center", color: C.muted });
      K.alpha(K.seg(S, .5, .8) * (1 - K.seg(S, 2.05, 2.25) + K.seg(S, 4.2, 4.4)) * moving);
      K.text(String(Math.round(val(i))), x, B - h - 2.5, { size: 2.5, mono: true, align: "center" });
    });
    // running total
    const la = K.seg(S, 2.05, 2.2) * (1 - K.seg(S, 4.05, 4.2));
    if (la > 0){
      const order = data.map((d, i) => i).sort((a, b) => r1[a] - r1[b]);
      let cum = 0;
      const pts = order.map(i => { cum += data[i][2]; return [cx(r1[i]), B - cum * sc, cum]; });
      const p = K.seg(S, 2.15, 2.8) * 6;
      K.alpha(la);
      for (let k = 0; k < 6; k++) if (p > k){ const t = K.clamp(p - k); K.line(pts[k][0], pts[k][1], K.lerp(pts[k][0], pts[k + 1][0], t), K.lerp(pts[k][1], pts[k + 1][1], t), { color: C.ink, lw: .4 }); }
      pts.forEach(([x, y, c], k) => {
        K.alpha(la * K.seg(S, 2.15 + k * .1, 2.25 + k * .1));
        K.dot(x, y, .9, { fill: C.ink });
        K.text(`${c}%`, x, y - 3, { size: 2.2, mono: true, align: "center", color: k < 3 && top3 > 0 ? C.accent : C.muted });
      });
      K.alpha(la * K.seg(S, 2.6, 2.8));
      K.line(X0, B - 80 * sc, X0 + 7 * SL, B - 80 * sc, { color: C.warn, dash: [1.2, .8], lw: .4 });
      K.text("80%", X0 + 7 * SL + 1, B - 80 * sc, { size: 2.3, mono: true, color: C.warn });
    }
    note("100 complaints, counted by cause", .5, .95);
    note("sorted: the biggest causes come first", 1.6, 1.95);
    note("the line adds them up from the left", 2.6, 2.95);
    note("3 of 7 causes make up 80% of complaints", 3.3, 3.95, C.accent);
    note("late delivery fixed: 63 complaints, a new top cause", 4.6, 9, C.accent);
    K.alpha(1);
  },

  /* ---------- Problem solving: small experiments ---------- */
  experiments(K, S, time){
    const C = K.C, ctx = K.ctx;
    const f = s => 74 - .02337 * (s - 57) ** 2;
    const sx = s => 48 + s * .66, ry = r => 80 - (r - 30) * 1.1;
    const tests = [[20, 1.15], [35, 2.1], [50, 3.05], [70, 3.35], [58, 3.65]];
    const done = tests.filter(([, t]) => S >= t + .1).length;
    const note = (t, a, b, col) => { K.alpha(K.seg(S, a, a + .2) * (1 - K.seg(S, b, b + .1))); K.text(t, 60, 92, { size: 2.7, align: "center", color: col || C.muted, weight: 600 }); };
    // the loop
    const LC = [22, 52], LR = 12;
    K.alpha(K.seg(S, 0, .3));
    ctx.beginPath(); ctx.arc(LC[0], LC[1], LR, 0, Math.PI * 2); ctx.strokeStyle = C.strong; ctx.lineWidth = .4; ctx.stroke();
    if (S >= .8){ const an = -Math.PI / 2 + time * 1.3; K.dot(LC[0] + Math.cos(an) * LR, LC[1] + Math.sin(an) * LR, 1, { fill: C.accent }); }
    [["guess", 0, -1], ["test", 1, 0], ["measure", 0, 1], ["learn", -1, 0]].forEach(([t, dx, dy]) => {
      const x = LC[0] + dx * LR, y = LC[1] + dy * LR;
      K.rect(x - 7.5, y - 3, 15, 6, 3, { fill: C.surface, stroke: C.strong });
      K.text(t, x, y, { size: 2.4, align: "center" });
    });
    if (done){ K.text(`${done} ${done > 1 ? "loops" : "loop"}`, LC[0], LC[1] + LR + 8, { size: 2.5, mono: true, align: "center", color: C.accent }); }
    // chart
    K.alpha(K.seg(S, .1, .4));
    K.line(48, 80, 114, 80, { color: C.strong }); K.line(48, 80, 48, 22, { color: C.strong });
    K.text("setting", 114, 86.5, { size: 2.4, align: "right", color: C.muted });
    K.text("result", 50, 24, { size: 2.4, color: C.muted });
    // the hidden curve, revealed at the end
    const cv = K.seg(S, 4.1, 4.6);
    if (cv > 0){
      K.alpha(cv * .8); ctx.beginPath();
      for (let s = 14; s <= 100; s += 1){ const x = sx(s), y = ry(f(s)); s === 14 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.setLineDash([1, .8]); ctx.strokeStyle = C.muted; ctx.lineWidth = .35; ctx.stroke(); ctx.setLineDash([]);
    }
    // first guess, before any test
    K.alpha(K.seg(S, .4, .7) * (1 - K.seg(S, 1, 1.12)));
    K.line(sx(20), 80, sx(20), 52, { color: C.accent, dash: [1, .8], lw: .4 });
    K.text("guess: 20", sx(20), 48.5, { size: 2.5, align: "center", color: C.accent, weight: 600 });
    // tests
    tests.forEach(([s, t], j) => {
      const a = K.seg(S, t, t + .15);
      if (a <= 0) return;
      const r = f(s), x = sx(s), y = ry(r), worse = j > 0 && r < f(tests[j - 1][0]), best = j === 4;
      if (j){
        const px = sx(tests[j - 1][0]), py = ry(f(tests[j - 1][0])), d = Math.hypot(x - px, y - py);
        K.alpha(K.seg(S, t - .05, t + .1)); K.arrow(px + (x - px) * 2 / d, py + (y - py) * 2 / d, x - (x - px) * 2.2 / d, y - (y - py) * 2.2 / d, { color: worse ? C.warn : C.strong, hs: 1, lw: .35 });
      }
      K.alpha(a);
      K.line(x, 80, x, 81.5, { color: C.strong });
      K.text(String(s), x, 84, { size: 2.2, mono: true, align: "center", color: C.muted });
      if (best && S >= t + .2){ K.dot(x, y, 2.6, { fill: false, stroke: C.ok, lw: .4 }); }
      K.dot(x, y, 1.4, { fill: worse ? C.warn : best ? C.ok : C.accent });
      K.text(String(Math.round(r)), x, y - 4, { size: 2.5, mono: true, align: "center", weight: 600, color: worse ? C.warn : C.ink });
    });
    note("write the guess down before testing it", .5, .95);
    note("one small test: setting 20 gives 42", 1.35, 1.95);
    note("35 scored higher: keep going that way", 2.3, 2.95, C.accent);
    note("70 was worse: too far, so step back to 58", 3.5, 3.95, C.warn);
    note("5 cheap tests found the top without seeing the curve", 4.5, 9, C.ok);
    K.alpha(1);
  },
  /* ---------- How AI is changing software development ---------- */
  aidev(K, S, time){
    const C = K.C;
    const vis = (a, b) => K.seg(S, a, a + .15) * (1 - K.seg(S, b - .12, b));
    const note = (t, a, b, col) => { K.alpha(K.seg(S, a, a + .2) * (1 - K.seg(S, b - .1, b))); K.text(t, 60, 94, { size: 2.7, align: "center", color: col || C.muted, weight: 600 }); };
    const tick = (x, y, a) => { if (a > 0){ K.alpha(a); K.check(x, y, 2.2, C.ok); } };

    // 1. autocomplete, then whole features
    const e0 = vis(0, .55);
    if (e0 > 0){
      K.alpha(e0); K.rect(20, 20, 80, 40, 2.4, { fill: C.surface, stroke: C.strong });
      K.text("report.py", 23, 24.5, { size: 2.4, mono: true, color: C.muted });
      ["def export(rows):", "    out = []", "    for r in rows:"].forEach((l, i) => K.text(l, 24, 32 + i * 6, { size: 2.6, mono: true }));
      const g = e0 * K.seg(S, .15, .3);
      K.alpha(g); K.text("        out.append(r.values())", 24, 50, { size: 2.6, mono: true, color: C.muted });
      K.rect(84, 47.5, 10, 5, 1.2, { stroke: C.strong }); K.text("tab", 89, 50, { size: 2.2, mono: true, align: "center", color: C.muted });
    }
    note("before: AI suggested the next line", .2, .55);
    const f0 = vis(.55, 1.05);
    if (f0 > 0){
      K.alpha(f0); K.rect(4, 22, 42, 14, 2.4, { fill: C.raised, stroke: C.accent, lw: .45 });
      K.text("feature", 7, 26.3, { size: 2.3, color: C.accent, weight: 600 });
      K.text("Export reports as CSV", 7, 31.5, { size: 2.8, weight: 600 });
      K.arrow(47, 29, 53.5, 29, { color: C.strong, hs: 1 });
      K.node(62, 29, 16, 10, "agent", { size: 3, stroke: C.accent, lw: .45 });
      K.line(70, 29, 73, 29, { color: C.strong }); K.line(73, 22, 73, 49, { color: C.strong });
      ["read the codebase", "write the code", "write and run tests", "open a pull request"].forEach((t, i) => {
        const y = 22 + i * 9, a = K.seg(S, .65 + i * .07, .72 + i * .07);
        K.alpha(f0 * a); K.line(73, y, 76, y, { color: C.strong });
        K.rect(76, y - 3.5, 40, 7, 1.6, { fill: C.surface, stroke: C.strong }); K.text(t, 79, y, { size: 2.5 });
        tick(112.5, y, f0 * K.seg(S, .74 + i * .07, .78 + i * .07));
      });
    }
    note("now: a whole feature from one request", .75, 1.05, C.accent);

    // 2. a spec instead of a chat
    const sp = vis(1.02, 2.05);
    if (sp > 0){
      const dim = 1 - .6 * K.seg(S, 1.4, 1.55);
      [["make the export nicer", 0], ["no, keep the old columns", 1], ["now the dates are wrong", 0]].forEach(([t, r], i) => {
        K.alpha(sp * K.seg(S, 1.05 + i * .08, 1.15 + i * .08) * dim);
        K.rect(4 + r * 4, 20 + i * 9, 38, 7, 3.5, { fill: C.surface, stroke: C.strong }); K.text(t, 7 + r * 4, 23.5 + i * 9, { size: 2.4 });
      });
      K.alpha(sp * K.seg(S, 1.3, 1.45) * dim);
      K.text("prompts get read differently", 4, 52, { size: 2.4, color: C.warn }); K.text("and argued over", 4, 56.5, { size: 2.4, color: C.warn });
      const sa = sp * K.seg(S, 1.4, 1.55);
      K.alpha(sa); K.rect(52, 14, 64, 48, 2.4, { fill: C.raised, stroke: C.accent, lw: .45 });
      K.text("spec.md", 55, 18.5, { size: 2.3, mono: true, color: C.muted });
      const rows = [["Goal", 1], ["Export any report as CSV", 0], ["Requirements", 1], ["· keep the column order", 0], ["· handle 100,000 rows", 0], ["Done when", 1], ["· all tests pass", 0], ["· the download starts in 2 s", 0]];
      rows.forEach(([t, h], i) => { K.alpha(sp * K.seg(S, 1.45 + i * .04, 1.52 + i * .04)); K.text(t, 55, 24.5 + i * 4.6, { size: h ? 2.4 : 2.5, weight: h ? 700 : 500, color: h ? C.accent : C.ink }); });
      K.alpha(sp * K.seg(S, 1.75, 1.85)); K.arrow(84, 62.5, 84, 69, { color: C.strong, hs: 1 }); K.node(84, 74, 16, 9, "agent", { size: 2.9 });
      ["code", "tests", "docs"].forEach((t, i) => {
        const x = 64 + i * 20; K.alpha(sp * K.seg(S, 1.85 + i * .04, 1.92 + i * .04));
        K.line(84, 78.5, x, 82.5, { color: C.line }); K.rect(x - 8, 82.5, 16, 6.5, 1.6, { fill: C.surface, stroke: C.ok }); K.text(t, x, 85.75, { size: 2.5, align: "center", color: C.ok, weight: 600 });
      });
    }

    // 3. from implementing to conducting
    const cd = vis(2.02, 3.05);
    if (cd > 0){
      K.alpha(cd * K.seg(S, 2.02, 2.15)); K.rect(20, 12, 80, 13, 2.4, { fill: C.raised, stroke: C.accent, lw: .45 });
      K.text("you decide", 23, 16, { size: 2.3, color: C.accent, weight: 600 });
      K.text("Goal: any report can be exported", 60, 20.5, { size: 2.8, align: "center", weight: 600 });
      [["1 · export API"], ["2 · export button"], ["3 · tests and docs"]].forEach(([t], i) => {
        const x = 3.5 + i * 39.5, a = cd * K.seg(S, 2.15 + i * .06, 2.27 + i * .06), p = K.seg(S, 2.3 + i * .08, 2.6 + i * .08);
        K.alpha(a); K.line(60, 25, x + 17, 37.5, { color: C.line });
        K.rect(x, 37.5, 34, 14, 2, { fill: C.surface, stroke: p >= 1 ? C.ok : C.strong, lw: p >= 1 ? .45 : .35 });
        K.text(t, x + 2.5, 42, { size: 2.6, weight: 600 });
        K.rect(x + 2.5, 46.5, 29, 1.6, .8, { fill: C.raised }); K.rect(x + 2.5, 46.5, 29 * p, 1.6, .8, { fill: p >= 1 ? C.ok : C.accent });
        K.dot(x + 4, 57, 1, { fill: C.accent }); K.text("agent", x + 6.5, 57, { size: 2.3, color: C.muted });
        tick(x + 30.5, 57, a * K.seg(S, 2.62 + i * .08, 2.66 + i * .08));
      });
      K.alpha(cd * K.seg(S, 2.55, 2.7)); K.text("then: the bottleneck was writing code fast", 60, 71, { size: 2.6, align: "center", color: C.muted });
      K.line(28, 71, 92, 71, { color: C.muted, lw: .3 });
      K.alpha(cd * K.seg(S, 2.7, 2.85)); K.text("now: deciding what to build, and how", 60, 79, { size: 2.9, align: "center", color: C.accent, weight: 600 });
    }

    // 4. context engineering and loop engineering
    const lp = vis(3.02, 4.05);
    if (lp > 0){
      K.alpha(lp); K.text("context window", 6, 20.5, { size: 2.5, color: C.muted, weight: 600 });
      K.rect(8, 25, 14, 61, 1.6, { fill: C.surface, stroke: C.strong });
      K.line(6, 26, 24, 26, { color: C.warn, dash: [1, .7], lw: .4 }); K.text("limit", 25.5, 26, { size: 2.3, color: C.warn });
      let y = 86;
      [["instructions", 6], ["relevant code", 22], ["tools", 8], ["skills", 6], ["MCP data", 10]].forEach(([t, h], i) => {
        const g = K.ease(K.seg(S, 3.08 + i * .08, 3.2 + i * .08)), hh = h * g;
        K.alpha(lp); K.rect(8.6, y - hh + .3, 12.8, Math.max(0, hh - .6), .8, { fill: i % 2 ? C.strong : C.fill });
        K.alpha(lp * K.seg(S, 3.15 + i * .08, 3.25 + i * .08)); K.text(t, 25.5, y - h / 2, { size: 2.3, color: C.ink });
        y -= h;
      });
      K.alpha(lp * K.seg(S, 3.5, 3.6)); K.text("room left", 25.5, 30.5, { size: 2.2, mono: true, color: C.muted });
      // the loop
      const L = [88, 52], R = 15, la = lp * K.seg(S, 3.3, 3.45);
      K.alpha(la); K.text("goal: all tests pass", L[0], 25, { size: 2.6, align: "center", color: C.accent, weight: 600 });
      K.ctx.beginPath(); K.ctx.arc(L[0], L[1], R, 0, Math.PI * 2); K.ctx.strokeStyle = C.strong; K.ctx.lineWidth = .4; K.ctx.stroke();
      if (S >= 3.45 && S < 3.86){ const an = -Math.PI / 2 + K.seg(S, 3.45, 3.85) * Math.PI * 6; K.dot(L[0] + Math.cos(an) * R, L[1] + Math.sin(an) * R, 1, { fill: C.accent }); }
      [["agent works", 0, -R], ["run checks", R * .87, R * .5], ["fix failures", -R * .87, R * .5]].forEach(([t, dx, dy]) => {
        const x = L[0] + dx, yy = L[1] + dy;
        K.rect(x - 11, yy - 3.25, 22, 6.5, 3.25, { fill: C.surface, stroke: C.strong }); K.text(t, x, yy, { size: 2.4, align: "center" });
      });
      const pass = Math.min(3, 1 + Math.floor(K.seg(S, 3.45, 3.85) * 3));
      if (S >= 3.45){ K.text(`pass ${pass}`, L[0], L[1], { size: 2.5, mono: true, align: "center", color: C.accent }); }
      const da = lp * K.seg(S, 3.85, 3.95), rx = L[0] + R * .87;
      K.alpha(da); K.arrow(rx, L[1] + R * .5 + 3.5, rx, 75, { color: C.ok, hs: 1 });
      K.rect(rx - 7, 75.5, 14, 6.5, 1.6, { fill: C.surface, stroke: C.ok }); K.text("done", rx, 78.75, { size: 2.5, align: "center", color: C.ok, weight: 600 });
    }
    note("you set the goal and when it's done; the agent loops", 3.55, 4.05, C.accent);

    // 5. how the model runs
    const gp = vis(4.02, 5.05);
    if (gp > 0){
      const W = 104, ww = W * 16 / 24, tokens = 65536 * K.seg(S, 4.3, 4.85), kv = tokens * 131072 / 2 ** 30, full = kv > 7.95;
      K.alpha(gp); K.text("GPU memory · 24 GB", 8, 15.5, { size: 2.6, color: C.muted, weight: 600 });
      K.rect(8, 19, W, 10, 1.6, { fill: C.surface, stroke: C.strong });
      K.alpha(gp * K.seg(S, 4.05, 4.2)); K.rect(8.4, 19.4, ww - .8, 9.2, 1.4, { fill: C.fill });
      K.text("model weights · 16 GB", 11, 24, { size: 2.6, color: C.white, weight: 600 });
      K.text("loaded once, stays put", 11, 33.5, { size: 2.3, color: C.muted });
      if (kv > 0){ K.alpha(gp); K.rect(8 + ww + .3, 19.4, Math.max(.4, W * kv / 24 - .7), 9.2, 1.2, { fill: full ? C.warn : C.accent }); }
      const kx = 8 + ww + 1.5;
      K.alpha(gp * K.seg(S, 4.25, 4.35)); K.text(`KV cache · ${kv.toFixed(1)} GB`, kx, 33.5, { size: 2.4, color: full ? C.warn : C.ink, weight: 600 });
      K.text(`${Math.round(tokens / 1024)}k tokens`, kx, 38, { size: 2.3, mono: true, color: C.muted });
      K.alpha(gp * K.seg(S, 4.85, 4.9)); K.text("memory full", kx, 42.5, { size: 2.3, color: C.warn, weight: 600 });
      const bub = (t, x, y, w, a, me, col) => { K.alpha(gp * a); K.rect(x, y - 3.25, w, 6.5, 3.25, { fill: me ? C.raised : C.surface, stroke: col || C.strong }); K.text(t, x + 3, y, { size: 2.5, color: col ? col : C.ink }); };
      bub("How long to build a small RPG?", 8, 55, 50, K.seg(S, 4.35, 4.45), true);
      bub("Several weeks to a few months.", 62, 63, 50, K.seg(S, 4.45, 4.55));
      bub("Build it.", 8, 74, 20, K.seg(S, 4.6, 4.7), true);
      bub("Playable prototype in 5 minutes.", 62, 82, 50, K.seg(S, 4.72, 4.82), false, C.ok);
    }
    note("it estimates from what it has read, not its own speed", 4.75, 5.05);

    // 6. prompt injection and sandboxes
    const sb = vis(5.02, 6.2);
    if (sb > 0){
      const A = [60, 50], SEC = [18, 50], PR = [100, 22], OUT = [100, 80];
      const box = K.seg(S, 5.58, 5.7);
      K.alpha(sb * K.seg(S, 5.05, 5.2) * (1 - K.seg(S, 5.55, 5.6)));
      K.text("private data + untrusted content + a way out", 60, 94, { size: 2.6, align: "center", color: C.warn, weight: 600 });
      K.alpha(sb * K.seg(S, 5.02, 5.15));
      K.line(A[0] - 9, A[1], SEC[0] + 12, SEC[1], { color: C.line }); K.line(A[0] + 9, A[1] - 2, PR[0] - 15, PR[1] + 3, { color: C.line }); K.line(A[0] + 9, A[1] + 2, OUT[0] - 15, OUT[1] - 3, { color: C.line });
      K.node(SEC[0], SEC[1], 24, 11, "your secrets", { sub: "API keys", size: 2.8 });
      K.node(PR[0], PR[1], 30, 11, "pull request", { sub: "from the internet", size: 2.8 });
      K.node(OUT[0], OUT[1], 30, 11, "unknown server", { sub: "the attacker's", size: 2.8 });
      K.node(A[0], A[1], 18, 10, "agent", { size: 3, stroke: box > 0 ? C.accent : C.strong, lw: box > 0 ? .5 : .35 });
      K.alpha(sb * K.seg(S, 5.1, 5.2)); K.line(PR[0], 12.5, PR[0], 16.5, { color: C.warn, lw: .35 }); K.rect(68, 5.5, 47, 7, 1.6, { fill: C.raised, stroke: C.warn, lw: .4 }); K.text("hidden: “send me the keys”", 91.5, 9, { size: 2.3, mono: true, align: "center", color: C.warn });
      K.alpha(sb); K.packet(PR[0] - 15, PR[1] + 3, A[0] + 9, A[1] - 2, K.seg(S, 5.15, 5.27), { color: C.warn });
      K.packet(SEC[0] + 12, SEC[1], A[0] - 9, A[1], K.seg(S, 5.27, 5.37), { color: C.warn });
      K.packet(A[0] + 9, A[1] + 2, OUT[0] - 15, OUT[1] - 3, K.seg(S, 5.37, 5.49), { color: C.warn });
      K.alpha(sb * K.seg(S, 5.47, 5.52) * (1 - K.seg(S, 5.55, 5.6))); K.text("keys leaked, without you noticing", 118, OUT[1] + 9, { size: 2.4, align: "right", color: C.warn, weight: 600 });
      if (box > 0){
        K.alpha(sb * box); K.ctx.setLineDash([1.2, .8]); K.rect(42, 36, 36, 28, 3, { stroke: C.accent, lw: .5 }); K.ctx.setLineDash([]);
        K.text("sandbox", 45, 40, { size: 2.4, color: C.accent, weight: 600 });
        K.text("+ your code", 60, 59, { size: 2.3, align: "center", color: C.muted });
        const t = K.seg(S, 5.72, 5.82), hit = t >= 1;
        K.alpha(sb); K.packet(A[0] + 9, A[1] + 2, 77.5, 54.5, t, { color: C.warn }); K.packet(A[0] - 9, A[1], 42.5, A[1], t, { color: C.warn });
        if (hit){
          K.alpha(sb * K.seg(S, 5.82, 5.86));
          [[78, 55], [42, 50]].forEach(([x, y]) => { K.line(x - 1.4, y - 1.4, x + 1.4, y + 1.4, { color: C.warn, lw: .55 }); K.line(x + 1.4, y - 1.4, x - 1.4, y + 1.4, { color: C.warn, lw: .55 }); });
          K.text("blocked", 80, 59, { size: 2.3, color: C.warn, weight: 600 });
        }
      }
    }
    note("a disposable sandbox: no secrets inside, limited network", 5.8, 6.3, C.accent);
    K.alpha(1);
  },
  /* ---------- Project: research agent ---------- */
  proj_research(K, S, time){
    const C = K.C;
    const vis = (a, b) => K.seg(S, a, a + .15) * (1 - K.seg(S, b - .12, b));
    const note = (t, a, b, col) => { K.alpha(K.seg(S, a, a + .2) * (1 - K.seg(S, b - .1, b))); K.text(t, 60, 94, { size: 2.7, align: "center", color: col || C.muted, weight: 600 }); };
    // 1. the question
    const q = vis(0, 1.05);
    if (q > 0){
      K.alpha(q * K.seg(S, 0, .15)); K.rect(18, 13, 84, 11, 2.4, { fill: C.raised, stroke: C.accent, lw: .45 });
      K.text("Does a multi-agent loop beat one LLM call?", 60, 18.5, { size: 2.9, align: "center", weight: 600 });
      [[30, "single LLM call", "one prompt, one answer"], [90, "four-agent loop", "four roles, one loop"]].forEach(([x, t, sub], i) => {
        const a = q * K.seg(S, .2 + i * .1, .35 + i * .1);
        K.alpha(a); K.arrow(60, 24, x, 41.5, { color: C.strong, hs: 1 });
        K.node(x, 48, 40, 12, t, { sub, size: 3 });
        K.alpha(q * K.seg(S, .5 + i * .1, .62 + i * .1)); K.packet(x, 54, x, 66, K.seg(S, .45 + i * .1, .6 + i * .1));
        K.rect(x - 14, 66, 28, 9, 2, { fill: C.surface, stroke: C.strong }); K.text(`answer ${"AB"[i]}`, x, 70.5, { size: 2.7, align: "center" });
      });
      K.alpha(q * K.seg(S, .7, .8)); K.text("vs", 60, 70.5, { size: 3, align: "center", color: C.muted, weight: 700 });
    }
    note("a demo can't tell you which one is better", .75, 1.05, C.accent);
    // 2. inside the RAG service
    const r = vis(1.02, 2.05);
    if (r > 0){
      const bm = [["d3", 34], ["d7", 41], ["d1", 48]], dn = [["d7", 56], ["d2", 63], ["d4", 70]];
      K.alpha(r); K.node(10, 50, 14, 9, "query", { size: 2.8 });
      K.alpha(r * K.seg(S, 1.08, 1.2)); K.line(17, 50, 22, 50, { color: C.strong }); K.line(22, 30, 22, 70, { color: C.strong });
      K.node(36, 30, 26, 11, "BM25", { sub: "keyword match", size: 3 }); K.node(36, 70, 26, 11, "dense vectors", { sub: "semantic match", size: 2.8 });
      K.line(22, 30, 23, 30, { color: C.strong }); K.line(22, 70, 23, 70, { color: C.strong });
      K.alpha(r * K.seg(S, 1.25, 1.35)); K.text("candidates", 62, 26, { size: 2.3, align: "center", color: C.muted });
      [...bm.map(c => [...c, C.accent, 30]), ...dn.map(c => [...c, C.ok, 70])].forEach(([id, y, col, fy], i) => {
        const a = K.seg(S, 1.25 + i * .05, 1.35 + i * .05); if (a <= 0) return;
        const yy = K.lerp(fy, y, K.io(a));
        K.alpha(r * a); K.rect(56, yy - 2.6, 12, 5.2, 1.4, { fill: C.surface, stroke: col, lw: .4 }); K.text(id, 62, yy, { size: 2.4, mono: true, align: "center", color: col });
      });
      K.alpha(r * K.seg(S, 1.55, 1.65)); K.arrow(69, 52, 76, 52, { color: C.strong, hs: 1 }); K.node(88, 52, 22, 12, "cross-encoder", { sub: "reranks", size: 2.6 });
      K.alpha(r * K.seg(S, 1.7, 1.8)); K.text("best 3", 112, 37, { size: 2.3, align: "center", color: C.muted });
      ["d7", "d3", "d2"].forEach((id, i) => { const a = K.seg(S, 1.72 + i * .06, 1.82 + i * .06); K.alpha(r * a); K.rect(106, 41 + i * 7 - 2.6, 12, 5.2, 1.4, { fill: C.fill }); K.text(id, 112, 41 + i * 7, { size: 2.4, mono: true, align: "center", color: C.white }); });
      K.alpha(r * K.seg(S, 1.72, 1.82)); K.arrow(99, 52, 105, 48, { color: C.strong, hs: .9 });
    }
    note("keyword and semantic matches, merged and reranked", 1.5, 2.05);
    // 3. the agent loop
    const L = vis(2.02, 3.05);
    if (L > 0){
      const nodes = [[16, "planner", "plans"], [44, "researcher", "finds evidence"], [72, "critic", "reviews"], [101, "synthesizer", "writes"]];
      K.alpha(L); K.text("question", 4, 22, { size: 2.4, color: C.muted }); K.arrow(8, 25, 12, 34, { color: C.strong, hs: .9 });
      nodes.forEach(([x, t, sub], i) => {
        const a = K.seg(S, 2.05 + i * .06, 2.17 + i * .06), on = (S >= 2.3 + i * .13 && S < 2.43 + i * .13) || (i === 1 && S >= 2.62 && S < 2.72);
        K.alpha(L * a); K.node(x, 40, i === 3 ? 26 : 24, 12, t, { sub, size: 2.8, stroke: on ? C.accent : C.strong, lw: on ? .55 : .35 });
        if (i) K.arrow(nodes[i - 1][0] + 12.5, 40, x - (i === 3 ? 13.5 : 12.5), 40, { color: C.strong, hs: .9 });
      });
      K.alpha(L * K.seg(S, 2.3, 2.4)); K.line(44, 46, 44, 63, { color: C.line, dash: [.8, .8] }); K.node(44, 69, 32, 11, "RAG service", { sub: "used as a tool", size: 2.8 });
      K.packet(44, 46, 44, 63.5, K.seg(S, 2.38, 2.46), { r: 1 }); K.packet(44, 63.5, 44, 46, K.seg(S, 2.46, 2.54), { r: 1, color: C.ok });
      const fb = K.seg(S, 2.56, 2.62);
      if (fb > 0){
        K.alpha(L * fb); K.ctx.beginPath(); K.ctx.moveTo(72, 34); K.ctx.quadraticCurveTo(58, 22, 46, 33.5); K.ctx.strokeStyle = C.warn; K.ctx.lineWidth = .45; K.ctx.stroke();
        K.arrow(47.5, 32, 45.5, 34, { color: C.warn, hs: 1.1 });
        K.text("unsupported claim: research again", 58, 20, { size: 2.4, align: "center", color: C.warn, weight: 600, halo: true });
      }
      K.alpha(L * K.seg(S, 2.8, 2.9)); K.arrow(101, 46, 101, 63, { color: C.ok, hs: 1 });
      K.rect(87, 63.5, 28, 10, 2, { fill: C.surface, stroke: C.ok }); K.text("final answer", 101, 68.5, { size: 2.7, align: "center", color: C.ok, weight: 600 });
    }
    note("the critic sends weak drafts back before anything is written", 2.7, 3.05);
    // 4. the benchmark
    const B = vis(3.02, 4.05);
    if (B > 0){
      const qs = ["q01", "q02", "q03", "q04", "q05", "q06"];
      K.alpha(B); K.text("same questions", 4, 18, { size: 2.4, color: C.muted, weight: 600 });
      qs.forEach((t, i) => { K.alpha(B * K.seg(S, 3.03 + i * .03, 3.1 + i * .03)); K.rect(4, 22 + i * 9, 16, 6.5, 1.4, { fill: C.surface, stroke: C.strong }); K.text(t, 12, 25.25 + i * 9, { size: 2.4, mono: true, align: "center" }); });
      const ap = [[50, 32, "agent loop"], [50, 70, "single call"]];
      ap.forEach(([x, y, t], i) => { K.alpha(B * K.seg(S, 3.15 + i * .05, 3.25 + i * .05)); K.node(x, y, 28, 10, t, { size: 2.9 }); K.line(20.5, 49, x - 14, y, { color: C.line }); K.line(x + 14, y, 75, 51, { color: C.line }); });
      K.alpha(B * K.seg(S, 3.25, 3.35)); K.node(84, 51, 18, 10, "scorer", { size: 2.9, stroke: C.accent, lw: .45 });
      for (let k = 0; k < 6; k++){
        const t0 = 3.3 + k * .09, x = k % 2 ? ap[1] : ap[0];
        K.alpha(B); K.packet(20.5, 25.25 + Math.floor(k / 2) * 9, x[0] - 14, x[1], K.seg(S, t0, t0 + .05), { r: .9 });
        K.packet(x[0] + 14, x[1], 75, 51, K.seg(S, t0 + .05, t0 + .1), { r: .9, color: C.ok });
      }
      K.alpha(B * K.seg(S, 3.35, 3.45)); K.text("results.csv", 98, 27, { size: 2.3, mono: true, color: C.muted });
      [["q01", "loop"], ["q01", "call"], ["q02", "loop"], ["q02", "call"], ["q03", "loop"], ["q03", "call"]].forEach(([qq, a], k) => {
        const ra = K.seg(S, 3.42 + k * .09, 3.48 + k * .09); if (ra <= 0) return;
        K.alpha(B * ra); K.line(93, 51, 96, 33 + k * 6, { color: C.line });
        K.text(`${qq} ${a}`, 98, 33 + k * 6, { size: 2.3, mono: true }); K.check(116, 33 + k * 6, 1.8, C.ok);
      });
    }
    note("both approaches, the same questions, scored the same way", 3.6, 4.05, C.accent);
    // 5. anyone can rerun it
    const R5 = vis(4.02, 5.2);
    if (R5 > 0){
      const st = [[14, "git push", ""], [42, "GitHub Actions", ""], [72, "pytest", "no API keys"], [102, "all tests pass", ""]];
      st.forEach(([x, t, sub], i) => {
        const a = K.seg(S, 4.05 + i * .12, 4.17 + i * .12), last = i === 3;
        K.alpha(R5 * a); K.node(x, 36, last ? 28 : 26, 11, t, { sub: sub || undefined, size: 2.7, stroke: last ? C.ok : C.strong, color: last ? C.ok : C.ink, lw: last ? .5 : .35 });
        if (i){ K.arrow(st[i - 1][0] + 13.5, 36, x - (last ? 14.5 : 13.5), 36, { color: C.strong, hs: .9 }); K.packet(st[i - 1][0] + 13.5, 36, x - 13.5, 36, K.seg(S, 4.05 + i * .12, 4.15 + i * .12), { r: .9 }); }
      });
      const ka = R5 * K.seg(S, 4.55, 4.7);
      K.alpha(ka); K.rect(24, 54, 72, 12, 2.4, { fill: C.surface, stroke: C.strong });
      K.text("API keys needed to run the tests", 60, 60, { size: 2.8, align: "center", color: C.muted });
      K.alpha(ka * K.seg(S, 4.65, 4.75)); K.line(26, 60, 94, 60, { color: C.warn, lw: .5 });
      K.alpha(ka * K.seg(S, 4.72, 4.82)); K.text("none: anyone can clone it and rerun the benchmark", 60, 74, { size: 2.7, align: "center", color: C.ok, weight: 600 });
    }
    K.alpha(1);
  },

  /* ---------- Project: schools dashboard ---------- */
  proj_schools(K, S, time){
    const C = K.C;
    const vis = (a, b) => K.seg(S, a, a + .15) * (1 - K.seg(S, b - .12, b));
    const note = (t, a, b, col) => { K.alpha(K.seg(S, a, a + .2) * (1 - K.seg(S, b - .1, b))); K.text(t, 60, 94, { size: 2.7, align: "center", color: col || C.muted, weight: 600 }); };
    const person = (x, y, a, col) => { K.alpha(a); K.dot(x, y - 3, 2.2, { fill: col || C.ink }); K.ctx.beginPath(); K.ctx.arc(x, y + 4, 4, Math.PI, 0); K.ctx.fillStyle = col || C.ink; K.ctx.fill(); };
    // 1. sign-in
    const s1 = vis(0, 1.05);
    if (s1 > 0){
      person(14, 48, s1 * K.seg(S, 0, .15)); K.text("client staff", 14, 59, { size: 2.4, align: "center", color: C.muted });
      K.alpha(s1 * K.seg(S, .15, .3)); K.arrow(21, 48, 33, 48, { color: C.strong, hs: 1 }); K.node(48, 48, 28, 12, "client's sign-in", { sub: "SSO", size: 2.8 });
      K.alpha(s1 * K.seg(S, .35, .5)); K.arrow(62.5, 48, 74, 48, { color: C.strong, hs: 1 });
      K.packet(62.5, 48, 74, 48, K.seg(S, .4, .55), { color: C.ok });
      K.alpha(s1 * K.seg(S, .5, .62)); K.node(91, 48, 32, 12, "dashboard", { sub: "behind their sign-in", size: 3, stroke: C.accent, lw: .5 });
      K.alpha(s1 * K.seg(S, .3, .45)); K.text("same accounts they already use", 48, 61, { size: 2.3, align: "center", color: C.muted });
    }
    note("one sign-in, through the client's own identity system", .65, 1.05, C.accent);
    // 2. hundreds of schools, one API
    const s2 = vis(1.02, 2.05);
    if (s2 > 0){
      const cols = 16, rows = 14, x0 = 5, y0 = 18, gap = 2.6;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++){
        const k = r * cols + c, a = K.seg(S, 1.05 + (k / (rows * cols)) * .3, 1.15 + (k / (rows * cols)) * .3);
        if (a <= 0) continue;
        const pulse = .55 + .45 * Math.sin(time * 2 + k * .7);
        K.alpha(s2 * a * pulse); K.dot(x0 + c * gap, y0 + r * gap * 1.55, .55, { fill: C.accent });
      }
      K.alpha(s2 * K.seg(S, 1.3, 1.45)); K.text("hundreds of schools", 24.5, 81, { size: 2.6, align: "center", color: C.muted, weight: 600 });
      K.alpha(s2 * K.seg(S, 1.4, 1.55));
      for (let i = 0; i < 6; i++){ const y = 22 + i * 10; K.line(45, y, 58, 50, { color: C.line }); K.packet(45, y, 58, 50, (time * .6 + i / 6) % 1, { r: .7 }); }
      K.node(68, 50, 20, 11, "FastAPI", { sub: "one API", size: 3, stroke: C.accent, lw: .5 });
      K.alpha(s2 * K.seg(S, 1.55, 1.7)); K.arrow(78.5, 50, 87, 50, { color: C.strong, hs: 1 }); K.node(102, 50, 28, 11, "dashboard", { size: 3 });
    }
    note("every school's data behind one API", 1.6, 2.05);
    // 3. the dashboard
    const s3 = vis(2.02, 3.05);
    if (s3 > 0){
      K.alpha(s3); K.rect(4, 10, 112, 78, 2.4, { fill: C.surface, stroke: C.strong });
      K.text("Schools overview", 8, 15.5, { size: 2.9, weight: 700 });
      ["all districts", "this term"].forEach((t, i) => { K.rect(70 + i * 23, 12.5, 21, 6, 3, { stroke: C.strong }); K.text(t, 80.5 + i * 23, 15.5, { size: 2.2, align: "center", color: C.muted }); });
      const card = (x, y, w, h, t, a) => { K.alpha(s3 * a); K.rect(x, y, w, h, 2, { fill: C.raised, stroke: C.line }); K.text(t, x + 3, y + 4.5, { size: 2.5, color: C.muted, weight: 600 }); };
      // attendance line
      const a1 = K.seg(S, 2.1, 2.25); card(8, 22, 50, 30, "Attendance", a1);
      const pts = [62, 66, 64, 70, 68, 73, 71, 76, 74, 78].map((v, i) => [12 + i * 4.7, 48 - (v - 55) * .7]);
      const p1 = K.seg(S, 2.2, 2.5) * (pts.length - 1);
      K.alpha(s3 * a1); K.ctx.beginPath(); pts.forEach(([x, y], i) => { if (i <= p1 + 1){ const t = K.clamp(p1 - i + 1); const px = i ? K.lerp(pts[i - 1][0], x, t) : x, py = i ? K.lerp(pts[i - 1][1], y, t) : y; i ? K.ctx.lineTo(px, py) : K.ctx.moveTo(px, py); } }); K.ctx.strokeStyle = C.accent; K.ctx.lineWidth = .6; K.ctx.stroke();
      // performance bars
      const a2 = K.seg(S, 2.2, 2.35); card(62, 22, 50, 30, "Performance", a2);
      [.55, .72, .64, .8, .68].forEach((v, i) => { const h = 18 * v * K.ease(K.seg(S, 2.3 + i * .04, 2.5 + i * .04)); K.alpha(s3 * a2); K.rect(67 + i * 9, 49 - h, 6, h, .8, { fill: i === 3 ? C.accent : C.strong }); });
      // risk list
      const a3 = K.seg(S, 2.35, 2.5); card(8, 56, 104, 28, "Students at risk", a3);
      ["School A", "School B", "School C"].forEach((t, i) => {
        const ra = s3 * K.seg(S, 2.5 + i * .08, 2.6 + i * .08);
        K.alpha(ra); K.dot(13, 66 + i * 6, 1, { fill: C.warn }); K.text(t, 16, 66 + i * 6, { size: 2.5 });
        K.rect(84, 64.2 + i * 6, 24, 3.6, 1.8, { fill: C.raised, stroke: C.line }); K.rect(84, 64.2 + i * 6, 24 * [.7, .45, .3][i], 3.6, 1.8, { fill: C.warn });
      });
    }
    note("attendance, performance and risk in one place", 2.7, 3.05, C.accent);
    // 4. export
    const s4 = vis(3.02, 4.05);
    if (s4 > 0){
      const press = K.seg(S, 3.2, 3.25) * (1 - K.seg(S, 3.3, 3.35));
      K.alpha(s4); K.rect(10, 20, 36, 10, 2.4, { fill: press > 0 ? C.fill : C.raised, stroke: C.accent, lw: .5 });
      K.text("Export to Excel", 28, 25, { size: 2.8, align: "center", weight: 600, color: press > 0 ? C.white : C.ink });
      const sh = K.ease(K.seg(S, 3.35, 3.7));
      if (sh > 0){
        const x0 = 54, y0 = K.lerp(30, 18, sh), cw = [24, 14, 14, 12], heads = ["school", "attend.", "perf.", "risk"];
        K.alpha(s4 * sh); K.rect(x0, y0, 62, 62, 2, { fill: C.surface, stroke: C.ok, lw: .45 });
        K.text("report.xlsx", x0 + 3, y0 + 4, { size: 2.3, mono: true, color: C.ok });
        let cx = x0 + 2;
        cw.forEach((w, c) => { K.text(heads[c], cx + 1, y0 + 10, { size: 2.2, color: C.muted, weight: 600 }); cx += w; });
        for (let r = 0; r < 7; r++){
          const ra = K.seg(S, 3.45 + r * .05, 3.52 + r * .05); if (ra <= 0) continue;
          const y = y0 + 16 + r * 6.2; K.alpha(s4 * sh * ra); K.line(x0 + 2, y - 3.1, x0 + 60, y - 3.1, { color: C.line, lw: .2 });
          let xx = x0 + 3;
          cw.forEach((w, c) => { K.rect(xx, y - 1, c ? w * .55 : w * .8, 1.6, .8, { fill: c === 3 && r % 3 === 1 ? C.warn : C.strong }); xx += w; });
        }
      }
      K.alpha(s4 * K.seg(S, 3.3, 3.4)); K.arrow(46.5, 25, 53, 25, { color: C.ok, hs: 1 });
    }
    note("the same numbers, ready for a spreadsheet", 3.6, 4.05);
    // 5. shipping
    const s5 = vis(4.02, 5.2);
    if (s5 > 0){
      K.alpha(s5); K.node(14, 50, 20, 11, "GitLab", { sub: "pipeline", size: 3 });
      [["dev", 30, 4.15], ["prod", 70, 4.5]].forEach(([env, y, t0]) => {
        const a = s5 * K.seg(S, t0 - .05, t0 + .05);
        K.alpha(a); K.ctx.setLineDash([1, .7]); K.rect(32, y - 15, 84, 30, 2.4, { stroke: env === "prod" ? C.accent : C.strong, lw: .45 }); K.ctx.setLineDash([]);
        K.text(`${env} server`, 35, y - 11, { size: 2.4, color: env === "prod" ? C.accent : C.muted, weight: 600 });
        [["nginx", 48], ["gunicorn", 74], ["FastAPI", 100]].forEach(([t, x], i) => { K.node(x, y + 1, 20, 9, t, { size: 2.7 }); if (i) K.arrow(x - 16, y + 1, x - 10.5, y + 1, { color: C.strong, hs: .8 }); });
        K.text("kept running by systemd", 74, y + 10.5, { size: 2.2, align: "center", color: C.muted });
        K.alpha(s5); K.line(24.5, 50, 31.5, y, { color: C.line }); K.packet(24.5, 50, 31.5, y, K.seg(S, t0 - .1, t0), { r: 1 });
      });
    }
    note("tested in dev, then shipped to prod", 4.6, 5.2, C.accent);
    K.alpha(1);
  },

  /* ---------- Project: chatbots and outreach ---------- */
  proj_bots(K, S, time){
    const C = K.C;
    const vis = (a, b) => K.seg(S, a, a + .15) * (1 - K.seg(S, b - .12, b));
    const note = (t, a, b, col) => { K.alpha(K.seg(S, a, a + .2) * (1 - K.seg(S, b - .1, b))); K.text(t, 60, 94, { size: 2.7, align: "center", color: col || C.muted, weight: 600 }); };
    const doc = (x, y, a) => { K.alpha(a); K.rect(x, y, 10, 13, 1.2, { fill: C.surface, stroke: C.strong }); for (let i = 0; i < 4; i++) K.rect(x + 2, y + 3 + i * 2.4, i === 3 ? 4 : 6, .8, .4, { fill: C.strong }); };
    const pine = (a, hl) => {
      K.alpha(a); K.rect(76, 26, 40, 46, 2.4, { stroke: C.strong }); K.text("Pinecone", 79, 30.5, { size: 2.5, color: C.muted, weight: 600 });
      for (let i = 0; i < 22; i++){ const x = 82 + ((i * 37) % 29), y = 38 + ((i * 53) % 29); K.alpha(a * (hl && [3, 9, 14].includes(i) ? 1 : .65)); K.dot(x, y, hl && [3, 9, 14].includes(i) ? 1.3 : .8, { fill: hl && [3, 9, 14].includes(i) ? C.accent : C.strong }); }
    };
    // 1. content becomes searchable
    const s1 = vis(0, 1.05);
    if (s1 > 0){
      [["FAQ", 8, 28], ["catalog", 8, 46], ["policies", 8, 64]].forEach(([t, x, y], i) => { doc(x, y, s1 * K.seg(S, i * .06, .12 + i * .06)); K.text(t, x + 13, y + 6.5, { size: 2.5 }); });
      K.alpha(s1 * K.seg(S, .2, .3)); K.text("split into chunks", 48, 40, { size: 2.4, align: "center", color: C.muted });
      for (let i = 0; i < 9; i++){ const t = K.seg(S, .3 + i * .03, .5 + i * .03); K.alpha(s1 * (t > 0 && t < 1 ? 1 : 0)); K.rect(K.lerp(24, 70, K.io(t)) - 2, K.lerp(32 + (i % 3) * 18, 44 + (i % 3) * 4, K.io(t)) - 1.2, 4, 2.4, .6, { fill: C.accent }); }
      pine(s1 * K.seg(S, .25, .4), false);
    }
    note("the client's own content, indexed as vectors", .6, 1.05, C.accent);
    // 2. the chatbot answers from it
    const s2 = vis(1.02, 2.05);
    if (s2 > 0){
      pine(s2, S >= 1.35);
      const bub = (t, x, y, w, a, me, col) => { K.alpha(s2 * a); K.rect(x, y - 3.5, w, 7, 3.5, { fill: me ? C.raised : C.surface, stroke: col || C.strong }); K.text(t, x + 3, y, { size: 2.5, color: col || C.ink }); };
      bub("Do you deliver on Sundays?", 4, 24, 47, K.seg(S, 1.05, 1.15), true);
      K.alpha(s2 * K.seg(S, 1.15, 1.25)); K.node(34, 46, 22, 11, "chatbot", { sub: "Gemini", size: 3, stroke: C.accent, lw: .5 });
      K.packet(45, 46, 76, 46, K.seg(S, 1.25, 1.35), { r: 1 }); K.packet(76, 50, 45, 50, K.seg(S, 1.4, 1.5), { r: 1, color: C.ok });
      bub("Yes, 9 am to 1 pm. (from your FAQ)", 4, 70, 56, K.seg(S, 1.55, 1.65), false, C.ok);
      K.alpha(s2 * K.seg(S, 1.7, 1.8)); K.text("PHP or Python, matching the client's stack", 34, 82, { size: 2.3, align: "center", color: C.muted });
    }
    note("answers come from the documents, not from memory", 1.75, 2.05);
    // 3-5. the outreach workflow
    const wf = vis(2.02, 5.2);
    if (wf > 0){
      const nodes = [["scrape", 14], ["Airtable", 38], ["OpenAI", 62], ["WhatsApp", 86]];
      const act = S < 3 ? 0 : S < 4 ? 1.5 : 3;
      K.alpha(wf); K.text("n8n workflow", 4, 12, { size: 2.4, color: C.muted, weight: 600 });
      K.packet(20, 20, 102, 20, (time * .25) % 1, { r: .8 });
      nodes.forEach(([t, x], i) => {
        const on = Math.abs(i - act) < .6 || (act === 1.5 && (i === 1 || i === 2));
        K.alpha(wf * K.seg(S, 2.05 + i * .05, 2.15 + i * .05)); K.node(x + 6, 20, 20, 9, t, { size: 2.7, stroke: on ? C.accent : C.strong, lw: on ? .55 : .35 });
        if (i) K.arrow(nodes[i - 1][1] + 16, 20, x - 4, 20, { color: C.strong, hs: .9 });
      });
      const leads = [["Bakery on Main St", "new"], ["City Gym", "new"], ["Corner Café", "new"], ["Dental Studio", "new"]];
      // step 3: leads found
      const l3 = K.seg(S, 2.2, 2.3) * (1 - K.seg(S, 2.95, 3.05));
      if (l3 > 0){
        K.alpha(wf * l3); K.text("lead scraping", 6, 34, { size: 2.4, color: C.muted });
        leads.forEach(([n], i) => { const a = K.seg(S, 2.3 + i * .1, 2.4 + i * .1); K.alpha(wf * l3 * a); K.rect(6, 38 + i * 9, 48, 7, 1.6, { fill: C.surface, stroke: C.strong }); K.text(n, 9, 41.5 + i * 9, { size: 2.5 }); K.arrow(56, 41.5 + i * 9, 64, 41.5 + i * 9, { color: C.accent, hs: .8 }); });
        K.alpha(wf * l3 * K.seg(S, 2.6, 2.7)); K.text("found and collected", 68, 55, { size: 2.6, color: C.accent, weight: 600 });
      }
      // steps 4 and 5: the Airtable table
      const tb = K.seg(S, 3.02, 3.15);
      if (tb > 0){
        const sent = i => K.seg(S, 4.3 + i * .12, 4.36 + i * .12);
        K.alpha(wf * tb); K.rect(4, 30, 56, 46, 2, { fill: C.surface, stroke: C.strong });
        K.text("lead", 7, 35, { size: 2.3, color: C.muted, weight: 600 }); K.text("status", 44, 35, { size: 2.3, color: C.muted, weight: 600 });
        leads.forEach(([n], i) => {
          const y = 42 + i * 8.5, s = sent(i), dr = K.seg(S, 3.3 + i * .1, 3.4 + i * .1);
          K.alpha(wf * tb); K.line(5, y - 4.2, 59, y - 4.2, { color: C.line, lw: .2 }); K.text(n, 7, y, { size: 2.4 });
          const st = s > 0 ? "sent" : dr > 0 ? "drafted" : "new";
          K.text(st, 44, y, { size: 2.3, mono: true, color: st === "sent" ? C.ok : st === "drafted" ? C.accent : C.muted });
        });
        // drafting
        const dA = K.seg(S, 3.25, 3.35) * (1 - K.seg(S, 3.95, 4.05));
        if (dA > 0){
          K.alpha(wf * dA); K.rect(64, 34, 52, 34, 2, { fill: C.raised, stroke: C.accent, lw: .45 });
          K.text("draft for City Gym", 67, 39, { size: 2.3, color: C.accent, weight: 600 });
          K.typed(["Hi! I saw City Gym's page", "and thought you might like", "a quick way to answer", "members on WhatsApp..."], K.seg(S, 3.35, 3.85), 67, 45, 4.6, { size: 2.4 });
        }
        // phone
        const ph = K.seg(S, 4.02, 4.15);
        if (ph > 0){
          K.alpha(wf * ph); K.rect(78, 30, 30, 56, 4, { fill: C.surface, stroke: C.strong }); K.rect(88, 32.5, 10, 1.4, .7, { fill: C.strong });
          K.text("WhatsApp", 93, 37.5, { size: 2.3, align: "center", color: C.muted });
          leads.forEach(([n], i) => { const s = sent(i); if (s <= 0) return; K.alpha(wf * s); K.rect(81, 42 + i * 10, 24, 7.5, 2.2, { fill: C.fill }); K.text(n.split(" ")[0] + "…", 83, 45.75 + i * 10, { size: 2.3, color: C.white }); });
          K.alpha(wf); leads.forEach((l, i) => K.packet(60, 42 + i * 8.5, 80, 45.75 + i * 10, K.seg(S, 4.2 + i * .12, 4.3 + i * .12), { r: .9, color: C.ok }));
        }
      }
    }
    note("leads collected automatically, no copying by hand", 2.6, 3.05);
    note("stored in Airtable, each message drafted by the OpenAI API", 3.5, 4.05);
    note("sent on WhatsApp, and the table keeps track", 4.75, 5.2, C.accent);
    K.alpha(1);
  },

  /* ---------- Services ---------- */
  services(K, S, time){
    const C = K.C;
    const vis = (a, b) => K.seg(S, a, a + .15) * (1 - K.seg(S, b - .12, b));
    const note = (t, a, b, col) => { K.alpha(K.seg(S, a, a + .2) * (1 - K.seg(S, b - .1, b))); K.text(t, 60, 94, { size: 2.7, align: "center", color: col || C.muted, weight: 600 }); };
    // 1. add AI to your product
    const s1 = vis(0, 1.05);
    if (s1 > 0){
      ["handbook.pdf", "pricing.xlsx", "tickets"].forEach((t, i) => { K.alpha(s1 * K.seg(S, i * .05, .12 + i * .05)); K.rect(4, 20 + i * 10, 26, 7, 1.6, { fill: C.surface, stroke: C.strong }); K.text(t, 7, 23.5 + i * 10, { size: 2.4, mono: true }); });
      K.alpha(s1 * K.seg(S, .12, .22)); K.text("your documents", 4, 15.5, { size: 2.4, color: C.muted, weight: 600 });
      K.arrow(31, 33.5, 39, 33.5, { color: C.strong, hs: 1 }); K.node(50, 33.5, 20, 11, "retrieval", { sub: "tuned", size: 2.9 });
      K.alpha(s1 * K.seg(S, .25, .35)); K.arrow(60.5, 33.5, 66, 33.5, { color: C.strong, hs: 1 });
      K.rect(66, 18, 50, 31, 2.4, { fill: C.raised, stroke: C.accent, lw: .45 }); K.text("assistant", 69, 22.5, { size: 2.3, color: C.accent, weight: 600 });
      K.typed(["Refunds take 5 business", "days on annual plans [1].", "Contact billing for", "exceptions [2]."], K.seg(S, .3, .55), 69, 28, 4.6, { size: 2.5 });
      // evaluation set
      const ev = s1 * K.seg(S, .55, .65);
      K.alpha(ev); K.text("evaluation set", 4, 60, { size: 2.4, color: C.muted, weight: 600 });
      for (let i = 0; i < 20; i++){
        const a = K.seg(S, .6 + i * .015, .65 + i * .015), ok = ![6, 13].includes(i), x = 6 + (i % 10) * 7, y = 67 + Math.floor(i / 10) * 8;
        K.alpha(ev * a); K.rect(x - 2.6, y - 2.6, 5.2, 5.2, 1, { fill: C.surface, stroke: ok ? C.ok : C.warn, lw: .35 });
        if (ok) K.check(x, y, 1.6, C.ok); else { K.line(x - 1, y - 1, x + 1, y + 1, { color: C.warn, lw: .45 }); K.line(x + 1, y - 1, x - 1, y + 1, { color: C.warn, lw: .45 }); }
      }
      K.alpha(ev * K.seg(S, .9, .95)); K.text("18 / 20", 98, 71, { size: 4, align: "center", weight: 700, color: C.accent, mono: true }); K.text("measured, not guessed", 98, 77.5, { size: 2.3, align: "center", color: C.muted });
    }
    note("answers that cite your documents, checked against an evaluation set", .7, 1.05);
    // 2. build the whole product
    const s2 = vis(1.02, 2.05);
    if (s2 > 0){
      const layers = [["Database", C.strong], ["API", C.strong], ["Auth and roles", C.strong], ["React interface", C.fill], ["Deploy and monitoring", C.accent]];
      layers.forEach(([t, col], i) => {
        const a = K.ease(K.seg(S, 1.08 + i * .1, 1.22 + i * .1)); if (a <= 0) return;
        const y = K.lerp(10, 78 - i * 13, a);
        K.alpha(s2 * a); K.rect(6, y - 5, 52, 10, 2, { fill: i === 4 ? C.surface : col, stroke: i === 4 ? C.accent : col, lw: .45 });
        K.text(t, 32, y, { size: 2.8, align: "center", weight: 600, color: i === 4 ? C.accent : C.white });
      });
      const pv = s2 * K.seg(S, 1.6, 1.75);
      K.alpha(pv); K.rect(66, 22, 50, 50, 2.4, { fill: C.surface, stroke: C.strong });
      [0, 1, 2].forEach(i => K.dot(70 + i * 3, 25.5, .8, { fill: C.strong }));
      K.rect(70, 31, 20, 3, 1, { fill: C.strong }); K.rect(70, 38, 42, 12, 1.6, { fill: C.raised });
      [0, 1, 2].forEach(i => K.rect(70 + i * 14.5, 54, 13, 13, 1.6, { fill: C.raised }));
      K.rect(98, 30, 14, 5, 2.5, { fill: C.fill });
      K.alpha(pv * K.seg(S, 1.75, 1.85)); K.text("one person owns all of it", 91, 80, { size: 2.6, align: "center", color: C.accent, weight: 600 });
    }
    note("from the database to the deploy, plus the handover", 1.7, 2.05);
    // 3. automate a workflow
    const s3 = vis(2.02, 3.05);
    if (s3 > 0){
      const ch = [["new lead", 14], ["enrich", 38], ["LLM step", 62], ["CRM + report", 90]];
      K.alpha(s3); K.text("every morning, by itself", 6, 24, { size: 2.5, color: C.accent, weight: 600 });
      for (let k = 0; k < 4; k++){ K.alpha(s3); K.packet(14, 40, 90, 40, ((time * .35) + k / 4) % 1, { r: .9 }); }
      ch.forEach(([t, x], i) => { K.alpha(s3 * K.seg(S, 2.05 + i * .06, 2.15 + i * .06)); K.node(x, 40, i === 3 ? 28 : 20, 10, t, { size: 2.7 }); if (i) K.arrow(ch[i - 1][1] + 10.5, 40, x - (i === 3 ? 14.5 : 10.5), 40, { color: C.strong, hs: .9 }); });
      const runs = Math.floor(K.seg(S, 2.3, 2.9) * 30);
      K.alpha(s3 * K.seg(S, 2.3, 2.4));
      K.text(`${runs}`, 60, 62, { size: 7, align: "center", weight: 700, mono: true, color: C.accent });
      K.text("runs this month, no copy and paste", 60, 70, { size: 2.6, align: "center", color: C.muted });
    }
    note("the tools you already use, connected", 2.6, 3.05);
    // 4. how a project runs
    const s4 = vis(3.02, 4.2);
    if (s4 > 0){
      const stops = [["intro call", "15 min", 14], ["written plan", "scope and price", 40], ["weekly demos", "working software", 68], ["handover", "deployed, documented", 100]];
      const prog = K.seg(S, 3.15, 3.85);
      K.alpha(s4); K.line(14, 44, 100, 44, { color: C.strong, lw: .5 });
      K.alpha(s4); K.line(14, 44, K.lerp(14, 100, prog), 44, { color: C.accent, lw: .7 });
      stops.forEach(([t, sub, x], i) => {
        const reached = prog >= (x - 14) / 86 - .001, a = s4 * K.seg(S, 3.05 + i * .05, 3.15 + i * .05);
        K.alpha(a); K.dot(x, 44, 2.2, { fill: reached ? C.accent : C.surface, stroke: reached ? C.accent : C.strong, lw: .4 });
        K.text(t, x, 36, { size: 2.7, align: "center", weight: 600 }); K.text(sub, x, 52, { size: 2.3, align: "center", color: C.muted });
      });
      ["w1", "w2", "w3", "w4"].forEach((w, i) => { const a = K.seg(S, 3.5 + i * .07, 3.56 + i * .07); K.alpha(s4 * a); K.rect(52 + i * 8.5, 58, 7, 5.5, 1.2, { fill: C.surface, stroke: C.ok }); K.text(w, 55.5 + i * 8.5, 60.75, { size: 2.1, mono: true, align: "center", color: C.ok }); });
      K.alpha(s4 * K.seg(S, 3.85, 3.95)); K.text("you see progress every week, not only at the end", 60, 78, { size: 2.7, align: "center", color: C.accent, weight: 600 });
    }
    K.alpha(1);
  },
  /* ---------- RLHF ---------- */
  rlhf(K, S, time){
    const C = K.C, ctx = K.ctx;
    const vis = (a, b) => K.seg(S, a, a + .15) * (1 - K.seg(S, b - .12, b));
    const note = (t, a, b, col) => { K.alpha(K.seg(S, a, a + .2) * (1 - K.seg(S, b - .1, b))); K.text(t, 60, 94, { size: 2.7, align: "center", color: col || C.muted, weight: 600 }); };
    const sig = z => 1 / (1 + Math.exp(-z));
    const person = (x, y, a) => { K.alpha(a); K.dot(x, y - 3, 2.1, { fill: C.ink }); ctx.beginPath(); ctx.arc(x, y + 3.6, 3.8, Math.PI, 0); ctx.fillStyle = C.ink; ctx.fill(); };
    // 1. supervised fine-tuning
    const s1 = vis(0, 1.05);
    if (s1 > 0){
      K.alpha(s1 * K.seg(S, 0, .15)); K.node(16, 56, 26, 12, "base model", { sub: "continues text", size: 2.9 });
      K.alpha(s1 * K.seg(S, .15, .3)); K.arrow(29.5, 56, 82.5, 56, { color: C.strong, hs: 1.1 });
      K.text("supervised fine-tuning", 57, 62, { size: 2.5, align: "center", color: C.muted });
      [["Q: Summarize this email", "A: written by a person"], ["Q: Explain DNS simply", "A: written by a person"], ["Q: Fix this SQL query", "A: written by a person"]].forEach(([q, a], i) => {
        const t = K.seg(S, .2 + i * .1, .32 + i * .1), y = 14 + i * 3;
        K.alpha(s1 * t); K.rect(35 + i * 3, y, 46, 11, 1.8, { fill: C.surface, stroke: C.strong });
        if (i === 2){ K.text(q, 38 + i * 3, y + 3.8, { size: 2.2, mono: true, color: C.muted }); K.text(a, 38 + i * 3, y + 7.6, { size: 2.2, mono: true }); }
        K.packet(58, 39, 58, 55, K.seg(S, .35 + i * .1, .5 + i * .1), { r: .9 });
      });
      K.alpha(s1 * K.seg(S, .3, .4)); K.text("demonstrations", 58, 11, { size: 2.4, align: "center", color: C.muted, weight: 600 });
      K.alpha(s1 * K.seg(S, .6, .75)); K.node(100, 56, 33, 12, "SFT model", { sub: "follows instructions", size: 2.9, stroke: C.accent, lw: .5 });
    }
    note("stage 1: imitate good answers written by people", .5, 1.05, C.accent);
    // 2. comparisons
    const s2 = vis(1.02, 2.05);
    if (s2 > 0){
      const pick = K.seg(S, 1.55, 1.65);
      K.alpha(s2); K.rect(16, 10, 88, 9, 2, { fill: C.raised, stroke: C.strong }); K.text("How do I reset my password?", 60, 14.5, { size: 2.8, align: "center", weight: 600 });
      [[6, ["Go to Settings › Security,", "choose Reset password and", "follow the emailed link."], true], [64, ["Passwords can be reset in", "many ways depending on", "your setup."], false]].forEach(([x, lines, good], i) => {
        const a = s2 * K.seg(S, 1.08 + i * .1, 1.2 + i * .1);
        K.alpha(a * (good ? 1 : 1 - pick * .45));
        K.rect(x, 25, 50, 25, 2, { fill: C.surface, stroke: pick > 0 ? (good ? C.ok : C.warn) : C.strong, lw: pick > 0 ? .5 : .35 });
        K.text(`answer ${"AB"[i]}`, x + 3, 29.5, { size: 2.4, color: C.muted, weight: 600 });
        K.typed(lines, K.seg(S, 1.12 + i * .1, 1.4 + i * .1), x + 3, 35, 4.6, { size: 2.5 });
        if (pick > 0){ K.alpha(a * pick); K.text(good ? "preferred" : "rejected", x + 47, 29.5, { size: 2.4, align: "right", color: good ? C.ok : C.warn, weight: 700 }); }
      });
      person(60, 64, s2 * K.seg(S, 1.4, 1.5)); K.text("labeler", 60, 73, { size: 2.4, align: "center", color: C.muted });
      K.alpha(s2 * pick); K.arrow(56, 61, 36, 51.5, { color: C.ok, hs: 1.1, lw: .45 });
      K.alpha(s2 * K.seg(S, 1.7, 1.8)); K.text("A ≻ B", 60, 82, { size: 3.4, mono: true, align: "center", color: C.accent, weight: 600 });
    }
    note("stage 2: people compare answers, which is easier than scoring them", 1.5, 2.05);
    // 3. reward model
    const s3 = vis(2.02, 3.05);
    if (s3 > 0){
      const rA = 1.8, rB = -0.4, p = sig(rA - rB), loss = -Math.log(p);
      K.alpha(s3); K.rect(4, 22, 20, 8, 1.6, { fill: C.surface, stroke: C.ok }); K.text("answer A", 14, 26, { size: 2.5, align: "center", color: C.ok });
      K.rect(4, 36, 20, 8, 1.6, { fill: C.surface, stroke: C.warn }); K.text("answer B", 14, 40, { size: 2.5, align: "center", color: C.warn });
      K.alpha(s3 * K.seg(S, 2.08, 2.2)); K.arrow(24.5, 26, 38.5, 31, { color: C.strong, hs: 1 }); K.arrow(24.5, 40, 38.5, 35, { color: C.strong, hs: 1 });
      K.node(59, 33, 40, 13, "reward model", { sub: "SFT copy + score head", size: 3, stroke: C.accent, lw: .5 });
      const ra = s3 * K.seg(S, 2.25, 2.4);
      K.alpha(ra); K.arrow(79.5, 31, 86, 26, { color: C.strong, hs: 1 }); K.arrow(79.5, 35, 86, 40, { color: C.strong, hs: 1 });
      K.text(`r(A) = ${rA.toFixed(1)}`, 88, 26, { size: 2.8, mono: true, color: C.ok, weight: 600 });
      K.text(`r(B) = ${rB.toFixed(1).replace("-", "−")}`, 88, 40, { size: 2.8, mono: true, color: C.warn, weight: 600 });
      const fa = s3 * K.seg(S, 2.45, 2.6);
      K.alpha(fa); K.rect(14, 54, 92, 28, 2.4, { fill: C.raised, stroke: C.strong });
      K.text("Bradley–Terry model", 18, 59, { size: 2.4, color: C.muted, weight: 600 });
      K.text("P(A ≻ B) = σ(r(A) − r(B))", 60, 66, { size: 2.9, mono: true, align: "center" });
      K.alpha(s3 * K.seg(S, 2.6, 2.72)); K.text(`= σ(${(rA - rB).toFixed(1)}) = ${p.toFixed(2)}`, 60, 71.5, { size: 2.9, mono: true, align: "center", color: C.accent });
      K.alpha(s3 * K.seg(S, 2.72, 2.84)); K.text(`loss = −log ${p.toFixed(2)} = ${loss.toFixed(2)}`, 60, 77, { size: 2.6, mono: true, align: "center", color: C.muted });
    }
    note("stage 3: a model learns to score answers the way people rank them", 2.5, 3.05);
    // 4. PPO with a KL leash
    const s4 = vis(3.02, 4.05);
    if (s4 > 0){
      const P = [24, 40], A = [60, 22], RM = [96, 40], U = [60, 58], REF = [24, 76];
      const nodes = [[P, "policy", "being tuned", 26], [A, "new answer", "", 24], [RM, "reward model", "frozen", 26], [U, "PPO update", "+ value model", 26]];
      const edges = [[P[0] + 7, P[1] - 6, A[0] - 12, A[1] + 1], [A[0] + 12, A[1] + 1, RM[0] - 7, RM[1] - 6], [RM[0] - 7, RM[1] + 6, U[0] + 13, U[1] - 1], [U[0] - 13, U[1] - 1, P[0] + 7, P[1] + 6]];
      edges.forEach(([x1, y1, x2, y2], i) => { K.alpha(s4 * K.seg(S, 3.15 + i * .06, 3.25 + i * .06)); K.arrow(x1, y1, x2, y2, { color: C.strong, hs: 1 }); });
      const lap = ((time * .35) % 1) * 4, k = Math.floor(lap), f = lap - k;
      if (S >= 3.4){ const [x1, y1, x2, y2] = edges[k]; K.alpha(s4); K.dot(K.lerp(x1, x2, f), K.lerp(y1, y2, f), 1, { fill: C.accent }); }
      nodes.forEach(([[x, y], t, sub, w], i) => { K.alpha(s4 * K.seg(S, 3.05 + i * .06, 3.15 + i * .06)); K.node(x, y, w, 11, t, { sub: sub || undefined, size: 2.8, stroke: i === 0 ? C.accent : C.strong, lw: i === 0 ? .5 : .35 }); });
      const ka = s4 * K.seg(S, 3.5, 3.65);
      K.alpha(ka); K.node(REF[0], REF[1], 26, 11, "reference", { sub: "frozen SFT copy", size: 2.8 });
      K.line(P[0], P[1] + 5.5, REF[0], REF[1] - 5.5, { color: C.warn, lw: .45, dash: [1, .8] });
      K.text("KL penalty", P[0] + 2, 58, { size: 2.4, color: C.warn, weight: 600, halo: true });
      K.alpha(s4 * K.seg(S, 3.65, 3.8));
      K.text("maximize  r(x, y) − β · KL(π ‖ π_ref)", 42, 76, { size: 2.5, mono: true, color: C.ink });
      K.text("score high, stay close to the reference", 42, 81, { size: 2.3, color: C.muted });
    }
    note("stage 4: generate, score, update, on a leash", 3.5, 4.05, C.accent);
    // 5. reward hacking
    const s5 = vis(4.02, 5.2);
    if (s5 > 0){
      const X0 = 14, X1 = 112, Y0 = 80, Y1 = 22, px = t => K.lerp(X0, X1, t), py = v => K.lerp(Y0, Y1, v);
      const proxy = t => 1.02 * (1 - Math.exp(-3.4 * t)), truth = t => .82 * (1.9 * t - 1.6 * t * t) / .564;
      const peak = .59, prog = K.seg(S, 4.12, 4.65);
      K.alpha(s5); K.line(X0, Y0, X1, Y0, { color: C.strong }); K.line(X0, Y0, X0, Y1 - 4, { color: C.strong });
      K.text("how far the policy moved from the reference (KL) →", X1, Y0 + 5, { size: 2.3, align: "right", color: C.muted });
      K.text("score", X0 + 1.5, Y1 - 4, { size: 2.3, color: C.muted });
      const curve = (fn, col, dash) => { ctx.beginPath(); for (let i = 0; i <= 60; i++){ const t = i / 60 * prog; const x = px(t), y = py(fn(t)); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.setLineDash(dash || []); ctx.strokeStyle = col; ctx.lineWidth = .6; ctx.stroke(); ctx.setLineDash([]); };
      if (prog > 0){
        const hz = K.seg(S, 4.7, 4.85);
        if (hz > 0){ K.alpha(s5 * hz * .12); K.rect(px(peak), Y1 - 2, X1 - px(peak), Y0 - Y1 + 2, 0, { fill: C.warn }); }
        K.alpha(s5); curve(proxy, C.accent); curve(truth, C.ink, [1.2, .8]);
        if (hz > 0){
          K.alpha(s5 * hz); K.line(px(peak), Y0, px(peak), Y1 - 2, { color: C.ok, lw: .4, dash: [.8, .8] });
          K.text("stop here", px(peak) - 1.5, Y1 + 1, { size: 2.4, align: "right", color: C.ok, weight: 600, halo: true });
          K.text("reward hacking", px(peak) + 2, Y0 - 4, { size: 2.5, color: C.warn, weight: 700 });
        }
      }
      K.alpha(s5 * K.seg(S, 4.1, 4.2));
      K.line(X0 + 4, 12, X0 + 9, 12, { color: C.accent, lw: .6 }); K.text("reward model score", X0 + 10.5, 12, { size: 2.4 });
      K.line(X0 + 50, 12, X0 + 55, 12, { color: C.ink, lw: .6, dash: [1.2, .8] }); K.text("true quality (human judgment)", X0 + 56.5, 12, { size: 2.4 });
    }
    note("the proxy keeps rising after real quality starts falling", 4.5, 5.2, C.warn);
    K.alpha(1);
  },

  /* ---------- DPO ---------- */
  dpo(K, S, time){
    const C = K.C, ctx = K.ctx;
    const vis = (a, b) => K.seg(S, a, a + .15) * (1 - K.seg(S, b - .12, b));
    const note = (t, a, b, col) => { K.alpha(K.seg(S, a, a + .2) * (1 - K.seg(S, b - .1, b))); K.text(t, 60, 94, { size: 2.7, align: "center", color: col || C.muted, weight: 600 }); };
    const sig = z => 1 / (1 + Math.exp(-z));
    // 1. two stages become one loss
    const s1 = vis(0, 1.05);
    if (s1 > 0){
      const merge = K.io(K.seg(S, .45, .8));
      K.alpha(s1); K.text("RLHF", 4, 17, { size: 2.6, color: C.muted, weight: 700 }); K.text("DPO", 4, 55, { size: 2.6, color: C.accent, weight: 700 });
      const top = [[18, "SFT", 20], [44, "reward model", 24], [70, "PPO (RL)", 22], [100, "aligned model", 26]];
      top.forEach(([x, t, w], i) => { K.alpha(s1 * K.seg(S, .02 + i * .05, .12 + i * .05)); K.node(x, 25, w, 10, t, { size: 2.7 }); if (i) K.arrow(top[i - 1][0] + top[i - 1][2] / 2 + .5, 25, x - w / 2 - .5, 25, { color: C.strong, hs: .9 }); });
      K.alpha(s1 * K.seg(S, .25, .35) * K.clamp(1 - K.seg(S, .42, .47) + K.seg(S, .8, .88))); K.text("4 models in memory: policy, reference, reward, value", 60, 36, { size: 2.4, align: "center", color: C.muted });
      // ghosts of the two middle stages sliding into one box
      [[44, 24, "reward model"], [70, 22, "PPO (RL)"]].forEach(([x, w, t]) => { if (merge > 0 && merge < 1){ K.alpha(s1 * (1 - merge) * .8); K.node(K.lerp(x, 57, merge), K.lerp(25, 63, merge), w, 10, t, { size: 2.7 }); } });
      const db = s1 * K.seg(S, .7, .85);
      K.alpha(s1 * K.seg(S, .4, .5)); K.node(18, 63, 20, 10, "SFT", { size: 2.7 }); K.node(100, 63, 26, 10, "aligned model", { size: 2.7 });
      K.alpha(db); K.node(57, 63, 26, 10, "DPO loss", { size: 2.9, stroke: C.accent, lw: .55 });
      K.arrow(28.5, 63, 43.5, 63, { color: C.strong, hs: .9 }); K.arrow(70.5, 63, 86.5, 63, { color: C.strong, hs: .9 });
      K.alpha(db * K.seg(S, .8, .9)); K.text("2 models: policy and frozen reference", 60, 74, { size: 2.4, align: "center", color: C.accent });
    }
    note("same preference pairs, no reward model, no RL loop", .5, 1.05, C.accent);
    // 2. the derivation
    const s2 = vis(1.02, 2.05);
    if (s2 > 0){
      const rows = [
        ["RLHF objective", "max  E[ r(x,y) ] − β · KL(π ‖ π_ref)", 1.05],
        ["has a closed-form optimum", "π*(y|x) ∝ π_ref(y|x) · exp( r(x,y) / β )", 1.25],
        ["solve it for the reward", "r(x,y) = β · log π(y|x) / π_ref(y|x) + β · log Z(x)", 1.45],
      ];
      rows.forEach(([lab, eq, t], i) => {
        const a = s2 * K.seg(S, t, t + .12), y = 14 + i * 17;
        K.alpha(a); K.text(lab, 60, y, { size: 2.4, align: "center", color: C.muted });
        K.rect(10, y + 2.5, 100, 9, 2, { fill: C.surface, stroke: i === 2 ? C.accent : C.strong, lw: i === 2 ? .5 : .35 });
        K.text(eq, 60, y + 7, { size: 2.6, mono: true, align: "center", color: i === 2 ? C.accent : C.ink });
        if (i) { K.alpha(a); K.arrow(60, y - 6.5, 60, y - 2.8, { color: C.strong, hs: .8 }); }
      });
      K.alpha(s2 * K.seg(S, 1.65, 1.78)); K.text("Z(x) is the same for both answers to a prompt, so it cancels", 60, 70, { size: 2.5, align: "center", color: C.muted });
      K.alpha(s2 * K.seg(S, 1.75, 1.88)); K.text("the model's own probabilities define its reward", 60, 77, { size: 3, align: "center", color: C.accent, weight: 700 });
    }
    note("Rafailov et al., 2023: “your language model is secretly a reward model”", 1.5, 2.05);
    // 3. the loss on one pair
    const s3 = vis(2.02, 3.05);
    if (s3 > 0){
      const beta = .5, tr = K.ease(K.seg(S, 2.25, 2.85)), dw = 1.0 * tr, dl = -3.0 * tr, m = beta * (dw - dl), L = -Math.log(sig(m));
      const f = v => v.toFixed(2).replace("-", "−");
      K.alpha(s3); K.text("L = −log σ( β · [ Δ_chosen − Δ_rejected ] )", 60, 12, { size: 2.6, mono: true, align: "center" });
      K.text("Δ = log π(y|x) − log π_ref(y|x)     β = 0.5", 60, 17.5, { size: 2.3, mono: true, align: "center", color: C.muted });
      // bars
      const Z = 48, sc = 6;
      K.alpha(s3 * K.seg(S, 2.08, 2.2)); K.line(6, Z, 54, Z, { color: C.strong });
      [[18, dw, C.ok, "chosen"], [42, dl, C.warn, "rejected"]].forEach(([x, v, col, lab]) => {
        const h = v * sc; K.rect(x - 5, h >= 0 ? Z - h : Z, 10, Math.max(.3, Math.abs(h)), .8, { fill: col });
        K.text(f(v), x, h >= 0 ? Z - h - 3 : Z - h + 3, { size: 2.6, mono: true, align: "center", color: col, weight: 600 });
        K.text(`Δ ${lab}`, x, 79, { size: 2.4, align: "center", color: C.muted });
      });
      // sigmoid panel
      const X0 = 64, X1 = 114, Y0 = 72, Y1 = 30, mx = z => K.lerp(X0, X1, (z + 1) / 4), my = v => K.lerp(Y0, Y1, v);
      K.alpha(s3 * K.seg(S, 2.12, 2.25));
      K.line(X0, Y0, X1, Y0, { color: C.strong }); K.line(mx(0), Y0, mx(0), Y1 - 2, { color: C.line, dash: [.8, .8] });
      ctx.beginPath(); for (let i = 0; i <= 50; i++){ const z = -1 + i / 50 * 4; i ? ctx.lineTo(mx(z), my(sig(z))) : ctx.moveTo(mx(z), my(sig(z))); } ctx.strokeStyle = C.strong; ctx.lineWidth = .5; ctx.stroke();
      K.text("margin β·(Δc − Δr)", X1, Y0 + 4.5, { size: 2.2, align: "right", color: C.muted });
      K.text("σ", X0 - 2, Y1, { size: 2.6, mono: true, color: C.muted, align: "right" });
      K.alpha(s3); K.dot(mx(m), my(sig(m)), 1.4, { fill: C.accent });
      K.text(`P = ${sig(m).toFixed(2)} · loss ${L.toFixed(2)}`, X1, Y1 - 6, { size: 2.6, mono: true, align: "right", color: C.accent, weight: 700, halo: true });
      K.alpha(s3 * K.seg(S, 2.2, 2.3)); K.text("loss = −log P, starts at log 2 ≈ 0.69", X0 + 25, 84, { size: 2.3, align: "center", color: C.muted });
    }
    note("push the chosen answer up relative to the rejected one", 2.5, 3.05, C.accent);
    // 4. beta and the offline catch
    const s4 = vis(3.02, 4.05);
    if (s4 > 0){
      const bt = K.io(K.seg(S, 3.15, 3.55)), beta = K.lerp(.5, .05, bt), shift = K.lerp(8, 34, bt);
      const AX0 = 8, AX1 = 112, Y0 = 72, bump = (c, h, w) => x => Y0 - h * Math.exp(-((x - c) ** 2) / (2 * w * w));
      K.alpha(s4); K.text("β", 18, 18.5, { size: 3, mono: true, color: C.muted, align: "right" });
      K.rect(22, 17.5, 66, 2, 1, { fill: C.raised }); const kx = K.lerp(80, 30, bt); K.dot(kx, 18.5, 2, { fill: C.accent });
      K.text(`β = ${beta.toFixed(2)}`, 92, 18.5, { size: 2.6, mono: true, color: C.accent, weight: 600 });
      K.text("weaker pull, more drift", 22, 25, { size: 2.2, color: C.muted }); K.text("stronger pull to reference", 88, 25, { size: 2.2, color: C.muted, align: "right" });
      K.line(AX0, Y0, AX1, Y0, { color: C.strong });
      const ref = bump(40, 26, 10), pol = bump(40 + shift, 26, 10);
      const draw = (fn, col, dash) => { ctx.beginPath(); for (let x = AX0; x <= AX1; x += 1){ const y = fn(x); x === AX0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.setLineDash(dash || []); ctx.strokeStyle = col; ctx.lineWidth = .6; ctx.stroke(); ctx.setLineDash([]); };
      draw(ref, C.muted, [1, .8]); draw(pol, C.accent);
      K.text("reference", 40, 43, { size: 2.4, align: "center", color: C.muted, halo: true });
      K.text("policy", 40 + shift, 41.5 - (bt > .3 ? 0 : 4), { size: 2.5, align: "center", color: C.accent, weight: 600, halo: true });
      // preference data lives near the reference
      const da = s4 * K.seg(S, 3.6, 3.72);
      for (let i = 0; i < 14; i++){ const x = 26 + (i * 37 % 29); K.alpha(da); K.dot(x, Y0 + 3 + (i % 3) * 1.8, .7, { fill: C.ok }); }
      K.alpha(da); K.text("preference pairs", 40, Y0 + 11, { size: 2.3, align: "center", color: C.ok });
      const ga = s4 * K.seg(S, 3.75, 3.88);
      if (ga > 0){ K.alpha(ga * .14); K.rect(62, 30, AX1 - 62, Y0 - 30, 0, { fill: C.warn }); K.alpha(ga); K.text("few or no pairs out here", 87, Y0 + 7, { size: 2.4, align: "center", color: C.warn, weight: 600 }); }
    }
    note("offline data can't correct a model that drifts past it", 3.55, 4.05, C.warn);
    // 5. choosing
    const s5 = vis(4.02, 5.2);
    if (s5 > 0){
      const card = (x, t, col, items, t0) => {
        K.alpha(s5 * K.seg(S, t0, t0 + .12)); K.rect(x, 10, 52, 46, 2.4, { fill: C.surface, stroke: col, lw: .5 });
        K.text(t, x + 4, 16, { size: 3, weight: 700, color: col });
        items.forEach((it, i) => { K.alpha(s5 * K.seg(S, t0 + .08 + i * .06, t0 + .16 + i * .06)); K.dot(x + 5, 24 + i * 7.5, .7, { fill: col }); K.text(it, x + 8, 24 + i * 7.5, { size: 2.4 }); });
      };
      card(5, "DPO", C.accent, ["fixed preference pairs", "modest compute", "no RL infrastructure", "simple, reproducible"], 4.05);
      card(63, "RLHF / online RL", C.ok, ["fresh samples in training", "reusable reward model", "verifiable rewards (GRPO)", "higher ceiling, more tuning"], 4.25);
      K.alpha(s5 * K.seg(S, 4.55, 4.65)); K.text("DPO-family variants", 6, 64, { size: 2.4, color: C.muted, weight: 600 });
      ["IPO", "KTO", "ORPO", "SimPO", "online DPO"].forEach((t, i) => {
        const w = K.width(t, { size: 2.5, weight: 600 }) + 5, x = 6 + [0, 12, 24, 38, 54][i];
        K.alpha(s5 * K.seg(S, 4.6 + i * .04, 4.68 + i * .04)); K.rect(x, 67.5, w, 6.5, 3.25, { fill: C.raised, stroke: C.strong }); K.text(t, x + w / 2, 70.75, { size: 2.5, align: "center", weight: 600 });
      });
      K.alpha(s5 * K.seg(S, 4.8, 4.9)); K.text("they change the loss or the data, not the need for good labels", 60, 82, { size: 2.5, align: "center", color: C.muted });
    }
    note("pick by constraints, not by trend", 4.6, 5.2, C.accent);
    K.alpha(1);
  },
};

/* stage controller */
let exCleanup = null;
function exDraw(canvas, scene, S, time, C){
  const dpr = Math.min(devicePixelRatio || 1, 2), cw = canvas.clientWidth, ch = canvas.clientHeight;
  if (!cw || !ch) return;
  if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)){ canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr); }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.globalAlpha = 1;
  const s = Math.min(cw / 120, ch / 100), ox = (cw - 120 * s) / 2, oy = (ch - 100 * s) / 2;
  ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);
  SCENES[scene](exKit(ctx, C, cw < 560 ? 1.2 : 1), S, time);
}
function initExplainer(){
  if (exCleanup){ exCleanup(); exCleanup = null; }
  const host = $("#ex"); if (!host) return;
  const scene = host.dataset.scene; if (!SCENES[scene]) return;
  const N = host.querySelectorAll(".steps .step").length;
  let C = exColors(), lastC = 0;
  if (reduce){
    host.classList.add("static");
    host.querySelectorAll(".ex-still canvas").forEach((cv, i) => exDraw(cv, scene, i + .999, 0, C));
    return;
  }
  const canvas = host.querySelector(".screen canvas"), steps = [...host.querySelectorAll(".steps .step")], bar = host.querySelector(".progress i");
  const track = host.querySelector(".build-track");
  let P = 0, Pd = -1, last = 0, cur = -1, raf = 0, visible = true, alive = true, done = false;
  const setP = p => {
    P = Math.min(.9999, Math.max(0, p));
    if (!done && P > .97){ done = true; GA.event("explainer-finished/" + location.pathname.split("/").filter(Boolean).pop()); }
  };
  let stopScroll;
  if (M && M.scroll){ const st = M.scroll(p => setP(p), { target: track, offset: ["start start", "end end"] }); stopScroll = typeof st === "function" ? st : null; }
  else { const on = () => { const r = track.getBoundingClientRect(); setP(-r.top / (r.height - innerHeight)); }; addEventListener("scroll", on, { passive: true }); on(); stopScroll = () => removeEventListener("scroll", on); }
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) loop(); }, { rootMargin: "100px" });
  io.observe(track);
  const t0 = performance.now();
  function frame(now){
    if (!alive || !visible) { raf = 0; return; }
    if (now - lastC > 300){ C = exColors(); lastC = now; }
    const dt = Math.min(.05, last ? (now - last) / 1000 : .016); last = now;
    Pd = Pd < 0 ? P : Pd + (P - Pd) * (1 - Math.exp(-dt * 10));
    const S = Pd * N, idx = Math.min(N - 1, Math.floor(S));
    if (idx !== cur){ cur = idx; steps.forEach((s, i) => s.classList.toggle("on", i === idx)); }
    bar.style.transform = `scaleX(${Pd})`;
    exDraw(canvas, scene, S, (now - t0) / 1000, C);
    raf = requestAnimationFrame(frame);
  }
  function loop(){ if (!raf) raf = requestAnimationFrame(frame); }
  loop();
  exCleanup = () => { alive = false; cancelAnimationFrame(raf); io.disconnect(); if (stopScroll) stopScroll(); };
}

/* ===================== views ===================== */
const monthKey = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
function schedule(){
  const d = new Date(); d.setDate(1);
  const out = [];
  for (let i = 0; i < 3; i++){ out.push({ key: monthKey(d), name: d.toLocaleDateString("en-US",{month:"long"}) }); d.setMonth(d.getMonth()+1); }
  return `<div class="sched" aria-label="Availability">${out.map(m => SITE.booked.includes(m.key)
    ? `<div class="full"><b>${m.name}</b><span>Booked</span></div>`
    : `<a href="${url("/book/")}"><b>${m.name}</b><span>Available</span></a>`).join("")}</div>`;
}
const projRow = (p, i = 0) => `
  <a class="prow" href="${url(`/projects/${p.slug}/`)}">
    <div><h3 class="shift" style="--i:${i}">${esc(p.title)}</h3><span class="meta">${esc(p.client)} · ${esc(p.when)}</span></div>
    <p>${esc(p.summary)}</p>
    <span class="go">${ICONS.arrow}</span>
  </a>`;
const tagHTML = k => `<span class="tag ${k}">${esc(SITE.labels[k].replace(/s$/,""))}</span>`;
const rankOf = p => { const i = (SITE.writingOrder || []).indexOf(p.slug); return i < 0 ? 999 : i; };
const sorted = () => [...SITE.posts].filter(p => !p.notes).sort((a,b) => rankOf(a) - rankOf(b) || b.date.localeCompare(a.date));
const otherNotes = () => [...SITE.posts].filter(p => p.notes).sort((a,b) => b.date.localeCompare(a.date));
const postHTML = p => `<a class="post" href="${url(`/writing/${p.slug}/`)}"><span class="d num">${p.kind === "explainer" ? `${p.steps.length} steps` : fmt(p.date)}</span><h3>${esc(p.title)}</h3>${tagHTML(p.kind)}<p>${esc(p.excerpt)}</p></a>`;
const exStage = (scene, title, steps) => `
      <section class="build explainer" id="ex" data-scene="${esc(scene)}" aria-label="${esc(title)}, step by step">
        <div class="build-track" style="height:${steps.length * 90}vh">
          <div class="pin">
            <ol class="steps">${steps.map(([t, d], i) => `<li class="step${i ? "" : " on"}"><span class="n">${i + 1}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join("")}</ol>
            <div class="screen" aria-hidden="true">
              <div class="bar"><span class="dots"><i></i><i></i><i></i></span><span class="file">${esc(title)}</span><span class="sample">Illustration</span></div>
              <canvas></canvas>
            </div>
            <div class="ex-stills">${steps.map(([t, d]) => `<div class="ex-still"><h3>${esc(t)}</h3><p>${esc(d)}</p><canvas aria-hidden="true"></canvas></div>`).join("")}</div>
            <div class="progress"><i></i></div>
          </div>
        </div>
      </section>`;
const explainerHTML = p => {
  const n = p.steps.length;
  return `
    <div class="page">
      <section class="proj-head">
        <a class="crumb" href="${url("/writing/")}">${ICONS.arrow} All writing</a>
        <div class="ex-meta">${tagHTML(p.kind)}<span>${n} steps · scroll to play</span></div>
        <h1>${esc(p.title)}</h1>
        <p class="lede">${esc(p.intro)}</p>
      </section>
      ${exStage(p.scene, p.title, p.steps)}
      <section class="cv">
        <h2>In short</h2><div><ul class="plain">${p.takeaways.map(t => `<li>${esc(t)}</li>`).join("")}</ul></div>
        ${p.refs && p.refs.length ? `<h2>References</h2><div><ol class="refs">${p.refs.map(([t, u]) => `<li>${u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>` : esc(t)}</li>`).join("")}</ol></div>` : ""}
        ${p.source ? `<h2>Source</h2><div><p class="src">${esc(p.source.text)} <a href="${esc(p.source.url)}" target="_blank" rel="noopener">${esc(p.source.link)}</a></p></div>` : ""}
        <h2>Share</h2><div>${shareHTML(p)}</div>
      </section>
      ${moreHTML(p)}
      ${ctaHTML()}
    </div>`;
};
/* reading paths: after each explainer, the three that build on it */
const NEXT = {
  rag: ["vectors", "evals", "agents"], agents: ["mcp", "rag", "evals"], transformer: ["neural", "lora", "rlhf"],
  neural: ["transformer", "diffusion", "lora"], vectors: ["rag", "btree", "transformer"], web: ["btree", "docker", "mcp"],
  lora: ["rlhf", "dpo", "transformer"], diffusion: ["neural", "transformer", "lora"], mcp: ["agents", "rag", "aidev"],
  btree: ["vectors", "web", "rag"], docker: ["web", "mcp", "agents"], evals: ["rag", "dpo", "agents"],
  rlhf: ["dpo", "lora", "evals"], dpo: ["rlhf", "evals", "lora"], decompose: ["whys", "pareto", "experiments"],
  whys: ["bisect", "decompose", "bottleneck"], bisect: ["whys", "experiments", "bottleneck"], bottleneck: ["pareto", "decompose", "bisect"],
  pareto: ["bottleneck", "decompose", "experiments"], experiments: ["bisect", "whys", "decompose"], aidev: ["agents", "mcp", "evals"],
};
const moreHTML = p => {
  const list = (NEXT[p.scene] || []).map(sc => SITE.posts.find(x => x.scene === sc)).filter(Boolean);
  return list.length ? `<section class="more"><div class="sh"><h2>${p.notes ? "More notes" : "Keep reading"}</h2><a href="${url("/writing/")}">All writing</a></div><div class="posts">${list.map(postHTML).join("")}</div></section>` : "";
};
const shareHTML = p => {
  const link = `${SITE.domain.replace(/\/$/, "")}/writing/${p.slug}/`, u = encodeURIComponent(link);
  const text = encodeURIComponent(`${p.title}: an animated, step-by-step explainer`);
  return `<div class="share">
      <a class="btn line" href="https://x.com/intent/post?text=${text}&url=${u}" target="_blank" rel="noopener" data-ev="share/x/${esc(p.slug)}">${ICONS.x} Post on X</a>
      <a class="btn line" href="https://www.linkedin.com/sharing/share-offsite/?url=${u}" target="_blank" rel="noopener" data-ev="share/linkedin/${esc(p.slug)}">${ICONS.linkedin} Share on LinkedIn</a>
      <button class="btn line" type="button" data-share="${esc(link)}" data-title="${esc(p.title)}">${ICONS.link} <span>Copy link</span></button>
    </div>
    <p class="share-note">Teaching this to a class or a new teammate? Send them the link.</p>`;
};
const socials = () => ["github","linkedin","x"].filter(k => SITE.links[k]).map(k => `<a href="${esc(SITE.links[k])}" target="_blank" rel="noopener" aria-label="${{github:"GitHub",linkedin:"LinkedIn",x:"X (Twitter)"}[k]}">${ICONS[k]}</a>`).join("");
const ctaHTML = () => `
  <section class="cta">
    <h2>Hiring, or need an AI feature built? Let's talk.</h2>
    <div class="row" style="justify-content:space-between;gap:20px">
      <div class="row" style="flex:1 1 320px"><a class="btn" href="mailto:${esc(SITE.email)}">Email me <span class="arr">${ICONS.arrow}</span></a><a class="btn line" href="${url("/resume/")}">Read my resume</a><a class="btn line" href="${url("/book/")}">Book a call</a></div>
      <div class="socials">${socials()}</div>
    </div>
  </section>`;

const V = {
  home: () => `
    <div class="page">
      <section class="hero">
        <h1>I build RAG and agent systems, <em>and measure whether they work.</em></h1>
        <p class="sub">I'm Juan Pablo, an AI developer in Argentina. I've built products end to end as the <b>only developer</b>, from the database to deployment.</p>
        <div class="row"><a class="btn" href="${url("/projects/")}">See my work <span class="arr">${ICONS.arrow}</span></a><a class="btn line" href="${url("/resume/")}">Resume</a><a class="btn line" href="mailto:${esc(SITE.email)}">Email me</a></div>
        <ul class="avail" aria-label="Availability"><li><b>Open to remote AI roles</b></li><li>UTC−3, overlaps US working hours</li><li>English C2 · Spanish native</li></ul>
      </section>
      ${buildStage()}
      <section>
        <div class="sh"><h2>Selected projects</h2><a href="${url("/projects/")}">All projects</a></div>
        <div class="plist">${SITE.projects.filter(p => !p.hideOnHome).slice(0,3).map(projRow).join("")}</div>
      </section>
      ${SITE.posts.length ? `<section><div class="sh"><h2>Recent writing</h2><a href="${url("/writing/")}">All writing</a></div><div class="posts">${(SITE.featured || []).map(s => SITE.posts.find(p => p.slug === s && !p.notes)).filter(Boolean).concat(sorted()).filter((p, i, a) => a.indexOf(p) === i).slice(0,3).map(postHTML).join("")}</div></section>` : ""}
      ${ctaHTML()}
    </div>`,

  projects: () => `
    <div class="page">
      <section><div class="sh"><h1 class="title">Projects</h1><p>Client work and personal projects. Each page covers the problem, how the system works and what changed.</p></div>
        <div class="plist">${SITE.projects.map(projRow).join("")}</div></section>
      ${ctaHTML()}
    </div>`,

  project: slug => {
    const i = SITE.projects.findIndex(p => p.slug === slug);
    if (i < 0) return V.notfound();
    const p = SITE.projects[i], prev = SITE.projects[i-1], next = SITE.projects[i+1];
    const flow = f => `<div><h3 class="flow-title">${esc(f.title)}</h3><ol class="flow">${f.steps.map(([n,d],k) => `<li>${k ? `<span class="arrow">${ICONS.arrow}</span>` : ""}<div class="node">${esc(n)}${d ? `<small>${esc(d)}</small>` : ""}</div></li>`).join("")}</ol></div>`;
    const links = [
      p.code ? `<a class="btn line" href="${esc(p.code)}" target="_blank" rel="noopener">${ICONS.github.replace('viewBox','width="16" height="16" viewBox')} See the code</a>` : "",
      p.demo ? `<a class="btn" href="${esc(p.demo)}" target="_blank" rel="noopener">Try the live demo <span class="arr">${ICONS.ext}</span></a>` : "",
    ].join("");
    return `
    <div class="page">
      <section class="proj-head">
        <a class="crumb" href="${url("/projects/")}">${ICONS.arrow} All projects</a>
        <h1 class="shift">${esc(p.title)}</h1>
        <p class="lede">${esc(p.summary)}</p>
        <div class="facts"><span><b>${esc(p.client)}</b></span><span>${esc(p.role)}</span><span class="num">${esc(p.when)}</span>${!p.code && p.codeNote ? `<span>${esc(p.codeNote)}</span>` : ""}</div>
        ${links ? `<div class="row">${links}</div>` : ""}
      </section>
      ${p.tour ? `<div class="tour-head"><h2>See it work</h2><span>${p.tour.steps.length} steps · scroll to play</span></div>${exStage(p.tour.scene, p.title, p.tour.steps)}` : ""}
      <section class="cv">
        <h2>Problem</h2><div><p class="lede">${esc(p.problem)}</p></div>
        <h2>Solution</h2><div><p style="max-width:62ch">${esc(p.solution)}</p></div>
        <h2>Architecture</h2><div><div class="flows">${p.flows.map(flow).join("")}</div>${p.notes.length ? `<ul class="notes" style="margin-top:22px">${p.notes.map(n => `<li>${esc(n)}</li>`).join("")}</ul>` : ""}</div>
        <h2>Stack</h2><div><div class="chips">${p.stack.map(s => `<span class="chip prod">${esc(s)}</span>`).join("")}</div></div>
        <h2>Result</h2><div><p class="lede">${esc(p.result)}</p></div>
      </section>
      <nav class="pnext" aria-label="More projects">
        ${prev ? `<a href="${url(`/projects/${prev.slug}/`)}"><span>Previous</span><b>${esc(prev.title)}</b></a>` : ""}
        ${next ? `<a class="next" href="${url(`/projects/${next.slug}/`)}"><span>Next</span><b>${esc(next.title)}</b></a>` : ""}
      </nav>
      ${ctaHTML()}
    </div>`;
  },

  services: () => `
    <div class="page">
      <section>
        <div class="sh"><h1 class="title">Services</h1><p>Every project starts with a free 15-minute call. You get a written plan and a price before any work begins.</p></div>
        <div style="margin:0 0 40px">${schedule()}</div>
      </section>
      <div class="tour-head"><h2>What each service looks like</h2><span>${SITE.servicesTour.length} steps · scroll to play</span></div>
      ${exStage("services", "How I work", SITE.servicesTour)}
      <section>
        <div class="offers">${SITE.offers.map((o, i) => `<div class="offer"><div><h3 class="shift" style="--i:${i}">${esc(o.name)}</h3><p>${esc(o.text)}</p><ul>${o.items.map(i => `<li>${esc(i)}</li>`).join("")}</ul></div><div class="terms"><span>Scope and price agreed after a first call</span><a class="btn line" href="${url("/book/")}" data-meet="${o.meeting}">Talk about this <span class="arr">${ICONS.arrow}</span></a></div></div>`).join("")}</div>
      </section>
      <section>
        <div class="sh"><h2>How a project runs</h2></div>
        <ol class="process">${SITE.process.map(([t,d]) => `<li><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join("")}</ol>
      </section>
      ${ctaHTML()}
    </div>`,

  resume: () => {
    const R = SITE.resume;
    const job = j => `<div class="job"><span class="muted num">${esc(j.when)}</span><div><h3>${esc(j.role)}</h3><span class="at">${esc(j.at)}</span>${j.points ? `<ul>${j.points.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}</div></div>`;
    return `
    <div class="page">
      <section>
        <div class="sh"><div style="display:grid;gap:8px"><h1 class="title">Resume</h1><span class="muted">${esc(R.title)}</span></div>
          ${SITE.resumePdf ? `<a class="btn" href="${asset(SITE.resumePdf)}" target="_blank" rel="noopener">Open the PDF <span class="arr">${ICONS.ext}</span></a>` : ""}</div>
        <div class="cv">
          <h2>Summary</h2><div><p class="lede">${esc(R.summary)}</p></div>
          <h2>Experience</h2><div>${R.jobs.map(job).join("")}</div>
          <h2>Projects</h2><div>${R.projects.map(job).join("")}</div>
          <h2>Education</h2><div>${R.education.map(job).join("")}</div>
          <h2>Honors</h2><div><ul class="plain">${R.honors.map(h => `<li>${esc(h)}</li>`).join("")}</ul></div>
          <h2>Languages</h2><div><ul class="plain">${R.languages.map(([l,v]) => `<li><b>${esc(l)}</b>, ${esc(v)}</li>`).join("")}</ul></div>
        </div>
      </section>
    </div>`;
  },

  stack: () => `
    <div class="page">
      <section>
        <div class="sh"><h1 class="title">Stack</h1><span class="legend"><span class="chip prod">Name</span> used in client work</span></div>
        <div class="groups">${SITE.stack.map(g => `<div class="group"><h3>${esc(g.group)}</h3><div class="chips">${g.items.map(n => `<span class="chip${SITE.shipped.includes(n)?" prod":""}">${esc(n)}</span>`).join("")}</div></div>`).join("")}</div>
      </section>
    </div>`,

  writing: () => {
    const main = sorted(), notes = otherNotes();
    const counts = { all: main.length };
    main.forEach(p => counts[p.kind] = (counts[p.kind]||0) + 1);
    const opts = [["all","All"], ...Object.entries(SITE.labels).filter(([k]) => counts[k])];
    const btns = tab => opts.map(([k,l]) => `<button type="button" ${tab ? `data-f="${k}" aria-pressed="${filter===k}"` : 'tabindex="-1" aria-hidden="true"'}>${l}<span class="num">${counts[k]||0}</span></button>`).join("");
    return `
    <div class="page">
      <section>
        <div class="sh"><h1 class="title">Writing</h1>
          ${opts.length > 2 ? `<div class="seg" id="seg" role="group" aria-label="Filter by label"><div class="seg-row">${btns(true)}</div><div class="over" id="segOver"><div class="seg-row">${btns(false)}</div></div></div>` : `<p>Animated, step-by-step explainers of how AI systems work, each with its sources.</p>`}</div>
        <div class="posts" id="posts">${listHTML()}</div>
      </section>
      ${notes.length ? `<section><div class="sh"><h2>Other notes</h2><p>General problem-solving methods and a talk summary, outside the main AI set.</p></div><div class="posts">${notes.map(postHTML).join("")}</div></section>` : ""}
    </div>`;
  },

  post: slug => {
    const p = SITE.posts.find(x => x.slug === slug);
    if (!p) return V.notfound();
    if (p.kind === "explainer") return explainerHTML(p);
    return `
    <div class="page"><article class="reader">
      <a class="crumb" href="${url("/writing/")}">${ICONS.arrow} All writing</a>
      <div class="row">${tagHTML(p.kind)}<span class="muted num">${fmt(p.date)} · ${p.read} min read</span></div>
      <h1>${esc(p.title)}</h1>
      ${p.guest ? `<p class="muted" style="font-size:18px">A conversation with ${esc(p.guest)}</p>` : ""}
      <div class="body">${p.body.map(b => typeof b === "string" ? `<p>${esc(b)}</p>` : `<p class="q">${esc(b.q)}</p>`).join("")}</div>
    </article></div>`;
  },

  book: () => {
    const days = []; const d = new Date(); d.setHours(12,0,0,0);
    while (days.length < 10){ d.setDate(d.getDate()+1); if (d.getDay() % 6) days.push(new Date(d)); }
    const iso = x => `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`;
    if (!day || !days.some(x => iso(x) === day)) day = iso(days[0]);
    const m = SITE.meetings[meet];
    const pretty = new Date(day+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
    const subject = encodeURIComponent(`${m.name} (${m.mins} min) on ${pretty}`);
    const bodyTxt = encodeURIComponent(`Hi Juan Pablo,\n\nI'd like a ${m.name.toLowerCase()} on ${pretty}. Times that work for me, with my time zone:\n\n\nWhat I'd like to talk about:\n\n`);
    const action = SITE.calUser
      ? `<a class="btn" target="_blank" rel="noopener" href="https://cal.com/${encodeURIComponent(SITE.calUser)}/${m.slug}?date=${day}">Choose a time <span class="arr">${ICONS.ext}</span></a>`
      : `<a class="btn" href="mailto:${esc(SITE.email)}?subject=${subject}&body=${bodyTxt}">Request this day ${ICONS.mail}</a>`;
    const tz = new Date().getTimezoneOffset() === 180 ? "" : (Intl.DateTimeFormat().resolvedOptions().timeZone || "").replace(/_/g," ");
    return `
    <div class="page">
      <section>
        <div class="sh"><h1 class="title">Book a call</h1><p>Pick a meeting and a day. ${SITE.calUser ? "You choose the exact time on the next screen." : "I'll reply with times that work for both of us."} I'm in ${esc(SITE.location)}${tz ? `, you're in ${esc(tz)}` : ""}.</p></div>
        <div class="book">
          <div><h3>Meeting</h3><div class="types">${SITE.meetings.map((x,i) => `<button type="button" data-m="${i}" aria-pressed="${i===meet}"><b>${esc(x.name)}</b><small>${esc(x.desc)}</small><span class="len num">${x.mins} min</span></button>`).join("")}</div></div>
          <div><h3>Day</h3>
            <div class="days">${days.map(x => `<button type="button" data-d="${iso(x)}" aria-pressed="${iso(x)===day}" aria-label="${x.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}"><small>${x.toLocaleDateString("en-US",{weekday:"short"})}</small><span class="dn num">${x.getDate()}</span><small>${x.toLocaleDateString("en-US",{month:"short"})}</small></button>`).join("")}</div>
            <div class="confirm" id="confirm"><div><b>${esc(m.name)}, ${m.mins} minutes</b><br><span class="muted">${pretty}</span></div>${action}</div>
            <div class="copyrow">Or write to <code id="em">${esc(SITE.email)}</code><button type="button" id="copyEm">Copy</button></div>
          </div>
        </div>
      </section>
    </div>`;
  },

  notfound: () => `
    <div class="page"><section class="proj-head">
      <h1 class="title">This page doesn't exist</h1>
      <p class="lede">The link may be old or mistyped.</p>
      <div class="row"><a class="btn" href="${url("/")}">Go to the home page <span class="arr">${ICONS.arrow}</span></a><a class="btn line" href="${url("/projects/")}">See my projects</a></div>
    </section></div>`,
};

/* ===================== state + router ===================== */
let filter = "all", meet = 0, day = null;
try { filter = localStorage.getItem("filter") || "all"; } catch(e){}
const view = $("#view");

function listHTML(){
  if (!SITE.posts.length) return `
    <div class="empty"><div><h3>The first posts are on the way</h3><p>Articles about building with LLMs, interviews with people I learn from, and shorter notes. Each one carries a label so you can filter.</p></div>
    <dl>${Object.keys(SITE.labels).map(k => `<dt>${tagHTML(k)}</dt><dd>${esc((SITE.labelHelp||{})[k] || "")}</dd>`).join("")}</dl></div>`;
  const list = sorted().filter(p => filter === "all" || p.kind === filter);
  return list.map(postHTML).join("") || `<p class="muted" style="padding:24px 0">Nothing with this label yet.</p>`;
}
function placeSeg(animate){
  const seg = $("#seg"), over = $("#segOver"); if (!seg) return;
  const btn = seg.querySelector(`.seg-row [data-f="${filter}"]`); if (!btn) return;
  const sb = over.getBoundingClientRect(), bb = btn.getBoundingClientRect();
  if (!animate) over.style.transition = "none";
  over.style.clipPath = `inset(0 ${sb.right - bb.right}px 0 ${bb.left - sb.left}px round 9px)`;
  if (!animate){ void over.offsetWidth; over.style.transition = ""; }
}
function rerender(html){ view.querySelector(".page").outerHTML = html; }

function currentPath(){
  if (HASH){ const h = location.hash; return h.startsWith("#/") ? decodeURIComponent(h.slice(1)) : "/"; }
  return decodeURIComponent(location.pathname);
}
function resolve(path){
  const s = path.split("/").filter(Boolean);
  if (!s.length) return { key:"home", html:V.home(), title:`${SITE.name} · AI Developer, RAG and Multi-Agent Systems` };
  if (s.length === 2 && s[0] === "projects"){ const p = SITE.projects.find(x => x.slug === s[1]); return { key:"projects", html:V.project(s[1]), title: p ? `${p.title} · ${SITE.name}` : `Not found · ${SITE.name}` }; }
  if (s.length === 2 && s[0] === "writing"){ const p = SITE.posts.find(x => x.slug === s[1]); return { key:"writing", html:V.post(s[1]), title: p ? `${p.title} · ${SITE.name}` : `Not found · ${SITE.name}` }; }
  const tab = TABS.find(t => t[2] === s[0]);
  if (s.length === 1 && tab && V[s[0]]) return { key:s[0], html:V[s[0]](), title:`${tab[1]} · ${SITE.name}` };
  return { key:"", html:V.notfound(), title:`Not found · ${SITE.name}` };
}
function route(scrollY){
  const r = resolve(currentPath());
  const paint = () => {
    view.innerHTML = r.html;
    document.querySelectorAll("#nav a").forEach(a => a.dataset.k === r.key ? a.setAttribute("aria-current","page") : a.removeAttribute("aria-current"));
    window.scrollTo(0, scrollY || 0);
    const active = $("#nav [aria-current]"); if (active) active.scrollIntoView({ block:"nearest", inline:"center" });
    document.title = r.title;
    initStage(); initExplainer(); placeSeg(false);
    GA.view();
  };
  if (document.startViewTransition && !reduce && route.ran) document.startViewTransition(paint); else paint();
  route.ran = true;
}

/* in-site links update the address without a full reload */
document.addEventListener("click", e => {
  if (HASH || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest("a[href]"); if (!a || a.target === "_blank") return;
  const href = a.getAttribute("href");
  if (!href.startsWith("/") || href.startsWith("//") || /\.[a-z0-9]+$/i.test(href)) return;
  e.preventDefault();
  if (href === location.pathname) { window.scrollTo({ top:0, behavior: reduce ? "auto" : "smooth" }); return; }
  history.replaceState({ y: scrollY }, "");
  history.pushState({ y: 0 }, "", href);
  route(0);
});
addEventListener("popstate", e => route((e.state && e.state.y) || 0));
addEventListener("hashchange", () => { if (HASH && location.hash.startsWith("#/")) route(0); });
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
addEventListener("resize", () => placeSeg(false));

view.addEventListener("click", e => {
  const f = e.target.closest("[data-f]");
  if (f){
    filter = f.dataset.f; try { localStorage.setItem("filter", filter); } catch(_){}
    document.querySelectorAll("#seg [data-f]").forEach(b => b.setAttribute("aria-pressed", b.dataset.f === filter));
    placeSeg(true);
    const posts = $("#posts"); posts.innerHTML = listHTML();
    if (M && !reduce && SITE.posts.length) M.animate(posts.children, { opacity:[0,1], y:[8,0] }, { delay: M.stagger(.04), duration:.3, ease:[.23,1,.32,1] });
    return;
  }
  const mt = e.target.closest("[data-meet]"); if (mt){ meet = +mt.dataset.meet; return; }
  const mb = e.target.closest("[data-m]");
  if (mb){ meet = +mb.dataset.m; rerender(V.book()); bump(); return; }
  const db = e.target.closest("[data-d]");
  if (db){ day = db.dataset.d; rerender(V.book()); bump(); return; }
  const sh = e.target.closest("[data-share]");
  if (sh){
    const link = sh.dataset.share, label = sh.querySelector("span");
    GA.event("share/copy/" + link.split("/").filter(Boolean).pop());
    try { navigator.clipboard.writeText(link).then(() => { label.textContent = "Link copied"; setTimeout(() => label.textContent = "Copy link", 1800); }, () => { label.textContent = link; }); }
    catch(_){ label.textContent = link; }
    return;
  }
  if (e.target.id === "copyEm"){
    const b = e.target;
    const ok = () => { b.textContent = "Copied"; setTimeout(() => b.textContent = "Copy", 1600); };
    const sel = () => { const r = document.createRange(); r.selectNodeContents($("#em")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = "Selected"; };
    try { navigator.clipboard.writeText(SITE.email).then(ok, sel); } catch(_) { sel(); }
  }
});
function bump(){
  const c = $("#confirm"); if (!c || !M || reduce) return;
  M.animate(c, { scale:[.985,1] }, { type:"spring", duration:.35, bounce:.3 });
}

route(0);
