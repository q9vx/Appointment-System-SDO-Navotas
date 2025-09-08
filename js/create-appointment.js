document.addEventListener("DOMContentLoaded", () => {
  const auth = firebase.auth();
  const db = firebase.firestore();

  function getPHNow() {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  }

  function formatPHDateTime(dateObj) {
    const pad = (n) => String(n).padStart(2, "0");
    const mm = pad(dateObj.getMonth() + 1);
    const dd = pad(dateObj.getDate());
    const yy = String(dateObj.getFullYear()).slice(-2);

    let hours = dateObj.getHours();
    const minutes = pad(dateObj.getMinutes());
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    return {
      date: `${mm}/${dd}/${yy}`,
      time: `${hours}:${minutes} ${ampm}`,
      full: `${mm}/${dd}/${yy} ${hours}:${minutes} ${ampm}`
    };
  }

  const dateField = document.getElementById("date");
  const timeField = document.getElementById("time");

  const phNow = getPHNow();
  const formatted = formatPHDateTime(phNow);

  if (dateField) dateField.value = formatted.date;
  if (timeField) timeField.value = formatted.time;

  const guestOverlay = document.getElementById("guestOverlay");
  const navProfile = document.getElementById("navProfile");
  const goSignup = document.getElementById("goSignup");

  auth.onAuthStateChanged(user => {
    if (user) {
      if (navProfile) navProfile.href = "dashboard.html"; // Or another page if needed
      if (guestOverlay) guestOverlay.style.display = "none";
    } else {
      if (navProfile) navProfile.href = "login.html";
      if (guestOverlay) guestOverlay.style.display = "flex";
    }
  });

  if (goSignup) {
    goSignup.addEventListener("click", () => {
      window.location.href = "signup.html";
    });
  }

  const createForm = document.getElementById("createAppointmentForm");
  if (createForm) {
    createForm.addEventListener("submit", (e) => {
      e.preventDefault();

      auth.onAuthStateChanged(user => {
        if (!user) {
          alert("⚠ You must be logged in to create an appointment.");
          return;
        }

        const purpose = document.getElementById("purpose").value;
        const notes = document.getElementById("notes").value.trim();

        db.collection("appointments").add({
          userId: user.uid,
          purpose: purpose,
          notes: notes || null,
          status: "Pending",
          appointmentDateTime: firebase.firestore.FieldValue.serverTimestamp(),
          createdAt: formatted.full
        }).then(() => {
          alert("✅ Appointment created successfully!");
          window.location.href = "my-appointments.html";
        }).catch(err => {
          console.error("Error creating appointment:", err);
          alert("❌ Failed to create appointment. Please try again.");
        });
      });
    });
  }
});
