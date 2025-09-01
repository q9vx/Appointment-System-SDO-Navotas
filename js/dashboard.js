document.addEventListener('DOMContentLoaded', () => {
    const appointmentList = document.getElementById('appointment-list');
    const logoutBtn = document.getElementById('logoutBtn');
    const createBtn = document.getElementById('createBtn');

    // Check user authentication
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'index.html';
        } else {
            loadAppointments(user.uid);
        }
    });

    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });
    }

    // Handle create appointment form
    const appointmentForm = document.getElementById('appointmentForm');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            if (!user) return;

            const dateTime = document.getElementById('dateTime').value;
            const notes = document.getElementById('notes').value;

            if (!dateTime) {
                alert("Please select a date and time.");
                return;
            }

            try {
                const docRef = await db.collection("appointments").add({
                    userId: user.uid,
                    dateTime: new Date(dateTime),
                    status: "Pending",
                    notes: notes
                });
                alert("Appointment created successfully!");
                window.location.href = 'dashboard.html';
            } catch (error) {
                console.error("Error adding appointment: ", error);
                alert("Failed to create appointment. Try again.");
            }
        });
    }

    // Logout
    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => window.location.href = 'index.html');
    });

    // Redirect to create appointment page
    createBtn.addEventListener('click', () => {
        window.location.href = 'create-appointment.html';
    });

    function loadAppointments(userId) {
        db.collection("appointments")
          .where("userId", "==", userId)
          .orderBy("dateTime")
          .onSnapshot(snapshot => {
              appointmentList.innerHTML = ""; // Clear current list
              snapshot.forEach(doc => {
                  const data = doc.data();
                  const card = document.createElement('div');
                  card.classList.add('appointment-card');

                  card.innerHTML = `
                    <p><strong>Date & Time:</strong> ${new Date(data.dateTime.seconds * 1000).toLocaleString()}</p>
                    <p><strong>Notes:</strong> ${data.notes || '-'}</p>
                    <span class="status ${data.status}">${data.status}</span>
                  `;

                  appointmentList.appendChild(card);
              });
          });
    }
});