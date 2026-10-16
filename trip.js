// trip.js
// FR-18, FR-19 and FR-17: a simulated live trip with GPS, ETA and the cost split.
// Nothing here uses real location. A timer moves the car along a drawn route.

const me = getCurrentUser() || { id: "" };
if (!me.id) window.location.href = "index.html";

seedDemoData();

// A whole trip takes this many real seconds on screen
const SIM_SECONDS = 40;

const record = findItems("matches", (m) => m.id === new URLSearchParams(location.search).get("m") && m.fromUserId === me.id)[0];
const mine = record ? findItems("commutes", (c) => c.id === record.myCommuteId)[0] : null;
const theirs = record ? findItems("commutes", (c) => c.id === record.theirCommuteId)[0] : null;
const result = mine && theirs ? scoreMatch(mine, theirs) : null;

if (!result) {
  window.location.href = "matches.html";
} else {
  runTrip();
}

function formatTime(t) {
  const [h, m] = t.split(":").map(Number);
  return ((h + 11) % 12 + 1) + ":" + String(m).padStart(2, "0") + " " + (h >= 12 ? "PM" : "AM");
}

function plusMinutes(t, add) {
  const total = minutesOf(t) + add;
  return String(Math.floor(total / 60) % 24).padStart(2, "0") + ":" + String(total % 60).padStart(2, "0");
}

function runTrip() {
  const person = findItems("users", (u) => u.id === theirs.userId)[0] || {};
  const driver = mine.type === "offer" ? mine : theirs;
  const totalMins = Math.round(driver.miles * 1.3);
  const arrive = plusMinutes(driver.departTime, totalMins);
  const text = (id, v) => (document.getElementById(id).textContent = v);

  // Start the trip the first time this page opens
  if (!record.tripStartedAt) {
    updateItem("matches", record.id, { status: "active", tripStartedAt: Date.now() });
    record.tripStartedAt = Date.now();
  }

  document.getElementById("backLink").href = "messages.html?with=" + encodeURIComponent(theirs.userId);
  text("toDest", "To " + driver.to);
  text("pAvatar", theirs.userName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase());
  text("pName", theirs.userName + (person.demo ? " (Demo)" : ""));
  text("pCar", person.car || person.detail || "");
  text("pRating", person.rating ? "★ " + person.rating.toFixed(1) : "New");
  text("pickTime", formatTime(driver.departTime));
  text("pickName", driver.from);
  text("dropTime", formatTime(arrive));
  text("dropName", driver.to);

  // Cost split: the driver and each seat share the gas and toll equally
  const total = driver.miles * MATCH_COST_PER_MILE;
  const share = result.price;
  const rows = document.getElementById("splitRows");
  const names = ["You", theirs.userName.split(" ")[0]];
  const youDrive = mine.type === "offer";
  [[names[0], youDrive ? "Driver share" : "Rider share"], [names[1], youDrive ? "Rider share" : "Driver share"]].forEach(([who, role]) => {
    const row = document.createElement("div");
    row.className = "label-row";
    row.innerHTML = "";
    const a = document.createElement("span");
    a.textContent = who + " (" + role + ")";
    const b = document.createElement("strong");
    b.textContent = "$" + share.toFixed(2);
    row.append(a, b);
    rows.appendChild(row);
  });
  text("splitTotal", "$" + total.toFixed(2));
  text("payNote", (youDrive ? "You get " : "You pay ") + "$" + share.toFixed(2) + " for this trip. Payment is simulated, no real money moves.");

  // Share ETA toggle
  const eta = document.getElementById("shareEta");
  eta.checked = !!record.shareEta;
  const showShare = () => text("shareNote", eta.checked ? "Sharing arrival time " + formatTime(arrive) + " (simulated link, nobody is notified)." : "");
  showShare();
  eta.addEventListener("change", () => {
    updateItem("matches", record.id, { shareEta: eta.checked });
    showShare();
  });

  document.getElementById("sosBtn").addEventListener("click", () => {
    text("safetyText", "Safety alert is a demo. In a real emergency call 911 now. Campus police numbers are on the Settings page.");
    document.getElementById("safetyBox").scrollIntoView({ behavior: "smooth", block: "center" });
  });

  // Moving car along the route
  const route = document.getElementById("route");
  const length = route.getTotalLength();
  const car = document.getElementById("car");
  const done = document.getElementById("done");
  const endBtn = document.getElementById("endBtn");
  let finished = record.status === "completed";

  function draw() {
    const progress = finished ? 1 : Math.min(1, (Date.now() - record.tripStartedAt) / (SIM_SECONDS * 1000));
    const point = route.getPointAtLength(length * progress);
    car.setAttribute("cx", point.x);
    car.setAttribute("cy", point.y);
    done.setAttribute("d", route.getAttribute("d"));
    done.setAttribute("stroke-dasharray", length * progress + " " + length);

    const left = Math.max(0, Math.round(totalMins * (1 - progress)));
    if (progress >= 1) {
      text("etaText", "Arrived at " + formatTime(arrive));
      text("speed", "0 mph");
      text("flow", "Trip complete");
      if (!finished) finish();
      return false;
    }
    text("etaText", left + " mins left · Arriving " + formatTime(arrive));
    text("speed", Math.round(58 + 5 * Math.sin(progress * 20)) + " mph");
    return true;
  }

  function finish() {
    finished = true;
    updateItem("matches", record.id, { status: "completed", completedAt: new Date().toISOString() });
    addItem("notifications", {
      id: newId("n"), userId: me.id, type: "trip",
      text: "You arrived at " + driver.to + ". Tell us how the ride went.", read: false, createdAt: new Date().toISOString(),
    });
    endBtn.textContent = "Rate this ride";
    document.getElementById("message").className = "success";
    text("message", "You arrived safely.");
  }

  if (finished) {
    endBtn.textContent = "Rate this ride";
  }

  endBtn.addEventListener("click", () => {
    if (!finished) {
      // Ending early counts as arrived for the demo
      record.tripStartedAt = Date.now() - SIM_SECONDS * 1000;
      updateItem("matches", record.id, { tripStartedAt: record.tripStartedAt });
      draw();
    }
    window.location.href = "review.html?m=" + encodeURIComponent(record.id);
  });

  const timer = setInterval(() => { if (!draw()) clearInterval(timer); }, 500);
  draw();
}
