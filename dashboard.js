// dashboard.js
// The Explore screen people land on after logging in.

// Not logged in? Back to the welcome page.
if (!getCurrentUser()) {
  window.location.href = "index.html";
}

const searchForm = document.getElementById("searchForm");
const queryInput = document.getElementById("query");

// Search goes to the rides page with the text filled in.
searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const q = queryInput.value.trim();
  window.location.href = q ? "matches.html?q=" + encodeURIComponent(q) : "matches.html";
});

// To Campus / To Office / Heading Home just fill in the search for now.
document.getElementById("quickChips").addEventListener("click", (event) => {
  const chip = event.target.closest(".chip");
  if (!chip) return;
  document.querySelectorAll("#quickChips .chip").forEach((c) => c.classList.remove("selected"));
  chip.classList.add("selected");
  window.location.href = "matches.html?q=" + encodeURIComponent(chip.dataset.q);
});
