// support.js
// FR-20: safety hotline numbers and support tickets.

const me = getCurrentUser() || { id: "" };
if (!me.id) window.location.href = "index.html";

seedDemoData();

// Campus police numbers. Check these on each campus website before you rely on them.
const CAMPUS_POLICE = {
  "UNT": { name: "UNT Police", phone: "940-565-3000" },
  "UT Dallas": { name: "UT Dallas Police", phone: "972-883-2222" },
  "SMU": { name: "SMU Police", phone: "214-768-3333" },
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// ---- Hotline ----

const campus = CAMPUS_POLICE[me.campus];
if (campus) {
  document.getElementById("campusName").textContent = campus.name;
  document.getElementById("campusLine").textContent = campus.phone;
  document.getElementById("campusCall").href = "tel:" + campus.phone.replace(/-/g, "");
} else {
  document.getElementById("campusName").textContent = "Your campus police";
  document.getElementById("campusLine").textContent = "Look up the number on your campus or workplace website.";
  document.getElementById("campusCall").classList.add("hidden");
}

// ---- Ride picker ----

const pick = document.getElementById("tripPick");
findItems("matches", (m) => m.fromUserId === me.id).forEach((m) => {
  const theirs = findItems("commutes", (c) => c.id === m.theirCommuteId)[0];
  if (!theirs) return;
  const o = document.createElement("option");
  o.value = m.id;
  o.textContent = theirs.userName + " (" + theirs.from + " to " + theirs.to + ")";
  pick.appendChild(o);
});

// ---- Tickets ----

function drawTickets() {
  const box = document.getElementById("tickets");
  box.replaceChildren();
  const list = findItems("tickets", (t) => t.userId === me.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (!list.length) {
    const empty = el("div", "card center");
    empty.appendChild(el("p", "fine", "No tickets yet."));
    box.appendChild(empty);
    return;
  }

  list.forEach((t) => {
    const card = el("article", "card");
    const head = el("div", "label-row");
    head.appendChild(el("strong", "", t.category));
    head.appendChild(el("span", "badge", t.status === "open" ? "Open" : "Resolved"));
    card.appendChild(head);
    card.appendChild(el("p", "fine", "#" + t.number + " · " + new Date(t.createdAt).toLocaleDateString()));
    card.appendChild(el("p", "", t.message));
    if (t.reply) card.appendChild(el("p", "notice", "Admin reply: " + t.reply));
    box.appendChild(card);
  });
}

document.getElementById("ticketForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const note = document.getElementById("ticketNote");
  const message = document.getElementById("ticketMsg").value.trim();

  if (message.length < 10) {
    note.className = "error";
    note.textContent = "Add a few more words so we can help.";
    return;
  }

  addItem("tickets", {
    id: newId("t"),
    number: 1000 + getAll("tickets").length + 1,
    userId: me.id,
    userName: me.name,
    category: document.getElementById("category").value,
    matchId: pick.value,
    message,
    status: "open",
    createdAt: new Date().toISOString(),
  });
  addItem("notifications", {
    id: newId("n"), userId: me.id, type: "ticket",
    text: "Your support ticket was received. We'll reply here.", read: false, createdAt: new Date().toISOString(),
  });

  document.getElementById("ticketMsg").value = "";
  note.className = "success";
  note.textContent = "Ticket sent. If this is an emergency, call 911 now.";
  drawTickets();
});

drawTickets();
