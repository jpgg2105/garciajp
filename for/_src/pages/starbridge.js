(function () {
  var S = [
    { q: "Principals are still tracking PD hours in spreadsheets and it goes wrong every semester.", where: "School board, item 6", stage: "Pain", phrase: "miss", hybrid: "show" },
    { q: "The board approved the award of RFP 26-114 for staff training scheduling software.", where: "School board, consent agenda", stage: "Awarded", phrase: "noise", hybrid: "drop" },
    { q: "We set aside eighty thousand dollars next year to replace how we schedule staff training.", where: "Budget workshop, item 3", stage: "Budgeted", phrase: "show", hybrid: "show" },
    { q: "Presentation from a vendor on their training scheduling platform.", where: "City council, item 9", stage: "Vendor pitch", phrase: "noise", hybrid: "drop" },
    { q: "Teachers told us the substitute and training calendar is a mess every Monday.", where: "School board, public comment", stage: "Pain", phrase: "miss", hybrid: "show" }
  ];
  var LABEL = {
    show: ["ok", "Shown, early stage"],
    noise: ["bad", "Shown, but too late"],
    miss: ["warn", "Missed"],
    drop: ["dim", "Dropped by the gate"]
  };
  var box = document.getElementById("snips"), sum = document.getElementById("snip-sum");
  var mode = "phrase";
  function render() {
    box.innerHTML = "";
    S.forEach(function (s) {
      var v = s[mode], l = LABEL[v];
      var c = document.createElement("div");
      c.className = "card " + (v === "show" ? "shown" : v === "noise" ? "noise" : "out");
      var q = document.createElement("q"); q.textContent = s.q;
      var m = document.createElement("span"); m.className = "meta";
      m.textContent = s.where + (mode === "hybrid" ? " · stage " + s.stage : "");
      var chip = document.createElement("span"); chip.className = "v chip " + l[0]; chip.textContent = l[1];
      c.appendChild(q); c.appendChild(chip); c.appendChild(m);
      box.appendChild(c);
    });
    sum.textContent = mode === "phrase"
      ? "Phrase match shows three results, and two of them are an awarded contract and a vendor pitch. It misses both real complaints because nobody said scheduling."
      : "Hybrid matching finds both complaints by meaning. The stage gate drops the award and the pitch, so all three results are early enough to act on.";
  }
  document.querySelectorAll("[data-m]").forEach(function (b) {
    b.addEventListener("click", function () {
      mode = b.getAttribute("data-m");
      document.querySelectorAll("[data-m]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      render();
    });
  });
  render();
})();
