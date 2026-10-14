// messages.js
// FR-7: chat between a rider and a driver. Messages live in localStorage.
// Demo people answer with a canned reply so the chat can be shown in class.

const me = getCurrentUser() || { id: "" };
if (!me.id) {
  window.location.href = "index.html";
}

seedDemoData();

const otherId = new URLSearchParams(location.search).get("with");

const REPLIES = [
  "Sounds good! See you then.",
  "Perfect, I'll be there a few minutes early.",
  "No problem. I usually wait by the main entrance.",
  "Thanks for letting me know!",
  "Got it. Text me when you're close.",
];

// ---- Helpers ----

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function initialsOf(name) {
  return (name || "?").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

function clock(iso) {
  const d = new Date(iso);
  const h = d.getHours();
  return ((h + 11) % 12 + 1) + ":" + String(d.getMinutes()).padStart(2, "0") + " " + (h >= 12 ? "PM" : "AM");
}

function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return ((h + 11) % 12 + 1) + ":" + String(m).padStart(2, "0") + " " + (h >= 12 ? "PM" : "AM");
}

function userById(id) {
  return findItems("users", (u) => u.id === id)[0] || null;
}

// Messages between me and one other person, oldest first. Hides replies that haven't "arrived" yet.
function thread(otherUserId) {
  const now = Date.now();
  return findItems("messages", (m) =>
    ((m.fromId === me.id && m.toId === otherUserId) || (m.fromId === otherUserId && m.toId === me.id)) &&
    new Date(m.createdAt).getTime() <= now
  ).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// Everyone I have talked to or sent a match request to
function partnerIds() {
  const ids = new Set();
  findItems("messages", (m) => m.fromId === me.id || m.toId === me.id).forEach((m) => ids.add(m.fromId === me.id ? m.toId : m.fromId));
  findItems("matches", (m) => m.fromUserId === me.id).forEach((m) => ids.add(m.toUserId));
  return Array.from(ids);
}

// ---- Send ----

function send(toId, text) {
  const clean = text.trim();
  if (!clean) return;
  const now = Date.now();
  addItem("messages", { id: newId("msg"), fromId: me.id, toId, text: clean, createdAt: new Date(now).toISOString() });

  const other = userById(toId);
  if (other && other.demo) {
    // Canned reply that shows up a moment later
    const reply = REPLIES[Math.floor(Math.random() * REPLIES.length)];
    addItem("messages", { id: newId("msg"), fromId: toId, toId: me.id, text: reply, createdAt: new Date(now + 1500).toISOString() });
    setTimeout(drawChat, 1600);
  }
  drawChat();
}

// ---- Inbox ----

function drawInbox() {
  const list = document.getElementById("threadList");
  list.replaceChildren();
  const ids = partnerIds();
  document.getElementById("threadCount").textContent = ids.length + (ids.length === 1 ? " chat" : " chats");

  if (ids.length === 0) {
    const empty = el("div", "card center");
    empty.appendChild(el("strong", "", "No chats yet"));
    empty.appendChild(el("p", "fine", "Send a seat request from Matches and the chat shows up here."));
    const link = el("a", "btn", "Find matches");
    link.href = "matches.html";
    empty.appendChild(link);
    list.appendChild(empty);
    return;
  }

  ids.forEach((id) => {
    const person = userById(id) || { name: "Unknown" };
    const msgs = thread(id);
    const last = msgs[msgs.length - 1];

    const row = el("a", "card thread");
    row.href = "messages.html?with=" + encodeURIComponent(id);
    row.appendChild(el("div", "avatar big", initialsOf(person.name)));
    const mid = el("div", "grow");
    mid.appendChild(el("strong", "", person.name + (person.demo ? " (Demo)" : "")));
    mid.appendChild(el("div", "fine", last ? last.text : "Say hi"));
    row.appendChild(mid);
    if (last) row.appendChild(el("span", "fine", clock(last.createdAt)));
    list.appendChild(row);
  });
}

// ---- Conversation ----

function drawChat() {
  const person = userById(otherId);
  const box = document.getElementById("bubbles");
  box.replaceChildren();

  thread(otherId).forEach((m) => {
    const mine = m.fromId === me.id;
    const wrap = el("div", "msg " + (mine ? "mine" : "theirs"));
    wrap.appendChild(el("div", "bubble", m.text));
    wrap.appendChild(el("span", "stamp", clock(m.createdAt) + (mine ? " ✓✓" : "")));
    box.appendChild(wrap);
  });

  if (!box.children.length) box.appendChild(el("p", "fine center", "No messages yet. Say hi to " + person.name.split(" ")[0] + "."));
  box.scrollTop = box.scrollHeight;
  window.scrollTo({ top: document.body.scrollHeight });
}

function openChat() {
  const person = userById(otherId);
  if (!person) {
    window.location.href = "messages.html";
    return;
  }
  document.getElementById("inbox").classList.add("hidden");
  document.getElementById("chat").classList.remove("hidden");

  document.getElementById("chatAvatar").textContent = initialsOf(person.name);
  document.getElementById("chatName").textContent = person.name + (person.demo ? " (Demo)" : "");
  const car = document.getElementById("chatCar");
  car.textContent = person.car || person.detail || person.campus || "";
  car.classList.toggle("hidden", !car.textContent);

  // Show the commute that links us, if there is one
  const link = findItems("matches", (m) => m.fromUserId === me.id && m.toUserId === otherId)[0];
  const trip = link ? findItems("commutes", (c) => c.id === link.theirCommuteId)[0] : null;
  const tripBar = document.getElementById("tripBar");
  if (trip) {
    document.getElementById("tripTime").textContent = "Leaves " + formatTime(trip.departTime) + " · " + trip.days.join(", ");
    document.getElementById("tripRoute").textContent = trip.from + " → " + trip.to;
    document.getElementById("viewTrip").href = "ride.html?c=" + encodeURIComponent(trip.id) + "&mine=" + encodeURIComponent(link.myCommuteId);
  } else {
    tripBar.classList.add("hidden");
  }

  document.getElementById("callBtn").addEventListener("click", () => {
    const note = document.getElementById("chatNote");
    note.textContent = "Calling isn't part of this demo. Use chat for now.";
    note.classList.remove("hidden");
  });

  // First time: start the chat with an intro so the thread isn't empty
  if (thread(otherId).length === 0 && link) {
    send(otherId, "Hi " + person.name.split(" ")[0] + "! I sent you a carpool request. Does the time work for you?");
  }

  document.getElementById("sendForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("msgInput");
    send(otherId, input.value);
    input.value = "";
  });

  document.getElementById("quickReplies").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (chip) send(otherId, chip.dataset.text);
  });

  drawChat();
}

if (otherId) openChat();
else drawInbox();
