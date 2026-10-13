(function () {
  var SHARE = [0.40, 0.20, 0.12, 0.08, 0.06, 0.028, 0.028, 0.028, 0.028, 0.028];
  var NS = "http://www.w3.org/2000/svg";
  var mode = "direct";
  var slider = document.getElementById("h-fans"), outN = document.getElementById("h-fans-out");
  var stats = document.getElementById("h-stats"), sum = document.getElementById("h-sum"), chart = document.getElementById("h-chart");
  var fmt = function (n) { return Math.round(n).toLocaleString("en-US"); };
  function dur(s) { s = Math.round(s); if (s < 60) return s + " s"; var m = Math.floor(s / 60), r = s % 60; return m + " min" + (r ? " " + r + " s" : ""); }

  function arrivalRate(t) { var m = Math.floor(t / 60); return m < 10 ? SHARE[m] / 60 : 0; }
  function capacity(t) { return 500 * Math.pow(1.5, Math.floor(t / 300)); }

  function simulate(N) {
    var T = 3600, A = [0], S = [0], arr = [], adm = [], q = 0, clear = 0;
    for (var t = 0; t < T; t++) {
      var a = N * arrivalRate(t);
      q += a;
      var s = Math.min(q, capacity(t));
      q -= s;
      arr.push(a); adm.push(s);
      A.push(A[t] + a); S.push(S[t] + s);
      if (q > 0.5) clear = t + 1;
      if (t > 600 && q <= 0.5) break;
    }
    var maxWait = 0, j = 0;
    for (var i = 1; i < A.length; i++) {
      while (j < S.length - 1 && S[j] < A[i] - 0.5) j++;
      maxWait = Math.max(maxWait, j - i);
    }
    return { arr: arr, adm: adm, clear: clear, maxWait: maxWait };
  }

  function el(tag, a, p) { var e = document.createElementNS(NS, tag); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }

  function draw(sim, N, animate) {
    chart.innerHTML = "";
    var L = 52, R = 12, Tp = 14, B = 34, W = 520, H = 280, pw = W - L - R, ph = H - Tp - B;
    var mins = Math.max(10, Math.ceil(sim.clear / 60) + 1);
    var Tmax = mins * 60;
    var peak = N * SHARE[0] / 60;
    var ymax = Math.max(peak, 600);
    var nice = [100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000];
    var stepY = nice.find(function (v) { return ymax / v <= 5; }) || 20000;
    ymax = Math.ceil(ymax / stepY) * stepY;
    var x = function (t) { return L + pw * t / Tmax; }, y = function (v) { return Tp + ph * (1 - v / ymax); };
    for (var v = 0; v <= ymax; v += stepY) {
      el("line", { x1: L, x2: W - R, y1: y(v), y2: y(v), style: "stroke:var(--line);stroke-width:1" }, chart);
      var tx = el("text", { x: L - 8, y: y(v) + 4, "text-anchor": "end", style: "fill:var(--muted);font:11px var(--f-code)" }, chart);
      tx.textContent = v >= 1000 ? (v / 1000) + "k" : v;
    }
    var tickEvery = mins > 20 ? 5 : mins > 10 ? 2 : 1;
    for (var m = 0; m <= mins; m += tickEvery) {
      var tt = el("text", { x: x(m * 60), y: H - B + 18, "text-anchor": "middle", style: "fill:var(--muted);font:11px var(--f-code)" }, chart);
      tt.textContent = m + "m";
    }
    el("line", { x1: L, x2: W - R, y1: y(500), y2: y(500), style: "stroke:var(--warn);stroke-width:1.2;stroke-dasharray:4 5" }, chart);
    function pts(series) {
      var p = [];
      for (var t = 0; t < Tmax; t += 5) p.push(x(t).toFixed(1) + "," + y(series[t] || 0).toFixed(1));
      return p.join(" ");
    }
    var admitted = mode === "direct" ? sim.arr : sim.adm;
    if (mode === "room") {
      var poly = [];
      for (var t = 0; t < Tmax; t += 5) poly.push(x(t).toFixed(1) + "," + y(sim.arr[t] || 0).toFixed(1));
      for (t = Math.floor((Tmax - 5) / 5) * 5; t >= 0; t -= 5) poly.push(x(t).toFixed(1) + "," + y(sim.adm[t] || 0).toFixed(1));
      el("polygon", { points: poly.join(" "), style: "fill:var(--accent-wash)" }, chart);
    }
    el("polyline", { points: pts(sim.arr), style: "fill:none;stroke:var(--muted);stroke-width:1.6" }, chart);
    var line = el("polyline", { points: pts(admitted), style: "fill:none;stroke:var(--accent);stroke-width:2.4;stroke-linejoin:round" }, chart);
    if (animate && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      var len = line.getTotalLength();
      line.style.strokeDasharray = len; line.style.strokeDashoffset = len;
      line.getBoundingClientRect();
      line.style.transition = "stroke-dashoffset .9s cubic-bezier(.23,1,.32,1)";
      line.style.strokeDashoffset = 0;
    }
    var yl = el("text", { x: L, y: Tp - 2, style: "fill:var(--muted);font:11px var(--f-code)" }, chart);
    yl.textContent = "per second";
  }

  function stat(v, label, cls) {
    return '<div class="stat"><b style="color:var(--' + cls + ')">' + v + "</b><span>" + label + "</span></div>";
  }

  function render(animate) {
    var N = +slider.value;
    outN.textContent = fmt(N);
    var sim = simulate(N);
    var peak = N * SHARE[0] / 60;
    if (mode === "direct") {
      stats.innerHTML =
        stat(fmt(peak) + "/s", "writes on a shared counter at peak, against about 1 per second", peak > 1 ? "bad" : "ok") +
        stat(fmt(peak) + "/s", "into a cold collection in minute one, against a 500 start", peak > 500 ? "bad" : "ok");
      sum.textContent = peak > 500
        ? "Expect contention errors and retries in exactly the minutes that matter, and fans who refresh, which adds more load."
        : "At this size the collection is fine, but a shared counter is still the first thing to break.";
    } else {
      stats.innerHTML =
        stat("1/s", "writes on the busiest document, the live total", "ok") +
        stat(fmt(Math.min(peak, 500)) + "/s", "peak writes into Firestore in the first five minutes", "ok") +
        stat(sim.maxWait > 0 ? dur(sim.maxWait) : "none", "longest time a fan waits in line", sim.maxWait > 300 ? "warn" : "ok") +
        stat(sim.clear > 0 ? "minute " + Math.ceil(sim.clear / 60) : "never forms", "when the line is empty", "ok");
      sum.textContent = sim.maxWait > 0
        ? "Nobody gets an error. The busiest fans wait in a visible line while Firestore takes writes at the rate it is designed for."
        : "At this size nobody waits. The room stays in place for the post that goes viral.";
    }
    draw(sim, N, animate);
  }

  document.querySelectorAll("[data-h]").forEach(function (b) {
    b.addEventListener("click", function () {
      mode = b.getAttribute("data-h");
      document.querySelectorAll("[data-h]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      render(true);
    });
  });
  slider.addEventListener("input", function () { render(false); });
  render(true);
})();
