console.log("Navbar auth script loaded ✅");

document.addEventListener("DOMContentLoaded", () => {
if (!auth) {
console.error("⚠️ Firebase Auth not initialized.");
return;
}

auth.onAuthStateChanged(async (user) => {
console.log("Auth state changed →", user ? "Logged in" : "Logged out");

const navLogin = document.getElementById("navLogin");
const navSignup = document.getElementById("navSignup");
const navProfile = document.getElementById("navProfile");
const navMyAppointments = document.getElementById("navMyAppointments");
const navCreateAppointment = document.getElementById("navCreateAppointment");

if (!navLogin || !navSignup || !navProfile || !navMyAppointments || !navCreateAppointment) {
console.error("⚠️ Navbar elements not found. Check your HTML IDs.");
return;
}

if (user) {
try {
const userDoc = await db.collection("users").doc(user.uid).get();
if (userDoc.exists) {
const userData = userDoc.data();
navLogin.classList.add("d-none");
navSignup.classList.add("d-none");
navProfile.classList.remove("d-none");
navMyAppointments.classList.remove("d-none");

if (userData.role === "admin") {
navProfile.href = "admin/admin-dashboard.html";
navCreateAppointment.classList.add("d-none");
} else {
navProfile.href = "settings.html";
navCreateAppointment.classList.remove("d-none");
}
} else {
console.error("User document does not exist");
}
} catch (err) {
console.error("Error fetching user data:", err);
}
} else {
navLogin.classList.remove("d-none");
navSignup.classList.remove("d-none");
navProfile.classList.add("d-none");
navMyAppointments.classList.add("d-none");
navCreateAppointment.classList.add("d-none");
}
});
});

function logoutUser() {
auth.signOut()
.then(() => {
console.log("✅ User logged out");
window.location.href = "index.html";
})
.catch((error) => {
console.error("Logout error:", error);
});
}
