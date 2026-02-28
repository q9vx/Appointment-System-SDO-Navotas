document.addEventListener("DOMContentLoaded", () => {
  const auth = firebase.auth();
  const db = firebase.firestore();
  const storage = firebase.storage();

  // Elements
  const overlay = document.getElementById("guestOverlay");
  const goSignup = document.getElementById("goSignup");
  const profileForm = document.getElementById("profileForm");
  const passwordForm = document.getElementById("passwordForm");
  const savePreferencesBtn = document.getElementById("savePreferences");
  const logoutBtn = document.getElementById("logoutBtn");
  const confirmDeleteBtn = document.getElementById("confirmDelete");
  const verifyEmailBtn = document.getElementById("verifyEmailBtn");
  const setup2FABtn = document.getElementById("setup2FA");
  const avatarUpload = document.getElementById("avatarUpload");
  const profileAvatar = document.getElementById("profileAvatar");
  const displayName = document.getElementById("displayName");
  const displayEmail = document.getElementById("displayEmail");
  const emailVerifiedStatus = document.getElementById("emailVerifiedStatus");
  const emailUnverifiedStatus = document.getElementById("emailUnverifiedStatus");
  const activityList = document.getElementById("activityList");

  // Export buttons
  const exportProfile = document.getElementById("exportProfile");
  const exportAppointments = document.getElementById("exportAppointments");
  const exportAll = document.getElementById("exportAll");

  const deleteAccountModal = new bootstrap.Modal(document.getElementById("deleteAccountModal"));
  const successToast = new bootstrap.Toast(document.getElementById("successToast"));
  const toastMessage = document.getElementById("toastMessage");

  let currentUser = null;
  let userDoc = null;

  // Toast function
  function showToast(message, type = "success") {
    toastMessage.textContent = message;
    const toastEl = document.getElementById("successToast");
    toastEl.className = `toast align-items-center text-white ${type === "success" ? "bg-success" : "bg-danger"} border-0`;
    successToast.show();
  }

  function showError(message) {
    showToast(message, "error");
  }

  // Load user data
  function loadUserData() {
    if (!currentUser) return;

    // Update display name and email
    displayName.textContent = currentUser.displayName || "User";
    displayEmail.textContent = currentUser.email;
    document.getElementById("email").value = currentUser.email;

    // Check email verification status
    if (currentUser.emailVerified) {
      emailVerifiedStatus.classList.remove("d-none");
      emailUnverifiedStatus.classList.add("d-none");
    } else {
      emailVerifiedStatus.classList.add("d-none");
      emailUnverifiedStatus.classList.remove("d-none");
    }

    // Load profile picture
    if (currentUser.photoURL) {
      profileAvatar.src = currentUser.photoURL;
    }

    // Load user document from Firestore
    db.collection("users").doc(currentUser.uid).get().then(doc => {
      if (doc.exists) {
        userDoc = doc.data();
        document.getElementById("fullName").value = userDoc.fullName || currentUser.displayName || "";
        document.getElementById("phone").value = userDoc.phone || "";
        document.getElementById("school").value = userDoc.school || "";
        document.getElementById("emailNotifications").checked = userDoc.emailNotifications !== false;
        document.getElementById("reminderNotifications").checked = userDoc.reminderNotifications !== false;
        document.getElementById("marketingNotifications").checked = userDoc.marketingNotifications || false;
        document.getElementById("twoFactorEnabled").checked = userDoc.twoFactorEnabled || false;

        // Update display name
        if (userDoc.fullName) {
          displayName.textContent = userDoc.fullName;
        }

        // Update profile picture from Firestore
        if (userDoc.photoURL) {
          profileAvatar.src = userDoc.photoURL;
        }
      } else {
        // Create user document if doesn't exist
        userDoc = {
          fullName: currentUser.displayName || "",
          email: currentUser.email,
          phone: "",
          school: "",
          emailNotifications: true,
          reminderNotifications: true,
          marketingNotifications: false,
          twoFactorEnabled: false,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        db.collection("users").doc(currentUser.uid).set(userDoc);
      }
    }).catch(err => {
      console.error("Error loading user data:", err);
    });

    // Load account activity
    loadAccountActivity();
  }

  // Load account activity
  function loadAccountActivity() {
    if (!currentUser) return;

    db.collection("users").doc(currentUser.uid).collection("activity")
      .orderBy("timestamp", "desc")
      .limit(10)
      .get()
      .then(snapshot => {
        if (snapshot.empty) {
          // Show default activity if no history
          activityList.innerHTML = `
            <li class="activity-item">
              <div class="activity-icon login">
                <i class="bi bi-box-arrow-in-right"></i>
              </div>
              <div class="activity-details">
                <div class="activity-title">Account created</div>
                <div class="activity-time">Welcome to SDO Navotas!</div>
              </div>
            </li>
          `;
          return;
        }

        activityList.innerHTML = "";
        snapshot.forEach(doc => {
          const activity = doc.data();
          const iconClass = activity.type === "login" ? "login" : 
                           activity.type === "logout" ? "logout" : "update";
          const icon = activity.type === "login" ? "bi-box-arrow-in-right" :
                      activity.type === "logout" ? "bi-box-arrow-left" : "bi-pencil";

          const time = activity.timestamp ? 
            new Date(activity.timestamp.seconds * 1000).toLocaleString() : "Just now";

          activityList.innerHTML += `
            <li class="activity-item">
              <div class="activity-icon ${iconClass}">
                <i class="bi ${icon}"></i>
              </div>
              <div class="activity-details">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-time">${time}</div>
              </div>
            </li>
          `;
        });
      })
      .catch(err => {
        console.error("Error loading activity:", err);
      });
  }

  // Log activity
  function logActivity(type, title) {
    if (!currentUser) return;

    db.collection("users").doc(currentUser.uid).collection("activity").add({
      type,
      title,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  // Profile form submission
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
      // Update Firebase Auth display name
      currentUser.updateProfile({
        displayName: fullName
      }).then(() => {
        displayName.textContent = fullName;
      });

      showToast("Profile updated successfully!");
      logActivity("update", "Profile updated");
    }).catch(err => {
      console.error("Error updating profile:", err);
      showError("Failed to update profile.");
    });
  });

  // Password change
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

    const credential = firebase.auth.EmailAuthProvider.credential(currentUser.email, currentPassword);
    currentUser.reauthenticateWithCredential(credential).then(() => {
      currentUser.updatePassword(newPassword).then(() => {
        showToast("Password changed successfully!");
        passwordForm.reset();
        logActivity("update", "Password changed");
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
    if (!currentUser) return;

    const emailNotifications = document.getElementById("emailNotifications").checked;
    const reminderNotifications = document.getElementById("reminderNotifications").checked;
    const marketingNotifications = document.getElementById("marketingNotifications").checked;
    const twoFactorEnabled = document.getElementById("twoFactorEnabled").checked;

    db.collection("users").doc(currentUser.uid).update({
      emailNotifications,
      reminderNotifications,
      marketingNotifications,
      twoFactorEnabled
    }).then(() => {
      showToast("Preferences saved successfully!");
      logActivity("update", "Preferences updated");
    }).catch(err => {
      console.error("Error saving preferences:", err);
      showError("Failed to save preferences.");
    });
  });

  // Verify email
  verifyEmailBtn?.addEventListener("click", () => {
    if (!currentUser) return;

    currentUser.sendEmailVerification()
      .then(() => {
        showToast("Verification email sent! Check your inbox.");
      })
      .catch(err => {
        console.error("Error sending verification:", err);
        showError("Failed to send verification email.");
      });
  });

  // Setup 2FA
  setup2FABtn?.addEventListener("click", () => {
    if (!currentUser) return;
    
    // Note: Firebase Auth currently doesn't support TOTP 2FA in client-side SDK
    // This would require a custom implementation or Firebase Auth Pro
    showToast("Two-Factor Authentication setup coming soon!");
  });

  // Avatar upload
  avatarUpload?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file || !currentUser) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      showError("Please select an image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      showError("Image must be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      // Upload to Firebase Storage
      const storageRef = storage.ref(`avatars/${currentUser.uid}`);
      const uploadTask = storageRef.put(file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log("Upload progress:", progress);
        },
        (error) => {
          console.error("Upload error:", error);
          showError("Failed to upload image.");
        },
        () => {
          uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
            // Update Firestore
            db.collection("users").doc(currentUser.uid).update({
              photoURL: downloadURL
            }).then(() => {
              // Update Auth profile
              currentUser.updateProfile({
                photoURL: downloadURL
              }).then(() => {
                profileAvatar.src = downloadURL;
                showToast("Profile picture updated!");
                logActivity("update", "Profile picture changed");
              });
            });
          });
        }
      );
    };
    reader.readAsDataURL(file);
  });

  // Export profile data
  exportProfile?.addEventListener("click", async () => {
    if (!currentUser || !userDoc) return;

    const data = {
      profile: {
        fullName: userDoc.fullName,
        email: currentUser.email,
        phone: userDoc.phone || "",
        school: userDoc.school || "",
        emailVerified: currentUser.emailVerified,
        createdAt: userDoc.createdAt
      },
      exportedAt: new Date().toISOString()
    };

    downloadJSON(data, "profile-data.json");
    logActivity("export", "Profile data exported");
    showToast("Profile data exported!");
  });

  // Export appointments
  exportAppointments?.addEventListener("click", async () => {
    if (!currentUser) return;

    const snapshot = await db.collection("appointments")
      .where("userId", "==", currentUser.uid)
      .get();

    const appointments = [];
    snapshot.forEach(doc => {
      appointments.push({ id: doc.id, ...doc.data() });
    });

    const data = {
      appointments,
      exportedAt: new Date().toISOString()
    };

    downloadJSON(data, "appointments.json");
    logActivity("export", "Appointment history exported");
    showToast("Appointment data exported!");
  });

  // Export all data
  exportAll?.addEventListener("click", async () => {
    if (!currentUser || !userDoc) return;

    // Get appointments
    const appointmentsSnapshot = await db.collection("appointments")
      .where("userId", "==", currentUser.uid)
      .get();

    const appointments = [];
    appointmentsSnapshot.forEach(doc => {
      appointments.push({ id: doc.id, ...doc.data() });
    });

    const data = {
      profile: {
        fullName: userDoc.fullName,
        email: currentUser.email,
        phone: userDoc.phone,
        school: userDoc.school,
        emailVerified: currentUser.emailVerified,
        createdAt: userDoc.createdAt
      },
      preferences: {
        emailNotifications: userDoc.emailNotifications,
        reminderNotifications: userDoc.reminderNotifications,
        marketingNotifications: userDoc.marketingNotifications
      },
      appointments,
      exportedAt: new Date().toISOString()
    };

    downloadJSON(data, "all-data.json");
    logActivity("export", "All data exported");
    showToast("All data exported!");
  });

  // Download JSON helper
  function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Logout
  logoutBtn?.addEventListener("click", () => {
    logActivity("logout", "Logged out");
    auth.signOut().then(() => {
      showToast("Logged out successfully!");
      window.location.href = "index.html";
    }).catch(err => {
      console.error("Logout error:", err);
      showError("Failed to logout.");
    });
  });

  // Delete account
  confirmDeleteBtn?.addEventListener("click", () => {
    if (!currentUser) return;

    const deletePassword = document.getElementById("deletePassword").value;
    const confirmCheck = document.getElementById("confirmDeleteCheck");

    if (!deletePassword) {
      showError("Password is required to delete account.");
      return;
    }

    if (!confirmCheck.checked) {
      showError("Please confirm you understand this action is irreversible.");
      return;
    }

    const credential = firebase.auth.EmailAuthProvider.credential(currentUser.email, deletePassword);
    currentUser.reauthenticateWithCredential(credential).then(() => {
      // Delete all user data
      db.collection("users").doc(currentUser.uid).delete().then(() => {
        // Delete appointments
        db.collection("appointments").where("userId", "==", currentUser.uid).get()
          .then(snapshot => {
            const batch = db.batch();
            snapshot.forEach(doc => batch.delete(doc.ref));
            return batch.commit();
          })
          .then(() => {
            // Delete storage avatar
            return storage.ref(`avatars/${currentUser.uid}`).delete().catch(() => {});
          })
          .then(() => {
            // Delete auth account
            return currentUser.delete();
          })
          .then(() => {
            showToast("Account deleted successfully!");
            window.location.href = "index.html";
          })
          .catch(err => {
            console.error("Error deleting account:", err);
            showError("Failed to delete account.");
          });
      });
    }).catch(err => {
      console.error("Reauthentication failed:", err);
      showError("Password is incorrect.");
    });
  });

  // Guest overlay
  if (goSignup) {
    goSignup.addEventListener("click", () => {
      window.location.href = "signup.html";
    });
  }

  // Auth state changed
  auth.onAuthStateChanged(user => {
    currentUser = user;
    if (!user) {
      if (overlay) overlay.style.display = "flex";
      return;
    }

    if (overlay) overlay.style.display = "none";
    loadUserData();
    logActivity("login", "Logged in successfully");
  });
});
