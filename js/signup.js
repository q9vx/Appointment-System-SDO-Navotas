const signupForm = document.querySelector("form");

signupForm.addEventListener("submit", async (e) => {
e.preventDefault();

const signupBtn = document.getElementById("signupBtn");
const loadingSpinner = document.getElementById("loadingSpinner");

// Disable button and show spinner
signupBtn.disabled = true;
loadingSpinner.style.display = "inline-block";

const role = document.getElementById("role").value;
const idNumber = role === "teacher" ? document.getElementById("teacherId").value.trim()
: document.getElementById("studentId").value.trim();
const firstName = document.getElementById("firstName").value.trim();
const lastName = document.getElementById("lastName").value.trim();
const email = document.getElementById("signupEmail").value.trim();
const password = document.getElementById("signupPassword").value;
const confirmPassword = document.getElementById("confirmPassword").value;

if (!role || !idNumber || !firstName || !lastName || !email || !password || !confirmPassword) {
alert("Please fill in all fields.");
signupBtn.disabled = false;
loadingSpinner.style.display = "none";
return;
}

if (password !== confirmPassword) {
alert("Passwords do not match.");
signupBtn.disabled = false;
loadingSpinner.style.display = "none";
return;
}

// Check for invalid email domains
const invalidDomains = ["example.com", "test.com", "fake.com", "placeholder.com"];
const emailDomain = email.split("@")[1]?.toLowerCase();
if (invalidDomains.includes(emailDomain)) {
alert("Please use a valid email address, not a placeholder or test domain.");
signupBtn.disabled = false;
loadingSpinner.style.display = "none";
return;
}

// Check if terms checkbox is checked
const termsCheckbox = document.getElementById("termsCheckbox");
if (!termsCheckbox || !termsCheckbox.checked) {
alert("You must agree to the Terms of Service.");
signupBtn.disabled = false;
loadingSpinner.style.display = "none";
return;
}

try {

const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
const user = userCredential.user;
await user.sendEmailVerification();

await firebase.firestore().collection("users").doc(user.uid).set({
role: role,
idNumber: idNumber,
firstName: firstName,
lastName: lastName,
email: email
});

const successMessage = document.getElementById("successMessage");
successMessage.textContent = "Account created successfully! Please check your email to verify your account. You will be redirected to login in 5 seconds.";
successMessage.style.display = "block";
setTimeout(() => window.location.href = "login.html", 5000);

} catch (error) {
console.error(error);
alert("Sign up failed: " + error.message);
} finally {
signupBtn.disabled = false;
loadingSpinner.style.display = "none";
}
});

// Password visibility toggle
// Validation for firstName and lastName fields with max 30 chars and alphabets only

document.addEventListener('DOMContentLoaded', () => {
  const firstNameInput = document.getElementById('firstName');
  const lastNameInput = document.getElementById('lastName');

  function validateNameInput(input) {
    const maxLength = 30;
    const regex = /^[A-Za-z]*$/; // alphabets only

    let value = input.value;
    let valid = true;
    let errorMessage = '';

    // Check length
    if (value.length > maxLength) {
      valid = false;
      errorMessage = `Maximum length is ${maxLength} characters.`;
      value = value.substring(0, maxLength);
      input.value = value;
    }

    // Check alphabets only
    if (!regex.test(value)) {
      valid = false;
      errorMessage = 'Only alphabets are allowed.';
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

  firstNameInput.addEventListener('input', () => validateNameInput(firstNameInput));
  lastNameInput.addEventListener('input', () => validateNameInput(lastNameInput));

  // Password strength indicator
  const passwordInput = document.getElementById('signupPassword');
  const strengthBar = document.getElementById('strengthBar');
  const strengthText = document.getElementById('strengthText');

  function checkPasswordStrength(password) {
    let strength = 0;
    let feedback = [];

    if (password.length >= 8) strength++;
    else feedback.push("At least 8 characters");

    if (/[a-z]/.test(password)) strength++;
    else feedback.push("Lowercase letter");

    if (/[A-Z]/.test(password)) strength++;
    else feedback.push("Uppercase letter");

    if (/[0-9]/.test(password)) strength++;
    else feedback.push("Number");

    if (/[^A-Za-z0-9]/.test(password)) strength++;
    else feedback.push("Special character");

    return { strength, feedback };
  }

  passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    const { strength, feedback } = checkPasswordStrength(password);

    let width = (strength / 5) * 100;
    strengthBar.style.width = width + '%';

    if (strength < 2) {
      strengthBar.className = 'progress-bar bg-danger';
      strengthText.textContent = 'Weak: ' + feedback.join(', ');
    } else if (strength < 4) {
      strengthBar.className = 'progress-bar bg-warning';
      strengthText.textContent = 'Medium: ' + feedback.join(', ');
    } else {
      strengthBar.className = 'progress-bar bg-success';
      strengthText.textContent = 'Strong';
    }
  });
});

// Password visibility toggle
const toggleSignupPassword = document.getElementById("toggleSignupPassword");
const signupPasswordInput = document.getElementById("signupPassword");

toggleSignupPassword.addEventListener("click", () => {
const type = signupPasswordInput.type === "password" ? "text" : "password";
signupPasswordInput.type = type;
toggleSignupPassword.innerHTML = type === "password" ? '<i class="bi bi-eye"></i>' : '<i class="bi bi-eye-slash"></i>';
});

const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");

toggleConfirmPassword.addEventListener("click", () => {
const type = confirmPasswordInput.type === "password" ? "text" : "password";
confirmPasswordInput.type = type;
toggleConfirmPassword.innerHTML = type === "password" ? '<i class="bi bi-eye"></i>' : '<i class="bi bi-eye-slash"></i>';
});


