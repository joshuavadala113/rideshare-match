
const form = document.getElementById("rideForm");
const rideList = document.getElementById("rideList");
const search = document.getElementById("search");
const message = document.getElementById("message");

let rides = [];

try {
  rides = JSON.parse(localStorage.getItem("rideshareRides") || "[]");
  if (!Array.isArray(rides)) rides = [];
} catch {
  rides = [];
}

function saveRides() {
  localStorage.setItem("rideshareRides", JSON.stringify(rides));
}

function renderRides() {
  const query = search.value.trim().toLowerCase();

  const filtered = rides.filter(ride =>
    ride.from.toLowerCase().includes(query) ||
    ride.to.toLowerCase().includes(query)
  );

  rideList.replaceChildren();

  if (filtered.length === 0) {
    rideList.textContent = "No matching rides found.";
    return;
  }

  filtered.forEach(ride => {
    const card = document.createElement("article");
    card.className = "ride";

    const title = document.createElement("h3");
    title.textContent = `${ride.from} → ${ride.to}`;

    const details = document.createElement("p");
    details.textContent =
      `Driver: ${ride.driver} | Date: ${ride.date} | Seats: ${ride.seats}`;

    card.append(title, details);
    rideList.appendChild(card);
  });
}

form.addEventListener("submit", event => {
  event.preventDefault();

  const ride = {
    driver: document.getElementById("driver").value.trim(),
    from: document.getElementById("from").value.trim(),
    to: document.getElementById("to").value.trim(),
    date: document.getElementById("date").value,
    seats: Number(document.getElementById("seats").value)
  };

  if (!ride.driver || !ride.from || !ride.to || !ride.date) {
    message.textContent = "Please complete all fields.";
    return;
  }

  if (ride.date < new Date().toLocaleDateString("en-CA")) {
    message.textContent = "Choose today or a future date.";
    return;
  }

  rides.push(ride);
  saveRides();
  form.reset();
  document.getElementById("seats").value = 3;
  message.textContent = "Ride posted successfully!";
  renderRides();
});

search.addEventListener("input", renderRides);

renderRides();
