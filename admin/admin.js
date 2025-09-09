document.addEventListener("DOMContentLoaded", () => {
  const auth = firebase.auth();
  const db = firebase.firestore();

  const list = document.getElementById("appointmentsList");
  const overlay = document.getElementById("guestOverlay");
  const goHomepage = document.getElementById("GoHomepage");

  // PH date formatting
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

  // Auth check
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      if (overlay) overlay.style.display = "flex";
      list.innerHTML = "<p class='text-center text-danger'>Access denied. Admins only.</p>";
      return;
    }

    try {
      const userDoc = await db.collection("users").doc(user.uid).get();
      const isAdmin = userDoc.exists && userDoc.data().role === "admin";

      if (!isAdmin) {
        if (overlay) overlay.style.display = "flex";
        list.innerHTML = "<p class='text-center text-danger'>Access denied. Admins only.</p>";
        return;
      }

      if (overlay) overlay.style.display = "none";

      // Load all appointments for admin
      loadAppointments();
    } catch (err) {
      console.error("Error checking admin:", err);
      list.innerHTML = "<p class='text-center text-danger'>Failed to verify admin. Check console.</p>";
    }
  });

  // Redirect button
  if (goHomepage) goHomepage.addEventListener("click", () => window.location.href = "index.html");

  async function loadAppointments() {
    list.innerHTML = "<p class='text-center text-muted'>Loading appointments...</p>";

    try {
      const snapshot = await db.collection("appointments").orderBy("createdAt", "desc").get();

      if (snapshot.empty) {
        list.innerHTML = "<p class='text-center text-muted'>No appointments found.</p>";
        return;
      }

      list.innerHTML = "";

      snapshot.forEach((doc) => {
        const appt = doc.data();

        // Auto-complete past appointments
        if (appt.status !== "Completed" && appt.status !== "Cancelled") {
          const apptTime = appt.appointmentDateTime?.toDate ? appt.appointmentDateTime.toDate() : new Date();
          if (apptTime < new Date()) {
            db.collection("appointments").doc(doc.id).update({ status: "Completed" });
            appt.status = "Completed";
          }
        }

        let badgeClass = "bg-secondary";
        if (appt.status === "Pending") badgeClass = "bg-warning text-dark";
        if (appt.status === "Confirmed") badgeClass = "bg-success";
        if (appt.status === "Completed") badgeClass = "bg-primary";
        if (appt.status === "Cancelled") badgeClass = "bg-danger";

        list.innerHTML += `
          <div class="appointment-card">
            <h5>${appt.purpose || "Appointment"}</h5>
            <p><strong>User:</strong> ${appt.userEmail || "-"}</p>
            <p><strong>Appointment:</strong> ${appt.date} ${appt.time}</p>
            <p><strong>Status:</strong> <span class="badge ${badgeClass}">${appt.status}</span></p>
            <p><strong>Created At:</strong> ${appt.createdAt?.toDate ? formatPHDateTime(appt.createdAt.toDate()) : "N/A"}</p>
            <p><strong>Notes:</strong> ${appt.notes || "None"}</p>

            ${appt.status === "Pending" ? `
              <div class="mt-2">
                <input type="text" id="reason-${doc.id}" class="form-control mb-2" placeholder="Add reason/note">
                <button class="btn btn-success btn-sm me-1" onclick="updateStatus('${doc.id}', 'Confirmed')">Confirm</button>
                <button class="btn btn-danger btn-sm" onclick="updateStatus('${doc.id}', 'Cancelled')">Cancel</button>
              </div>
            ` : ""}
          </div>
        `;
      });
    } catch (err) {
      console.error("Error fetching appointments:", err);
      list.innerHTML = "<p class='text-center text-danger'>Failed to load appointments.</p>";
    }
  }

  // Update status
  window.updateStatus = async function (id, status) {
    const reasonInput = document.getElementById(`reason-${id}`);
    const reason = reasonInput?.value?.trim() || null;

    try {
      await db.collection("appointments").doc(id).update({
        status,
        notes: reason || firebase.firestore.FieldValue.delete()
      });
      loadAppointments();
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update appointment. Check console for details.");
    }
  };
});
