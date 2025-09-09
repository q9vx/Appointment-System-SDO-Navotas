const auth = firebase.auth();
const db = firebase.firestore();
const userName = document.getElementById("userName");
const logoutBtn = document.getElementById("logoutBtn");
const guestOverlay = document.getElementById("guestOverlay");
const goSignup = document.getElementById("goSignup");

// Auth check
auth.onAuthStateChanged(async (user) => {
  if (user) {
    document.body.style.display = "block";
    if (guestOverlay) guestOverlay.style.display = "none";
    if (userName) userName.textContent = user.displayName || user.email.split("@")[0];

    // Load appointments for dashboard counters
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
    // Not logged in → show guest overlay
    document.body.style.display = "block";
    if (guestOverlay) guestOverlay.style.display = "flex";
  }
});

// Go to signup
if (goSignup) {
  goSignup.addEventListener("click", () => {
    window.location.href = "signup.html";
  });
}

// Logout
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    auth.signOut().then(() => {
      window.location.href = "login.html";
    });
  });
}
