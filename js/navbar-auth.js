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
    const navLogin = document.getElementById("navLogin");
    const navSignup = document.getElementById("navSignup");
    const navProfile = document.getElementById("navProfile");
    const profileName = document.getElementById("profileName");

    if (!navMyAppointments || !navCreateAppointment || !navLogin || !navSignup || !navProfile) {
      console.error("⚠️ Navbar elements not found. Check your HTML IDs.");
      return;
    }

    if (user) {
      try {
        const userDoc = await db.collection("users").doc(user.uid).get();
        const userData = userDoc.exists ? userDoc.data() : { role: "user" };

        navProfile.classList.remove("d-none");
        navMyAppointments.classList.remove("d-none");
        navCreateAppointment.classList.remove("d-none");

        navLogin.classList.add("d-none");
        navSignup.classList.add("d-none");

        profileName.textContent = user.displayName || user.email.split("@")[0];

        if (userData.role === "admin") {
          navCreateAppointment.classList.add("d-none");
        }

      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    } else {

      navProfile.classList.add("d-none");
      navMyAppointments.classList.add("d-none");
      navCreateAppointment.classList.add("d-none");

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
