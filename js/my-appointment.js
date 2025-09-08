document.addEventListener("DOMContentLoaded", () => {
  const auth = firebase.auth();
  const db = firebase.firestore();

  const list = document.getElementById("appointmentsList");
  const overlay = document.getElementById("guestOverlay");
  const goSignup = document.getElementById("goSignup");

  function formatPHDateTime(dateObj) {
    const pad = (n) => String(n).padStart(2, "0");
    const mm = pad(dateObj.getMonth() + 1);
    const dd = pad(dateObj.getDate());
    const yy = String(dateObj.getFullYear()).slice(-2);

    let hours = dateObj.getHours();
    const minutes = pad(dateObj.getMinutes());
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    return `${mm}/${dd}/${yy} ${hours}:${minutes} ${ampm}`;
  }

  list.innerHTML = "<p class='text-center text-muted'>Loading your appointments...</p>";

  auth.onAuthStateChanged(user => {
    if (!user) {
      document.body.classList.add("guest-blur");
      if (overlay) overlay.style.display = "flex";
      if (goSignup) goSignup.addEventListener("click", () => {
        window.location.href = "signup.html";
      });
      list.innerHTML = "<p class='text-center text-muted'>You must log in to view appointments.</p>";
      return;
    }

    document.body.classList.remove("guest-blur");
    if (overlay) overlay.style.display = "none";

    db.collection("appointments")
      .where("userId", "==", user.uid)
      .get()
      .then(snapshot => {
        if (snapshot.empty) {
          list.innerHTML = "<p class='text-center text-muted'>No appointments yet.</p>";
          return;
        }

        const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        appointments.sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

        list.innerHTML = "";
        appointments.forEach(appt => {
          let badgeClass = "bg-secondary";
          if (appt.status === "Pending") badgeClass = "bg-warning text-dark";
          if (appt.status === "Confirmed") badgeClass = "bg-success";
          if (appt.status === "Completed") badgeClass = "bg-primary";
          if (appt.status === "Cancelled") badgeClass = "bg-danger";

          const steps = ["Pending", "Confirmed", "Completed", "Cancelled"];
          const trackerHTML = steps.map((step, idx) => {
            let cls = "status-circle";
            if (step === appt.status) cls += " status-active";
            if (steps.indexOf(appt.status) > idx) cls += " status-completed";
            return `
              <div class="status-step">
                <div class="${cls}">${step === "Cancelled" ? "X" : idx + 1}</div>
                <span>${step}</span>
              </div>
            `;
          }).join("");
          let appointmentDateTime = "N/A";
          if (appt.appointmentDateTime && appt.appointmentDateTime.toDate) {
            appointmentDateTime = formatPHDateTime(appt.appointmentDateTime.toDate());
          }

          list.innerHTML += `
            <div class="card mb-4 shadow-sm">
              <div class="card-body">
                <h5>${appt.reason || "Appointment"}</h5>
                <p class="mb-1"><strong>Appointment:</strong> ${appointmentDateTime}</p>
                <p class="mb-1"><strong>Status:</strong> <span class="badge ${badgeClass}">${appt.status}</span></p>
                <p class="mb-1"><strong>Created At:</strong> ${appt.createdAt || "N/A"}</p>
                <div class="status-tracker mt-3">${trackerHTML}</div>
                ${appt.notes ? `<p class="mt-2 text-muted"><strong>Notes:</strong> ${appt.notes}</p>` : ""}
              </div>
            </div>
          `;
        });
      })
      .catch(err => {
        console.error("Error fetching appointments:", err);
        list.innerHTML = "<p class='text-center text-danger'>Failed to load appointments.</p>";
      });
  });
});
