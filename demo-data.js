// demo-data.js
// Makes a few pretend riders and drivers so the matching page has something to match.
// These people are made up. They can't log in. It only runs once per browser.

const DEMO_FLAG = "rsm_demoSeeded";

// A demo admin so the admin page can be shown in class.
// Email: admin@rideshare.demo  Password: admin123  (class demo only, never use a real password)
function ensureAdmin() {
  if (findItems("users", (u) => u.id === "demo_admin").length) return;
  addItem("users", {
    id: "demo_admin",
    demo: true,
    role: "admin",
    name: "Demo Admin",
    email: "admin@rideshare.demo",
    password: "admin123",
    campus: "UNT",
    status: "active",
    createdAt: new Date().toISOString(),
  });
}

function seedDemoData() {
  ensureAdmin();
  if (localStorage.getItem(DEMO_FLAG)) return;

  const people = [
    { id: "demo_maya", name: "Maya Torres", campus: "UNT", detail: "Biology, junior", car: "Toyota Prius", rating: 4.9, rides: 48 },
    { id: "demo_jordan", name: "Jordan Lee", campus: "UNT", detail: "Computer Science, senior", car: "Honda Civic", rating: 4.7, rides: 31 },
    { id: "demo_sofia", name: "Sofia Nguyen", campus: "UT Dallas", detail: "Design, grad student", car: "Hyundai Ioniq 5", rating: 5.0, rides: 62 },
    { id: "demo_daniel", name: "Daniel Okafor", campus: "UNT", detail: "Business, junior", car: "Ford Escape", rating: 4.6, rides: 12 },
    { id: "demo_ethan", name: "Ethan Brooks", campus: "UNT", detail: "Pre-Med, sophomore", car: "", rating: 4.8, rides: 9 },
    { id: "demo_aisha", name: "Aisha Rahman", campus: "UNT", detail: "Math, senior", car: "", rating: 4.9, rides: 22 },
  ];

  people.forEach((p) => {
    addItem("users", {
      id: p.id,
      demo: true,
      name: p.name,
      email: p.id + "@demo.local",
      campus: p.campus,
      detail: p.detail,
      car: p.car,
      rating: p.rating,
      rides: p.rides,
      status: "active",
    });
  });

  const commutes = [
    { userId: "demo_maya", type: "offer", from: "Denton", to: "UT Dallas", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], departTime: "08:20", seats: 2, atmosphere: ["Quiet ride", "EV only"], miles: 38 },
    { userId: "demo_jordan", type: "offer", from: "UNT", to: "UT Dallas", days: ["Mon", "Wed", "Fri"], departTime: "08:30", seats: 3, atmosphere: ["Music welcome"], miles: 38 },
    { userId: "demo_sofia", type: "offer", from: "Lewisville", to: "UT Dallas", days: ["Tue", "Thu"], departTime: "09:00", seats: 3, atmosphere: ["Luggage friendly"], miles: 30 },
    { userId: "demo_daniel", type: "offer", from: "UNT", to: "SMU", days: ["Mon", "Wed", "Fri"], departTime: "07:50", seats: 3, atmosphere: ["Quiet ride"], miles: 40 },
    { userId: "demo_ethan", type: "request", from: "UNT", to: "UT Dallas", days: ["Mon", "Tue", "Wed", "Thu"], departTime: "08:15", seats: 1, atmosphere: ["Luggage friendly"], miles: 38 },
    { userId: "demo_aisha", type: "request", from: "Denton", to: "UT Dallas", days: ["Tue", "Thu"], departTime: "08:45", seats: 1, atmosphere: ["Quiet ride"], miles: 38 },
  ];

  commutes.forEach((c) => {
    const person = people.find((p) => p.id === c.userId);
    addItem("commutes", {
      id: newId("c"),
      userName: person.name,
      returnTime: "",
      status: "open",
      createdAt: new Date().toISOString(),
      ...c,
    });
  });

  localStorage.setItem(DEMO_FLAG, "yes");
}
