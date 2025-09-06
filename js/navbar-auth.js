console.log("Navbar auth script loaded ✅");

document.addEventListener("DOMContentLoaded", () => {
  if (typeof auth === "undefined") {
    console.error("⚠️ Firebase Auth not initialized.");
    return;
  }

  auth.onAuthStateChanged(async (user) => {
    console.log("Auth state changed →", user ? "Logged in" : "Logged out");

    const navLogin = document.getElementById("navLogin");
    const navSignup = document.getElementById("navSignup");
    const navProfile = document.getElementById("navProfile");
    const navCreateAppointmentDropdown = document.getElementById("navCreateAppointmentDropdown");

    if (!navLogin || !navSignup || !navProfile) {
      console.error("⚠️ Navbar elements not found. Check your HTML IDs.");
      return;
    }

    if (user) {
      try {
        const userDoc = await db.collection("users").doc(user.uid).get();
        const userData = userDoc.exists ? userDoc.data() : { role: "user" };

        navProfile.classList.remove("d-none");

        navLogin.classList.add("d-none");
        navSignup.classList.add("d-none");

        if (userData.role === "admin" && navCreateAppointmentDropdown) {
          navCreateAppointmentDropdown.classList.add("d-none");
        } else if (navCreateAppointmentDropdown) {
          navCreateAppointmentDropdown.classList.remove("d-none");
        }

      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    } else {

      navProfile.classList.add("d-none");
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
