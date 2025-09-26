const sidebarToggleBtn = document.getElementById('sidebarToggle');
const wrapper = document.getElementById('wrapper');

if (sidebarToggleBtn && wrapper) {
  sidebarToggleBtn.addEventListener('click', () => {
    wrapper.classList.toggle('toggled');
  });
} else {
  console.error('Sidebar toggle button or wrapper element not found');
}

// Close sidebar when clicking on overlay (mobile)
document.addEventListener('click', (e) => {
  if (window.innerWidth <= 768 && wrapper.classList.contains('toggled')) {
    const sidebar = document.getElementById('sidebar-wrapper');
    if (sidebar && !sidebar.contains(e.target) && e.target !== sidebarToggleBtn) {
      wrapper.classList.remove('toggled');
    }
  }
});

const tableBody = document.getElementById("appointmentsTable");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const dateFrom = document.getElementById("dateFrom");
const dateTo = document.getElementById("dateTo");
const applyFiltersBtn = document.getElementById("applyFiltersBtn");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const logoutBtn = document.getElementById("logoutBtn");
const overlay = document.getElementById("guestOverlay");

// Bulk action elements
const selectAllCheckbox = document.getElementById("selectAllCheckbox");
const bulkConfirmBtn = document.getElementById("bulkConfirmBtn");
const bulkCancelBtn = document.getElementById("bulkCancelBtn");
const bulkExportBtn = document.getElementById("bulkExportBtn");

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

// Real-time features variables
let realTimeMode = true;
let refreshInterval = null;
let lastUpdateTime = new Date();
let newItemsCount = 0;
let appointmentListener = null;
let feedbackListener = null;
let helpRequestsListener = null;

// Notification variables
let notifications = [];
let maxNotifications = 10;
let notificationTimeUpdateInterval = null;

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
  const selectedStatuses = Array.from(statusFilter.selectedOptions).map(option => option.value);
  const dateFromValue = dateFrom.value;
  const dateToValue = dateTo.value;

  const filtered = allAppointments.filter(app => {
    // Enhanced search across multiple fields
    const matchSearch =
      (app.userName || "").toLowerCase().includes(search) ||
      app.userEmail.toLowerCase().includes(search) ||
      (app.role || "").toLowerCase().includes(search) ||
      app.purpose.toLowerCase().includes(search) ||
      (app.notes || "").toLowerCase().includes(search);

    // Multi-select status filtering
    const matchStatus = selectedStatuses.length === 0 || selectedStatuses.includes(app.status);

    // Date range filtering
    let matchDateRange = true;
    if (dateFromValue || dateToValue) {
      const appointmentDate = new Date(app.date);
      if (dateFromValue) {
        const fromDate = new Date(dateFromValue);
        matchDateRange = matchDateRange && appointmentDate >= fromDate;
      }
      if (dateToValue) {
        const toDate = new Date(dateToValue);
        toDate.setHours(23, 59, 59, 999); // Include the entire day
        matchDateRange = matchDateRange && appointmentDate <= toDate;
      }
    }

    return matchSearch && matchStatus && matchDateRange;
  });

  renderAppointments(filtered);
  updateStats();
  updateBulkButtonStates();
}

function clearFilters() {
  searchInput.value = "";
  statusFilter.selectedIndex = -1; // Clear multi-select
  dateFrom.value = "";
  dateTo.value = "";
  applyFilters();
}

// Event listeners
searchInput.addEventListener("input", applyFilters);
statusFilter.addEventListener("change", applyFilters);
dateFrom.addEventListener("change", applyFilters);
dateTo.addEventListener("change", applyFilters);
applyFiltersBtn.addEventListener("click", applyFilters);
clearFiltersBtn.addEventListener("click", clearFilters);

function renderAppointments(list) {
  tableBody.innerHTML = "";

  // Reset select all checkbox when re-rendering
  if (selectAllCheckbox) {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
  }

  if (!list.length) {
    tableBody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-4">No appointments found.</td></tr>`;
    return;
  }

  list.forEach(app => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td><input type="checkbox" class="appointment-checkbox" data-id="${app.id}"></td>
      <td class="fw-semibold">${app.userName || app.userEmail}</td>
      <td>${app.date}</td>
      <td>${app.time}</td>
      <td>${app.role || "Student"}</td>
      <td>${app.purpose}</td>
      <td><span class="status-badge ${getStatusBadgeClass(app.status)}">${app.status}</span></td>
      <td>${app.notes || "-"}</td>
      <td class="text-center">
        <div class="btn-group" role="group">
          <button class="action-btn btn-info-custom btn-sm me-1" data-action="View">
            <i class="bi bi-eye"></i>
          </button>
          <button class="action-btn btn-warning-custom btn-sm me-1" data-action="Edit">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="action-btn btn-danger-custom btn-sm" data-action="Delete">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    `;

    tr.querySelectorAll("button").forEach(btn => {
      if (btn.dataset.action === "View") {
        btn.addEventListener("click", () => openModal(app));
      } else if (btn.dataset.action === "Edit") {
        btn.addEventListener("click", () => editAppointment(app));
      } else if (btn.dataset.action === "Delete") {
        btn.addEventListener("click", () => deleteAppointment(app.id));
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

function getStatusBadgeClass(status) {
  switch (status) {
    case "Pending": return "status-pending";
    case "Confirmed": return "status-confirmed";
    case "Completed": return "status-completed";
    case "Cancelled": return "status-cancelled";
    default: return "status-pending";
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

// Real-time features functions
function startRealTimeListeners() {
  console.log("Starting real-time listeners...");

  // Appointments listener
  appointmentListener = db.collection("appointments")
    .onSnapshot(snapshot => {
      const previousCount = allAppointments.length;
      allAppointments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(app => app.status !== "Cancelled");

      allAppointments.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return bTime - aTime;
      });

      const newCount = allAppointments.length;
      if (newCount > previousCount) {
        const newItems = newCount - previousCount;
        newItemsCount += newItems;
        showNotification(`New appointment${newItems > 1 ? 's' : ''} received!`);
        addNotification('appointment', `New appointment${newItems > 1 ? 's' : ''} received!`);
        updateNotificationBadge();
      }

      updateStats();
      applyFilters();
    }, err => {
      console.error("Error loading appointments:", err);
      tableBody.innerHTML = `<tr><td colspan="9" class="text-center text-danger">Failed to load appointments. Check console for details.</td></tr>`;
    });

  // Feedback listener
  feedbackListener = db.collection("feedback")
    .orderBy("timestamp", "desc")
    .onSnapshot(snapshot => {
      const previousCount = allFeedback.length;
      allFeedback = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const newCount = allFeedback.length;
      if (newCount > previousCount) {
        const newItems = newCount - previousCount;
        newItemsCount += newItems;
        showNotification(`New feedback${newItems > 1 ? 's' : ''} received!`);
        addNotification('feedback', `New feedback${newItems > 1 ? 's' : ''} received!`);
        updateNotificationBadge();
      }

      renderFeedback(allFeedback);
    }, err => {
      console.error("Error loading feedback:", err);
      feedbackTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Failed to load feedback. Check console for details.</td></tr>`;
    });

  // Help requests listener
  helpRequestsListener = db.collection("helpRequests")
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {
      const previousCount = allHelpRequests.length;
      allHelpRequests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const newCount = allHelpRequests.length;
      if (newCount > previousCount) {
        const newItems = newCount - previousCount;
        newItemsCount += newItems;
        showNotification(`New help request${newItems > 1 ? 's' : ''} received!`);
        addNotification('helpRequest', `New help request${newItems > 1 ? 's' : ''} received!`);
        updateNotificationBadge();
      }

      renderHelpRequests(allHelpRequests);
    }, err => {
      console.error("Error loading help requests:", err);
      helpRequestsTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Failed to load help requests. Check console for details.</td></tr>`;
    });
}

function stopRealTimeListeners() {
  console.log("Stopping real-time listeners...");

  if (appointmentListener) {
    appointmentListener();
    appointmentListener = null;
  }
  if (feedbackListener) {
    feedbackListener();
    feedbackListener = null;
  }
  if (helpRequestsListener) {
    helpRequestsListener();
    helpRequestsListener = null;
  }

  // Stop notification time update interval
  stopNotificationTimeUpdate();
}

async function fetchDataPeriodically() {
  try {
    // Fetch appointments
    const appointmentsSnapshot = await db.collection("appointments").get();
    allAppointments = appointmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).filter(app => app.status !== "Cancelled");

    allAppointments.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return bTime - aTime;
    });

    // Fetch feedback
    const feedbackSnapshot = await db.collection("feedback").orderBy("timestamp", "desc").get();
    allFeedback = feedbackSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Fetch help requests
    const helpRequestsSnapshot = await db.collection("helpRequests").orderBy("createdAt", "desc").get();
    allHelpRequests = helpRequestsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    updateStats();
    applyFilters();
    renderFeedback(allFeedback);
    renderHelpRequests(allHelpRequests);

    console.log("Data refreshed at", new Date().toLocaleTimeString());
  } catch (error) {
    console.error("Error fetching data periodically:", error);
  }
}

function showNotification(message) {
  const toastElement = document.getElementById('notificationToast');
  const toastMessage = document.getElementById('toastMessage');
  const toastTime = toastElement.querySelector('small');

  if (toastElement && toastMessage && toastTime) {
    toastMessage.textContent = message;
    toastTime.textContent = 'just now';

    const toast = new bootstrap.Toast(toastElement);
    toast.show();
  }
}

function updateNotificationBadge() {
  const badge = document.getElementById('notificationBadge');
  if (badge) {
    if (newItemsCount > 0) {
      badge.textContent = newItemsCount > 99 ? '99+' : newItemsCount;
      badge.classList.remove('d-none');
    } else {
      badge.classList.add('d-none');
    }
  }
}

// Notification dropdown functions
function addNotification(type, message, data = {}) {
  const notification = {
    id: Date.now(),
    type: type, // 'appointment', 'feedback', 'helpRequest'
    message: message,
    data: data,
    timestamp: new Date(),
    read: false
  };

  notifications.unshift(notification);

  // Keep only the most recent notifications
  if (notifications.length > maxNotifications) {
    notifications = notifications.slice(0, maxNotifications);
  }

  updateNotificationDropdown();
}

function updateNotificationDropdown() {
  const notificationList = document.getElementById('notificationList');

  if (!notificationList) return;

  notificationList.innerHTML = '';

  if (notifications.length === 0) {
    notificationList.innerHTML = `
      <li>
        <div class="dropdown-item text-center text-muted py-4">
          <i class="bi bi-bell-slash d-block mb-2" style="font-size: 2rem;"></i>
          <small>No new notifications</small>
        </div>
      </li>
    `;
    return;
  }

  notifications.forEach(notification => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.className = 'dropdown-item d-flex align-items-center';
    link.href = '#';

    const icon = document.createElement('i');
    icon.className = `me-2 ${getNotificationIcon(notification.type)}`;

    const content = document.createElement('div');
    content.className = 'flex-grow-1';

    const message = document.createElement('div');
    message.className = 'notification-message';
    message.textContent = notification.message;

    const time = document.createElement('small');
    time.className = 'text-muted';
    time.textContent = getTimeAgo(notification.timestamp);

    content.appendChild(message);
    content.appendChild(time);

    link.appendChild(icon);
    link.appendChild(content);

    if (!notification.read) {
      link.classList.add('unread');
    }

    link.addEventListener('click', (e) => {
      e.preventDefault();
      markAsRead(notification.id);
      handleNotificationClick(notification);
    });

    item.appendChild(link);
    notificationList.appendChild(item);
  });
}

function getNotificationIcon(type) {
  switch (type) {
    case 'appointment': return 'bi bi-calendar-check text-primary';
    case 'feedback': return 'bi bi-chat-dots text-info';
    case 'helpRequest': return 'bi bi-question-circle text-warning';
    default: return 'bi bi-bell text-secondary';
  }
}

function getTimeAgo(timestamp) {
  const now = new Date();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function markAsRead(notificationId) {
  const notification = notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.read = true;
    updateNotificationDropdown();
  }
}

function handleNotificationClick(notification) {
  // Navigate to the appropriate section based on notification type
  switch (notification.type) {
    case 'appointment':
      // Switch to appointments tab
      const appointmentsTab = document.querySelector('[data-bs-target="#appointments"]');
      if (appointmentsTab) {
        appointmentsTab.click();
      }
      break;
    case 'feedback':
      // Switch to feedback tab
      const feedbackTab = document.querySelector('[data-bs-target="#feedback"]');
      if (feedbackTab) {
        feedbackTab.click();
      }
      break;
    case 'helpRequest':
      // Switch to help requests tab
      const helpTab = document.querySelector('[data-bs-target="#help-requests"]');
      if (helpTab) {
        helpTab.click();
      }
      break;
  }
}

function clearAllNotifications() {
  notifications = [];
  updateNotificationDropdown();
}

function startNotificationTimeUpdate() {
  // Update notification times every minute
  notificationTimeUpdateInterval = setInterval(() => {
    if (notifications.length > 0) {
      updateNotificationDropdown();
    }
  }, 60000); // Update every 60 seconds
}

function stopNotificationTimeUpdate() {
  if (notificationTimeUpdateInterval) {
    clearInterval(notificationTimeUpdateInterval);
    notificationTimeUpdateInterval = null;
  }
}

// Event listener for real-time toggle
document.getElementById('autoRefreshToggle').addEventListener('change', (e) => {
  realTimeMode = e.target.checked;

  if (realTimeMode) {
    stopRealTimeListeners();
    startRealTimeListeners();
    startNotificationTimeUpdate();
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
    console.log("Switched to real-time mode");
  } else {
    stopRealTimeListeners();
    refreshInterval = setInterval(fetchDataPeriodically, 30000); // Refresh every 30 seconds
    console.log("Switched to periodic refresh mode");
  }
});

// Notification button click handler
document.getElementById('notificationBtn').addEventListener('click', () => {
  newItemsCount = 0;
  updateNotificationBadge();
});

// Clear all notifications button handler
document.getElementById('clearAllNotificationsBtn')?.addEventListener('click', () => {
  clearAllNotifications();
  newItemsCount = 0;
  updateNotificationBadge();
});

// View all notifications button handler
document.getElementById('viewAllNotificationsBtn')?.addEventListener('click', () => {
  // Switch to appointments tab and scroll to top to show all activity
  const appointmentsTab = document.querySelector('[data-bs-target="#appointments"]');
  if (appointmentsTab) {
    appointmentsTab.click();
    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Close the dropdown
  const dropdown = document.querySelector('.dropdown-menu');
  if (dropdown) {
    dropdown.classList.remove('show');
  }
});

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

  // Initialize real-time toggle switch
  const toggleSwitch = document.getElementById('autoRefreshToggle');
  if (toggleSwitch) {
    toggleSwitch.checked = realTimeMode;
  }

  // Start real-time listeners by default
  startRealTimeListeners();

  // Start notification time update interval
  startNotificationTimeUpdate();
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

function editAppointment(app) {
  // Placeholder: Implement the logic to open an edit form/modal pre-filled with appointment data
  alert(`Edit appointment for ${app.userEmail} (ID: ${app.id}) - Feature to be implemented.`);
}

async function deleteAppointment(id) {
  if (!confirm("Are you sure you want to delete this appointment? This action cannot be undone.")) {
    return;
  }
  try {
    await db.collection("appointments").doc(id).delete();
    console.log(`✅ Appointment ${id} deleted successfully.`);
  } catch (err) {
    console.error("Error deleting appointment:", err);
    alert("Failed to delete appointment.");
  }
}

// Utility function to convert array of objects to CSV string
function arrayToCSV(data) {
  if (!data.length) return '';

  const keys = Object.keys(data[0]);
  const csvRows = [];

  // Header row
  csvRows.push(keys.join(','));

  // Data rows
  for (const row of data) {
    const values = keys.map(k => {
      let val = row[k] === null || row[k] === undefined ? '' : row[k];
      val = val.toString().replace(/"/g, '""'); // Escape double quotes
      if (val.search(/("|,|\n)/g) >= 0) {
        val = `"${val}"`;
      }
      return val;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

// Export appointments to CSV
document.getElementById('exportAppointmentsBtn').addEventListener('click', async () => {
  try {
    const snapshot = await firebase.firestore().collection('appointments').get();
    const appointments = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        User: data.userEmail || '',
        Purpose: data.purpose || '',
        DateTime: data.dateTime || '',
        Status: data.status || '',
        CreatedAt: data.createdAt ? data.createdAt.toDate().toLocaleString() : '',
        Notes: data.notes || ''
      };
    });
    const csv = arrayToCSV(appointments);
    downloadCSV(csv, 'appointments.csv');
  } catch (error) {
    console.error('Error exporting appointments:', error);
    alert('Failed to export appointments.');
  }
});

// Export feedback to CSV
document.getElementById('exportFeedbackBtn').addEventListener('click', async () => {
  try {
    const snapshot = await firebase.firestore().collection('feedback').get();
    const feedbacks = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        Name: data.name || '',
        Email: data.email || '',
        Subject: data.subject || '',
        Message: data.message || '',
        SubmittedAt: data.submittedAt ? data.submittedAt.toDate().toLocaleString() : ''
      };
    });
    const csv = arrayToCSV(feedbacks);
    downloadCSV(csv, 'feedback.csv');
  } catch (error) {
    console.error('Error exporting feedback:', error);
    alert('Failed to export feedback.');
  }
});

// Export help requests to CSV
document.getElementById('exportHelpRequestsBtn').addEventListener('click', async () => {
  try {
    const snapshot = await firebase.firestore().collection('helpRequests').get();
    const helpRequests = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        Name: data.fullName || '',
        Email: data.email || '',
        Category: data.category || '',
        Priority: data.priority || '',
        Status: data.status || '',
        SubmittedAt: data.createdAt ? data.createdAt.toDate().toLocaleString() : ''
      };
    });
    const csv = arrayToCSV(helpRequests);
    downloadCSV(csv, 'help_requests.csv');
  } catch (error) {
    console.error('Error exporting help requests:', error);
    alert('Failed to export help requests.');
  }
});

// Helper function to trigger CSV download
function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (navigator.msSaveBlob) { // IE 10+
    navigator.msSaveBlob(blob, filename);
  } else {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Bulk Actions Functions
function getSelectedAppointmentIds() {
  const checkboxes = document.querySelectorAll('.appointment-checkbox:checked');
  return Array.from(checkboxes).map(cb => cb.dataset.id);
}

function updateBulkButtonStates() {
  const selectedIds = getSelectedAppointmentIds();
  const hasSelection = selectedIds.length > 0;

  bulkConfirmBtn.disabled = !hasSelection;
  bulkCancelBtn.disabled = !hasSelection;
  bulkExportBtn.disabled = !hasSelection;
}

async function bulkConfirmAppointments() {
  const selectedIds = getSelectedAppointmentIds();
  if (!selectedIds.length) return;

  if (!confirm(`Are you sure you want to confirm ${selectedIds.length} appointment(s)?`)) {
    return;
  }

  try {
    const batch = db.batch();
    selectedIds.forEach(id => {
      const ref = db.collection("appointments").doc(id);
      batch.update(ref, {
        status: "Confirmed",
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });
    await batch.commit();
    console.log(`✅ Confirmed ${selectedIds.length} appointments`);
  } catch (err) {
    console.error("Error bulk confirming appointments:", err);
    alert("Failed to confirm selected appointments.");
  }
}

async function bulkCancelAppointments() {
  const selectedIds = getSelectedAppointmentIds();
  if (!selectedIds.length) return;

  const reason = prompt("Please provide a reason for cancellation:");
  if (!reason || !reason.trim()) {
    alert("Cancellation reason is required.");
    return;
  }

  if (!confirm(`Are you sure you want to cancel ${selectedIds.length} appointment(s)?`)) {
    return;
  }

  try {
    const batch = db.batch();
    selectedIds.forEach(id => {
      const ref = db.collection("appointments").doc(id);
      batch.update(ref, {
        status: "Cancelled",
        adminNotes: reason.trim(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });
    await batch.commit();
    console.log(`✅ Cancelled ${selectedIds.length} appointments`);
  } catch (err) {
    console.error("Error bulk cancelling appointments:", err);
    alert("Failed to cancel selected appointments.");
  }
}

async function bulkExportAppointments() {
  const selectedIds = getSelectedAppointmentIds();
  if (!selectedIds.length) return;

  try {
    const appointments = [];
    for (const id of selectedIds) {
      const doc = await db.collection("appointments").doc(id).get();
      if (doc.exists) {
        const data = doc.data();
        appointments.push({
          User: data.userEmail || '',
          Purpose: data.purpose || '',
          Date: data.date || '',
          Time: data.time || '',
          Status: data.status || '',
          Role: data.role || '',
          Notes: data.notes || '',
          CreatedAt: data.createdAt ? data.createdAt.toDate().toLocaleString() : ''
        });
      }
    }

    const csv = arrayToCSV(appointments);
    downloadCSV(csv, `selected_appointments_${new Date().toISOString().split('T')[0]}.csv`);
    console.log(`✅ Exported ${selectedIds.length} appointments`);
  } catch (err) {
    console.error("Error bulk exporting appointments:", err);
    alert("Failed to export selected appointments.");
  }
}

// Event Listeners for Bulk Actions
selectAllCheckbox.addEventListener('change', (e) => {
  const checkboxes = document.querySelectorAll('.appointment-checkbox');
  checkboxes.forEach(cb => {
    cb.checked = e.target.checked;
  });
  updateBulkButtonStates();
});

bulkConfirmBtn.addEventListener('click', bulkConfirmAppointments);
bulkCancelBtn.addEventListener('click', bulkCancelAppointments);
bulkExportBtn.addEventListener('click', bulkExportAppointments);

// Update bulk button states when checkboxes change
document.addEventListener('change', (e) => {
  if (e.target.classList.contains('appointment-checkbox')) {
    updateBulkButtonStates();

    // Update select all checkbox state
    const allCheckboxes = document.querySelectorAll('.appointment-checkbox');
    const checkedCheckboxes = document.querySelectorAll('.appointment-checkbox:checked');
    selectAllCheckbox.checked = allCheckboxes.length > 0 && allCheckboxes.length === checkedCheckboxes.length;
    selectAllCheckbox.indeterminate = checkedCheckboxes.length > 0 && checkedCheckboxes.length < allCheckboxes.length;
  }
});

// User Management Variables
const usersTableBody = document.getElementById("usersTable");
const userSearchInput = document.getElementById("userSearchInput");
const userRoleFilter = document.getElementById("userRoleFilter");
const userModal = new bootstrap.Modal(document.getElementById('userModal'));
const userFirstName = document.getElementById('userFirstName');
const userLastName = document.getElementById('userLastName');
const userEmail = document.getElementById('userEmail');
const userIdNumber = document.getElementById('userIdNumber');
const userRole = document.getElementById('userRole');
const userStatus = document.getElementById('userStatus');
const userJoinedDate = document.getElementById('userJoinedDate');
const userLastLogin = document.getElementById('userLastLogin');
const userActivityLogs = document.getElementById('userActivityLogs');
const saveUserBtn = document.getElementById('saveUserBtn');
const deleteUserBtn = document.getElementById('deleteUserBtn');

let allUsers = [];
let currentUserId = null;
let userListener = null;

// User Management Functions
async function loadUsers() {
  try {
    const snapshot = await db.collection("users").get();
    allUsers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    allUsers.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return bTime - aTime;
    });

    renderUsers(allUsers);
  } catch (error) {
    console.error("Error loading users:", error);
    usersTableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Failed to load users. Check console for details.</td></tr>`;
  }
}

function renderUsers(list) {
  usersTableBody.innerHTML = "";

  if (!list.length) {
    usersTableBody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">No users found.</td></tr>`;
    return;
  }

  list.forEach(user => {
    const tr = document.createElement("tr");
    const statusBadge = getUserStatusBadge(user.status);
    const roleBadge = getUserRoleBadge(user.role);

    tr.innerHTML = `
      <td>${user.firstName || ""} ${user.lastName || ""}</td>
      <td>${user.email || ""}</td>
      <td>${user.idNumber || ""}</td>
      <td><span class="badge ${roleBadge}">${user.role || "N/A"}</span></td>
      <td><span class="badge ${statusBadge}">${user.status || "N/A"}</span></td>
      <td>${user.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString() : "N/A"}</td>
      <td>${user.lastLogin ? new Date(user.lastLogin.toDate()).toLocaleString() : "N/A"}</td>
      <td class="text-center">
        <button class="btn btn-info btn-sm me-1" data-action="View" data-id="${user.id}">View</button>
        <button class="btn btn-warning btn-sm me-1" data-action="Edit" data-id="${user.id}">Edit</button>
        <button class="btn btn-danger btn-sm" data-action="Delete" data-id="${user.id}">Delete</button>
      </td>
    `;

    tr.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        const action = btn.dataset.action;
        const userId = btn.dataset.id;
        handleUserAction(userId, action);
      });
    });

    usersTableBody.appendChild(tr);
  });
}

function getUserStatusBadge(status) {
  switch (status) {
    case "active": return "bg-success";
    case "inactive": return "bg-secondary";
    case "suspended": return "bg-danger";
    default: return "bg-secondary";
  }
}

function getUserRoleBadge(role) {
  switch (role) {
    case "admin": return "bg-primary";
    case "teacher": return "bg-info";
    case "student": return "bg-warning";
    default: return "bg-secondary";
  }
}

function applyUserFilters() {
  const search = userSearchInput.value.toLowerCase();
  const selectedRole = userRoleFilter.value;

  const filtered = allUsers.filter(user => {
    const matchSearch =
      (user.firstName || "").toLowerCase().includes(search) ||
      (user.lastName || "").toLowerCase().includes(search) ||
      (user.email || "").toLowerCase().includes(search) ||
      (user.idNumber || "").toLowerCase().includes(search);

    const matchRole = !selectedRole || user.role === selectedRole;

    return matchSearch && matchRole;
  });

  renderUsers(filtered);
}

function openUserModal(user) {
  currentUserId = user.id;
  userFirstName.value = user.firstName || "";
  userLastName.value = user.lastName || "";
  userEmail.value = user.email || "";
  userIdNumber.value = user.idNumber || "";
  userRole.value = user.role || "student";
  userStatus.value = user.status || "active";
  userJoinedDate.value = user.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString() : "N/A";
  userLastLogin.value = user.lastLogin ? new Date(user.lastLogin.toDate()).toLocaleString() : "N/A";

  loadUserActivityLogs(user.id);
  userModal.show();
}

async function loadUserActivityLogs(userId) {
  try {
    userActivityLogs.innerHTML = '<p class="text-muted mb-0">Loading activity logs...</p>';

    const snapshot = await db.collection("userActivity")
      .where("userId", "==", userId)
      .orderBy("timestamp", "desc")
      .limit(10)
      .get();

    if (snapshot.empty) {
      userActivityLogs.innerHTML = '<p class="text-muted mb-0">No activity logs found.</p>';
      return;
    }

    const logs = snapshot.docs.map(doc => doc.data());
    const logsHtml = logs.map(log => `
      <div class="mb-2 p-2 border rounded">
        <small class="text-muted">${new Date(log.timestamp.toDate()).toLocaleString()}</small>
        <div class="fw-semibold">${log.action}</div>
        <div class="text-sm">${log.details || ""}</div>
      </div>
    `).join("");

    userActivityLogs.innerHTML = logsHtml;
  } catch (error) {
    console.error("Error loading user activity logs:", error);
    userActivityLogs.innerHTML = '<p class="text-danger mb-0">Failed to load activity logs.</p>';
  }
}

async function saveUserChanges() {
  const updatedData = {
    role: userRole.value,
    status: userStatus.value,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    await db.collection("users").doc(currentUserId).update(updatedData);

    // Log the activity
    await db.collection("userActivity").add({
      userId: currentUserId,
      action: "Profile Updated",
      details: `Role changed to ${userRole.value}, Status changed to ${userStatus.value}`,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    userModal.hide();
    console.log(`✅ User ${currentUserId} updated successfully`);
  } catch (error) {
    console.error("Error updating user:", error);
    alert("Failed to update user.");
  }
}

async function deleteUser(userId) {
  if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
    return;
  }

  try {
    await db.collection("users").doc(userId).delete();

    // Log the activity
    await db.collection("userActivity").add({
      userId: userId,
      action: "Account Deleted",
      details: "User account permanently deleted by admin",
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ User ${userId} deleted successfully`);
  } catch (error) {
    console.error("Error deleting user:", error);
    alert("Failed to delete user.");
  }
}

function handleUserAction(userId, action) {
  const user = allUsers.find(u => u.id === userId);
  if (!user) return;

  switch (action) {
    case "View":
    case "Edit":
      openUserModal(user);
      break;
    case "Delete":
      deleteUser(userId);
      break;
  }
}

// Event Listeners for User Management
userSearchInput.addEventListener("input", applyUserFilters);
userRoleFilter.addEventListener("change", applyUserFilters);
saveUserBtn.addEventListener("click", saveUserChanges);
deleteUserBtn.addEventListener("click", () => deleteUser(currentUserId));

// Integrate User Management with Real-time Listeners
function startUserListener() {
  userListener = db.collection("users")
    .onSnapshot(snapshot => {
      const previousCount = allUsers.length;
      allUsers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      allUsers.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return bTime - aTime;
      });

      const newCount = allUsers.length;
      if (newCount > previousCount) {
        const newItems = newCount - previousCount;
        showNotification(`New user${newItems > 1 ? 's' : ''} registered!`);
        addNotification('user', `New user${newItems > 1 ? 's' : ''} registered!`);
        updateNotificationBadge();
      }

      applyUserFilters();
    }, err => {
      console.error("Error loading users:", err);
      usersTableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Failed to load users. Check console for details.</td></tr>`;
    });
}

// Update startRealTimeListeners to include user listener
function startRealTimeListeners() {
  console.log("Starting real-time listeners...");

  // Existing listeners
  appointmentListener = db.collection("appointments")
    .onSnapshot(snapshot => {
      const previousCount = allAppointments.length;
      allAppointments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(app => app.status !== "Cancelled");

      allAppointments.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return bTime - aTime;
      });

      const newCount = allAppointments.length;
      if (newCount > previousCount) {
        const newItems = newCount - previousCount;
        newItemsCount += newItems;
        showNotification(`New appointment${newItems > 1 ? 's' : ''} received!`);
        addNotification('appointment', `New appointment${newItems > 1 ? 's' : ''} received!`);
        updateNotificationBadge();
      }

      updateStats();
      applyFilters();
    }, err => {
      console.error("Error loading appointments:", err);
      tableBody.innerHTML = `<tr><td colspan="9" class="text-center text-danger">Failed to load appointments. Check console for details.</td></tr>`;
    });

  feedbackListener = db.collection("feedback")
    .orderBy("timestamp", "desc")
    .onSnapshot(snapshot => {
      const previousCount = allFeedback.length;
      allFeedback = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const newCount = allFeedback.length;
      if (newCount > previousCount) {
        const newItems = newCount - previousCount;
        newItemsCount += newItems;
        showNotification(`New feedback${newItems > 1 ? 's' : ''} received!`);
        addNotification('feedback', `New feedback${newItems > 1 ? 's' : ''} received!`);
        updateNotificationBadge();
      }

      renderFeedback(allFeedback);
    }, err => {
      console.error("Error loading feedback:", err);
      feedbackTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Failed to load feedback. Check console for details.</td></tr>`;
    });

  helpRequestsListener = db.collection("helpRequests")
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {
      const previousCount = allHelpRequests.length;
      allHelpRequests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const newCount = allHelpRequests.length;
      if (newCount > previousCount) {
        const newItems = newCount - previousCount;
        newItemsCount += newItems;
        showNotification(`New help request${newItems > 1 ? 's' : ''} received!`);
        addNotification('helpRequest', `New help request${newItems > 1 ? 's' : ''} received!`);
        updateNotificationBadge();
      }

      renderHelpRequests(allHelpRequests);
    }, err => {
      console.error("Error loading help requests:", err);
      helpRequestsTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Failed to load help requests. Check console for details.</td></tr>`;
    });

  // Add user listener
  startUserListener();
}

// Update stopRealTimeListeners to include user listener
function stopRealTimeListeners() {
  console.log("Stopping real-time listeners...");

  if (appointmentListener) {
    appointmentListener();
    appointmentListener = null;
  }
  if (feedbackListener) {
    feedbackListener();
    feedbackListener = null;
  }
  if (helpRequestsListener) {
    helpRequestsListener();
    helpRequestsListener = null;
  }
  if (userListener) {
    userListener();
    userListener = null;
  }

  // Stop notification time update interval
  stopNotificationTimeUpdate();
}

// Update fetchDataPeriodically to include users
async function fetchDataPeriodically() {
  try {
    // Fetch appointments
    const appointmentsSnapshot = await db.collection("appointments").get();
    allAppointments = appointmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).filter(app => app.status !== "Cancelled");

    allAppointments.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return bTime - aTime;
    });

    // Fetch feedback
    const feedbackSnapshot = await db.collection("feedback").orderBy("timestamp", "desc").get();
    allFeedback = feedbackSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Fetch help requests
    const helpRequestsSnapshot = await db.collection("helpRequests").orderBy("createdAt", "desc").get();
    allHelpRequests = helpRequestsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Fetch users
    const usersSnapshot = await db.collection("users").get();
    allUsers = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    allUsers.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return bTime - aTime;
    });

    updateStats();
    applyFilters();
    renderFeedback(allFeedback);
    renderHelpRequests(allHelpRequests);
    applyUserFilters();

    console.log("Data refreshed at", new Date().toLocaleTimeString());
  } catch (error) {
    console.error("Error fetching data periodically:", error);
  }
}

// Chart.js analytics setup
document.addEventListener('DOMContentLoaded', () => {
  const db = firebase.firestore();

  // Fetch appointments data for charts
  db.collection('appointments').get().then(snapshot => {
    const appointments = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        date: data.dateTime ? new Date(data.dateTime) : null,
        status: data.status || 'Unknown'
      };
    }).filter(a => a.date !== null);

    // Prepare data for appointment trends (by month)
    const trendsData = {};
    appointments.forEach(a => {
      const month = a.date.getFullYear() + '-' + (a.date.getMonth() + 1);
      trendsData[month] = (trendsData[month] || 0) + 1;
    });

    const trendLabels = Object.keys(trendsData).sort();
    const trendCounts = trendLabels.map(label => trendsData[label]);

    // Prepare data for status distribution
    const statusCounts = {};
    appointments.forEach(a => {
      statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
    });
    const statusLabels = Object.keys(statusCounts);
    const statusData = statusLabels.map(label => statusCounts[label]);

    // Render charts
    const ctxTrends = document.getElementById('appointmentTrendsChart').getContext('2d');
    new Chart(ctxTrends, {
      type: 'line',
      data: {
        labels: trendLabels,
        datasets: [{
          label: 'Appointments per Month',
          data: trendCounts,
          borderColor: 'rgba(40, 167, 69, 1)',
          backgroundColor: 'rgba(40, 167, 69, 0.2)',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: 'Month' } },
          y: { title: { display: true, text: 'Number of Appointments' }, beginAtZero: true }
        }
      }
    });

    const ctxStatus = document.getElementById('statusDistributionChart').getContext('2d');
    new Chart(ctxStatus, {
      type: 'doughnut',
      data: {
        labels: statusLabels,
        datasets: [{
          label: 'Appointment Status Distribution',
          data: statusData,
          backgroundColor: [
            '#ffc107', // Pending - yellow
            '#28a745', // Confirmed - green
            '#0d6efd', // Completed - blue
            '#dc3545'  // Cancelled - red
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }).catch(error => {
    console.error('Error loading appointment data for charts:', error);
  });
});

// Dark mode toggle functionality
document.addEventListener('DOMContentLoaded', () => {
    const darkModeToggle = document.getElementById('darkModeToggle');

    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (darkModeToggle) darkModeToggle.checked = true;
    } else {
        document.documentElement.removeAttribute('data-theme');
        if (darkModeToggle) darkModeToggle.checked = false;
    }

    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', () => {
            if (darkModeToggle.checked) {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
            }
        });
    }
});
