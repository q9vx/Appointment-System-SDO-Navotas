auth.onAuthStateChanged(async (user) => {
  if (user) {
    const userDoc = await db.collection("users").doc(user.uid).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    // If admin tries to access create page → block them
    if (userData && userData.role === "admin") {
      alert("Admins cannot create appointments.");
      window.location.href = "admin-dashboard.html";
    }
  } else {
    window.location.href = "login.html";
  }
});
