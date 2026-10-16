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

// ---- Reason box and decision log (FR-11, FR-12) ----

let pendingAction = null;

// Shows the reason box. onDone gets the typed reason.
function askReason(title, sub, onDone) {
  document.getElementById("reasonTitle").textContent = title;
  document.getElementById("reasonSub").textContent = sub;
  document.getElementById("reasonText").value = "";
  document.getElementById("reasonNote").textContent = "";
  pendingAction = onDone;
  document.getElementById("reasonSheet").classList.remove("hidden");
  document.getElementById("reasonText").focus();
}

function closeReason() {
  pendingAction = null;
  document.getElementById("reasonSheet").classList.add("hidden");
}

document.getElementById("reasonOk").addEventListener("click", () => {
  const reason = document.getElementById("reasonText").value.trim();
  if (reason.length < 5) {
    document.getElementById("reasonNote").textContent = "Please write a reason (at least 5 characters).";
    return;
  }
  const run = pendingAction;
  closeReason();
  if (run) run(reason);
});
document.getElementById("reasonCancel").addEventListener("click", closeReason);

// One line in the decision log
function logAction(action, targetName, targetUserId, reason, reportId) {
  addItem("adminLog", {
    id: newId("log"),
    adminId: me.id,
    adminName: me.name,
    action,
    targetName,
    targetUserId,
    reportId: reportId || null,
    reason,
    createdAt: new Date().toISOString(),
  });
}

function drawLog() {
  const box = document.getElementById("log");
  box.replaceChildren();
  const list = getAll("adminLog").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (!list.length) {
    const empty = el("div", "card center");
    empty.appendChild(el("p", "fine", "No decisions yet."));
    box.appendChild(empty);
    return;
  }
  list.forEach((l) => {
    const card = el("article", "card");
    const head = el("div", "label-row");
    head.appendChild(el("strong", "", l.action + ": " + l.targetName));
    head.appendChild(el("span", "badge", new Date(l.createdAt).toLocaleDateString()));
    card.appendChild(head);
    card.appendChild(el("p", "fine", "By " + l.adminName + " \u00b7 " + new Date(l.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })));
    card.appendChild(el("p", "", "Reason: " + l.reason));
    box.appendChild(card);
  });
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
    [findItems("users", (u) => u.vehicleStatus === "pending").length, "Cars to check"],
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
    if (r.decisionReason) card.appendChild(el("p", "notice", "Decision reason: " + r.decisionReason));

    if (r.status === "open") {
      const actions = el("div", "actions");
      actions.append(
        btn("Dismiss", "btn-soft", () => {
          askReason("Dismiss this report", "About " + r.aboutName + ". The reporter is told no action was taken.", (reason) => {
            updateItem("reports", r.id, { status: "dismissed", decisionReason: reason });
            logAction("Dismissed report", r.aboutName, r.aboutUserId, reason, r.id);
            notify(r.fromUserId, "Thanks for your report about " + r.aboutName + ". We reviewed it and took no action.");
            drawAll();
          });
        }),
        btn("Warn", "btn-soft", () => {
          askReason("Warn " + r.aboutName, "They get a warning with your reason.", (reason) => {
            updateItem("reports", r.id, { status: "warned", decisionReason: reason });
            logAction("Warned", r.aboutName, r.aboutUserId, reason, r.id);
            notify(r.aboutUserId, "Admin warning: " + reason.replace(/[.!?]+$/, "") + ". Please follow the community rules.");
            notify(r.fromUserId, "Thanks for your report about " + r.aboutName + ". We sent them a warning.");
            drawAll();
          });
        }),
        btn("Suspend user", "btn-dark", () => {
          askReason("Suspend " + r.aboutName, "Their account is blocked and their commutes stop showing in matches.", (reason) => {
            suspend(r.aboutUserId);
            updateItem("reports", r.id, { status: "suspended", decisionReason: reason });
            logAction("Suspended", r.aboutName, r.aboutUserId, reason, r.id);
            notify(r.fromUserId, "Thanks for your report about " + r.aboutName + ". Their account was suspended.");
            drawAll();
          });
        })
      );
      card.appendChild(actions);
    }
    box.appendChild(card);
  });
}

// ---- Vehicle checks (FR-16) ----

function drawVehicles() {
  const box = document.getElementById("vehicles");
  box.replaceChildren();
  const list = findItems("users", (u) => u.vehicleStatus === "pending");

  if (!list.length) {
    const empty = el("div", "card center");
    empty.appendChild(el("p", "fine", "No vehicles waiting."));
    box.appendChild(empty);
    return;
  }

  list.forEach((u) => {
    const v = u.vehicle;
    const card = el("article", "card");
    const head = el("div", "label-row");
    head.appendChild(el("strong", "", u.name));
    head.appendChild(el("span", "badge", "Pending"));
    card.appendChild(head);
    card.appendChild(el("p", "", v.color + " " + v.make + " " + v.model + (v.year ? " (" + v.year + ")" : "") + " \u00b7 plate " + v.plate));

    const actions = el("div", "actions");
    actions.append(
      btn("Approve", "btn-dark", () => {
        updateItem("users", u.id, { vehicleStatus: "verified" });
        notify(u.id, "Your vehicle was verified. Riders now see a verified badge.");
        drawAll();
      }),
      btn("Reject", "btn-soft", () => {
        updateItem("users", u.id, { vehicleStatus: "rejected" });
        notify(u.id, "We couldn't verify your vehicle. Check the details on your vehicle page and submit again.");
        drawAll();
      })
    );
    card.appendChild(actions);
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
    if (u.status === "suspended") {
      actions.appendChild(btn("Reinstate", "btn-soft", () => {
        askReason("Reinstate " + u.name, "Their account works again.", (reason) => {
          reinstate(u.id);
          logAction("Reinstated", u.name, u.id, reason);
          notify(u.id, "Your account was reinstated: " + reason);
          drawAll();
        });
      }));
    } else {
      actions.appendChild(btn("Suspend", "btn-soft", () => {
        askReason("Suspend " + u.name, "Their account is blocked and their commutes stop showing in matches.", (reason) => {
          suspend(u.id);
          logAction("Suspended", u.name, u.id, reason);
          drawAll();
        });
      }));
    }
    actions.appendChild(btn("Remove", "btn-soft danger", () => {
      askReason("Remove " + u.name, "This deletes the account and their commutes. It can't be undone.", (reason) => {
        removeAccount(u.id);
        logAction("Removed account", u.name, u.id, reason);
        drawAll();
      });
    }));
    card.appendChild(actions);
    box.appendChild(card);
  });

  if (!list.length) box.appendChild(el("p", "fine", "Nobody found."));
}

function drawAll() {
  drawStats();
  drawReports();
  drawVehicles();
  drawTickets();
  drawLog();
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
