import { db } from './firebase-config.js';
import { collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const appointmentTable = document.getElementById('appointmentTable');

async function loadAppointments() {
  appointmentTable.innerHTML = '';
  
  const querySnapshot = await getDocs(collection(db, "appointments"));
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${docSnap.id}</td>
      <td>${data.name}</td>
      <td>${data.role}</td>
      <td>${data.email}</td>
      <td>${data.dateTime}</td>
      <td><span class="badge ${getBadgeClass(data.status)}">${data.status}</span></td>
      <td>
        <button class="btn btn-success btn-sm me-1" onclick="updateStatus('${docSnap.id}', 'Confirmed')">Confirm</button>
        <button class="btn btn-danger btn-sm" onclick="updateStatus('${docSnap.id}', 'Cancelled')">Cancel</button>
      </td>
    `;
    appointmentTable.appendChild(row);
  });
}

function getBadgeClass(status) {
  switch(status) {
    case "Pending": return "bg-warning";
    case "Confirmed": return "bg-success";
    case "Completed": return "bg-info";
    case "Cancelled": return "bg-danger";
    default: return "bg-secondary";
  }
}

window.updateStatus = async function(id, status) {
  await updateDoc(doc(db, "appointments", id), { status });
  loadAppointments();
}

loadAppointments();
