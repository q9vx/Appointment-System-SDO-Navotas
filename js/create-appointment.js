document.addEventListener("DOMContentLoaded", () => {
const auth = firebase.auth();
const db = firebase.firestore();

const guestOverlay = document.getElementById("guestOverlay");
const goSignup = document.getElementById("goSignup");

let successToast, errorToast;

auth.onAuthStateChanged(user => {
if (!user) {
if (guestOverlay) guestOverlay.style.display = "flex";
if (goSignup) {
goSignup.addEventListener("click", () => {
window.location.href = "signup.html";
});
}
document.body.style.display = "block";
return;
}

if (guestOverlay) guestOverlay.style.display = "none";
document.body.style.display = "block";

const navProfile = document.getElementById("navProfile");
if (navProfile) {
navProfile.href = "dashboard.html";

db.collection("users").doc(user.uid).get().then(doc => {
if (doc.exists && doc.data().role === "admin") {
navProfile.href = "admin/admin-dashboard.html";
const navbar = document.getElementById("navbarContent");
const ul = navbar.querySelector("ul");
const li = document.createElement("li");
li.className = "nav-item";
li.innerHTML = '<a class="nav-link" href="admin/admin-dashboard.html"><i class="bi bi-speedometer2 me-1"></i> Admin Dashboard</a>';
ul.appendChild(li);
}
}).catch(err => {
console.error("Error checking user role:", err);
});
}

initAppointmentForm(user, db);
});
});

function initAppointmentForm(user, db) {
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

function updateDateTime() {
const phNow = getPHNow();
const formatted = formatPHDateTime(phNow);

if (dateField) dateField.value = formatted.date;
if (timeField) timeField.value = formatted.time;
}

updateDateTime();

const dateTimeInterval = setInterval(updateDateTime, 1000);

window.dateTimeInterval = dateTimeInterval;

const notesField = document.getElementById("notes");
const charCount = document.getElementById("charCount");

if (notesField && charCount) {
notesField.addEventListener("input", () => {
const count = notesField.value.length;
charCount.textContent = count;

if (count > 450) {
charCount.style.color = "#dc3545";
} else if (count > 400) {
charCount.style.color = "#fd7e14";
} else {
charCount.style.color = "#6c757d";
}
});
}

const createForm = document.getElementById("createAppointmentForm");
const submitBtn = document.getElementById("submitBtn");

if (!createForm || !submitBtn) return;

const purposeField = document.getElementById("purpose");
if (purposeField) {
purposeField.addEventListener("change", () => {
if (purposeField.value) {
purposeField.classList.remove("is-invalid");
purposeField.classList.add("is-valid");
} else {
purposeField.classList.remove("is-valid");
purposeField.classList.add("is-invalid");
}
});
}

createForm.addEventListener("submit", async (e) => {
e.preventDefault();

const purpose = purposeField?.value;
const notes = notesField?.value.trim();

let isValid = true;

if (!purpose) {
purposeField?.classList.add("is-invalid");
isValid = false;
} else {
purposeField?.classList.remove("is-invalid");
purposeField?.classList.add("is-valid");
}

if (!isValid) {
showToast("Please fill in all required fields.", "error");
return;
}

submitBtn.disabled = true;
submitBtn.classList.add("loading");
submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Creating...';

try {
const appointmentDateTime = getPHNow();
const currentFormatted = formatPHDateTime(appointmentDateTime);

await db.collection("appointments").add({
userId: user.uid,
userEmail: user.email,
purpose: purpose,
notes: notes || null,
status: "Pending",
date: currentFormatted.date,
time: currentFormatted.time,
appointmentDateTime: appointmentDateTime,
createdAt: firebase.firestore.FieldValue.serverTimestamp()
});

showToast("Appointment created successfully! Redirecting...", "success");

setTimeout(() => {
window.location.href = "my-appointments.html";
}, 2000);

} catch (err) {
console.error("Error creating appointment:", err);

let errorMessage = "Failed to create appointment. Please try again.";
if (err.code === "permission-denied") {
errorMessage = "You don't have permission to create appointments.";
} else if (err.code === "unavailable") {
errorMessage = "Service temporarily unavailable. Please try again later.";
}

showToast(errorMessage, "error");

submitBtn.disabled = false;
submitBtn.classList.remove("loading");
submitBtn.innerHTML = '<i class="bi bi-calendar-plus me-2"></i>Create Appointment';
}
});

function showToast(message, type) {
  if (!successToast || !errorToast || typeof successToast.show !== 'function' || typeof errorToast.show !== 'function') {
    const successElement = document.getElementById('successToast');
    const errorElement = document.getElementById('errorToast');

    if (successElement && errorElement && typeof bootstrap !== 'undefined' && bootstrap.Toast) {
      successToast = new bootstrap.Toast(successElement);
      errorToast = new bootstrap.Toast(errorElement);
    } else {
      console.error('Bootstrap or toast elements not available. Cannot show toast.');
      console.error(`${type} message: ${message}`);
      return;
    }
  }

  const toastMessage = type === "success"
    ? document.getElementById("toastMessage")
    : document.getElementById("errorToastMessage");

  if (toastMessage) {
    toastMessage.textContent = message;
  }

  if (type === "success") {
    successToast.show();
  } else if (type === "error") {
    errorToast.show();
  }
}

if (charCount) charCount.textContent = "0";
}
