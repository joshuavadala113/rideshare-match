// postride.js
// FR-4: post a commute (driver offer or rider request), check it, and save it.

const user = getCurrentUser();
if (!user) {
  window.location.href = "index.html";
}

// ---- Rough distances between our main hubs (estimates only) ----
// Key is the two names sorted and joined with "|".
const ROUTE_ESTIMATES = {
  "UNT|UT Dallas": { miles: 38, mins: 50 },
  "SMU|UNT": { miles: 40, mins: 55 },
  "SMU|UT Dallas": { miles: 17, mins: 25 },
};
const DEFAULT_ROUTE = { miles: 15, mins: 25 };

// Gas and toll estimate for one trip, per mile
const COST_PER_MILE = 0.25;

const form = document.getElementById("commuteForm");
const fromInput = document.getElementById("from");
const toInput = document.getElementById("to");
const messageEl = document.getElementById("message");

let mode = "offer";
let seats = 3;
const chosenDays = new Set();
const chosenAtmosphere = new Set();

// ---- Small helpers ----

function showError(text) {
  messageEl.className = "error";
  messageEl.textContent = text;
}

function abbreviate(text) {
  const clean = text.trim();
  if (!clean) return "---";
  const words = clean.split(/\s+/);
  if (words.length > 1) {
    return words.map((w) => w[0]).join("").slice(0, 4).toUpperCase();
  }
  return clean.slice(0, 4).toUpperCase();
}

function routeEstimate() {
  const key = [fromInput.value.trim(), toInput.value.trim()].sort().join("|");
  return ROUTE_ESTIMATES[key] || null;
}

// ---- Live summary (distance, price share, counts) ----

function updateSummary() {
  document.getElementById("abbrFrom").textContent = abbreviate(fromInput.value);
  document.getElementById("abbrTo").textContent = abbreviate(toInput.value);

  const known = routeEstimate();
  const route = known || DEFAULT_ROUTE;
  const hasBoth = fromInput.value.trim() && toInput.value.trim();

  const milesEl = document.getElementById("routeMiles");
  const noteEl = document.getElementById("routeNote");
  if (!hasBoth) {
    milesEl.textContent = "Enter both places";
    noteEl.textContent = "for a distance estimate";
  } else {
    milesEl.textContent = "~" + route.miles + " mi · ~" + route.mins + " mins";
    noteEl.textContent = known ? "Estimate between campus hubs" : "Default estimate for this route";
  }

  document.getElementById("dayCount").textContent = chosenDays.size + " days/wk";

  // Split the trip cost between the driver and the riders
  const tripCost = route.miles * COST_PER_MILE;
  const perSeat = tripCost / (seats + 1);
  const tripsPerWeek = chosenDays.size * (document.getElementById("returnTime").value ? 2 : 1);
  const weekly = perSeat * seats * tripsPerWeek;
  document.getElementById("perSeat").textContent = "$" + perSeat.toFixed(2);
  document.getElementById("weekly").textContent = "Est. $" + weekly.toFixed(2) + "/wk";
}

[fromInput, toInput, document.getElementById("returnTime")].forEach((el) =>
  el.addEventListener("input", updateSummary)
);

// ---- Controls ----

document.getElementById("modeChoice").addEventListener("click", (event) => {
  const button = event.target.closest(".seg");
  if (!button) return;
  mode = button.dataset.value;
  document.querySelectorAll("#modeChoice .seg").forEach((b) => b.classList.toggle("selected", b === button));

  const driving = mode === "offer";
  document.getElementById("seatsTitle").textContent = driving ? "Available seats" : "Seats needed";
  document.getElementById("seatsNote").textContent = driving
    ? "Leave room for back row comfort"
    : "How many people are riding?";
  seats = Math.min(seats, driving ? 8 : 4);
  document.getElementById("seatCount").textContent = seats;
  updateSummary();
});

document.getElementById("invertBtn").addEventListener("click", () => {
  const temp = fromInput.value;
  fromInput.value = toInput.value;
  toInput.value = temp;
  updateSummary();
});

document.getElementById("days").addEventListener("click", (event) => {
  const button = event.target.closest(".day");
  if (!button) return;
  const day = button.dataset.day;
  if (chosenDays.has(day)) chosenDays.delete(day);
  else chosenDays.add(day);
  button.classList.toggle("selected", chosenDays.has(day));
  updateSummary();
});

document.getElementById("atmosphere").addEventListener("click", (event) => {
  const chip = event.target.closest(".chip");
  if (!chip) return;
  const value = chip.dataset.value;
  if (chosenAtmosphere.has(value)) chosenAtmosphere.delete(value);
  else chosenAtmosphere.add(value);
  chip.classList.toggle("selected", chosenAtmosphere.has(value));
});

function maxSeats() {
  return mode === "offer" ? 8 : 4;
}

document.getElementById("seatMinus").addEventListener("click", () => {
  if (seats > 1) seats -= 1;
  document.getElementById("seatCount").textContent = seats;
  updateSummary();
});

document.getElementById("seatPlus").addEventListener("click", () => {
  if (seats < maxSeats()) seats += 1;
  document.getElementById("seatCount").textContent = seats;
  updateSummary();
});

// ---- Publish ----

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const from = fromInput.value.trim();
  const to = toInput.value.trim();
  const departTime = document.getElementById("departTime").value;
  const returnTime = document.getElementById("returnTime").value;

  if (!from || !to) {
    showError("Enter both a pickup point and a destination.");
    return;
  }

  if (from.toLowerCase() === to.toLowerCase()) {
    showError("Pickup and destination can't be the same place.");
    return;
  }

  if (chosenDays.size === 0) {
    showError("Pick at least one commute day.");
    return;
  }

  if (!departTime) {
    showError("Choose a departure time.");
    return;
  }

  if (returnTime && returnTime <= departTime) {
    showError("The return time needs to be after the departure time.");
    return;
  }

  const route = routeEstimate() || DEFAULT_ROUTE;

  addItem("commutes", {
    id: newId("c"),
    userId: user.id,
    userName: user.name,
    type: mode,
    from,
    to,
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"].filter((d) => chosenDays.has(d)),
    departTime,
    returnTime,
    seats,
    atmosphere: Array.from(chosenAtmosphere),
    miles: route.miles,
    status: "open",
    createdAt: new Date().toISOString(),
  });

  messageEl.className = "success";
  messageEl.textContent = "Commute published! It's listed below.";
  renderMine();
  window.scrollTo({ top: document.getElementById("myCommutes").offsetTop - 80, behavior: "smooth" });
});

// ---- Your commutes (pause or delete) ----

function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return ((h + 11) % 12 + 1) + ":" + String(m).padStart(2, "0") + " " + suffix;
}

function renderMine() {
  const box = document.getElementById("myCommutes");
  const mine = findItems("commutes", (c) => c.userId === user.id);
  box.replaceChildren();

  if (mine.length === 0) {
    const empty = document.createElement("p");
    empty.className = "fine";
    empty.textContent = "You haven't published a commute yet.";
    box.appendChild(empty);
    return;
  }

  mine.forEach((c) => {
    const card = document.createElement("article");
    card.className = "card commute" + (c.status === "paused" ? " paused" : "");

    const title = document.createElement("strong");
    title.textContent = c.from + " → " + c.to;

    const kind = document.createElement("span");
    kind.className = "badge";
    kind.textContent = c.type === "offer" ? "Driving" : "Needs a ride";

    const head = document.createElement("div");
    head.className = "label-row";
    head.append(title, kind);

    const details = document.createElement("p");
    details.className = "fine";
    details.textContent =
      c.days.join(", ") + " · Depart " + formatTime(c.departTime) +
      (c.returnTime ? " · Return " + formatTime(c.returnTime) : "") +
      " · " + c.seats + (c.type === "offer" ? " seats" : " needed") +
      (c.atmosphere.length ? " · " + c.atmosphere.join(", ") : "");

    const actions = document.createElement("div");
    actions.className = "actions";

    const pause = document.createElement("button");
    pause.type = "button";
    pause.className = "btn-soft";
    pause.textContent = c.status === "paused" ? "Resume" : "Pause";
    pause.addEventListener("click", () => {
      updateItem("commutes", c.id, { status: c.status === "paused" ? "open" : "paused" });
      renderMine();
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "btn-soft danger";
    remove.textContent = "Delete";
    remove.addEventListener("click", () => {
      dbWrite(DB_KEYS.commutes, getAll("commutes").filter((x) => x.id !== c.id));
      renderMine();
    });

    actions.append(pause, remove);
    card.append(head, details, actions);
    box.appendChild(card);
  });
}

// ---- Start ----

const activeUsers = getAll("users").filter((u) => !u.status || u.status === "active").length;
document.getElementById("activeCount").textContent =
  activeUsers + (activeUsers === 1 ? " carpooler" : " carpoolers") + " active";

updateSummary();
renderMine();
