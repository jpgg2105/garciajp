/* Flow: a small animated system diagram.
   Nodes sit on a grid (c = column along the flow, r = row across it). On wide screens the flow runs
   left to right; under 700px it turns and runs top to bottom, so labels stay readable on a phone.
   Each step lights some nodes and sends packets along some edges. */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  window.Flow = function (root, cfg) {
    var box = root.querySelector(".flow");
    var nN = root.querySelector("[data-n]"), nT = root.querySelector("[data-t]"), nD = root.querySelector("[data-d]");
    var bPrev = root.querySelector("[data-prev]"), bNext = root.querySelector("[data-next]"), bPlay = root.querySelector("[data-play]");
    var dotsBox = root.querySelector("[data-dots]");
    var nodes = {}, edges = {}, geo = {}, svg = null, tall = null, step = 0;
    var playing = !reduce, timer = null, raf = null, visible = true, t0 = performance.now();
    var packets = [];
    var STEP_MS = cfg.stepMs || 5200;

    cfg.nodes.forEach(function (n) { nodes[n.id] = n; });
    cfg.edges.forEach(function (e) { edges[e.a + ">" + e.b] = e; });

    function dims() {
      return tall
        ? { w: 120, h: 62, cw: 128, rh: 100, padX: 6, padY: 34, ft: 15, fs: 12.5 }
        : { w: 140, h: 60, cw: 164, rh: 96, padX: 20, padY: 34, ft: 13, fs: 11 };
    }

    function center(n, d) {
      return tall
        ? { x: d.padX + d.w / 2 + n.r * d.cw, y: d.padY + d.h / 2 + n.c * d.rh }
        : { x: d.padX + d.w / 2 + n.c * d.cw, y: d.padY + d.h / 2 + n.r * d.rh };
    }

    function pathFor(e, d) {
      var A = geo[e.a], B = geo[e.b], w = d.w, h = d.h;
      if (!tall) {
        if (e.back) {
          var y = d.maxY + h / 2 + 34;
          return "M" + A.x + "," + (A.y + h / 2) + " C" + A.x + "," + y + " " + B.x + "," + y + " " + B.x + "," + (B.y + h / 2);
        }
        if (Math.abs(A.x - B.x) < 1) {
          var s = A.y < B.y ? 1 : -1;
          return "M" + A.x + "," + (A.y + s * h / 2) + " L" + B.x + "," + (B.y - s * h / 2);
        }
        var x1 = A.x + w / 2, x2 = B.x - w / 2, mx = (x1 + x2) / 2;
        return "M" + x1 + "," + A.y + " C" + mx + "," + A.y + " " + mx + "," + B.y + " " + x2 + "," + B.y;
      }
      if (e.back) {
        var x = d.maxX + w / 2 + 22;
        return "M" + (A.x + w / 2) + "," + A.y + " C" + x + "," + A.y + " " + x + "," + B.y + " " + (B.x + w / 2) + "," + B.y;
      }
      if (Math.abs(A.y - B.y) < 1) {
        var s2 = A.x < B.x ? 1 : -1;
        return "M" + (A.x + s2 * w / 2) + "," + A.y + " L" + (B.x - s2 * w / 2) + "," + B.y;
      }
      var y1 = A.y + h / 2, y2 = B.y - h / 2, my = (y1 + y2) / 2;
      return "M" + A.x + "," + y1 + " C" + A.x + "," + my + " " + B.x + "," + my + " " + B.x + "," + y2;
    }

    function build() {
      var d = dims();
      var maxC = 0, maxR = 0, hasBack = false;
      cfg.nodes.forEach(function (n) { maxC = Math.max(maxC, n.c); maxR = Math.max(maxR, n.r); });
      cfg.edges.forEach(function (e) { if (e.back) hasBack = true; });
      var W, H;
      if (!tall) { W = d.padX * 2 + d.w + maxC * d.cw; H = d.padY + d.h + maxR * d.rh + (hasBack ? 64 : 18); }
      else { W = d.padX * 2 + d.w + maxR * d.cw + (hasBack ? 30 : 0); H = d.padY + d.h + maxC * d.rh + 18; }

      box.innerHTML = "";
      svg = el("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": cfg.label || "System diagram" }, box);
      var defs = el("defs", {}, svg);
      ["dim", "on"].forEach(function (k) {
        var m = el("marker", { id: cfg.id + "-ar-" + k, viewBox: "0 0 10 10", refX: "9", refY: "5", markerWidth: "7", markerHeight: "7", orient: "auto-start-reverse" }, defs);
        el("path", { d: "M0,1 L9,5 L0,9 z", style: "fill:" + (k === "on" ? "var(--accent)" : "var(--stage-line)") }, m);
      });

      cfg.nodes.forEach(function (n) { geo[n.id] = center(n, d); });
      d.maxY = 0; d.maxX = 0;
      cfg.nodes.forEach(function (n) { d.maxY = Math.max(d.maxY, geo[n.id].y); d.maxX = Math.max(d.maxX, geo[n.id].x); });
      var gEdges = el("g", {}, svg), gPk = el("g", {}, svg), gNodes = el("g", {}, svg);

      cfg.edges.forEach(function (e) {
        var p = el("path", { d: pathFor(e, d), class: "edge" + (e.back ? " back" : ""), "marker-end": "url(#" + cfg.id + "-ar-dim)" }, gEdges);
        e._p = p; e._len = p.getTotalLength();
        if (e.label && !tall) {
          var mid = p.getPointAtLength(e._len / 2);
          var t = el("text", { x: mid.x, y: mid.y + (e.back ? (tall ? 0 : 16) : -8), "text-anchor": tall && e.back ? "start" : "middle", class: "elabel" }, gEdges);
          if (tall && e.back) t.setAttribute("x", mid.x + 6);
          t.textContent = e.label;
        }
      });

      cfg.nodes.forEach(function (n) {
        var c = geo[n.id];
        var g = el("g", { class: "n", tabindex: "0", role: "button", "aria-label": n.t + ". " + (n.s || "") }, gNodes);
        el("rect", { class: "box", x: c.x - d.w / 2, y: c.y - d.h / 2, width: d.w, height: d.h, rx: 12 }, g);
        var t = el("text", { class: "t", x: c.x, y: c.y + (n.s ? -3 : 5), "text-anchor": "middle", "font-size": d.ft }, g);
        t.textContent = n.t;
        if (n.s) {
          var s = el("text", { class: "s", x: c.x, y: c.y + 15, "text-anchor": "middle", "font-size": d.fs }, g);
          s.textContent = n.s;
        }
        if (n.tag) {
          var tg = el("g", { class: "tag" + (n.tag === "LLM" ? " llm" : "") }, g);
          var tw = n.tag.length * 6.6 + 12;
          el("rect", { x: c.x - tw / 2, y: c.y - d.h / 2 - 9, width: tw, height: 17, rx: 8.5 }, tg);
          var tt = el("text", { x: c.x, y: c.y - d.h / 2 + 3.5, "text-anchor": "middle", "font-size": 10 }, tg);
          tt.textContent = n.tag;
        }
        [t, g.querySelector(".s")].forEach(function (tx) {
          if (!tx) return;
          var fs = parseFloat(tx.getAttribute("font-size")), len = tx.getComputedTextLength();
          if (len > d.w - 12) tx.setAttribute("font-size", (fs * (d.w - 12) / len).toFixed(2));
        });
        n._g = g;
        function jump() {
          for (var i = 0; i < cfg.steps.length; i++) if (cfg.steps[i].on.indexOf(n.id) > -1) { pause(); go(i); return; }
        }
        g.addEventListener("click", jump);
        g.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); jump(); } });
        g.style.cursor = "pointer";
      });

      packets = [];
      cfg.edges.forEach(function (e) {
        e._pk = [];
        for (var i = 0; i < 2; i++) {
          var glow = el("circle", { r: 7, class: "pk-glow", visibility: "hidden" }, gPk);
          var dot = el("circle", { r: 3.6, class: "pk", visibility: "hidden" }, gPk);
          e._pk.push({ glow: glow, dot: dot, off: i / 2 });
        }
      });
      paint();
    }

    function paint() {
      var s = cfg.steps[step];
      box.classList.add("has-on");
      cfg.nodes.forEach(function (n) { n._g.classList.toggle("on", s.on.indexOf(n.id) > -1); });
      cfg.edges.forEach(function (e) {
        var key = e.a + ">" + e.b, on = (s.go || []).indexOf(key) > -1;
        e._on = on;
        e._p.classList.toggle("on", on);
        e._p.setAttribute("marker-end", "url(#" + cfg.id + "-ar-" + (on ? "on" : "dim") + ")");
        e._pk.forEach(function (p, i) {
          var vis = on ? "visible" : "hidden";
          p.dot.setAttribute("visibility", vis); p.glow.setAttribute("visibility", vis);
          if (on && reduce) {
            var pt = e._p.getPointAtLength(e._len * (0.35 + i * 0.3));
            p.dot.setAttribute("cx", pt.x); p.dot.setAttribute("cy", pt.y);
            p.glow.setAttribute("cx", pt.x); p.glow.setAttribute("cy", pt.y);
          }
        });
      });
      if (nN) nN.textContent = (step + 1) + " / " + cfg.steps.length;
      if (nT) nT.textContent = s.t;
      if (nD) nD.textContent = s.d;
      if (dotsBox) Array.prototype.forEach.call(dotsBox.children, function (b, i) {
        if (i === step) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
      });
      if (cfg.onStep) cfg.onStep(step, s);
    }

    function frame(now) {
      raf = null;
      if (!visible || reduce) return;
      var tt = (now - t0) / 1600;
      cfg.edges.forEach(function (e) {
        if (!e._on) return;
        e._pk.forEach(function (p) {
          var f = (tt + p.off) % 1;
          var pt = e._p.getPointAtLength(e._len * f);
          p.dot.setAttribute("cx", pt.x); p.dot.setAttribute("cy", pt.y);
          p.glow.setAttribute("cx", pt.x); p.glow.setAttribute("cy", pt.y);
        });
      });
      raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf && !reduce && visible) raf = requestAnimationFrame(frame); }

    function go(i) {
      step = (i + cfg.steps.length) % cfg.steps.length;
      paint(); kick();
    }
    function schedule() {
      clearInterval(timer);
      if (playing) timer = setInterval(function () { if (visible) go(step + 1); }, STEP_MS);
      if (bPlay) { bPlay.setAttribute("aria-pressed", playing ? "true" : "false"); bPlay.textContent = playing ? "Pause" : "Play"; }
    }
    function pause() { playing = false; schedule(); }

    if (dotsBox) {
      cfg.steps.forEach(function (s, i) {
        var b = document.createElement("button");
        b.type = "button"; b.setAttribute("aria-label", "Step " + (i + 1) + ". " + s.t);
        b.addEventListener("click", function () { pause(); go(i); });
        dotsBox.appendChild(b);
      });
    }
    if (bPrev) bPrev.addEventListener("click", function () { pause(); go(step - 1); });
    if (bNext) bNext.addEventListener("click", function () { pause(); go(step + 1); });
    if (bPlay) bPlay.addEventListener("click", function () { playing = !playing; if (playing) go(step + 1); schedule(); });

    function layout() {
      var isTall = box.clientWidth < 700;
      if (isTall === tall) return;
      tall = isTall; build(); kick();
    }
    layout();
    window.addEventListener("resize", layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { tall = null; layout(); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; kick(); }).observe(root);
    }
    document.addEventListener("visibilitychange", function () { visible = !document.hidden; kick(); });
    schedule(); kick();
    return { go: go, pause: pause };
  };
})();
