// ride.js
// FR-8: look at one match in detail, see the cost split, and confirm the request.

const me = getCurrentUser() || { id: "" };
if (!me.id) window.location.href = "index.html";

seedDemoData();

const params = new URLSearchParams(location.search);
const theirs = findItems("commutes", (c) => c.id === params.get("c"))[0];
const mine = findItems("commutes", (c) => c.id === params.get("mine") && c.userId === me.id)[0];

const result = theirs && mine ? scoreMatch(mine, theirs) : null;

if (!result) {
  window.location.href = "matches.html";
} else {
  showRide();
}

function showRide() {
const person = findItems("users", (u) => u.id === theirs.userId)[0] || {};
const driver = mine.type === "offer" ? mine : theirs;
const text = (id, value) => (document.getElementById(id).textContent = value);

function formatTime(t) {
  const [h, m] = t.split(":").map(Number);
  return ((h + 11) % 12 + 1) + ":" + String(m).padStart(2, "0") + " " + (h >= 12 ? "PM" : "AM");
}

function plusMinutes(t, add) {
  const total = minutesOf(t) + add;
  const h = Math.floor(total / 60) % 24;
  return String(h).padStart(2, "0") + ":" + String(total % 60).padStart(2, "0");
}

// Rough drive time: about 1.3 minutes per mile
const mins = Math.round(driver.miles * 1.3);

text("pAvatar", (person.name || theirs.userName).split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase());
text("pName", theirs.userName + (person.demo ? " (Demo)" : ""));
text("pDetail", person.detail || person.campus || "Campus member");
text("pRating", person.rating ? "★ " + person.rating.toFixed(1) : "New");
const alreadyRequested = findItems("matches", (m) => m.myCommuteId === mine.id && m.theirCommuteId === theirs.id).length > 0;
const plate = person.vehicle && person.vehicle.plate;
let carLine = (person.rides || 0) + " shared trips";
if (theirs.type === "offer" && person.car) {
  carLine = person.car + (vehicleVerified(person) ? " \u00b7 \u2713 Verified vehicle" : "");
  carLine += plate && alreadyRequested ? " \u00b7 Plate " + plate : " \u00b7 plate shared after you confirm";
}
text("pCar", carLine);
text("affinity", result.score + "% route match");
text("daysLine", result.sharedDays.join(", ") + " recurring");
text("pickTime", formatTime(driver.departTime));
text("pickName", driver.from);
text("dropTime", formatTime(plusMinutes(driver.departTime, mins)));
text("dropName", driver.to);
text("transit", "~" + mins + " mins · " + driver.miles + " mi (estimate)");

// Cost: gas and toll for the trip, split between the driver and every seat
const tripCost = driver.miles * MATCH_COST_PER_MILE;
const people = driver.seats + 1;
text("costTotal", "$" + tripCost.toFixed(2));
text("splitLabel", "Split across " + people + " carpoolers");
text("splitAmt", "-$" + (tripCost - result.price).toFixed(2));
text("share", "$" + result.price.toFixed(2));
text("poolNote", "$" + (result.price * result.sharedDays.length * 2).toFixed(2) + " / 2 weeks on shared days");

// Confirm
const button = document.getElementById("confirmBtn");
const message = document.getElementById("message");

function alreadySent() {
  return findItems("matches", (m) => m.myCommuteId === mine.id && m.theirCommuteId === theirs.id).length > 0;
}

function showSent() {
  button.disabled = true;
  button.textContent = "Requested";
  message.className = "success";
  message.textContent = "Request sent. Open the chat to plan the pickup.";
  if (!document.getElementById("chatLink")) {
    const link = document.createElement("a");
    link.id = "chatLink";
    link.className = "btn";
    link.href = "messages.html?with=" + encodeURIComponent(theirs.userId);
    link.textContent = "Message " + theirs.userName.split(" ")[0];
    button.after(link);

    // Demo shortcut: pretend the driver accepted and start the trip
    const rec = findItems("matches", (m) => m.myCommuteId === mine.id && m.theirCommuteId === theirs.id)[0];
    const go = document.createElement("a");
    go.className = "btn btn-dark";
    go.href = "trip.html?m=" + encodeURIComponent(rec.id);
    go.textContent = "Start trip (demo)";
    link.after(go);
  }
}

if (alreadySent()) showSent();

button.addEventListener("click", () => {
  addItem("matches", {
    id: newId("m"),
    fromUserId: me.id,
    toUserId: theirs.userId,
    myCommuteId: mine.id,
    theirCommuteId: theirs.id,
    score: result.score,
    status: "requested",
    createdAt: new Date().toISOString(),
  });
  addItem("notifications", {
    id: newId("n"),
    userId: me.id,
    type: "match",
    text: "You sent a request to " + theirs.userName + " (" + result.score + "% match).",
    read: false,
    createdAt: new Date().toISOString(),
  });
  showSent();
});

}
