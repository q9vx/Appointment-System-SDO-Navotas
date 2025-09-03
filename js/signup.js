const signupForm = document.querySelector("form");

signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

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
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
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

        alert("Account created successfully! Please check your email to verify your account.");
        window.location.href = "login.html";

    } catch (error) {
        console.error(error);
        alert("Sign up failed: " + error.message);
    }
});