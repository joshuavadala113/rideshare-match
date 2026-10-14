// matches.js
// FR-5 results screen and FR-6 filters. Uses matching.js to score the commutes.

const me = getCurrentUser() || { id: "" };
if (!me.id) {
  window.location.href = "index.html";
}

seedDemoData();

const resultsEl = document.getElementById("results");
const countPill = document.getElementById("countPill");
const chooser = document.getElementById("myCommute");
const sheet = document.getElementById("sheet");

// Everything the person has chosen to filter by
const filters = {
  top: false,
  drivers: false,
  earliest: false,
  sortBy: "match",
  fromTime: "",
  toTime: "",
  maxDetour: "",
  minScore: 40,
};

const startingQuery = (new URLSearchParams(location.search).get("q") || "").trim().toLowerCase();

// ---- Small helpers ----

function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return ((h + 11) % 12 + 1) + ":" + String(m).padStart(2, "0") + " " + (h >= 12 ? "PM" : "AM");
}

function initialsOf(name) {
  return (name || "?").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function myOpenCommutes() {
  return findItems("commutes", (c) => c.userId === me.id && c.status === "open");
}

function selectedCommute() {
  const list = myOpenCommutes();
  return list.find((c) => c.id === chooser.value) || list[0] || null;
}

function alreadyRequested(myCommuteId, theirCommuteId) {
  return findItems("matches", (m) => m.myCommuteId === myCommuteId && m.theirCommuteId === theirCommuteId).length > 0;
}

// ---- Top card (route) ----

function showRoute(commute) {
  const list = myOpenCommutes();

  chooser.replaceChildren();
  list.forEach((c) => {
    const option = document.createElement("option");
    option.value = c.id;
    option.textContent = c.from + " to " + c.to + " (" + formatTime(c.departTime) + ")";
    chooser.appendChild(option);
  });
  if (commute) chooser.value = commute.id;
  chooser.classList.toggle("hidden", list.length < 2);

  const title = document.getElementById("routeTitle");
  const sub = document.getElementById("routeSub");
  if (!commute) {
    title.textContent = "No commute yet";
    sub.textContent = "Post a commute to see who matches.";
    return;
  }
  title.textContent = commute.from + " → " + commute.to;
  sub.textContent =
    (commute.type === "offer" ? "Driving" : "Needs a ride") +
    " · Leaves " + formatTime(commute.departTime) + " · " + commute.days.join(", ");
}

// ---- Apply filters to the scored list ----

function applyFilters(matches, mine) {
  let list = matches.filter((m) => m.score >= Math.max(40, Number(filters.minScore)));

  if (filters.top) list = list.filter((m) => m.score >= 90);
  if (filters.drivers) list = list.filter((m) => m.commute.type === "offer");
  if (filters.fromTime) list = list.filter((m) => m.commute.departTime >= filters.fromTime);
  if (filters.toTime) list = list.filter((m) => m.commute.departTime <= filters.toTime);
  if (filters.maxDetour) list = list.filter((m) => m.detour <= Number(filters.maxDetour));

  if (startingQuery) {
    list = list.filter((m) =>
      (m.commute.from + " " + m.commute.to + " " + m.commute.userName).toLowerCase().includes(startingQuery)
    );
  }

  const sortBy = filters.earliest ? "earliest" : filters.sortBy;
  if (sortBy === "earliest") list.sort((a, b) => a.commute.departTime.localeCompare(b.commute.departTime));
  else if (sortBy === "price") list.sort((a, b) => a.price - b.price);
  else list.sort((a, b) => b.score - a.score);

  return list;
}

// ---- One match card ----

function makeCard(match, mine) {
  const c = match.commute;
  const person = findItems("users", (u) => u.id === c.userId)[0] || {};
  const isDriver = c.type === "offer";

  const card = el("article", "card match");

  // Top row: avatar, name, match percentage
  const top = el("div", "match-top");
  top.appendChild(el("div", "avatar big", initialsOf(c.userName)));

  const who = el("div", "grow");
  const nameLine = el("div", "name-line");
  nameLine.appendChild(el("strong", "", c.userName));
  if (person.rating) nameLine.appendChild(el("span", "stars", "★ " + person.rating.toFixed(1) + " (" + person.rides + ")"));
  who.appendChild(nameLine);
  who.appendChild(el("div", "fine", (person.detail || person.campus || "Campus member") + (person.demo ? " · Demo" : "")));
  top.appendChild(who);

  top.appendChild(el("span", "score" + (match.score >= 90 ? " high" : ""), match.score + "% match"));
  card.appendChild(top);

  // Info grid
  const info = el("div", "info-grid");
  info.appendChild(el("span", "", "Leaves " + formatTime(c.departTime)));
  info.appendChild(el("span", "", "≈" + match.detour.toFixed(1) + " mi detour"));
  info.appendChild(el("span", "blue-text", isDriver ? c.seats + " seats open" : c.seats + " seat needed"));
  info.appendChild(el("span", "", (isDriver ? "$" : "Offers $") + match.price.toFixed(2) + (isDriver ? " / ride" : "")));
  card.appendChild(info);

  // Tags
  const tags = el("div", "tag-row");
  c.atmosphere.forEach((t) => tags.appendChild(el("span", "chip small", t)));
  if (isDriver && person.car) tags.appendChild(el("span", "chip small", person.car));
  tags.appendChild(el("span", "chip small", c.from + " → " + c.to));
  card.appendChild(tags);

  // Details that open with the info button
  const details = el("p", "fine hidden", "Shared days: " + match.sharedDays.join(", ") + ". Time gap: " + match.timeGap + " min.");
  card.appendChild(details);

  // Buttons
  const actions = el("div", "actions");
  const requested = alreadyRequested(mine.id, c.id);
  const main = document.createElement("button");
  main.type = "button";
  main.className = "grow " + (match.score >= 90 ? "" : "btn-dark");
  main.textContent = requested ? "Requested" : isDriver ? "Request Seat" : "Offer Ride to " + c.userName.split(" ")[0];
  main.disabled = requested;
  main.addEventListener("click", () => sendRequest(match, mine, main));

  const infoBtn = document.createElement("button");
  infoBtn.type = "button";
  infoBtn.className = "btn-soft round-btn";
  infoBtn.textContent = "i";
  infoBtn.setAttribute("aria-label", "Match details");
  infoBtn.addEventListener("click", () => details.classList.toggle("hidden"));

  actions.append(main, infoBtn);
  card.appendChild(actions);
  return card;
}

// ---- Request a seat or offer a ride ----

function sendRequest(match, mine, button) {
  addItem("matches", {
    id: newId("m"),
    fromUserId: me.id,
    toUserId: match.commute.userId,
    myCommuteId: mine.id,
    theirCommuteId: match.commute.id,
    score: match.score,
    status: "requested",
    createdAt: new Date().toISOString(),
  });

  addItem("notifications", {
    id: newId("n"),
    userId: me.id,
    type: "match",
    text: "You sent a request to " + match.commute.userName + " (" + match.score + "% match).",
    read: false,
    createdAt: new Date().toISOString(),
  });

  button.textContent = "Requested";
  button.disabled = true;

  // Offer a shortcut to the chat
  if (!button.parentNode.querySelector(".chat-link")) {
    const chat = document.createElement("a");
    chat.className = "btn btn-soft chat-link";
    chat.style.width = "auto";
    chat.textContent = "Message";
    chat.href = "messages.html?with=" + encodeURIComponent(match.commute.userId);
    button.parentNode.insertBefore(chat, button.nextSibling);
  }
}

// ---- Draw everything ----

function render() {
  const mine = selectedCommute();
  showRoute(mine);
  resultsEl.replaceChildren();

  const note = document.getElementById("queryNote");
  note.textContent = startingQuery ? 'Filtered by "' + startingQuery + '". Open Matches from the menu to clear it.' : "";

  if (!mine) {
    const empty = el("div", "card center");
    empty.appendChild(el("p", "", "You need a commute before we can find matches."));
    const link = el("a", "btn", "Post a commute");
    link.href = "postride.html";
    empty.appendChild(link);
    resultsEl.appendChild(empty);
    countPill.textContent = "0 matches found";
    return;
  }

  const others = findItems("commutes", (c) => c.userId !== me.id && c.status === "open");
  const matches = applyFilters(findMatches(mine, others), mine);

  countPill.textContent = matches.length + (matches.length === 1 ? " match found" : " matches found");

  if (matches.length === 0) {
    const empty = el("div", "card center");
    empty.appendChild(el("strong", "", "No matches yet"));
    empty.appendChild(el("p", "fine", "Try different days or times, loosen the filters, or check back later."));
    resultsEl.appendChild(empty);
  }

  matches.forEach((m) => resultsEl.appendChild(makeCard(m, mine)));

  // 0.404 kg of CO2 per car mile, the usual US average
  const saved = mine.miles * 0.404;
  document.getElementById("co2Text").textContent = "Saving " + saved.toFixed(1) + " kg CO2 per trip";
}

// ---- Controls ----

chooser.addEventListener("change", render);

document.getElementById("filterChips").addEventListener("click", (event) => {
  const chip = event.target.closest(".chip");
  if (!chip) return;
  const key = chip.dataset.filter;
  filters[key] = !filters[key];
  chip.classList.toggle("selected", filters[key]);
  render();
});

function openSheet(open) {
  sheet.classList.toggle("hidden", !open);
}

document.getElementById("openFilter").addEventListener("click", () => openSheet(true));
document.getElementById("floatFilter").addEventListener("click", () => openSheet(true));
document.getElementById("closeSheet").addEventListener("click", () => openSheet(false));
sheet.addEventListener("click", (event) => {
  if (event.target === sheet) openSheet(false);
});

document.getElementById("applyFilter").addEventListener("click", () => {
  filters.sortBy = document.getElementById("sortBy").value;
  filters.fromTime = document.getElementById("fromTime").value;
  filters.toTime = document.getElementById("toTime").value;
  filters.maxDetour = document.getElementById("maxDetour").value;
  filters.minScore = document.getElementById("minScore").value;
  openSheet(false);
  render();
});

document.getElementById("resetFilter").addEventListener("click", () => {
  document.getElementById("sortBy").value = "match";
  document.getElementById("fromTime").value = "";
  document.getElementById("toTime").value = "";
  document.getElementById("maxDetour").value = "";
  document.getElementById("minScore").value = "40";
  Object.assign(filters, { top: false, drivers: false, earliest: false, sortBy: "match", fromTime: "", toTime: "", maxDetour: "", minScore: 40 });
  document.querySelectorAll("#filterChips .chip").forEach((c) => c.classList.remove("selected"));
  openSheet(false);
  render();
});

render();
