(function () {
  var BASE = { acc: 91.2, ground: 96.0, terms: 88.5, p95: 2.4, cost: 3.10 };
  var METRICS = [
    ["acc", "Accuracy", "%", 1, true], ["ground", "Grounded in the audio", "%", 1, true],
    ["terms", "Domain terms right", "%", 1, true], ["p95", "Latency, p95", " s", 1, false], ["cost", "Cost per 1k calls", "", 2, false]
  ];
  var C = [
    { id: "prompt", name: "Shorter prompt", d: { acc: -0.4, ground: -3.1, terms: -0.2, p95: -0.3, cost: -0.87 }, better: 4, worse: 14, pass: false,
      sum: "Cost drops 28 percent, but grounding falls on 14 cases, all with two or more speakers. Blocked, with those 14 cases listed." },
    { id: "model", name: "Cheaper model", d: { acc: -2.8, ground: -1.2, terms: -6.0, p95: -0.9, cost: -1.89 }, better: 9, worse: 31, pass: false,
      sum: "Faster and 61 percent cheaper, but domain terms fall six points. Blocked. A good candidate for the simpler calls only." },
    { id: "glossary", name: "Add 40 glossary terms", d: { acc: 1.3, ground: 0.2, terms: 5.1, p95: 0.1, cost: 0.06 }, better: 17, worse: 2, pass: true,
      sum: "Domain terms up five points. Two cases got worse, both inside the agreed threshold, and both go in the release report." }
  ];
  var bar = document.getElementById("r-changes"), rows = document.getElementById("r-rows");
  var pbar = document.getElementById("r-bar"), prog = document.getElementById("r-prog");
  var sum = document.getElementById("r-sum"), verdict = document.getElementById("r-verdict");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, timer = null;
  function fmt(v, unit, dp) { return (unit === "" ? "$" : "") + v.toFixed(dp) + unit; }
  function table(c, done) {
    rows.innerHTML = METRICS.map(function (m) {
      var b = BASE[m[0]], d = c.d[m[0]], v = b + d;
      var good = m[4] ? d >= 0 : d <= 0;
      var big = m[4] ? d <= -1 : false;
      var col = !done ? "muted" : big ? "bad" : good ? "ok" : "warn";
      return "<tr><td>" + m[1] + "</td><td class='num'>" + fmt(b, m[2], m[3]) + "</td><td class='num'>" + (done ? fmt(v, m[2], m[3]) : "·") +
        "</td><td class='num' style='color:var(--" + col + ")'>" + (done ? (d > 0 ? "+" : d < 0 ? "-" : "") + (m[2] === "" ? "$" + Math.abs(d).toFixed(2) : Math.abs(d).toFixed(m[3]) + m[2].trim()) : "") + "</td></tr>";
    }).join("");
  }
  function run(i) {
    var c = C[i];
    Array.prototype.forEach.call(bar.children, function (x, j) { x.setAttribute("aria-pressed", j === i ? "true" : "false"); });
    clearInterval(timer);
    verdict.innerHTML = ""; sum.textContent = "";
    var n = reduce ? 300 : 0;
    function tick() {
      pbar.style.width = (n / 3) + "%";
      prog.textContent = n < 300 ? "Running case " + n + " of 300" : "300 of 300 cases. " + c.better + " better, " + c.worse + " worse, " + (300 - c.better - c.worse) + " the same.";
      table(c, n >= 300);
      if (n >= 300) {
        clearInterval(timer);
        sum.textContent = c.sum;
        verdict.innerHTML = '<span class="chip ' + (c.pass ? "ok" : "bad") + '">' + (c.pass ? "Ships" : "Blocked") + "</span>";
      }
      n = Math.min(300, n + 12);
    }
    tick();
    if (!reduce) timer = setInterval(tick, 40);
  }
  C.forEach(function (c, i) {
    var b = document.createElement("button");
    b.type = "button"; b.id = "r-" + c.id; b.textContent = c.name;
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", function () { run(i); });
    bar.appendChild(b);
  });
  table(C[0], false);
  run(0);
})();
