document.addEventListener('DOMContentLoaded', () => {
    const appointmentList = document.getElementById('appointment-list');
    const logoutBtn = document.getElementById('logoutBtn');


    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'index.html';
        } else {
            loadAllAppointments();
        }
    });

    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => window.location.href = 'index.html');
    });

    function loadAllAppointments() {
        db.collection("appointments")
          .orderBy("dateTime")
          .onSnapshot(snapshot => {
              appointmentList.innerHTML = "";
              snapshot.forEach(doc => {
                  const data = doc.data();
                  const card = document.createElement('div');
                  card.classList.add('appointment-card');

                  const steps = ["Pending", "Confirmed", "Completed", "Cancelled"];
                  let timelineHTML = '<div class="timeline">';
                  steps.forEach(step => {
                      const activeClass = step === data.status ? 'active' : '';

                      timelineHTML += `<div class="timeline-step ${activeClass}" data-id="${doc.id}" data-status="${step}">${step}</div>`;
                  });
                  timelineHTML += '</div>';

                  card.innerHTML = `
                    <p><strong>Teacher ID:</strong> ${data.userId}</p>
                    <p><strong>Date & Time:</strong> ${new Date(data.dateTime.seconds * 1000).toLocaleString()}</p>
                    <p><strong>Notes:</strong> ${data.notes || '-'}</p>
                    ${timelineHTML}
                  `;

                  appointmentList.appendChild(card);
              });

              document.querySelectorAll('.timeline-step').forEach(step => {
                  step.addEventListener('click', async (e) => {
                      const appointmentId = e.target.dataset.id;
                      const newStatus = e.target.dataset.status;

                      try {
                          await db.collection("appointments").doc(appointmentId).update({ status: newStatus });
                          console.log(`Updated ${appointmentId} to ${newStatus}`);
                      } catch (err) {
                          console.error("Error updating status:", err);
                      }
                  });
              });
          });
    }
});
