// activity.js
// FR-14: notification list, plus a short history of your ride requests and trips.

const me = getCurrentUser() || { id: "" };
if (!me.id) window.location.href = "index.html";

seedDemoData();

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function when(iso) {
  const d = new Date(iso);
  const h = d.getHours();
  const time = ((h + 11) % 12 + 1) + ":" + String(d.getMinutes()).padStart(2, "0") + " " + (h >= 12 ? "PM" : "AM");
  return (d.toDateString() === new Date().toDateString() ? "Today" : d.toLocaleDateString()) + ", " + time;
}

// Demo drivers and riders answer requests after a few seconds (simulated, they are made up)
function answerDemoRequests() {
  findItems("matches", (m) => m.fromUserId === me.id && m.status === "requested").forEach((m) => {
    const other = findItems("users", (u) => u.id === m.toUserId)[0];
    if (other && other.demo && Date.now() - new Date(m.createdAt).getTime() > 5000) {
      updateItem("matches", m.id, { status: "accepted" });
      addItem("notifications", {
        id: newId("n"), userId: me.id, type: "accepted",
        text: other.name + " accepted your request. Say hi in Messages.", read: false, createdAt: new Date().toISOString(),
      });
    }
  });
}

function drawNotes() {
  const box = document.getElementById("notes");
  box.replaceChildren();
  const list = findItems("notifications", (n) => n.userId === me.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (list.length === 0) {
    const empty = el("div", "card center");
    empty.appendChild(el("p", "fine", "Nothing yet. Requests, replies and trip updates show up here."));
    box.appendChild(empty);
    return;
  }

  list.forEach((n) => {
    const card = el("article", "card note" + (n.read ? "" : " unread"));
    const body = el("div", "grow");
    body.appendChild(el("div", "", n.text));
    body.appendChild(el("div", "fine", when(n.createdAt)));
    card.appendChild(body);
    if (!n.read) {
      const b = el("button", "chip", "Mark read");
      b.type = "button";
      b.style.margin = "0";
      b.addEventListener("click", () => { updateItem("notifications", n.id, { read: true }); drawNotes(); });
      card.appendChild(b);
    }
    box.appendChild(card);
  });
}

function drawRides() {
  const box = document.getElementById("rides");
  box.replaceChildren();
  const list = findItems("matches", (m) => m.fromUserId === me.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (list.length === 0) {
    const empty = el("div", "card center");
    empty.appendChild(el("p", "fine", "No rides yet."));
    const link = el("a", "btn", "Find matches");
    link.href = "matches.html";
    empty.appendChild(link);
    box.appendChild(empty);
    return;
  }

  const labels = { requested: "Waiting for reply", accepted: "Accepted", active: "On the way", completed: "Completed" };

  list.forEach((m) => {
    const theirs = findItems("commutes", (c) => c.id === m.theirCommuteId)[0];
    const card = el("article", "card");
    const head = el("div", "label-row");
    head.appendChild(el("strong", "", theirs ? theirs.userName : "Ride"));
    head.appendChild(el("span", "badge", labels[m.status] || m.status));
    card.appendChild(head);
    if (theirs) card.appendChild(el("p", "fine", theirs.from + " → " + theirs.to + " · " + theirs.days.join(", ")));

    const actions = el("div", "actions");
    const chat = el("a", "btn btn-soft", "Message");
    chat.href = "messages.html?with=" + encodeURIComponent(m.toUserId);
    chat.style.width = "auto";
    actions.appendChild(chat);

    if (m.status === "accepted" || m.status === "active") {
      const go = el("a", "btn", m.status === "active" ? "Back to trip" : "Start trip (demo)");
      go.href = "trip.html?m=" + encodeURIComponent(m.id);
      go.style.width = "auto";
      actions.appendChild(go);
    }
    if (m.status === "completed") {
      const reviewed = findItems("reviews", (r) => r.matchId === m.id && r.fromUserId === me.id).length > 0;
      if (!reviewed) {
        const rate = el("a", "btn", "Rate ride");
        rate.href = "review.html?m=" + encodeURIComponent(m.id);
        rate.style.width = "auto";
        actions.appendChild(rate);
      }
    }
    card.appendChild(actions);
    box.appendChild(card);
  });
}

document.getElementById("markAll").addEventListener("click", () => {
  findItems("notifications", (n) => n.userId === me.id && !n.read).forEach((n) => updateItem("notifications", n.id, { read: true }));
  drawNotes();
  document.querySelectorAll(".badge-count").forEach((b) => b.remove());
});

answerDemoRequests();
drawNotes();
drawRides();
// Check again in case a demo person is about to answer
setInterval(() => { answerDemoRequests(); drawNotes(); drawRides(); }, 6000);
