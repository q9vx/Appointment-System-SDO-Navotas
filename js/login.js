// login.js

const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";

  const role = document.getElementById("role").value;
  const loginId = document.getElementById("loginId").value.trim();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!role || !loginId || !email || !password) {
    loginError.textContent = "Please fill in all fields.";
    return;
  }

  try {
    // Sign in user
    const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Verify ID in Firestore
    const userDoc = await firebase.firestore().collection("users").doc(user.uid).get();
    if (!userDoc.exists) {
      loginError.textContent = "User record not found.";
      return;
    }

    const userData = userDoc.data();
    if (userData.role !== role || userData.idNumber !== loginId) {
      loginError.textContent = "Invalid ID or role.";
      return;
    }

    // Redirect to dashboard
    window.location.href = "dashboard.html";

  } catch (error) {
    console.error(error);
    loginError.textContent = error.message || "Login failed. Please check your credentials.";
  }
});
