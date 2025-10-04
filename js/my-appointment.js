document.addEventListener("DOMContentLoaded", () => {
const auth = firebase.auth();
const db = firebase.firestore();

const list = document.getElementById("appointmentsList");
const skeletonLoader = document.getElementById("skeletonLoader");
const overlay = document.getElementById("guestOverlay");
const goSignup = document.getElementById("goSignup");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const loadingIndicator = document.getElementById("loadingIndicator");
const pageInfo = document.getElementById("pageInfo");
const sortSelect = document.getElementById("sortSelect");
const clearFiltersBtn = document.getElementById("clearFilters");
const navProfile = document.getElementById("navProfile");
const successToast = new bootstrap.Toast(document.getElementById("successToast"));
const toastMessage = document.getElementById("toastMessage");

// Pagination and filtering state
let allAppointments = [];
let filteredAppointments = [];
let currentPage = 1;
const pageSize = 10;
let currentFilter = "all";
let currentSort = "createdAt-desc";
let isAdmin = false;

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

function showLoading() {
loadingIndicator.classList.add("show");
loadMoreBtn.style.display = "none";
}

function hideLoading() {
loadingIndicator.classList.remove("show");
}

function showSkeleton() {
if (skeletonLoader) skeletonLoader.style.display = "block";
list.style.display = "none";
}

function hideSkeleton() {
if (skeletonLoader) skeletonLoader.style.display = "none";
list.style.display = "block";
}

function showToast(message, duration = 3000) {
if (toastMessage && successToast) {
toastMessage.textContent = message;
successToast.show();
setTimeout(() => successToast.hide(), duration);
}
}

function showError(message) {
hideSkeleton();
list.innerHTML = `<p class='text-center text-danger'><i class='bi bi-exclamation-triangle me-2'></i>${message}</p>`;
}

function updatePageInfo() {
const totalFiltered = filteredAppointments.length;
const showing = Math.min(currentPage * pageSize, totalFiltered);
const hasMore = showing < totalFiltered;

loadMoreBtn.style.display = hasMore ? "block" : "none";
pageInfo.textContent = `Showing ${showing} of ${totalFiltered} appointments`;

if (!hasMore && totalFiltered > pageSize) {
pageInfo.textContent += " (all loaded)";
}
}

function getCurrentPageAppointments() {
const startIndex = 0;
const endIndex = currentPage * pageSize;
return filteredAppointments.slice(startIndex, endIndex);
}

function applyFilter(appointments, filter) {
const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const weekFromNow = new Date(today);
weekFromNow.setDate(today.getDate() + 7);
const monthFromNow = new Date(today);
monthFromNow.setMonth(today.getMonth() + 1);

switch (filter) {
case "today":
return appointments.filter(appt => {
const apptDate = new Date(appt.date);
return apptDate.toDateString() === today.toDateString();
});
case "week":
return appointments.filter(appt => {
const apptDate = new Date(appt.date);
return apptDate >= today && apptDate < weekFromNow;
});
case "month":
return appointments.filter(appt => {
const apptDate = new Date(appt.date);
return apptDate >= today && apptDate < monthFromNow;
});
case "upcoming":
return appointments.filter(appt => {
const apptDate = new Date(appt.date);
return apptDate >= today;
});
default:
return appointments;
}
}

function applySort(appointments, sort) {
const [field, direction] = sort.split("-");
const isDesc = direction === "desc";

return [...appointments].sort((a, b) => {
let aVal, bVal;

switch (field) {
case "createdAt":
aVal = a.createdAt?.toDate?.() || new Date(0);
bVal = b.createdAt?.toDate?.() || new Date(0);
break;
case "date":
aVal = new Date(a.date + (a.time ? ` ${a.time}` : ""));
bVal = new Date(b.date + (b.time ? ` ${b.time}` : ""));
break;
case "status":
aVal = a.status || "";
bVal = b.status || "";
break;
default:
return 0;
}

if (aVal < bVal) return isDesc ? 1 : -1;
if (aVal > bVal) return isDesc ? -1 : 1;
return 0;
});
}

function updateQuickFilterButtons() {
document.querySelectorAll(".quick-filter-btn").forEach(btn => {
btn.classList.toggle("active", btn.dataset.filter === currentFilter);
});
}

function renderStats(appointments) {
const total = appointments.length;
const pending = appointments.filter(a => a.status === 'Pending').length;
const confirmed = appointments.filter(a => a.status === 'Confirmed').length;
const completed = appointments.filter(a => a.status === 'Completed').length;
const cancelled = appointments.filter(a => a.status === 'Cancelled').length;
const feedbackReceived = appointments.filter(a => a.status === 'FeedbackReceived').length;

const statsHTML = `
<div class="stat-card">
<span class="stat-number">${total}</span>
<span class="stat-label">Total</span>
</div>
<div class="stat-card">
<span class="stat-number">${pending}</span>
<span class="stat-label">Pending</span>
</div>
<div class="stat-card">
<span class="stat-number">${confirmed}</span>
<span class="stat-label">Confirmed</span>
</div>
<div class="stat-card">
<span class="stat-number">${completed}</span>
<span class="stat-label">Completed</span>
</div>
<div class="stat-card">
<span class="stat-number">${feedbackReceived}</span>
<span class="stat-label">Feedback</span>
</div>
<div class="stat-card">
<span class="stat-number">${cancelled}</span>
<span class="stat-label">Cancelled</span>
</div>
`;

document.getElementById('statsGrid').innerHTML = statsHTML;
document.getElementById('statsSection').style.display = 'block';
}

function renderAppointments(appointments) {
hideSkeleton();
if (appointments.length === 0) {
list.innerHTML = "<p class='text-center text-muted'><i class='bi bi-calendar-x me-2'></i>No appointments found.</p>";
return;
}

list.innerHTML = "";
appointments.forEach((appt, index) => {
let createdAtDisplay = "N/A";
if (appt.createdAt && appt.createdAt.toDate) {
createdAtDisplay = formatPHDateTime(appt.createdAt.toDate());
}

let appointmentDateTime = "N/A";
if (appt.date && appt.time) {
appointmentDateTime = `${appt.date} ${appt.time}`;
}

let badgeClass = "bg-secondary";
let statusIcon = "";
if (appt.status === "Pending") {
badgeClass = "bg-warning";
statusIcon = "⏳";
} else if (appt.status === "Confirmed") {
badgeClass = "bg-success";
statusIcon = "✅";
} else if (appt.status === "Completed") {
badgeClass = "bg-info";
statusIcon = "✅";
} else if (appt.status === "FeedbackReceived") {
badgeClass = "bg-primary";
statusIcon = "💬";
} else if (appt.status === "Cancelled") {
badgeClass = "bg-danger";
statusIcon = "❌";
}

const statusSteps = [
{ step: "Submitted", icon: "📝", message: "Your request has been submitted successfully." },
{ step: "Viewing by HR Staff", icon: "👀", message: "Your request is up for viewing by the HR staff." },
{ step: "Accepted", icon: "✅", message: "Your request has been accepted." },
{ step: "Approved", icon: "🎉", message: "Appointment approved! Prepare for needed things to bring (e.g., documents, ID)." },
{ step: "Completed", icon: "🏁", message: "Appointment completed successfully." },
{ step: "Feedback Received", icon: "💬", message: "Thank you for your feedback!" }
];

let currentStepIndex = -1;
let trackerHTML = "";

if (appt.status === "Cancelled") {
trackerHTML = `
<div class="status-tracker mt-3">
<div class="alert alert-danger d-flex align-items-center">
<i class="bi bi-x-circle me-2"></i>
<strong>Cancelled:</strong> ${appt.cancellationReason || 'No reason provided'}
</div>
</div>
`;
} else {
if (appt.status === "Pending") currentStepIndex = 0;
else if (appt.status === "Confirmed") currentStepIndex = 2;
else if (appt.status === "Completed") currentStepIndex = 4;
else if (appt.status === "FeedbackReceived") currentStepIndex = 5;

trackerHTML = `
<div class="status-tracker mt-3">
<h6 class="fw-semibold mb-3 text-primary"><i class="bi bi-graph-up me-2"></i>Appointment Progress</h6>
<div class="timeline">
${statusSteps.map((step, index) => {
const isCompleted = index <= currentStepIndex;
const isCurrent = index === currentStepIndex;
return `
<div class="step-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}">
<div class="step-content">
<h6 class="mb-1">${step.step}</h6>
<p class="mb-0 small">${step.message}</p>
</div>
</div>
`;
}).join('')}
</div>
</div>
`;
}

const cardHTML = `
<div class="appointment-card fade-in-card" data-id="${appt.id || ''}" style="animation-delay: ${index * 0.1}s;">
<div class="d-flex justify-content-between align-items-start mb-3">
<div>
<i class="bi bi-calendar-event text-primary me-2"></i>
<h6 class="fw-bold mb-1 d-inline">${appt.purpose || 'General Appointment'}</h6>
</div>
<span class="badge ${badgeClass} fs-6">${statusIcon} ${appt.status}</span>
</div>
<div class="row">
<div class="col-md-6">
<p class="mb-2">
<i class="bi bi-clock-history text-muted me-2"></i>
<strong>Date & Time:</strong> ${appointmentDateTime}
</p>
<p class="mb-0">
<i class="bi bi-calendar-check text-muted me-2"></i>
<strong>Created:</strong> ${createdAtDisplay}
</p>
</div>
<div class="col-md-6">
${appt.notes ? `<p class="text-muted small mb-2"><i class="bi bi-chat-text text-muted me-1"></i>${appt.notes}</p>` : ""}
${appt.adminNotes ? `<p class="text-info small"><i class="bi bi-person-check text-info me-1"></i><strong>Admin:</strong> ${appt.adminNotes}</p>` : ""}
</div>
</div>
<div class="status-tracker mt-3">${trackerHTML}</div>
${appt.status !== "Cancelled" && appt.status !== "Completed" && appt.status !== "FeedbackReceived" ? `
<button class="btn btn-outline-danger btn-sm mt-3 cancel-btn" aria-label="Cancel this appointment">
<i class="bi bi-x-circle me-1"></i>Cancel Appointment
</button>
` : ""}
</div>
`;

list.innerHTML += cardHTML;
});
}

function loadAndRenderAppointments() {
showSkeleton();

filteredAppointments = applyFilter(allAppointments, currentFilter);
filteredAppointments = applySort(filteredAppointments, currentSort);

currentPage = 1;

const currentAppointments = getCurrentPageAppointments();
setTimeout(() => { 
renderAppointments(currentAppointments);
updatePageInfo();
}, 800);
}

function loadMoreAppointments() {
if ((currentPage * pageSize) >= filteredAppointments.length) return;

showLoading();
currentPage++;
const currentAppointments = getCurrentPageAppointments();
renderAppointments(currentAppointments);
updatePageInfo();
hideLoading();
}

document.querySelectorAll(".quick-filter-btn").forEach(btn => {
btn.addEventListener("click", () => {
document.querySelectorAll(".quick-filter-btn").forEach(b => b.classList.remove("active"));
btn.classList.add("active");
currentFilter = btn.dataset.filter;
loadAndRenderAppointments();
});
});

sortSelect.addEventListener("change", () => {
currentSort = sortSelect.value;
loadAndRenderAppointments();
});

if (clearFiltersBtn) {
clearFiltersBtn.addEventListener("click", () => {
currentFilter = "all";
currentSort = "createdAt-desc";
sortSelect.value = "createdAt-desc";
document.querySelectorAll(".quick-filter-btn").forEach(b => b.classList.remove("active"));
document.querySelector("[data-filter='all']").classList.add("active");
loadAndRenderAppointments();
showToast("Filters cleared!");
});
}

loadMoreBtn.addEventListener("click", loadMoreAppointments);

updateQuickFilterButtons();
showSkeleton();

auth.onAuthStateChanged(user => {
if (!user) {
hideSkeleton();
document.body.classList.add("guest-blur");
if (overlay) overlay.style.display = "flex";
if (goSignup) goSignup.addEventListener("click", () => {
window.location.href = "signup.html";
});
list.innerHTML = "<p class='text-center text-muted'><i class='bi bi-box-arrow-in-right me-2'></i>You must log in to view appointments.</p>";
return;
}

document.body.classList.remove("guest-blur");
if (overlay) overlay.style.display = "none";

db.collection("users").doc(user.uid).get().then(doc => {
isAdmin = doc.exists && doc.data().role === "admin";
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
allAppointments = [];
snapshot.forEach(doc => {
const appt = { id: doc.id, ...doc.data() };
allAppointments.push(appt);
});

renderStats(allAppointments);
loadAndRenderAppointments();

list.addEventListener("click", (e) => {
if (e.target.classList.contains("cancel-btn")) {
const card = e.target.closest(".appointment-card");
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
showToast("Please select a reason for cancellation.", 4000);
return;
}

db.collection("appointments").doc(apptId).update({
status: "Cancelled",
cancellationReason: reason,
cancellationNotes: notes || null,
cancelledAt: firebase.firestore.FieldValue.serverTimestamp()
}).then(() => {
showToast("Appointment cancelled successfully!");

const apptIndex = allAppointments.findIndex(a => a.id === apptId);
if (apptIndex !== -1) {
allAppointments[apptIndex].status = "Cancelled";
}

renderStats(allAppointments);
loadAndRenderAppointments();
cancelModal.hide();
confirmCancelBtn.removeEventListener('click', onConfirm);
}).catch((error) => {
console.error("Error cancelling appointment:", error);
showToast("Failed to cancel appointment. Please try again.", 5000);
});
};

confirmCancelBtn.addEventListener('click', onConfirm, { once: true });
}
});
})
.catch(err => {
console.error("Error fetching appointments:", err);
showError("Failed to load appointments. Please check your connection and try again.");
});
});
});
});
