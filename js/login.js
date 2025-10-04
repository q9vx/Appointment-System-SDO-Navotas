const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

loginForm.addEventListener("submit", async (e) => {
e.preventDefault();
loginError.textContent = "";

const loginBtn = document.getElementById("loginBtn");
const loginSpinner = document.getElementById("loginSpinner");

// Disable button and show spinner
loginBtn.disabled = true;
loginSpinner.style.display = "inline-block";

const role = document.getElementById("role").value;
const loginId = document.getElementById("loginId").value.trim();
const email = document.getElementById("loginEmail").value.trim();
const password = document.getElementById("loginPassword").value.trim();

if (!role || !loginId || !email || !password) {
loginError.textContent = "Please fill in all fields.";
loginBtn.disabled = false;
loginSpinner.style.display = "none";
return;
}

try {
console.log("Attempting login with email:", email, "password length:", password.length);

// Set persistence based on "Remember me" checkbox
const rememberMe = document.getElementById("rememberMe").checked;
const persistence = rememberMe ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION;
await auth.setPersistence(persistence);

const userCredential = await auth.signInWithEmailAndPassword(email, password);
const user = userCredential.user;

await user.reload();
if (!user.emailVerified) {
loginError.textContent = "Please verify your email before logging in.";
await auth.signOut();
loginBtn.disabled = false;
loginSpinner.style.display = "none";
return;
}

const userDoc = await db.collection("users").doc(user.uid).get();
if (!userDoc.exists) {
loginError.textContent = "User record not found.";
loginBtn.disabled = false;
loginSpinner.style.display = "none";
return;
}

const userData = userDoc.data();
if (userData.role !== role || userData.idNumber !== loginId) {
loginError.textContent = "Invalid ID or role.";
loginBtn.disabled = false;
loginSpinner.style.display = "none";
return;
}

window.location.href = "index.html";

} catch (error) {
console.error(error);
loginError.textContent = error.message || "Login failed. Please check your credentials.";
} finally {
loginBtn.disabled = false;
loginSpinner.style.display = "none";
}
});

// Validation for loginId field to accept numbers only
document.addEventListener('DOMContentLoaded', () => {
  const loginIdInput = document.getElementById('loginId');

  function validateLoginIdInput(input) {
    const regex = /^[0-9]*$/; // numbers only

    let value = input.value;
    let valid = true;
    let errorMessage = '';

    // Check numbers only
    if (!regex.test(value)) {
      valid = false;
      errorMessage = 'Only numbers are allowed.';
      // Remove non-numeric characters
      value = value.replace(/[^0-9]/g, '');
      input.value = value;
    }

    // Show error styling and message
    if (!valid) {
      input.classList.add('is-invalid');
      if (!input.nextElementSibling || !input.nextElementSibling.classList.contains('invalid-feedback')) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = errorMessage;
        input.parentNode.appendChild(errorDiv);
      } else {
        input.nextElementSibling.textContent = errorMessage;
      }
    } else {
      input.classList.remove('is-invalid');
      if (input.nextElementSibling && input.nextElementSibling.classList.contains('invalid-feedback')) {
        input.nextElementSibling.remove();
      }
    }
  }

  loginIdInput.addEventListener('input', () => validateLoginIdInput(loginIdInput));
});

// Password visibility toggle
const toggleLoginPassword = document.getElementById("toggleLoginPassword");
const loginPasswordInput = document.getElementById("loginPassword");

toggleLoginPassword.addEventListener("click", () => {
const type = loginPasswordInput.type === "password" ? "text" : "password";
loginPasswordInput.type = type;
toggleLoginPassword.innerHTML = type === "password" ? '<i class="bi bi-eye"></i>' : '<i class="bi bi-eye-slash"></i>';
});
