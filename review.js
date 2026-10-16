// review.js
// FR-9: rate the other person after a trip. FR-10: report a problem.

const me = getCurrentUser() || { id: "" };
if (!me.id) window.location.href = "index.html";

seedDemoData();

const record = findItems("matches", (m) => m.id === new URLSearchParams(location.search).get("m") && m.fromUserId === me.id)[0];
const mine = record ? findItems("commutes", (c) => c.id === record.myCommuteId)[0] : null;
const theirs = record ? findItems("commutes", (c) => c.id === record.theirCommuteId)[0] : null;
const result = mine && theirs ? scoreMatch(mine, theirs) : null;

if (!result) {
  window.location.href = "matches.html";
} else {
  startReview();
}

function formatTime(t) {
  const [h, m] = t.split(":").map(Number);
  return ((h + 11) % 12 + 1) + ":" + String(m).padStart(2, "0") + " " + (h >= 12 ? "PM" : "AM");
}

function startReview() {
  const person = findItems("users", (u) => u.id === theirs.userId)[0] || {};
  const driver = mine.type === "offer" ? mine : theirs;
  const first = theirs.userName.split(" ")[0];
  const youDrive = mine.type === "offer";
  const text = (id, v) => (document.getElementById(id).textContent = v);

  const total = Math.round(driver.miles * 1.3);
  const t = minutesOf(driver.departTime) + total;
  const arrive = String(Math.floor(t / 60) % 24).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0");

  text("arrivedAt", driver.to);
  text("arrivedTime", "Arrived at " + formatTime(arrive));
  text("pAvatar", theirs.userName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase());
  text("pName", theirs.userName + (person.demo ? " (Demo)" : ""));
  text("ask", "How was your carpool with " + first + "?");
  text("cost", "$" + result.price.toFixed(2));
  text("costLabel", youDrive ? "Your share of gas & tolls (you receive)" : "Your share of gas & tolls");
  text("tipTo", "100% to " + first);

  let stars = 5;
  const tips = [];
  const labels = { 1: "Poor", 2: "Fair", 3: "Good", 4: "Great", 5: "Exceptional Carpool" };
  const starBox = document.getElementById("stars");

  function drawStars() {
    starBox.replaceChildren();
    for (let i = 1; i <= 5; i++) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "star" + (i <= stars ? " on" : "");
      b.textContent = "★";
      b.setAttribute("aria-label", i + " star" + (i > 1 ? "s" : ""));
      b.addEventListener("click", () => { stars = i; drawStars(); });
      starBox.appendChild(b);
    }
    text("starLabel", labels[stars] + " (" + stars + ".0)");
  }
  drawStars();

  const compliments = new Set();
  document.getElementById("compliments").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    const v = chip.dataset.v;
    if (compliments.has(v)) compliments.delete(v); else compliments.add(v);
    chip.classList.toggle("selected", compliments.has(v));
  });

  let tip = 2;
  document.getElementById("tips").addEventListener("click", (e) => {
    const b = e.target.closest(".seg");
    if (!b) return;
    tip = Number(b.dataset.v);
    document.querySelectorAll("#tips .seg").forEach((x) => x.classList.toggle("selected", x === b));
  });

  const submit = document.getElementById("submit");
  const message = document.getElementById("message");

  function alreadyReviewed() {
    return findItems("reviews", (r) => r.matchId === record.id && r.fromUserId === me.id)[0];
  }

  function lock() {
    submit.disabled = true;
    submit.textContent = "Review sent";
    message.className = "success";
    message.textContent = "Thanks! Your review was saved.";
  }

  if (alreadyReviewed()) lock();

  submit.addEventListener("click", () => {
    if (alreadyReviewed()) return;
    addItem("reviews", {
      id: newId("r"),
      matchId: record.id,
      fromUserId: me.id,
      toUserId: theirs.userId,
      stars,
      compliments: Array.from(compliments),
      note: document.getElementById("note").value.trim(),
      tip,
      createdAt: new Date().toISOString(),
    });

    // Update the other person's average if they are a real (non-demo) account
    if (!person.demo) {
      const all = findItems("reviews", (r) => r.toUserId === theirs.userId);
      const avg = all.reduce((s, r) => s + r.stars, 0) / all.length;
      updateItem("users", theirs.userId, { rating: Math.round(avg * 10) / 10, rides: all.length });
    }
    lock();
    setTimeout(() => (window.location.href = "dashboard.html"), 1200);
  });

  // ---- Report (FR-10) ----
  const box = document.getElementById("reportBox");
  document.getElementById("reportBtn").addEventListener("click", () => box.classList.toggle("hidden"));
  document.getElementById("sendReport").addEventListener("click", () => {
    const details = document.getElementById("details").value.trim();
    const msg = document.getElementById("reportMsg");
    if (details.length < 10) {
      msg.className = "error";
      msg.textContent = "Add a few words about what happened.";
      return;
    }
    addItem("reports", {
      id: newId("rep"),
      fromUserId: me.id,
      fromName: me.name,
      aboutUserId: theirs.userId,
      aboutName: theirs.userName,
      matchId: record.id,
      reason: document.getElementById("reason").value,
      details,
      status: "open",
      createdAt: new Date().toISOString(),
    });
    msg.className = "success";
    msg.textContent = "Report sent. Our team will look at it.";
    document.getElementById("sendReport").disabled = true;
  });
}
