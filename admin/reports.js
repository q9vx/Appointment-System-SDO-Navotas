const tableBody = document.getElementById("reportsTable");
const logoutBtn = document.getElementById("logoutBtn");
const overlay = document.getElementById("guestOverlay");

let allCancelled = [];

function updateStats() {
const total = allCancelled.length;
const thisMonth = allCancelled.filter(a => {
const cancelledAt = a.cancelledAt?.toDate?.() || new Date(a.cancelledAt || 0);
const now = new Date();
return cancelledAt.getMonth() === now.getMonth() && cancelledAt.getFullYear() === now.getFullYear();
}).length;

document.getElementById("totalCancelled").textContent = total;
document.getElementById("recentCancelled").textContent = thisMonth;
}

logoutBtn.addEventListener("click", async (e) => {
e.preventDefault();
await auth.signOut();
window.location.href = "../index.html";
});

function renderReports(list) {
tableBody.innerHTML = "";

if (!list.length) {
tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No cancelled appointments found.</td></tr>`;
return;
}

list.forEach(app => {
const tr = document.createElement("tr");

tr.innerHTML = `
<td>${app.userEmail}</td>
<td>${app.purpose}</td>
<td>${app.date} ${app.time}</td>
<td>${app.cancellationReason || "No reason provided"}${app.cancellationNotes ? `<br><small class="text-muted">${app.cancellationNotes}</small>` : ""}</td>
<td>${new Date(app.cancelledAt?.toDate?.() || app.cancelledAt).toLocaleString()}</td>
`;

tableBody.appendChild(tr);
});
}

auth.onAuthStateChanged(async user => {
if (!user) {
overlay.style.display = "flex";
return;
}

if (user.uid !== "oU96E4ZGt1cvQ5mEnTAXDWQ8s4K2") {
overlay.style.display = "flex";
return;
}

db.collection("appointments").where("status", "==", "Cancelled")
.onSnapshot(snapshot => {
allCancelled = snapshot.docs.map(doc => ({
id: doc.id,
...doc.data()
}));

allCancelled.sort((a, b) => {
const aTime = a.cancelledAt?.toDate?.() || new Date(a.cancelledAt || 0);
const bTime = b.cancelledAt?.toDate?.() || new Date(b.cancelledAt || 0);
return bTime - aTime;
});

updateStats();
renderReports(allCancelled);
}, err => {
console.error("Error loading reports:", err);
tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Failed to load reports. Check console for details.</td></tr>`;
});
});
