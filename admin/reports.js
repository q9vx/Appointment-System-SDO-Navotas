const tableBody = document.getElementById("reportsTable");
const logoutBtn = document.getElementById("logoutBtn");
const overlay = document.getElementById("guestOverlay");

const exportCSVBtn = document.getElementById("exportCSVBtn");
const exportPDFBtn = document.getElementById("exportPDFBtn");

let allAppointments = [];
let allFeedback = [];
let allHelpRequests = [];
let allCancelled = [];

let monthlyTrendsChart, statusPieChart, purposeBarChart;

function updateStats() {
  const total = allAppointments.length;
  const completed = allAppointments.filter(a => a.status === "Completed").length;
  const cancelled = allAppointments.filter(a => a.status === "Cancelled").length;
  const pending = allAppointments.filter(a => a.status === "Pending").length;
  const confirmed = allAppointments.filter(a => a.status === "Confirmed").length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Avg response time for confirmed/completed (hours)
  let totalResponseTime = 0;
  let responseCount = 0;
  allAppointments.forEach(a => {
    if (a.status === "Confirmed" || a.status === "Completed") {
      const createdAt = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const updatedAt = a.updatedAt?.toDate?.() || new Date(a.updatedAt || createdAt);
      const responseTime = (updatedAt - createdAt) / (1000 * 60 * 60); // hours
      totalResponseTime += responseTime;
      responseCount++;
    }
  });
  const avgResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount * 10) / 10 : 0;

  // Cancelled this month
  const now = new Date();
  const thisMonthCancelled = allAppointments.filter(a => {
    const cancelledAt = a.cancelledAt?.toDate?.() || new Date(a.cancelledAt || 0);
    return a.status === "Cancelled" && cancelledAt.getMonth() === now.getMonth() && cancelledAt.getFullYear() === now.getFullYear();
  }).length;

  document.getElementById("totalAppointments").textContent = total;
  document.getElementById("completedAppointments").textContent = completed;
  document.getElementById("cancelledAppointments").textContent = cancelled;
  document.getElementById("completionRate").textContent = completionRate + "%";
  document.getElementById("avgResponseTime").textContent = avgResponseTime + "h";
  document.getElementById("totalFeedback").textContent = allFeedback.length;
  document.getElementById("totalHelpRequests").textContent = allHelpRequests.length;
  document.getElementById("cancelledThisMonth").textContent = thisMonthCancelled;
}

logoutBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  await auth.signOut();
  window.location.href = "../index.html";
});

// Export CSV
exportCSVBtn.addEventListener("click", () => {
  let csv = "Status,Count,Percentage\n";
  const total = allAppointments.length;
  const statuses = ["Pending", "Confirmed", "Completed", "Cancelled"];
  statuses.forEach(status => {
    const count = allAppointments.filter(a => a.status === status).length;
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    csv += `${status},${count},${percentage}%\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "appointments-summary.csv";
  a.click();
  window.URL.revokeObjectURL(url);
});

// Export PDF (basic, using jsPDF if available, but since no lib, simple alert or skip - here we'll use a simple text export as PDF-like)
exportPDFBtn.addEventListener("click", () => {
  let pdfContent = "Appointments Summary Report\n\n";
  const total = allAppointments.length;
  const statuses = ["Pending", "Confirmed", "Completed", "Cancelled"];
  statuses.forEach(status => {
    const count = allAppointments.filter(a => a.status === status).length;
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    pdfContent += `${status}: ${count} (${percentage}%)\n`;
  });
  pdfContent += `\nTotal Feedback: ${allFeedback.length}\nTotal Help Requests: ${allHelpRequests.length}\nAvg Response Time: ${document.getElementById("avgResponseTime").textContent}\nCompletion Rate: ${document.getElementById("completionRate").textContent}`;
  
  const blob = new Blob([pdfContent], { type: "text/plain" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "appointments-summary.txt"; // Simple text file as PDF alternative
  a.click();
  window.URL.revokeObjectURL(url);
});

function renderReports(list) {
  const cancelledTableBody = document.getElementById("reportsTable");
  cancelledTableBody.innerHTML = "";

  if (!list.length) {
    cancelledTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No cancelled appointments found.</td></tr>`;
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

    cancelledTableBody.appendChild(tr);
  });
}

function renderSummaryTable() {
  const summaryBody = document.getElementById("appointmentsSummaryTable");
  summaryBody.innerHTML = "";
  const total = allAppointments.length;
  const statuses = ["Pending", "Confirmed", "Completed", "Cancelled"];
  statuses.forEach(status => {
    const count = allAppointments.filter(a => a.status === status).length;
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${status}</td>
      <td>${count}</td>
      <td>${percentage}%</td>
    `;
    summaryBody.appendChild(tr);
  });
}

function renderFeedbackTable() {
  const feedbackBody = document.getElementById("feedbackTable");
  feedbackBody.innerHTML = "";
  if (!allFeedback.length) {
    feedbackBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No feedback found.</td></tr>`;
    return;
  }
  allFeedback.forEach(fb => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${fb.name || "N/A"}</td>
      <td>${fb.email}</td>
      <td>${fb.subject}</td>
      <td>${fb.timestamp ? new Date(fb.timestamp).toLocaleString() : "N/A"}</td>
    `;
    feedbackBody.appendChild(tr);
  });
}

function renderHelpTable() {
  const helpBody = document.getElementById("helpTable");
  helpBody.innerHTML = "";
  if (!allHelpRequests.length) {
    helpBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No help requests found.</td></tr>`;
    return;
  }
  allHelpRequests.forEach(hr => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${hr.name || "N/A"}</td>
      <td>${hr.category || "N/A"}</td>
      <td>${hr.priority || "N/A"}</td>
      <td>${hr.status || "Pending"}</td>
      <td>${hr.timestamp ? new Date(hr.timestamp).toLocaleString() : "N/A"}</td>
    `;
    helpBody.appendChild(tr);
  });
}

function renderCharts() {
  const completed = allAppointments.filter(a => a.status === "Completed").length;
  const cancelled = allAppointments.filter(a => a.status === "Cancelled").length;
  const pending = allAppointments.filter(a => a.status === "Pending").length;
  const confirmed = allAppointments.filter(a => a.status === "Confirmed").length;

  // Monthly Trends Chart (last 12 months)
  const months = [];
  const completedData = [];
  const cancelledData = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    months.push(monthStr);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const completedMonth = allAppointments.filter(a => {
      const created = a.createdAt?.toDate?.() || new Date(a.createdAt);
      return a.status === "Completed" && created >= monthStart && created <= monthEnd;
    }).length;
    const cancelledMonth = allAppointments.filter(a => {
      const cancelledAt = a.cancelledAt?.toDate?.() || new Date(a.cancelledAt || 0);
      return a.status === "Cancelled" && cancelledAt >= monthStart && cancelledAt <= monthEnd;
    }).length;
    completedData.push(completedMonth);
    cancelledData.push(cancelledMonth);
  }

  const monthlyCtx = document.getElementById("monthlyTrendsChart").getContext("2d");
  if (monthlyTrendsChart) monthlyTrendsChart.destroy();
  monthlyTrendsChart = new Chart(monthlyCtx, {
    type: "line",
    data: {
      labels: months,
      datasets: [
        {
          label: "Completed",
          data: completedData,
          borderColor: "#28a745",
          backgroundColor: "rgba(40, 167, 69, 0.1)",
          tension: 0.4
        },
        {
          label: "Cancelled",
          data: cancelledData,
          borderColor: "#dc3545",
          backgroundColor: "rgba(220, 53, 69, 0.1)",
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } }
    }
  });

  // Status Pie Chart
  const statusCtx = document.getElementById("statusPieChart").getContext("2d");
  const statusCounts = {
    Pending: pending,
    Confirmed: confirmed,
    Completed: completed,
    Cancelled: cancelled
  };
  if (statusPieChart) statusPieChart.destroy();
  statusPieChart = new Chart(statusCtx, {
    type: "pie",
    data: {
      labels: Object.keys(statusCounts),
      datasets: [{
        data: Object.values(statusCounts),
        backgroundColor: ["#ffc107", "#007bff", "#28a745", "#dc3545"]
      }]
    },
    options: { responsive: true }
  });

  // Purpose Bar Chart
  const purposeCtx = document.getElementById("purposeBarChart").getContext("2d");
  const purposes = [...new Set(allAppointments.map(a => a.purpose))];
  const purposeCounts = purposes.map(p => allAppointments.filter(a => a.purpose === p).length);
  if (purposeBarChart) purposeBarChart.destroy();
  purposeBarChart = new Chart(purposeCtx, {
    type: "bar",
    data: {
      labels: purposes,
      datasets: [{
        label: "Appointments",
        data: purposeCounts,
        backgroundColor: "#17a2b8"
      }]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
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

  // Load all appointments
  db.collection("appointments")
    .onSnapshot(snapshot => {
      allAppointments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      allAppointments.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      allCancelled = allAppointments.filter(a => a.status === "Cancelled");
      updateStats();
      renderCharts();
      renderSummaryTable();
      renderReports(allCancelled);
    }, err => console.error("Error loading appointments:", err));

  // Load feedback
  db.collection("feedback")
    .orderBy("timestamp", "desc")
    .onSnapshot(snapshot => {
      allFeedback = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderFeedbackTable();
      updateStats();
    }, err => console.error("Error loading feedback:", err));

  // Load help requests
  db.collection("help-requests")
    .orderBy("timestamp", "desc")
    .onSnapshot(snapshot => {
      allHelpRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderHelpTable();
      updateStats();
    }, err => console.error("Error loading help requests:", err));
});
