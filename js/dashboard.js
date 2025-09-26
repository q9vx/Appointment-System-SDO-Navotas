const auth = firebase.auth();
const db = firebase.firestore();
const userName = document.getElementById("userName");
const logoutBtn = document.getElementById("logoutBtn");
const guestOverlay = document.getElementById("guestOverlay");
const goSignup = document.getElementById("goSignup");

auth.onAuthStateChanged(async (user) => {
if (user) {
document.body.style.display = "block";
if (guestOverlay) guestOverlay.style.display = "none";
if (userName) userName.textContent = user.displayName || user.email.split("@")[0];

try {
const snapshot = await db.collection("appointments").where("userId", "==", user.uid).get();
const appointments = snapshot.docs.map(docSnap => ({
  id: docSnap.id,
  ...docSnap.data()
}));

let pending = 0, confirmed = 0, cancelled = 0, completed = 0;
const total = appointments.length;

appointments.forEach(appointment => {
  switch (appointment.status) {
    case "Pending":
      pending++;
      break;
    case "Confirmed":
      confirmed++;
      break;
    case "Completed":
      completed++;
      break;
    case "Cancelled":
      cancelled++;
      break;
  }
});

document.getElementById("totalCount").textContent = total;
document.getElementById("pendingCount").textContent = pending;
document.getElementById("confirmedCount").textContent = confirmed;
document.getElementById("cancelledCount").textContent = cancelled;

const successRate = total > 0 ? Math.round(((confirmed + completed) / total) * 100) : 0;
document.getElementById("successRate").textContent = successRate + "%";

const now = new Date();
const thisMonth = now.getMonth();
const thisYear = now.getFullYear();
const thisMonthCount = appointments.filter(a => {
  const appDate = new Date(a.date);
  return appDate.getMonth() === thisMonth && appDate.getFullYear() === thisYear;
}).length;
document.getElementById("thisMonthCount").textContent = thisMonthCount;

const sortedAppointments = appointments.map(a => ({
  ...a,
  fullDate: new Date(a.date + (a.time ? ' ' + a.time : ''))
})).sort((a, b) => a.fullDate - b.fullDate);

const lastAppointment = sortedAppointments[sortedAppointments.length - 1];
document.getElementById("lastAppointment").textContent = lastAppointment ? 
  `${lastAppointment.date} - ${lastAppointment.purpose || 'N/A'}` : 'None';

const today = new Date();
const nextWeek = new Date(today);
nextWeek.setDate(today.getDate() + 7);
const upcoming = sortedAppointments.filter(a => 
  a.fullDate > today && a.fullDate <= nextWeek && a.status !== "Cancelled"
).slice(0, 5);

const upcomingContainer = document.getElementById("upcomingAppointments");
if (upcoming.length > 0) {
  upcomingContainer.innerHTML = upcoming.map(appointment => `
    <a href="my-appointments.html" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
      <div>
        <div class="fw-bold">${appointment.purpose || 'General Appointment'}</div>
        <small class="text-muted">${appointment.date} at ${appointment.time || 'TBD'}</small>
      </div>
      <span class="badge ${appointment.status === 'Confirmed' ? 'bg-success' : 'bg-warning'}">${appointment.status}</span>
    </a>
  `).join('');
} else {
  upcomingContainer.innerHTML = '<p class="text-muted mb-0">No upcoming appointments</p>';
}

const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const reminders = sortedAppointments.filter(a => 
  a.fullDate > today && a.fullDate < tomorrow && a.status !== "Cancelled"
);

const remindersContainer = document.getElementById("reminders");
if (reminders.length > 0) {
  remindersContainer.innerHTML = reminders.map(appointment => `
    <div class="list-group-item d-flex justify-content-between align-items-center alert-warning">
      <div>
        <div class="fw-bold text-warning">⚠️ Urgent: ${appointment.purpose || 'Appointment'}</div>
        <small class="text-muted">Tomorrow: ${appointment.date} at ${appointment.time || 'TBD'}</small>
      </div>
      <i class="bi bi-exclamation-triangle-fill text-warning fs-3"></i>
    </div>
  `).join('');
} else {
  remindersContainer.innerHTML = '<p class="text-muted mb-0">No urgent reminders</p>';
}

} catch (error) {
console.error("Error loading dashboard data:", error);
const errorMsg = document.createElement("div");
errorMsg.className = "alert alert-danger";
errorMsg.textContent = "Error loading your appointments. Please refresh the page.";
document.querySelector(".card-dashboard").appendChild(errorMsg);
}

} else {
document.body.style.display = "block";
if (guestOverlay) guestOverlay.style.display = "flex";
window.location.href = "login.html";
}
});

if (goSignup) {
goSignup.addEventListener("click", () => {
window.location.href = "signup.html";
});
}

if (logoutBtn) {
logoutBtn.addEventListener("click", () => {
auth.signOut().then(() => {
window.location.href = "login.html";
});
});
}
