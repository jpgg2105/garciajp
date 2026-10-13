(function () {
  var CASE = 12, UNIT_COST = 4.1;
  var ids = ["v", "l", "s", "c", "o", "i"];
  var inp = {}, out = {};
  ids.forEach(function (k) { inp[k] = document.getElementById("f-" + k); out[k] = document.getElementById("f-" + k + "-out"); });
  var promo = document.getElementById("f-promo");
  var bad = false, badBtn = document.getElementById("f-bad");
  var fmt = function (n) { return Math.round(n).toLocaleString("en-US"); };

  function engine(v, L, S, C, onHand, inbound) {
    var rop = v * (L + S), pos = onHand + inbound;
    var need = Math.max(0, v * (L + S + C) - pos);
    var qty = pos <= rop ? Math.ceil(need / CASE) * CASE : 0;
    return { rop: Math.round(rop), pos: pos, qty: qty, cases: qty / CASE, days: Math.max(0, Math.floor((pos - rop) / v)) };
  }

  function render() {
    var x = {};
    ids.forEach(function (k) { x[k] = +inp[k].value; out[k].textContent = fmt(x[k]); });
    var raw = promo.checked ? x.v * (21 + 7 * 3) / 28 : x.v;
    var r = engine(x.v, x.l, x.s, x.c, x.o, x.i);
    var rr = engine(raw, x.l, x.s, x.c, x.o, x.i);
    var extra = rr.qty - r.qty;

    document.getElementById("f-stats").innerHTML =
      '<div class="stat"><b style="color:var(--' + (r.qty ? "warn" : "ok") + ')">' + (r.qty ? fmt(r.qty) : "No order") + "</b><span>" + (r.qty ? fmt(r.cases) + " cases of 12" : "for about " + r.days + " more days") + "</span></div>" +
      '<div class="stat"><b>' + fmt(r.rop) + "</b><span>reorder point</span></div>" +
      (promo.checked ? '<div class="stat"><b style="color:var(--' + (extra > 0 ? "bad" : "muted") + ')">' + (extra > 0 ? "+" + fmt(extra) : "0") + "</b><span>" + (extra > 0 ? "extra units from the raw average, about $" + fmt(extra * UNIT_COST) + " tied up" : "difference from the raw average") + "</span></div>" : "");

    var q = r.qty, cs = r.cases;
    if (bad && q) { q = q + 9; }
    var lead = "Selling about " + fmt(x.v) + " a day across channels" + (promo.checked ? ", with last week's Amazon promo left out" : "") + ". ";
    var text = lead + "The supplier takes " + x.l + " days and you keep " + x.s + " safety days, so the reorder point is " + fmt(r.rop) + ". You have " + fmt(x.o) + " on hand and " + fmt(x.i) + " inbound, " + fmt(r.pos) + " in total, which is " +
      (r.qty ? "below it. Ordering " + fmt(q) + " units, " + fmt(cs) + " cases of 12, covers " + x.c + " days after it arrives." : "above it. No order yet. At this pace you reach the reorder point in about " + r.days + " days.");
    document.getElementById("f-reason").textContent = text;
    document.getElementById("f-note").textContent = r.qty
      ? "Hi, could you confirm " + fmt(cs) + " cases (" + fmt(q) + " units) of the merino crew socks, black, size M, at our current price? Please send the ship date when you have it. Thanks."
      : "No supplier note until an order is needed.";

    var allowed = [x.v, x.l, x.s, x.c, x.o, x.i, r.rop, r.pos, r.qty, r.cases, r.days, 12, 7, 28].map(Math.round);
    var nums = (text.match(/\d[\d,]*/g) || []).map(function (s) { return +s.replace(/,/g, ""); });
    var box = document.getElementById("f-check"), wrong = [];
    box.innerHTML = "";
    nums.forEach(function (n) {
      var ok = allowed.indexOf(n) > -1;
      if (!ok) wrong.push(n);
      var c = document.createElement("span"); c.className = "chip " + (ok ? "ok" : "bad"); c.textContent = fmt(n);
      box.appendChild(c);
    });
    document.getElementById("f-check-sum").textContent = wrong.length
      ? "The draft says " + fmt(wrong[0]) + " but the engine says " + fmt(r.qty) + ". The draft is rejected and written again before the buyer sees it."
      : "Every number in the text matches the engine, so the draft can be shown.";
    badBtn.textContent = bad ? "Show the good draft" : "Show a bad draft";
    badBtn.disabled = !r.qty;
    badBtn.style.opacity = r.qty ? 1 : .5;
  }

  ids.forEach(function (k) { inp[k].addEventListener("input", render); });
  promo.addEventListener("change", render);
  badBtn.addEventListener("click", function () { bad = !bad; render(); });
  render();
})();
