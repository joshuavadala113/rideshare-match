// admin.js
// FR-11: report queue. FR-12: suspend, reinstate or remove accounts. FR-13: counts.
// Only a user with role "admin" can open this page. (Real security needs a server, this is a demo.)

const me = getCurrentUser() || { id: "" };
if (!me.id) window.location.href = "index.html";
else if (me.role !== "admin") window.location.href = "dashboard.html";

let reportView = "open";

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function btn(label, className, onClick) {
  const b = el("button", className, label);
  b.type = "button";
  b.style.width = "auto";
  b.addEventListener("click", onClick);
  return b;
}

function notify(userId, text) {
  addItem("notifications", { id: newId("n"), userId, type: "admin", text, read: false, createdAt: new Date().toISOString() });
}

// ---- Counts (FR-13) ----

function drawStats() {
  const users = findItems("users", (u) => u.role !== "admin");
  const box = document.getElementById("stats");
  box.replaceChildren();
  const numbers = [
    [users.filter((u) => u.status !== "suspended").length, "Active members"],
    [users.filter((u) => u.status === "suspended").length, "Suspended"],
    [findItems("commutes", (c) => c.status === "open").length, "Open commutes"],
    [findItems("matches", () => true).length, "Ride requests"],
    [findItems("matches", (m) => m.status === "completed").length, "Trips done"],
    [findItems("reports", (r) => r.status === "open").length, "Open reports"],
    [findItems("tickets", (t) => t.status === "open").length, "Open tickets"],
  ];
  numbers.forEach(([n, label]) => {
    const cell = el("div");
    cell.appendChild(el("strong", "", String(n)));
    cell.appendChild(el("span", "", label));
    box.appendChild(cell);
  });
}

// ---- Account actions (FR-12) ----

function suspend(userId) {
  updateItem("users", userId, { status: "suspended" });
  // Their commutes stop showing up in matches
  findItems("commutes", (c) => c.userId === userId && c.status === "open").forEach((c) => updateItem("commutes", c.id, { status: "paused" }));
}

function reinstate(userId) {
  updateItem("users", userId, { status: "active" });
}

function removeAccount(userId) {
  dbWrite(DB_KEYS.users, getAll("users").filter((u) => u.id !== userId));
  dbWrite(DB_KEYS.commutes, getAll("commutes").filter((c) => c.userId !== userId));
}

// ---- Reports (FR-11) ----

function drawReports() {
  const box = document.getElementById("reports");
  box.replaceChildren();
  const list = findItems("reports", (r) => (reportView === "open" ? r.status === "open" : r.status !== "open"))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (list.length === 0) {
    const empty = el("div", "card center");
    empty.appendChild(el("p", "fine", reportView === "open" ? "No open reports." : "Nothing handled yet."));
    box.appendChild(empty);
    return;
  }

  list.forEach((r) => {
    const card = el("article", "card");
    const head = el("div", "label-row");
    head.appendChild(el("strong", "", r.reason));
    head.appendChild(el("span", "badge", r.status === "open" ? "Open" : r.status));
    card.appendChild(head);
    card.appendChild(el("p", "fine", "About " + r.aboutName + " · from " + r.fromName + " · " + new Date(r.createdAt).toLocaleDateString()));
    card.appendChild(el("p", "", r.details));

    if (r.status === "open") {
      const actions = el("div", "actions");
      actions.append(
        btn("Dismiss", "btn-soft", () => {
          updateItem("reports", r.id, { status: "dismissed" });
          notify(r.fromUserId, "Thanks for your report about " + r.aboutName + ". We reviewed it and took no action.");
          drawAll();
        }),
        btn("Warn", "btn-soft", () => {
          updateItem("reports", r.id, { status: "warned" });
          notify(r.aboutUserId, "Admin warning: a report was filed about a recent ride. Please follow the community rules.");
          notify(r.fromUserId, "Thanks for your report about " + r.aboutName + ". We sent them a warning.");
          drawAll();
        }),
        btn("Suspend user", "btn-dark", () => {
          suspend(r.aboutUserId);
          updateItem("reports", r.id, { status: "suspended" });
          notify(r.fromUserId, "Thanks for your report about " + r.aboutName + ". Their account was suspended.");
          drawAll();
        })
      );
      card.appendChild(actions);
    }
    box.appendChild(card);
  });
}

// ---- Support tickets (FR-20) ----

function drawTickets() {
  const box = document.getElementById("tickets");
  box.replaceChildren();
  const list = findItems("tickets", () => true).sort((a, b) => (a.status === b.status ? b.createdAt.localeCompare(a.createdAt) : a.status === "open" ? -1 : 1));

  if (!list.length) {
    const empty = el("div", "card center");
    empty.appendChild(el("p", "fine", "No tickets."));
    box.appendChild(empty);
    return;
  }

  list.forEach((t) => {
    const card = el("article", "card");
    const head = el("div", "label-row");
    head.appendChild(el("strong", "", t.category));
    head.appendChild(el("span", "badge", t.status === "open" ? "Open" : "Resolved"));
    card.appendChild(head);
    card.appendChild(el("p", "fine", "#" + t.number + " \u00b7 from " + t.userName));
    card.appendChild(el("p", "", t.message));

    if (t.status === "open") {
      const reply = el("input");
      reply.type = "text";
      reply.placeholder = "Reply to " + t.userName.split(" ")[0];
      reply.setAttribute("aria-label", "Reply");
      card.appendChild(reply);
      const actions = el("div", "actions");
      actions.appendChild(btn("Resolve", "btn-dark", () => {
        const text = reply.value.trim() || "Thanks, we looked into this and closed it.";
        updateItem("tickets", t.id, { status: "resolved", reply: text });
        notify(t.userId, "Your support ticket #" + t.number + " was resolved: " + text);
        drawAll();
      }));
      card.appendChild(actions);
    } else if (t.reply) {
      card.appendChild(el("p", "notice", "Reply: " + t.reply));
    }
    box.appendChild(card);
  });
}

// ---- People ----

function drawPeople() {
  const box = document.getElementById("people");
  box.replaceChildren();
  const q = document.getElementById("find").value.trim().toLowerCase();
  const list = findItems("users", (u) => u.role !== "admin" && (u.name + " " + u.email).toLowerCase().includes(q));

  list.forEach((u) => {
    const card = el("article", "card");
    const head = el("div", "label-row");
    head.appendChild(el("strong", "", u.name + (u.demo ? " (Demo)" : "")));
    head.appendChild(el("span", "badge", u.status === "suspended" ? "Suspended" : "Active"));
    card.appendChild(head);
    card.appendChild(el("p", "fine", u.email + (u.campus ? " · " + u.campus : "")));

    const actions = el("div", "actions");
    if (u.status === "suspended") actions.appendChild(btn("Reinstate", "btn-soft", () => { reinstate(u.id); drawAll(); }));
    else actions.appendChild(btn("Suspend", "btn-soft", () => { suspend(u.id); drawAll(); }));
    actions.appendChild(btn("Remove", "btn-soft danger", () => {
      if (confirm("Remove " + u.name + " and their commutes? This can't be undone.")) {
        removeAccount(u.id);
        drawAll();
      }
    }));
    card.appendChild(actions);
    box.appendChild(card);
  });

  if (!list.length) box.appendChild(el("p", "fine", "Nobody found."));
}

function drawAll() {
  drawStats();
  drawReports();
  drawTickets();
  drawPeople();
}

document.getElementById("reportTabs").addEventListener("click", (e) => {
  const b = e.target.closest(".seg");
  if (!b) return;
  reportView = b.dataset.v;
  document.querySelectorAll("#reportTabs .seg").forEach((x) => x.classList.toggle("selected", x === b));
  drawReports();
});

document.getElementById("find").addEventListener("input", drawPeople);

if (me.role === "admin") drawAll();
