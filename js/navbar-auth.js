console.log("Navbar auth script loaded ✅");

document.addEventListener("DOMContentLoaded", () => {
  if (!auth) {
    console.error("⚠️ Firebase Auth not initialized.");
    return;
  }

  auth.onAuthStateChanged(async (user) => {
    console.log("Auth state changed →", user ? "Logged in" : "Logged out");

    const navMyAppointments = document.getElementById("navMyAppointments");
    const navCreateAppointment = document.getElementById("navCreateAppointment");
    const navLogout = document.getElementById("navLogout");
    const navLogin = document.getElementById("navLogin");
    const navSignup = document.getElementById("navSignup");

    if (!navMyAppointments || !navCreateAppointment || !navLogout || !navLogin || !navSignup) {
      console.error("⚠️ Navbar elements not found. Check your HTML IDs.");
      return;
    }

    if (user) {
      try {
        const userDoc = await db.collection("users").doc(user.uid).get();
        const userData = userDoc.exists ? userDoc.data() : { role: "user" };

        navMyAppointments.classList.remove("d-none");
        navLogout.classList.remove("d-none");
        navLogin.classList.add("d-none");
        navSignup.classList.add("d-none");

        if (userData.role === "admin") {
          navCreateAppointment.classList.add("d-none");
        } else {
          navCreateAppointment.classList.remove("d-none");
        }

      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    } else {
      // Show guest nav items
      navMyAppointments.classList.add("d-none");
      navCreateAppointment.classList.add("d-none");
      navLogout.classList.add("d-none");

      navLogin.classList.remove("d-none");
      navSignup.classList.remove("d-none");
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
