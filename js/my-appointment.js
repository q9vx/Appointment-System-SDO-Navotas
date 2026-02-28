document.addEventListener("DOMContentLoaded", () => {
    const auth = firebase.auth();
    const db = firebase.firestore();

    const container = document.getElementById("appointmentsContainer");
    const skeletonLoader = document.getElementById("skeletonLoader");
    const overlay = document.getElementById("guestOverlay");
    const goSignup = document.getElementById("goSignup");
    const loadMoreBtn = document.getElementById("loadMoreBtn");
    const pageInfo = document.getElementById("pageInfo");
    const paginationArea = document.getElementById("paginationArea");
    const sortSelect = document.getElementById("sortSelect");
    const searchInput = document.getElementById("searchInput");
    const listViewBtn = document.getElementById("listViewBtn");
    const gridViewBtn = document.getElementById("gridViewBtn");
    const successToast = new bootstrap.Toast(document.getElementById("successToast"));
    const toastMessage = document.getElementById("toastMessage");
    const feedbackModal = new bootstrap.Modal(document.getElementById('feedbackModal'));
    const submitFeedbackBtn = document.getElementById('submitFeedback');
    const feedbackRatingInput = document.getElementById('feedbackRating');
    const ratingStars = document.querySelectorAll('#ratingStars i');
    let currentFeedbackApptId = null;

    let allAppointments = [];
    let filteredAppointments = [];
    let currentPage = 1;
    const pageSize = 10;
    let currentFilter = "all";
    let currentSort = "createdAt-desc";
    let currentView = "list";
    let currentSearch = "";
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

    function showSkeleton() {
        if (skeletonLoader) skeletonLoader.style.display = "block";
        if (container) container.style.display = "none";
    }

    function hideSkeleton() {
        if (skeletonLoader) skeletonLoader.style.display = "none";
        if (container) container.style.display = "block";
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
        if (container) container.innerHTML = `<p class='text-center text-danger'><i class='bi bi-exclamation-triangle me-2'></i>${message}</p>`;
    }

    function updatePageInfo() {
        const totalFiltered = filteredAppointments.length;
        const showing = Math.min(currentPage * pageSize, totalFiltered);
        const hasMore = showing < totalFiltered;
        if (loadMoreBtn) loadMoreBtn.style.display = hasMore ? "block" : "none";
        if (pageInfo) pageInfo.textContent = `Showing ${showing} of ${totalFiltered} appointments`;
        if (paginationArea) paginationArea.style.display = totalFiltered > 0 ? "flex" : "none";
    }

    function getCurrentPageAppointments() {
        return filteredAppointments.slice(0, currentPage * pageSize);
    }

    function applySearch(appointments, searchTerm) {
        if (!searchTerm || searchTerm.trim() === "") return appointments;
        
        const search = searchTerm.toLowerCase().trim();
        return appointments.filter(appt => {
            const purpose = (appt.purpose || "").toLowerCase();
            const status = (appt.status || "").toLowerCase();
            const date = (appt.date || "").toLowerCase();
            const time = (appt.time || "").toLowerCase();
            const notes = (appt.notes || "").toLowerCase();
            const adminNotes = (appt.adminNotes || "").toLowerCase();
            
            return purpose.includes(search) || status.includes(search) || 
                   date.includes(search) || time.includes(search) || 
                   notes.includes(search) || adminNotes.includes(search);
        });
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
                return appointments.filter(appt => new Date(appt.date).toDateString() === today.toDateString());
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
                return appointments.filter(appt => new Date(appt.date) >= today);
            default:
                return appointments;
        }
    }

    function applySort(appointments, sort) {
        const [field, direction] = sort.split("-");
        const isDesc = direction === "desc";
        return [...appointments].sort((a, b) => {
            let aVal, bVal;
            if (field === "createdAt") {
                aVal = a.createdAt?.toDate?.() || new Date(0);
                bVal = b.createdAt?.toDate?.() || new Date(0);
            } else if (field === "date") {
                aVal = new Date(a.date + (a.time ? ` ${a.time}` : ""));
                bVal = new Date(b.date + (b.time ? ` ${b.time}` : ""));
            } else {
                aVal = a.status || "";
                bVal = b.status || "";
            }
            if (aVal < bVal) return isDesc ? 1 : -1;
            if (aVal > bVal) return isDesc ? -1 : 1;
            return 0;
        });
    }

    function renderStats(appointments) {
        const statsSection = document.getElementById('statsSection');
        if (!statsSection) return;

        const total = appointments.length;
        const pending = appointments.filter(a => a.status === 'Pending').length;
        const confirmed = appointments.filter(a => a.status === 'Confirmed' || a.status === 'Completed').length;
        const cancelled = appointments.filter(a => a.status === 'Cancelled').length;

        const statTotal = document.getElementById('statTotal');
        const statPending = document.getElementById('statPending');
        const statConfirmed = document.getElementById('statConfirmed');
        const statCancelled = document.getElementById('statCancelled');

        if (statTotal) statTotal.textContent = total;
        if (statPending) statPending.textContent = pending;
        if (statConfirmed) statConfirmed.textContent = confirmed;
        if (statCancelled) statCancelled.textContent = cancelled;

        statsSection.style.display = total > 0 ? 'block' : 'none';
    }

    function getStatusBadge(appt) {
        let badgeClass = "bg-secondary";
        let statusIcon = "";
        if (appt.status === "Pending") { 
            badgeClass = "bg-warning text-dark"; 
            statusIcon = "⏳"; 
        }
        else if (appt.status === "Confirmed") { 
            badgeClass = "bg-success"; 
            statusIcon = "✅"; 
        }
        else if (appt.status === "Completed") { 
            badgeClass = "bg-info"; 
            statusIcon = "✅"; 
        }
        else if (appt.status === "Cancelled") { 
            badgeClass = "bg-danger"; 
            statusIcon = "❌"; 
        }
        return { badgeClass, statusIcon };
    }

    function getPurposeIcon(purpose) {
        if (!purpose) return "bi-calendar-event";
        const p = purpose.toLowerCase();
        if (p.includes("enrollment") || p.includes("enroll")) return "bi-person-plus";
        if (p.includes("transfer")) return "bi-arrow-left-right";
        if (p.includes("credential")) return "bi-award";
        if (p.includes("document")) return "bi-file-earmark-text";
        if (p.includes("consultation") || p.includes("consult")) return "bi-chat-dots";
        if (p.includes("medical") || p.includes("health")) return "bi-heart-pulse";
        if (p.includes("meeting")) return "bi-people";
        return "bi-calendar-event";
    }

    function renderAppointments(appointments) {
        console.log("Rendering appointments:", appointments.length);
        const emptyState = document.getElementById('emptyState');
        
        if (appointments.length === 0) {
            if (container) container.innerHTML = "";
            if (emptyState) emptyState.style.display = "block";
            hideSkeleton();
            return;
        }
        
        if (emptyState) emptyState.style.display = "none";
        if (!container) {
            console.log("Container not found!");
            return;
        }
        
        container.innerHTML = "";
        container.className = `appointments-container appointments-${currentView}`;
        
        hideSkeleton();
        
        appointments.forEach((appt, index) => {
            const createdAtDisplay = appt.createdAt?.toDate ? formatPHDateTime(appt.createdAt.toDate()) : "N/A";
            const appointmentDateTime = appt.date && appt.time ? `${appt.date} ${appt.time}` : (appt.date || "N/A");
            
            const { badgeClass, statusIcon } = getStatusBadge(appt);
            const purposeIcon = getPurposeIcon(appt.purpose);
            
            const cardHTML = `
            <div class="appointment-card status-${appt.status?.toLowerCase()}" data-id="${appt.id || ''}" style="animation-delay: ${index * 0.05}s;">
                <div class="appt-header">
                    <div class="appt-purpose">
                        <i class="bi ${purposeIcon}"></i>
                        <h4>${appt.purpose || 'General Appointment'}</h4>
                    </div>
                    <span class="appt-status ${appt.status?.toLowerCase()}">${statusIcon} ${appt.status}</span>
                </div>
                <div class="appt-body">
                    <div class="appt-detail">
                        <i class="bi bi-calendar3"></i>
                        <span><span class="label">Date:</span><span class="value">${appt.date || 'N/A'}</span></span>
                    </div>
                    <div class="appt-detail">
                        <i class="bi bi-clock"></i>
                        <span><span class="label">Time:</span><span class="value">${appt.time || 'N/A'}</span></span>
                    </div>
                    <div class="appt-detail">
                        <i class="bi bi-plus-circle"></i>
                        <span><span class="label">Created:</span><span class="value">${createdAtDisplay}</span></span>
                    </div>
                </div>
                ${appt.notes ? `<div class="appt-notes"><i class="bi bi-chat-text me-1"></i>${appt.notes}</div>` : ''}
                ${appt.adminNotes ? `<div class="appt-admin-notes"><i class="bi bi-person-check me-1"></i><strong>Admin:</strong> ${appt.adminNotes}</div>` : ''}
                <div class="appt-actions">
                    ${appt.status !== "Cancelled" && appt.status !== "Completed" ? 
                    `<button class="btn btn-outline-danger btn-sm cancel-btn"><i class="bi bi-x-circle me-1"></i>Cancel</button>` : ''}
                    ${appt.status === "Completed" ? 
                    `<button class="btn btn-outline-primary btn-sm feedback-btn"><i class="bi bi-chat-dots me-1"></i>Feedback</button>` : ''}
                </div>
            </div>`;
            container.innerHTML += cardHTML;
        });
    }

    function loadAndRenderAppointments() {
        // Apply search first
        let results = applySearch(allAppointments, currentSearch);
        
        // Then filter
        results = applyFilter(results, currentFilter);
        
        // Then sort
        results = applySort(results, currentSort);
        
        filteredAppointments = results;
        currentPage = 1;
        
        renderAppointments(getCurrentPageAppointments());
        updatePageInfo();
    }

    // Filter buttons event listeners
    document.querySelectorAll(".quick-filter-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".quick-filter-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentFilter = btn.dataset.filter;
            loadAndRenderAppointments();
        });
    });

    // Sort dropdown event listener
    if (sortSelect) {
        sortSelect.addEventListener("change", () => {
            currentSort = sortSelect.value;
            loadAndRenderAppointments();
        });
    }

    // Search input event listener with debounce
    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentSearch = searchInput.value;
                loadAndRenderAppointments();
            }, 300);
        });
    }

    // View toggle event listeners
    if (listViewBtn) {
        listViewBtn.addEventListener("click", () => {
            currentView = "list";
            listViewBtn.classList.add("active");
            gridViewBtn.classList.remove("active");
            loadAndRenderAppointments();
        });
    }

    if (gridViewBtn) {
        gridViewBtn.addEventListener("click", () => {
            currentView = "grid";
            gridViewBtn.classList.add("active");
            listViewBtn.classList.remove("active");
            loadAndRenderAppointments();
        });
    }

    // Load more button
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener("click", () => {
            if ((currentPage * pageSize) < filteredAppointments.length) {
                currentPage++;
                renderAppointments(getCurrentPageAppointments());
                updatePageInfo();
            }
        });
    }

    showSkeleton();

    auth.onAuthStateChanged(user => {
        if (!user) {
            hideSkeleton();
            if (overlay) overlay.style.display = "flex";
            if (goSignup) goSignup.addEventListener("click", () => window.location.href = "signup.html");
            if (container) container.innerHTML = "<p class='text-center text-muted py-5'><i class='bi bi-box-arrow-in-right me-2'></i>Please log in to view appointments.</p>";
            return;
        }

        if (overlay) overlay.style.display = "none";

        db.collection("users").doc(user.uid).get().then(doc => {
            isAdmin = doc.exists && doc.data().role === "admin";
            
            const query = isAdmin ? 
                db.collection("appointments").orderBy("createdAt", "desc") : 
                db.collection("appointments").where("userId", "==", user.uid);

            query.onSnapshot(snapshot => {
                allAppointments = [];
                snapshot.forEach(doc => {
                    allAppointments.push({ id: doc.id, ...doc.data() });
                });
                renderStats(allAppointments);
                loadAndRenderAppointments();
            });
        });

        // Cancel button handler
        if (container) {
            container.addEventListener("click", (e) => {
                if (e.target.classList.contains("cancel-btn") || e.target.closest(".cancel-btn")) {
                    const btn = e.target.classList.contains("cancel-btn") ? e.target : e.target.closest(".cancel-btn");
                    const card = btn.closest(".appointment-card");
                    const apptId = card?.getAttribute("data-id");
                    if (!apptId) return;

                    const cancelModal = new bootstrap.Modal(document.getElementById('cancelModal'));
                    const cancelReasonSelect = document.getElementById('cancelReason');
                    const cancelNotesTextarea = document.getElementById('cancelNotes');
                    const confirmCancelBtn = document.getElementById('confirmCancel');

                    if (cancelReasonSelect) cancelReasonSelect.value = "";
                    if (cancelNotesTextarea) cancelNotesTextarea.value = "";
                    cancelModal.show();

                    const handleConfirm = () => {
                        const reason = cancelReasonSelect?.value;
                        if (!reason) {
                            showToast("Please select a reason.", 4000);
                            return;
                        }

                        db.collection("appointments").doc(apptId).update({
                            status: "Cancelled",
                            cancellationReason: reason,
                            cancelledAt: firebase.firestore.FieldValue.serverTimestamp()
                        }).then(() => {
                            showToast("Appointment cancelled!");
                            cancelModal.hide();
                        }).catch(err => {
                            console.error(err);
                            showToast("Failed to cancel.", 5000);
                        });
                    };

                    if (confirmCancelBtn) {
                        confirmCancelBtn.onclick = handleConfirm;
                    }
                }

                if (e.target.classList.contains("feedback-btn") || e.target.closest(".feedback-btn")) {
                    const btn = e.target.classList.contains("feedback-btn") ? e.target : e.target.closest(".feedback-btn");
                    const card = btn.closest(".appointment-card");
                    currentFeedbackApptId = card?.getAttribute("data-id");
                    feedbackModal.show();
                }
            });
        }

        // Feedback modal
        const feedbackModalEl = document.getElementById('feedbackModal');
        if (feedbackModalEl) {
            feedbackModalEl.addEventListener('show.bs.modal', () => {
                document.getElementById('feedbackSubject').value = "";
                document.getElementById('feedbackRating').value = "0";
                document.getElementById('feedbackMessage').value = "";
                if (ratingStars) ratingStars.forEach(star => star.classList.remove('active'));
            });
        }

        // Rating stars click
        const ratingStarsContainer = document.getElementById('ratingStars');
        if (ratingStarsContainer) {
            ratingStarsContainer.onclick = (e) => {
                const star = e.target;
                if (star.tagName === 'I') {
                    const rating = parseInt(star.dataset.rating);
                    feedbackRatingInput.value = rating;
                    ratingStars.forEach((s, i) => {
                        s.classList.toggle('active', i < rating);
                    });
                }
            };
        }

        // Submit feedback
        if (submitFeedbackBtn) {
            submitFeedbackBtn.onclick = () => {
                const subject = document.getElementById('feedbackSubject')?.value;
                const rating = parseInt(feedbackRatingInput.value);
                const message = document.getElementById('feedbackMessage')?.value.trim();

                if (!subject || !message) {
                    showToast("Please fill all fields.", 3000);
                    return;
                }

                submitFeedbackBtn.disabled = true;
                submitFeedbackBtn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>Submitting...';

                db.collection("feedback").add({
                    subject, rating, message,
                    userId: auth.currentUser?.uid,
                    userEmail: auth.currentUser?.email,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    type: 'general'
                }).then(() => {
                    showToast("Thank you for your feedback!");
                    feedbackModal.hide();
                    if (currentFeedbackApptId) {
                        db.collection("appointments").doc(currentFeedbackApptId).update({ status: "FeedbackReceived" });
                    }
                }).catch(err => {
                    console.error(err);
                    showToast("Failed to submit feedback.", 5000);
                }).finally(() => {
                    submitFeedbackBtn.disabled = false;
                    submitFeedbackBtn.innerHTML = '<i class="bi bi-send me-1"></i>Submit';
                });
            };
        }
    });
});
