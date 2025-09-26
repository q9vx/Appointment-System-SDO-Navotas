document.addEventListener("DOMContentLoaded", () => {
const auth = firebase.auth();
const db = firebase.firestore();

const overlay = document.getElementById("guestOverlay");
const goSignup = document.getElementById("goSignup");
const navProfile = document.getElementById("navProfile");
const profileForm = document.getElementById("profileForm");
const passwordForm = document.getElementById("passwordForm");
const savePreferencesBtn = document.getElementById("savePreferences");
const logoutBtn = document.getElementById("logoutBtn");
const confirmDeleteBtn = document.getElementById("confirmDelete");
const deleteAccountModal = new bootstrap.Modal(document.getElementById("deleteAccountModal"));
const successToast = new bootstrap.Toast(document.getElementById("successToast"));
const toastMessage = document.getElementById("toastMessage");

let currentUser = null;
let userDoc = null;

// Show toast
function showToast(message, type = "success") {
  toastMessage.textContent = message;
  const toastEl = document.getElementById("successToast");
  toastEl.className = `toast align-items-center text-white ${type === "success" ? "bg-success" : "bg-danger"} border-0`;
  successToast.show();
}

// Show error
function showError(message) {
  showToast(message, "error");
}

// Load user data
function loadUserData() {
  if (!currentUser) return;

  db.collection("users").doc(currentUser.uid).get().then(doc => {
    if (doc.exists) {
      userDoc = doc.data();
      document.getElementById("fullName").value = userDoc.fullName || "";
      document.getElementById("email").value = currentUser.email;
      document.getElementById("phone").value = userDoc.phone || "";
      document.getElementById("school").value = userDoc.school || "";
      document.getElementById("emailNotifications").checked = userDoc.emailNotifications !== false;
      document.getElementById("reminderNotifications").checked = userDoc.reminderNotifications !== false;
    }
  }).catch(err => {
    console.error("Error loading user data:", err);
    showError("Failed to load profile data.");
  });
}

// Update profile
profileForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!currentUser || !userDoc) return;

  const fullName = document.getElementById("fullName").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const school = document.getElementById("school").value.trim();

  if (!fullName) {
    showError("Full name is required.");
    return;
  }

  db.collection("users").doc(currentUser.uid).update({
    fullName,
    phone,
    school
  }).then(() => {
    showToast("Profile updated successfully!");
    loadUserData(); // Reload to confirm
  }).catch(err => {
    console.error("Error updating profile:", err);
    showError("Failed to update profile.");
  });
});

// Change password
passwordForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!currentUser) return;

  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (newPassword !== confirmPassword) {
    showError("Passwords do not match.");
    return;
  }

  if (newPassword.length < 6) {
    showError("New password must be at least 6 characters.");
    return;
  }

  // Reauthenticate
  const credential = firebase.auth.EmailAuthProvider.credential(currentUser.email, currentPassword);
  currentUser.reauthenticateWithCredential(credential).then(() => {
    currentUser.updatePassword(newPassword).then(() => {
      showToast("Password changed successfully!");
      passwordForm.reset();
    }).catch(err => {
      console.error("Error updating password:", err);
      showError("Failed to change password.");
    });
  }).catch(err => {
    console.error("Reauthentication failed:", err);
    showError("Current password is incorrect.");
  });
});

// Save preferences
savePreferencesBtn.addEventListener("click", () => {
  if (!currentUser || !userDoc) return;

  const emailNotifications = document.getElementById("emailNotifications").checked;
  const reminderNotifications = document.getElementById("reminderNotifications").checked;

  db.collection("users").doc(currentUser.uid).update({
    emailNotifications,
    reminderNotifications
  }).then(() => {
    showToast("Preferences saved successfully!");
  }).catch(err => {
    console.error("Error saving preferences:", err);
    showError("Failed to save preferences.");
  });
});

// Logout
logoutBtn.addEventListener("click", () => {
  auth.signOut().then(() => {
    showToast("Logged out successfully!");
    window.location.href = "index.html";
  }).catch(err => {
    console.error("Logout error:", err);
    showError("Failed to logout.");
  });
});

// Delete account
confirmDeleteBtn.addEventListener("click", () => {
  if (!currentUser) return;

  const deletePassword = document.getElementById("deletePassword").value;

  if (!deletePassword) {
    showError("Password is required to delete account.");
    return;
  }

  const credential = firebase.auth.EmailAuthProvider.credential(currentUser.email, deletePassword);
  currentUser.reauthenticateWithCredential(credential).then(() => {
    // Delete Firestore doc
    db.collection("users").doc(currentUser.uid).delete().then(() => {
      // Delete appointments if any (optional, but for cleanup)
      db.collection("appointments").where("userId", "==", currentUser.uid).get().then(snapshot => {
        const batch = db.batch();
        snapshot.forEach(doc => batch.delete(doc.ref));
        return batch.commit();
      }).then(() => {
        // Delete auth account
        currentUser.delete().then(() => {
          showToast("Account deleted successfully!");
          window.location.href = "index.html";
        }).catch(err => {
          console.error("Error deleting account:", err);
          showError("Failed to delete account.");
        });
      });
    }).catch(err => {
      console.error("Error deleting user data:", err);
      showError("Failed to delete user data.");
    });
  }).catch(err => {
    console.error("Reauthentication failed:", err);
    showError("Password is incorrect.");
  });
});

// Auth state listener
auth.onAuthStateChanged(user => {
  currentUser = user;
  if (!user) {
    document.body.classList.add("guest-blur");
    if (overlay) overlay.style.display = "flex";
    if (navProfile) navProfile.href = "login.html";
    if (goSignup) goSignup.addEventListener("click", () => {
      window.location.href = "signup.html";
    });
    return;
  }

  document.body.classList.remove("guest-blur");
  if (overlay) overlay.style.display = "none";

  // Check admin role
  db.collection("users").doc(user.uid).get().then(doc => {
    const isAdmin = doc.exists && doc.data().role === "admin";
    if (navProfile) navProfile.href = isAdmin ? "admin/admin-dashboard.html" : "settings.html"; // Default to settings for non-admin
  });

  loadUserData();
});

// Initialize
if (goSignup) {
  goSignup.addEventListener("click", () => {
    window.location.href = "signup.html";
  });
}
});
