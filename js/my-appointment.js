  auth.onAuthStateChanged((user) => {
    if (!user) {
      alert("⚠️ You must log in first before creating an appointment.");
      window.location.href = "login.html";
    }

  const list = document.getElementById("appointmentsList");
  list.innerHTML = "<p class='text-center text-muted'>Loading your appointments...</p>";

  db.collection("appointments")
    .where("userId", "==", user.uid)
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {
      if (snapshot.empty) {
        list.innerHTML = "<p class='text-center text-muted'>No appointments yet.</p>";
        return;
      }

      list.innerHTML = "";
      snapshot.forEach(doc => {
        const appt = doc.data();

        const dateStr = appt.appointmentDate || "N/A";
        const timeStr = appt.appointmentTime || "N/A";

        let badgeClass = "bg-secondary";
        if (appt.status === "Pending") badgeClass = "bg-warning text-dark";
        if (appt.status === "Confirmed") badgeClass = "bg-success";
        if (appt.status === "Completed") badgeClass = "bg-primary";
        if (appt.status === "Cancelled") badgeClass = "bg-danger";

        const steps = ["Pending", "Confirmed", "Completed", "Cancelled"];
        let trackerHTML = steps.map((step, idx) => {
          let cls = "status-circle";
          if (step === appt.status) cls += " status-active";
          if (steps.indexOf(appt.status) > idx) cls += " status-completed";

          return `
            <div class="status-step">
              <div class="${cls}">${step === "Cancelled" ? "X" : idx+1}</div>
              <span>${step}</span>
            </div>
          `;
        }).join("");

        list.innerHTML += `
          <div class="card mb-4">
            <div class="card-body">
              <h5>${appt.reason || "Appointment"}</h5>
              <p class="mb-1"><strong>Date:</strong> ${dateStr}</p>
              <p class="mb-1"><strong>Time:</strong> ${timeStr}</p>
              <p class="mb-1"><strong>Status:</strong> 
                <span class="badge ${badgeClass}">${appt.status}</span>
              </p>
              <div class="status-tracker">${trackerHTML}</div>
            </div>
          </div>
        `;
      });
    });
});
