document.addEventListener("DOMContentLoaded", () => {
  const auth = firebase.auth();
  const db = firebase.firestore();

  const overlay = document.getElementById("guestOverlay");
  const goSignup = document.getElementById("goSignup");
  const form = document.getElementById("createAppointmentForm");

  auth.onAuthStateChanged(user => {
    if (!user) {
      document.body.classList.add("guest-blur");
      if (overlay) overlay.style.display = "flex";
      if (goSignup) goSignup.addEventListener("click", () => {
        window.location.href = "signup.html";
      });
      return;
    }

    document.body.classList.remove("guest-blur");
    if (overlay) overlay.style.display = "none";
  });

  if (!form) return;

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
