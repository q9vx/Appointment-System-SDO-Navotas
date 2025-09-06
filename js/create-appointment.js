document.addEventListener("DOMContentLoaded", () => {
  const auth = firebase.auth();
  const db = firebase.firestore();

  const overlay = document.getElementById("guestOverlay");
  const goSignup = document.getElementById("goSignup");

  auth.onAuthStateChanged(user => {
    if (!user) {
      overlay.style.display = "flex";

      goSignup.addEventListener("click", () => {
        window.location.href = "signup.html";
      });

      return;
    }
  });

  const form = document.getElementById("createAppointmentForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const reason = document.getElementById("reason").value.trim();
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const notes = document.getElementById("notes").value.trim();

    if (!reason || !date || !time) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      await db.collection("appointments").add({
        userId: user.uid,
        reason,
        appointmentDate: date,
        appointmentTime: time,
        notes,
        status: "Pending",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      alert("✅ Appointment created successfully!");
      window.location.href = "my-appointments.html";
    } catch (error) {
      console.error("Error creating appointment:", error);
      alert("❌ Failed to create appointment. Try again.");
    }
  });
});
