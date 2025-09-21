const tableBody = document.getElementById("appointmentsTable");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const logoutBtn = document.getElementById("logoutBtn");
const overlay = document.getElementById("guestOverlay");

const modal = new bootstrap.Modal(document.getElementById('appointmentModal'));
const modalUser = document.getElementById('modalUser');
const modalPurpose = document.getElementById('modalPurpose');
const modalDateTime = document.getElementById('modalDateTime');
const modalStatus = document.getElementById('modalStatus');
const modalNotes = document.getElementById('modalNotes');
const modalCreatedAt = document.getElementById('modalCreatedAt');
const statusSelect = document.getElementById('statusSelect');
const reasonDiv = document.getElementById('reasonDiv');
const reasonTextarea = document.getElementById('reasonTextarea');
const updateBtn = document.getElementById('updateBtn');

const feedbackTableBody = document.getElementById("feedbackTable");
const helpRequestsTableBody = document.getElementById("helpRequestsTable");

let currentAppointmentId = null;
let allAppointments = [];
let allFeedback = [];
let allHelpRequests = [];

function updateStats() {
  const pending = allAppointments.filter(a => a.status === "Pending").length;
  const confirmed = allAppointments.filter(a => a.status === "Confirmed").length;
  const completed = allAppointments.filter(a => a.status === "Completed").length;
  const cancelled = allAppointments.filter(a => a.status === "Cancelled").length;
  document.getElementById("statPending").textContent = pending;
  document.getElementById("statConfirmed").textContent = confirmed;
  document.getElementById("statCompleted").textContent = completed;
  document.getElementById("statCancelled").textContent = cancelled;
}

logoutBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  await auth.signOut();
  window.location.href = "../index.html";
});

function applyFilters() {
  const search = searchInput.value.toLowerCase();
  const status = statusFilter.value;

  const filtered = allAppointments.filter(app => {
    const matchSearch =
      app.userEmail.toLowerCase().includes(search) ||
      app.purpose.toLowerCase().includes(search);

    const matchStatus = !status || app.status === status;

    return matchSearch && matchStatus;
  });

  renderAppointments(filtered);
  updateStats();
}

searchInput.addEventListener("input", applyFilters);
statusFilter.addEventListener("change", applyFilters);

function renderAppointments(list) {
  tableBody.innerHTML = "";

  if (!list.length) {
    tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No appointments found.</td></tr>`;
    return;
  }

  list.forEach(app => {
    const tr = document.createElement("tr");

    if (app.status === "Pending") {
      tr.classList.add("table-warning");
    }

    tr.innerHTML = `
      <td>${app.userEmail}</td>
      <td>${app.purpose}</td>
      <td>${app.date} ${app.time}</td>
      <td><span class="badge bg-${statusColor(app.status)}">${app.status}</span></td>
      <td>${new Date(app.createdAt?.toDate?.() || app.createdAt).toLocaleString()}</td>
      <td>${app.notes || "-"}</td>
      <td class="text-center"><button class="btn btn-info btn-sm" data-action="View">View</button></td>
      <td>
        <button class="btn btn-sm btn-success me-1" data-action="Confirm">Confirm</button>
        <button class="btn btn-sm btn-info me-1" data-action="Complete">Complete</button>
        <button class="btn btn-sm btn-danger" data-action="Cancel">Cancel</button>
      </td>
    `;

    tr.querySelectorAll("button").forEach(btn => {
      if (btn.dataset.action === "View") {
        btn.addEventListener("click", () => openModal(app));
      } else {
        btn.addEventListener("click", () => updateStatus(app.id, btn.dataset.action));
      }
    });

    tableBody.appendChild(tr);
  });
}

function statusColor(status) {
  switch (status) {
    case "Pending": return "warning";
    case "Confirmed": return "primary";
    case "Completed": return "success";
    case "Cancelled": return "danger";
    default: return "secondary";
  }
}

async function updateStatus(id, newStatus) {
  try {
    await db.collection("appointments").doc(id).update({
      status: newStatus,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log(`✅ Appointment ${id} updated to ${newStatus}`);
  } catch (err) {
    console.error("Error updating status:", err);
    alert("Failed to update status.");
  }
}

function renderFeedback(list) {
  feedbackTableBody.innerHTML = "";

  if (!list.length) {
    feedbackTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No feedback found.</td></tr>`;
    return;
  }

  list.forEach(fb => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${fb.name}</td>
      <td>${fb.email}</td>
      <td>${fb.subject}</td>
      <td>${fb.message}</td>
      <td>${new Date(fb.timestamp?.toDate?.() || fb.timestamp).toLocaleString()}</td>
    `;
    feedbackTableBody.appendChild(tr);
  });
}

function renderHelpRequests(list) {
  helpRequestsTableBody.innerHTML = "";

  if (!list.length) {
    helpRequestsTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No help requests found.</td></tr>`;
    return;
  }

  list.forEach(request => {
    const tr = document.createElement("tr");
    const statusBadge = getStatusBadge(request.status);
    const priorityBadge = getPriorityBadge(request.priority);

    tr.innerHTML = `
      <td>${request.fullName}</td>
      <td>${request.email}</td>
      <td>${request.category}</td>
      <td><span class="badge ${priorityBadge}">${request.priority}</span></td>
      <td><span class="badge ${statusBadge}">${request.status}</span></td>
      <td>${new Date(request.createdAt?.toDate?.() || request.createdAt).toLocaleString()}</td>
      <td class="text-center">
        <button class="btn btn-info btn-sm me-1" data-action="View" data-id="${request.id}">View</button>
        <button class="btn btn-success btn-sm me-1" data-action="Resolve" data-id="${request.id}">Resolve</button>
        <button class="btn btn-warning btn-sm" data-action="Pending" data-id="${request.id}">Pending</button>
      </td>
    `;

    tr.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        const action = btn.dataset.action;
        const requestId = btn.dataset.id;
        handleHelpRequestAction(requestId, action);
      });
    });

    helpRequestsTableBody.appendChild(tr);
  });
}

function getStatusBadge(status) {
  switch (status) {
    case "Open": return "bg-danger";
    case "In Progress": return "bg-warning";
    case "Resolved": return "bg-success";
    case "Closed": return "bg-secondary";
    default: return "bg-secondary";
  }
}

function getPriorityBadge(priority) {
  switch (priority) {
    case "Urgent": return "bg-danger";
    case "Normal": return "bg-info";
    default: return "bg-secondary";
  }
}

async function handleHelpRequestAction(requestId, action) {
  try {
    let newStatus = "Open";
    if (action === "Resolve") newStatus = "Resolved";
    else if (action === "Pending") newStatus = "In Progress";

    await db.collection("helpRequests").doc(requestId).update({
      status: newStatus,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Help request ${requestId} updated to ${newStatus}`);
  } catch (err) {
    console.error("Error updating help request:", err);
    alert("Failed to update help request status.");
  }
}

auth.onAuthStateChanged(async user => {
  if (!user) {
    overlay.style.display = "flex";
    return;
  }

  console.log("Logged in user UID:", user.uid);
  console.log("Expected admin UID: oU96E4ZGt1cvQ5mEnTAXDWQ8s4K2");

  if (user.uid !== "oU96E4ZGt1cvQ5mEnTAXDWQ8s4K2") {
    console.log("Access denied: UID does not match admin UID");
    overlay.style.display = "flex";
    return;
  }

  console.log("Admin access granted");

  db.collection("appointments")
    .onSnapshot(snapshot => {
      allAppointments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(app => app.status !== "Cancelled");

      allAppointments.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return bTime - aTime;
      });

      updateStats();
      applyFilters();
    }, err => {
      console.error("Error loading appointments:", err);
      tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Failed to load appointments. Check console for details.</td></tr>`;
    });

  db.collection("feedback")
    .orderBy("timestamp", "desc")
    .onSnapshot(snapshot => {
      allFeedback = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      renderFeedback(allFeedback);
    }, err => {
      console.error("Error loading feedback:", err);
      feedbackTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Failed to load feedback. Check console for details.</td></tr>`;
    });

  db.collection("helpRequests")
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {
      allHelpRequests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      renderHelpRequests(allHelpRequests);
    }, err => {
      console.error("Error loading help requests:", err);
      helpRequestsTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Failed to load help requests. Check console for details.</td></tr>`;
    });
});

function openModal(app) {
  currentAppointmentId = app.id;
  modalUser.textContent = app.userEmail;
  modalPurpose.textContent = app.purpose;
  modalDateTime.textContent = `${app.date} ${app.time}`;
  modalStatus.textContent = app.status;
  modalNotes.textContent = app.notes || "-";
  modalCreatedAt.textContent = new Date(app.createdAt?.toDate?.() || app.createdAt).toLocaleString();

  statusSelect.value = app.status || "Pending";
  reasonTextarea.value = app.adminNotes || "";
  reasonDiv.style.display = statusSelect.value === "Cancelled" ? "block" : "none";

  modal.show();
}

statusSelect.addEventListener("change", () => {
  if (statusSelect.value === "Cancelled") {
    reasonDiv.style.display = "block";
  } else {
    reasonDiv.style.display = "none";
    reasonTextarea.value = "";
  }
});

updateBtn.addEventListener("click", async () => {
  const newStatus = statusSelect.value;
  const adminNotes = reasonTextarea.value.trim();

  if (newStatus === "Cancelled" && !adminNotes) {
    alert("Please provide a reason for cancellation.");
    return;
  }

  try {
    await db.collection("appointments").doc(currentAppointmentId).update({
      status: newStatus,
      adminNotes: adminNotes || null,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    modal.hide();
    console.log(`✅ Appointment ${currentAppointmentId} updated to ${newStatus}`);
  } catch (err) {
    console.error("Error updating appointment:", err);
    alert("Failed to update appointment.");
  }
});
