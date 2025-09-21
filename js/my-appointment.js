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

db.collection("users").doc(user.uid).get().then(doc => {
const isAdmin = doc.exists && doc.data().role === "admin";
if (isAdmin) {
const navbar = document.getElementById("navbarContent");
const ul = navbar.querySelector("ul");
const li = document.createElement("li");
li.className = "nav-item";
li.innerHTML = '<a class="nav-link" href="admin/admin-dashboard.html"><i class="bi bi-speedometer2 me-1"></i> Admin Dashboard</a>';
ul.appendChild(li);
}

const query = isAdmin ? db.collection("appointments").orderBy("createdAt", "desc") : db.collection("appointments").where("userId", "==", user.uid);
query.get().then(snapshot => {
if (snapshot.empty) {
list.innerHTML = "<p class='text-center text-muted'>No appointments yet.</p>";
return;
}

list.innerHTML = "";
let appointments = [];
snapshot.forEach(doc => {
const appt = doc.data();
appointments.push(appt);

let createdAtDisplay = "N/A";
if (appt.createdAt && appt.createdAt.toDate) {
createdAtDisplay = formatPHDateTime(appt.createdAt.toDate());
}

let appointmentDateTime = "N/A";
if (appt.date && appt.time) {
appointmentDateTime = `${appt.date} ${appt.time}`;
}

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

list.innerHTML += `
<div class="card mb-4 shadow-sm" data-id="${doc.id}">
<div class="card-body">
<h5>${appt.purpose || "Appointment"}</h5>
<p class="mb-1"><strong>Appointment:</strong> ${appointmentDateTime}</p>
<p class="mb-1"><strong>Status:</strong> <span class="badge ${badgeClass}">${appt.status}</span></p>
<p class="mb-1"><strong>Created At:</strong> ${createdAtDisplay}</p>
<div class="status-tracker mt-3">${trackerHTML}</div>
${appt.notes ? `<p class="mt-2 text-muted"><strong>Notes:</strong> ${appt.notes}</p>` : ""}
${appt.adminNotes ? `<p class="mt-2 text-info"><strong>Admin Note:</strong> ${appt.adminNotes}</p>` : ""}
<button class="btn btn-danger btn-sm mt-3 cancel-btn">Cancel Appointment</button>
</div>
</div>
`;
});

list.addEventListener("click", (e) => {
  if (e.target.classList.contains("cancel-btn")) {
    const card = e.target.closest(".card");
    const apptId = card.getAttribute("data-id");
    if (!apptId) return;

    const cancelModal = new bootstrap.Modal(document.getElementById('cancelModal'));
    const cancelReasonSelect = document.getElementById('cancelReason');
    const cancelNotesTextarea = document.getElementById('cancelNotes');
    const confirmCancelBtn = document.getElementById('confirmCancel');

    cancelReasonSelect.value = "";
    cancelNotesTextarea.value = "";

    cancelModal.show();

    const onConfirm = () => {
      const reason = cancelReasonSelect.value;
      const notes = cancelNotesTextarea.value.trim();

      if (!reason) {
        alert("Please select a reason for cancellation.");
        return;
      }

      db.collection("appointments").doc(apptId).update({
        status: "Cancelled",
        cancellationReason: reason,
        cancellationNotes: notes || null,
        cancelledAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => {
        alert("Appointment cancelled successfully.");
        e.target.disabled = true;
        e.target.textContent = "Cancelled";
        const statusBadge = card.querySelector(".badge");
        if (statusBadge) {
          statusBadge.textContent = "Cancelled";
          statusBadge.className = "badge bg-danger";
        }
        cancelModal.hide();
        confirmCancelBtn.removeEventListener('click', onConfirm);
      }).catch((error) => {
        console.error("Error cancelling appointment:", error);
        alert("Failed to cancel appointment. Please try again.");
      });
    };

    confirmCancelBtn.addEventListener('click', onConfirm, { once: true });
  }
});
})
.catch(err => {
console.error("Error fetching appointments:", err);
list.innerHTML = "<p class='text-center text-danger'>Failed to load appointments.</p>";
});
});
});
});
