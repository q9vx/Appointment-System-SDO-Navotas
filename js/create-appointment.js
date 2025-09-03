auth.onAuthStateChanged(async (user) => {
  const protectedContent = document.getElementById("protectedContent");

  if (user) {
    const userDoc = await db.collection("users").doc(user.uid).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    if (userData && userData.role === "admin") {
      alert("Admins cannot create appointments.");
      window.location.href = "admin-dashboard.html";
      return;
    }

    protectedContent.style.display = "block";

    const form = document.getElementById("appointmentForm");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const fullName = document.getElementById("fullName").value;
      const email = document.getElementById("email").value;
      const role = document.getElementById("role").value;
      const teacherId = document.getElementById("teacherId").value || "";
      const studentId = document.getElementById("studentId").value || "";
      const appointmentDate = document.getElementById("appointmentDate").value;
      const appointmentTime = document.getElementById("appointmentTime").value;
      const reason = document.getElementById("reason").value;

      try {
        await db.collection("appointments").add({
          fullName,
          email,
          role,
          teacherId,
          studentId,
          appointmentDate,
          appointmentTime,
          reason,
          status: "Pending",
          userId: user.uid,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("✅ Appointment created successfully!");
        form.reset();
        window.location.href = "my-appointments.html";
      } catch (error) {
        console.error("Error creating appointment:", error);
        alert("❌ Failed to create appointment. Please try again.");
      }
    });

  } else {
 alert("⚠️ You must log in first before creating an appointment.");
    window.location.href = "login.html";
  }
});
