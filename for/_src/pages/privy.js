(function () {
  var M = [
    { id: "phx", name: "Phoenix", flips: 18, hold: 141, holdDrop: 3, zip: "85033", zipFlips: 41 },
    { id: "tpa", name: "Tampa", flips: 11, hold: 168, holdDrop: 2, zip: "33610", zipFlips: 29 },
    { id: "cle", name: "Cleveland", flips: 24, hold: 119, holdDrop: 4, zip: "44105", zipFlips: 37 }
  ];
  var pick = 0;
  var bar = document.getElementById("p-metros"), data = document.getElementById("p-data"), out = document.getElementById("p-out");
  M.forEach(function (m, i) {
    var b = document.createElement("button");
    b.type = "button"; b.id = "p-" + m.id; b.textContent = m.name;
    b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
    b.addEventListener("click", function () {
      pick = i;
      Array.prototype.forEach.call(bar.children, function (x, j) { x.setAttribute("aria-pressed", j === i ? "true" : "false"); });
      render();
    });
    bar.appendChild(b);
  });
  function piece(label, body) {
    return '<div><p class="label" style="margin-bottom:8px">' + label + '</p><p class="out-text">' + body + "</p></div>";
  }
  function render() {
    var m = M[pick];
    data.innerHTML =
      '<div class="stat"><b>+' + m.flips + "%</b><span>flips vs last month</span></div>" +
      '<div class="stat"><b>' + m.hold + " days</b><span>median hold, down " + m.holdDrop + " weeks</span></div>" +
      '<div class="stat"><b>' + m.zip + "</b><span>busiest zip, " + m.zipFlips + " flips</span></div>";
    out.innerHTML =
      piece("Metro page title", "Where investors are flipping in " + m.name + " this month") +
      piece("Video hook, first 3 seconds", m.name + " investors are holding " + m.holdDrop + " weeks less than last month. Here is the zip where it is happening.") +
      piece("Email subject", m.zip + " had " + m.zipFlips + " flips last month") +
      piece("Email first line", "You closed in " + m.zip + " this year, so this might be useful. Flips there are up " + m.flips + " percent and the median hold is down to " + m.hold + " days.");
  }
  var W = [
    ["Week 1", "Metro pages for the top five markets and one outbound email per market, tracked in HubSpot."],
    ["Week 2", "Video scripts from the same numbers, and the first look at which metro brought trials."],
    ["Week 3", "FAQ blocks and schema on every metro page, aimed at answer engines."],
    ["Week 4", "A nurture journey for trials who have not run a search yet, using their own metro."]
  ];
  document.getElementById("p-weeks").innerHTML = W.map(function (w) {
    return '<div class="card"><q style="font-size:16px">' + w[1] + '</q><span class="v chip ok">' + w[0] + "</span></div>";
  }).join("");
  render();
})();
