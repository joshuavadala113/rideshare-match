// settings.js
// FR-3: view and edit your profile, and save your commute preferences.

const sessionUser = getCurrentUser();
if (!sessionUser) {
  window.location.href = "index.html";
}

// The full record (with preferences) lives in the users list.
function getUserRecord() {
  return findItems("users", (u) => u.id === sessionUser.id)[0] || null;
}

const PLAN_LABELS = { rider: "Rider", driver: "Driver", both: "Rider and driver" };

const editBtn = document.getElementById("editBtn");
const editForm = document.getElementById("editForm");
const editMessage = document.getElementById("editMessage");

function initialsOf(name) {
  return (name || "?").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

// ---- Fill in the profile card ----

function showProfile() {
  const user = getUserRecord();
  if (!user) return;

  document.getElementById("bigAvatar").textContent = initialsOf(user.name);
  document.getElementById("profName").textContent = user.name;
  document.getElementById("profCampus").textContent = user.campus || "Campus";
  document.getElementById("profMeta").textContent =
    (PLAN_LABELS[user.plan] || "Rider and driver") + " · 0 rides shared";

  // These numbers start at zero and grow once trips are confirmed.
  const rides = findItems("confirmations", (c) => c.driverId === user.id || c.riderId === user.id);
  document.getElementById("statCo2").textContent = rides.length * 3 + " kg";
  document.getElementById("statGas").textContent = "$" + rides.length * 4;
  document.getElementById("profMeta").textContent =
    (PLAN_LABELS[user.plan] || "Rider and driver") + " · " + rides.length + " rides shared";
}

// ---- Edit profile ----

function openEdit(open) {
  editForm.classList.toggle("hidden", !open);
  editBtn.textContent = open ? "Close" : "Edit";
  editMessage.textContent = "";
  if (open) {
    const user = getUserRecord();
    document.getElementById("editName").value = user.name;
    document.getElementById("editCampus").value = user.campus || "UNT";
    document.getElementById("editEmail").value = user.email;
  }
}

editBtn.addEventListener("click", () => openEdit(editForm.classList.contains("hidden")));
document.getElementById("cancelEdit").addEventListener("click", () => openEdit(false));

editForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.getElementById("editName").value.trim();
  const campus = document.getElementById("editCampus").value;

  if (!name) {
    editMessage.className = "error";
    editMessage.textContent = "Your name can't be empty.";
    return;
  }

  updateItem("users", sessionUser.id, { name, campus });
  setCurrentUser({ ...getCurrentUser(), name, campus });
  window.location.reload();
});

// ---- Preferences (saved as soon as you change them) ----

const savedTag = document.getElementById("savedTag");

function flashSaved() {
  savedTag.textContent = "Saved";
  setTimeout(() => { savedTag.textContent = "Auto-saved"; }, 1200);
}

function loadPrefs() {
  const user = getUserRecord();
  if (!user) return;
  const prefs = user.prefs || {};

  document.querySelectorAll("[data-pref]").forEach((box) => {
    box.checked = Boolean(prefs[box.dataset.pref]);
  });

  const role = user.plan || "both";
  document.querySelectorAll("#roleChoice .seg").forEach((b) => {
    b.classList.toggle("selected", b.dataset.value === role);
  });
}

document.querySelectorAll("[data-pref]").forEach((box) => {
  box.addEventListener("change", () => {
    const user = getUserRecord();
    const prefs = { ...(user.prefs || {}), [box.dataset.pref]: box.checked };
    updateItem("users", user.id, { prefs });
    flashSaved();
  });
});

document.getElementById("roleChoice").addEventListener("click", (event) => {
  const button = event.target.closest(".seg");
  if (!button) return;
  updateItem("users", sessionUser.id, { plan: button.dataset.value });
  setCurrentUser({ ...getCurrentUser(), plan: button.dataset.value });
  loadPrefs();
  showProfile();
  flashSaved();
});

// ---- Log out ----

document.getElementById("logoutBtn").addEventListener("click", () => {
  clearCurrentUser();
  window.location.href = "index.html";
});

showProfile();
loadPrefs();


// ---- Vehicle summary (FR-16) ----

(function showVehicle() {
  const u = getUserRecord();
  if (!u || !u.vehicle) return;
  const labels = { pending: "Waiting for check", verified: "Verified", rejected: "Needs changes" };
  document.getElementById("vehicleTag").textContent = labels[u.vehicleStatus] || "Added";
  document.getElementById("vehicleName").textContent = u.car;
  document.getElementById("vehicleSub").textContent = "Plate " + u.vehicle.plate;
})();
