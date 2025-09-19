const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const resetMessage = document.getElementById("resetMessage");
forgotPasswordForm.addEventListener("submit", (e) => {
e.preventDefault();

const email = document.getElementById("resetEmail").value;
const auth = firebase.auth();

auth.sendPasswordResetEmail(email)
.then(() => {
resetMessage.innerHTML = `<span class="text-success">Password reset link sent! Check your email: ${email}</span>`;
forgotPasswordForm.reset();
})
.catch((error) => {
let errorMsg = "";
if (error.code === "auth/user-not-found") {
errorMsg = "No account found with this email.";
} else if (error.code === "auth/invalid-email") {
errorMsg = "Please enter a valid email address.";
} else {
errorMsg = error.message;
}
resetMessage.innerHTML = `<span class="text-danger">${errorMsg}</span>`;
});
});
