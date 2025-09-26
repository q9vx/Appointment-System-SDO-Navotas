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

// Filter variables
let currentFilters = {
  dateFrom: null,
  dateTo: null,
  status: '',
  purpose: ''
};



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

// Export PDF using jsPDF
exportPDFBtn.addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Set up fonts and colors
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(30, 58, 138); // Navy blue

  // Header
  doc.text("SDO Navotas - Appointments Report", 20, 30);
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, 40);

  // Summary Statistics
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(30, 58, 138);
  doc.text("Summary Statistics", 20, 60);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);

  const stats = [
    `Total Appointments: ${document.getElementById("totalAppointments").textContent}`,
    `Completed: ${document.getElementById("completedAppointments").textContent}`,
    `Cancelled: ${document.getElementById("cancelledAppointments").textContent}`,
    `Completion Rate: ${document.getElementById("completionRate").textContent}`,
    `Average Response Time: ${document.getElementById("avgResponseTime").textContent}`,
    `Total Feedback: ${document.getElementById("totalFeedback").textContent}`,
    `Help Requests: ${document.getElementById("totalHelpRequests").textContent}`,
    `Cancelled This Month: ${document.getElementById("cancelledThisMonth").textContent}`
  ];

  let yPos = 75;
  stats.forEach(stat => {
    doc.text(stat, 20, yPos);
    yPos += 8;
  });

  // Status Distribution Table
  yPos += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Status Distribution", 20, yPos);
  yPos += 10;

  // Table headers
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setFillColor(248, 250, 252);
  doc.rect(20, yPos - 5, 170, 8, 'F');
  doc.setTextColor(0, 0, 0);
  doc.text("Status", 25, yPos);
  doc.text("Count", 100, yPos);
  doc.text("Percentage", 140, yPos);
  yPos += 8;

  // Table data
  doc.setFont("helvetica", "normal");
  const filteredAppointments = getFilteredAppointments();
  const total = filteredAppointments.length;
  const statuses = ["Pending", "Confirmed", "Completed", "Cancelled"];

  statuses.forEach(status => {
    const count = filteredAppointments.filter(a => a.status === status).length;
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

    doc.text(status, 25, yPos);
    doc.text(count.toString(), 100, yPos);
    doc.text(`${percentage}%`, 140, yPos);
    yPos += 8;
  });

  // Purpose Distribution (if space allows)
  if (yPos < 250) {
    yPos += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Appointments by Purpose", 20, yPos);
    yPos += 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setFillColor(248, 250, 252);
    doc.rect(20, yPos - 5, 170, 8, 'F');
    doc.setTextColor(0, 0, 0);
    doc.text("Purpose", 25, yPos);
    doc.text("Count", 140, yPos);
    yPos += 8;

    doc.setFont("helvetica", "normal");
    const purposes = [...new Set(filteredAppointments.map(a => a.purpose))].filter(p => p);
    purposes.slice(0, 8).forEach(purpose => { // Limit to 8 purposes to fit page
      const count = filteredAppointments.filter(a => a.purpose === purpose).length;
      doc.text(purpose.length > 25 ? purpose.substring(0, 22) + "..." : purpose, 25, yPos);
      doc.text(count.toString(), 140, yPos);
      yPos += 8;
    });
  }

  // Footer
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Schools Division Office of Navotas City - Confidential Report", 20, 280);
  doc.text("Republic of the Philippines • Department of Education • Division of Navotas", 20, 285);

  // Save the PDF
  const fileName = `SDO-Navotas-Report-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
});

function renderReports(list) {
  const cancelledTableBody = document.getElementById("reportsTable");
  cancelledTableBody.innerHTML = "";

  if (!list.length) {
    cancelledTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No cancelled appointments found.</td></tr>`;
    return;
  }

  // Sort by cancelled date (most recent first)
  list.sort((a, b) => {
    const aDate = a.cancelledAt?.toDate?.() || a.updatedAt?.toDate?.() || new Date(a.createdAt || 0);
    const bDate = b.cancelledAt?.toDate?.() || b.updatedAt?.toDate?.() || new Date(b.createdAt || 0);
    return bDate - aDate;
  });

  list.forEach(app => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${app.userEmail}</td>
      <td>${app.purpose}</td>
      <td>${app.date} ${app.time}</td>
      <td>${app.cancellationReason || app.adminNotes || "No reason provided"}${app.adminNotes && app.cancellationReason !== app.adminNotes ? `<br><small class="text-muted">${app.adminNotes}</small>` : ""}</td>
      <td>${new Date(app.cancelledAt?.toDate?.() || app.updatedAt?.toDate?.() || app.createdAt).toLocaleString()}</td>
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
      <td>${hr.fullName || "N/A"}</td>
      <td>${hr.category || "N/A"}</td>
      <td>${hr.priority || "N/A"}</td>
      <td>${hr.status || "Pending"}</td>
      <td>${hr.createdAt ? new Date(hr.createdAt.toDate()).toLocaleString() : "N/A"}</td>
    `;
    helpBody.appendChild(tr);
  });
}

function populatePurposeFilter() {
  const purposeFilter = document.getElementById("purposeFilter");
  const purposes = [...new Set(allAppointments.map(a => a.purpose))].sort();
  purposeFilter.innerHTML = '<option value="">All Purposes</option>';
  purposes.forEach(purpose => {
    const option = document.createElement("option");
    option.value = purpose;
    option.textContent = purpose;
    purposeFilter.appendChild(option);
  });
}

function getFilteredAppointments() {
  return allAppointments.filter(appointment => {
    // Date filter
    if (currentFilters.dateFrom || currentFilters.dateTo) {
      const appointmentDate = new Date(appointment.createdAt?.toDate?.() || appointment.createdAt);
      if (currentFilters.dateFrom && appointmentDate < new Date(currentFilters.dateFrom)) return false;
      if (currentFilters.dateTo && appointmentDate > new Date(currentFilters.dateTo + 'T23:59:59')) return false;
    }

    // Status filter
    if (currentFilters.status && appointment.status !== currentFilters.status) return false;

    // Purpose filter
    if (currentFilters.purpose && appointment.purpose !== currentFilters.purpose) return false;

    return true;
  });
}

function applyFilters() {
  currentFilters.dateFrom = document.getElementById("dateFrom").value;
  currentFilters.dateTo = document.getElementById("dateTo").value;
  currentFilters.status = document.getElementById("statusFilter").value;
  currentFilters.purpose = document.getElementById("purposeFilter").value;

  const filteredAppointments = getFilteredAppointments();
  const filteredCancelled = filteredAppointments.filter(a => a.status === "Cancelled");

  updateStats(filteredAppointments);
  renderCharts(filteredAppointments);
  renderSummaryTable(filteredAppointments);
  renderReports(filteredCancelled);
}

function clearFilters() {
  document.getElementById("dateFrom").value = '';
  document.getElementById("dateTo").value = '';
  document.getElementById("statusFilter").value = '';
  document.getElementById("purposeFilter").value = '';

  currentFilters = { dateFrom: null, dateTo: null, status: '', purpose: '' };

  allCancelled = allAppointments.filter(a => a.status === "Cancelled");
  updateStats();
  renderCharts();
  renderSummaryTable();
  renderReports(allCancelled);
}

function updateStats(filteredAppointments = allAppointments) {
  const total = filteredAppointments.length;
  const completed = filteredAppointments.filter(a => a.status === "Completed").length;
  const cancelled = filteredAppointments.filter(a => a.status === "Cancelled").length;
  const pending = filteredAppointments.filter(a => a.status === "Pending").length;
  const confirmed = filteredAppointments.filter(a => a.status === "Confirmed").length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Avg response time for confirmed/completed (hours)
  let totalResponseTime = 0;
  let responseCount = 0;
  filteredAppointments.forEach(a => {
    if (a.status === "Confirmed" || a.status === "Completed") {
      const createdAt = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const updatedAt = a.updatedAt?.toDate?.() || new Date(a.updatedAt || createdAt);
      const responseTime = (updatedAt - createdAt) / (1000 * 60 * 60); // hours
      totalResponseTime += responseTime;
      responseCount++;
    }
  });
  const avgResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount * 10) / 10 : 0;

  // Cancelled this month (from all appointments for this stat)
  const now = new Date();
  const thisMonthCancelled = allAppointments.filter(a => {
    const cancelledAt = a.cancelledAt?.toDate?.() || a.updatedAt?.toDate?.() || new Date(a.createdAt || 0);
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

function renderCharts(filteredAppointments = allAppointments) {
  const completed = filteredAppointments.filter(a => a.status === "Completed").length;
  const cancelled = filteredAppointments.filter(a => a.status === "Cancelled").length;
  const pending = filteredAppointments.filter(a => a.status === "Pending").length;
  const confirmed = filteredAppointments.filter(a => a.status === "Confirmed").length;

  // Monthly Trends Chart (last 12 months) - Enhanced with pending/confirmed
  const months = [];
  const completedData = [];
  const cancelledData = [];
  const pendingData = [];
  const confirmedData = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    months.push(monthStr);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    // Use filtered appointments for trends when filters are applied
    const appointmentsToUse = currentFilters.dateFrom || currentFilters.dateTo || currentFilters.status || currentFilters.purpose ? filteredAppointments : allAppointments;

    const completedMonth = appointmentsToUse.filter(a => {
      const created = a.createdAt?.toDate?.() || new Date(a.createdAt);
      return a.status === "Completed" && created >= monthStart && created <= monthEnd;
    }).length;
    const cancelledMonth = appointmentsToUse.filter(a => {
      const cancelledAt = a.cancelledAt?.toDate?.() || new Date(a.cancelledAt || 0);
      return a.status === "Cancelled" && cancelledAt >= monthStart && cancelledAt <= monthEnd;
    }).length;
    const pendingMonth = appointmentsToUse.filter(a => {
      const created = a.createdAt?.toDate?.() || new Date(a.createdAt);
      return a.status === "Pending" && created >= monthStart && created <= monthEnd;
    }).length;
    const confirmedMonth = appointmentsToUse.filter(a => {
      const created = a.createdAt?.toDate?.() || new Date(a.createdAt);
      return a.status === "Confirmed" && created >= monthStart && created <= monthEnd;
    }).length;

    completedData.push(completedMonth);
    cancelledData.push(cancelledMonth);
    pendingData.push(pendingMonth);
    confirmedData.push(confirmedMonth);
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
          tension: 0.4,
          fill: false
        },
        {
          label: "Confirmed",
          data: confirmedData,
          borderColor: "#007bff",
          backgroundColor: "rgba(0, 123, 255, 0.1)",
          tension: 0.4,
          fill: false
        },
        {
          label: "Pending",
          data: pendingData,
          borderColor: "#ffc107",
          backgroundColor: "rgba(255, 193, 7, 0.1)",
          tension: 0.4,
          fill: false
        },
        {
          label: "Cancelled",
          data: cancelledData,
          borderColor: "#dc3545",
          backgroundColor: "rgba(220, 53, 69, 0.1)",
          tension: 0.4,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            title: function(context) {
              return `Month: ${context[0].label}`;
            },
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y}`;
            }
          }
        },
        legend: {
          display: true,
          position: 'top'
        }
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Month'
          }
        },
        y: {
          display: true,
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Appointments'
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    }
  });

  // Status Pie Chart - Enhanced with tooltips
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
        backgroundColor: ["#ffc107", "#007bff", "#28a745", "#dc3545"],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? Math.round((context.parsed / total) * 100) : 0;
              return `${context.label}: ${context.parsed} (${percentage}%)`;
            }
          }
        },
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true
          }
        }
      }
    }
  });

  // Purpose Bar Chart - Enhanced with tooltips and responsiveness
  const purposeCtx = document.getElementById("purposeBarChart").getContext("2d");
  const purposes = [...new Set(filteredAppointments.map(a => a.purpose))].filter(p => p); // Filter out empty purposes
  const purposeCounts = purposes.map(p => filteredAppointments.filter(a => a.purpose === p).length);
  if (purposeBarChart) purposeBarChart.destroy();
  purposeBarChart = new Chart(purposeCtx, {
    type: "bar",
    data: {
      labels: purposes,
      datasets: [{
        label: "Appointments",
        data: purposeCounts,
        backgroundColor: "#17a2b8",
        borderColor: "#138496",
        borderWidth: 1,
        hoverBackgroundColor: "#138496"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.label}: ${context.parsed.y} appointments`;
            }
          }
        },
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Purpose'
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        },
        y: {
          display: true,
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Appointments'
          }
        }
      }
    }
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
      populatePurposeFilter();
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
  db.collection("helpRequests")
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {
      allHelpRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderHelpTable();
      updateStats();
    }, err => console.error("Error loading help requests:", err));

  // Add filter event listeners
  document.getElementById("applyFiltersBtn").addEventListener("click", applyFilters);
  document.getElementById("clearFiltersBtn").addEventListener("click", clearFilters);
});
