const auth = firebase.auth();
const db = firebase.firestore();
const userName = document.getElementById("userName");
const logoutBtn = document.getElementById("logoutBtn");
const guestOverlay = document.getElementById("guestOverlay");
const goSignup = document.getElementById("goSignup");

auth.onAuthStateChanged(async (user) => {
if (user) {
document.body.style.display = "block";
if (guestOverlay) guestOverlay.style.display = "none";
if (userName) userName.textContent = user.displayName || user.email.split("@")[0];

const snapshot = await db.collection("appointments").where("userId", "==", user.uid).get();
let pending = 0, confirmed = 0, cancelled = 0;

snapshot.forEach(docSnap => {
const data = docSnap.data();
if (data.status === "Pending") pending++;
if (data.status === "Confirmed") confirmed++;
if (data.status === "Cancelled") cancelled++;
});

document.getElementById("pendingCount").textContent = pending;
document.getElementById("confirmedCount").textContent = confirmed;
document.getElementById("cancelledCount").textContent = cancelled;

} else {
document.body.style.display = "block";
if (guestOverlay) guestOverlay.style.display = "flex";
}
});

if (goSignup) {
goSignup.addEventListener("click", () => {
window.location.href = "signup.html";
});
}

if (logoutBtn) {
logoutBtn.addEventListener("click", () => {
auth.signOut().then(() => {
window.location.href = "login.html";
});
});
}
