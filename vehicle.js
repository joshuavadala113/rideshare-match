// vehicle.js
// FR-16: add your car details. An admin checks them and adds a verified badge.

const sessionUser = getCurrentUser();
if (!sessionUser) window.location.href = "index.html";

const message = document.getElementById("message");
const fields = ["make", "model", "color", "year", "plate"];

function record() {
  return findItems("users", (u) => u.id === sessionUser.id)[0] || {};
}

const STATUS = {
  pending: ["Waiting for check", "An admin will look at your details. You'll get a notification."],
  verified: ["Verified", "Riders see a verified vehicle badge on your matches."],
  rejected: ["Needs changes", "An admin couldn't verify this car. Fix the details and submit again."],
};

function showStatus() {
  const u = record();
  const info = STATUS[u.vehicleStatus];
  document.getElementById("statusBadge").textContent = info ? info[0] : "Not added";
  document.getElementById("statusText").textContent = info ? info[1] : "Add your car to start driving.";
  document.getElementById("removeBtn").classList.toggle("hidden", !u.vehicle);

  if (u.vehicle) fields.forEach((f) => (document.getElementById(f).value = u.vehicle[f] || ""));
}

document.getElementById("vehicleForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const v = {};
  fields.forEach((f) => (v[f] = document.getElementById(f).value.trim()));
  v.plate = v.plate.toUpperCase();

  if (!v.make || !v.model || !v.color || !v.plate) {
    message.className = "error";
    message.textContent = "Make, model, color and plate are required.";
    return;
  }
  if (!/^[A-Z0-9 -]{2,10}$/.test(v.plate)) {
    message.className = "error";
    message.textContent = "A plate uses letters and numbers only.";
    return;
  }

  updateItem("users", sessionUser.id, {
    vehicle: v,
    car: v.color + " " + v.make + " " + v.model,
    vehicleStatus: "pending",
  });
  message.className = "success";
  message.textContent = "Saved. An admin will check it soon.";
  showStatus();
});

document.getElementById("removeBtn").addEventListener("click", () => {
  updateItem("users", sessionUser.id, { vehicle: null, car: "", vehicleStatus: null });
  fields.forEach((f) => (document.getElementById(f).value = ""));
  message.className = "success";
  message.textContent = "Vehicle removed.";
  showStatus();
});

showStatus();
