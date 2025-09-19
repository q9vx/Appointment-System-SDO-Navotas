auth.onAuthStateChanged(async (user) => {
const authNav = document.getElementById("authNav");
if (!authNav) return;

if (user) {
try {

const userDoc = await db.collection("users").doc(user.uid).get();
const userData = userDoc.exists ? userDoc.data() : null;

if (!userData) {
console.warn("No user record found. Forcing logout.");
await auth.signOut();
window.location.href = "login.html";
return;
}

const path = window.location.pathname;
if (path.includes("login.html") || path.includes("signup.html")) {
if (userData.role === "admin") {
window.location.href = "admin/admin-dashboard.html";
return;
} else {
window.location.href = "dashboard.html";
return;
}
}

let html = `
<div class="dropdown">
<a class="nav-link dropdown-toggle p-0" href="#" role="button" data-bs-toggle="dropdown">
<i class="bi bi-person-circle fs-4"></i>
</a>
<ul class="dropdown-menu dropdown-menu-end">
<li><span class="dropdown-item-text">
${userData.firstName} (${userData.role})
</span></li>
<li><hr class="dropdown-divider"></li>
`;

if (userData.role === "admin") {
html += `<li><a class="dropdown-item" href="admin/admin-dashboard.html">Admin Dashboard</a></li>`;
} else {
html += `
<li><a class="dropdown-item" href="dashboard.html">Dashboard</a></li>
<li><a class="dropdown-item" href="create-appointment.html">Create Appointment</a></li>
<li><a class="dropdown-item" href="my-appointments.html">My Appointments</a></li>
`;
}

html += `
<li><a class="dropdown-item" href="terms.html">Terms of Service</a></li>
<li><a class="dropdown-item text-danger" href="#" id="logoutBtn">Logout</a></li>
</ul>
</div>
`;

authNav.innerHTML = html;

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
logoutBtn.addEventListener("click", async (e) => {
e.preventDefault();
await auth.signOut();
window.location.href = "index.html";
});
}
} catch (err) {
console.error("Auth check error:", err);
}
} else {

authNav.innerHTML = `
<a class="nav-link p-0" href="login.html" title="Login">
<i class="bi bi-person-circle fs-4"></i>
</a>
`;
}
});
