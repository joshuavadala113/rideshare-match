// welcome.js
// If someone is already logged in, skip the welcome page and go to the rides page.

if (getCurrentUser()) {
  window.location.href = "dashboard.html";
}
