// forgot_password.js
/**
 * HistoryFlow Password Recovery Page JavaScript
 * Enhanced for security, accessibility, and user experience
 * @version 1.1.0
 */

document.addEventListener("DOMContentLoaded", () => {
    // Form elements
    const recoveryForm = document.getElementById("recoveryForm");
    const emailInput = document.getElementById("email");
    const newPasswordInput = document.getElementById("newPassword");
    const securityQuestionInput = document.getElementById("securityQuestion");
    const securityAnswerInput = document.getElementById("securityAnswer");
    const resetButton = document.getElementById("resetButton");
    const errorContainer = document.getElementById("errorContainer");
    const rateLimitNotice = document.getElementById("rateLimitNotice");
    const togglePasswordButton = document.getElementById("togglePassword");
    const csrfTokenField = document.getElementById("csrfToken");

    // Generate and set CSRF token
    csrfTokenField.value = generateCSRFToken();

    if (togglePasswordButton && newPasswordInput) {
        togglePasswordButton.addEventListener("click", () => {
            const type = newPasswordInput.getAttribute("type") === "password" ? "text" : "password";
            newPasswordInput.setAttribute("type", type);
            togglePasswordButton.querySelector(".eye-icon").textContent = type === "password" ? "👁️" : "👁️‍🗨️";
            togglePasswordButton.setAttribute("aria-label", type === "password" ? "Show password" : "Hide password");
        });
    }

    recoveryForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearMessages();

        // Validate CSRF token
        const submittedToken = csrfTokenField.value;
        if (!validateCSRFToken(submittedToken)) {
            showError("Invalid request. Please refresh and try again.");
            logSecurityEvent("Invalid CSRF token detected");
            return;
        }

        const email = emailInput.value.trim();
        const newPassword = newPasswordInput.value.trim();
        const securityQuestion = securityQuestionInput.value;
        const securityAnswer = securityAnswerInput.value.trim();

        if (!validateInputs(email, newPassword, securityQuestion, securityAnswer)) {
            return;
        }

        setLoadingState(true);

        try {
            const users = JSON.parse(localStorage.getItem("users")) || [];
            const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());

            if (userIndex === -1) {
                showError("Email not found. Please check your email address.");
                setLoadingState(false);
                return;
            }

            const user = users[userIndex];

            if (user.securityQuestion !== securityQuestion || 
                user.securityAnswer.toLowerCase() !== securityAnswer.toLowerCase()) {
                showError("Incorrect security answer. Try again.");
                setLoadingState(false);
                return;
            }

            user.password = newPassword;
            users[userIndex] = user;
            localStorage.setItem("users", JSON.stringify(users));

            showSuccess("Password updated! Redirecting...");

            setTimeout(() => {
                window.location.href = "index.html";
            }, 2000);

        } catch (error) {
            showError("An error occurred. Please try again.");
            console.error("Password reset error:", error);
            setLoadingState(false);
        }
    });

    function validateInputs(email, password, question, answer) {
        if (!email || !validateEmail(email)) {
            showError("Enter a valid email address.");
            return false;
        }
        if (!password || password.length < 8) {
            showError("Password must have at least 8 characters.");
            return false;
        }
        if (!question) {
            showError("Select a security question.");
            return false;
        }
        if (!answer) {
            showError("Answer the security question.");
            return false;
        }
        return true;
    }

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function showError(message) {
        errorContainer.textContent = message;
        errorContainer.classList.remove("hidden");
        errorContainer.classList.add("alert-error");
    }

    function showSuccess(message) {
        errorContainer.textContent = message;
        errorContainer.classList.remove("hidden", "alert-error");
        errorContainer.classList.add("alert-success");
    }

    function clearMessages() {
        errorContainer.textContent = "";
        errorContainer.classList.add("hidden");
        errorContainer.classList.remove("alert-error", "alert-success");
    }

    function setLoadingState(isLoading) {
        resetButton.disabled = isLoading;
        resetButton.querySelector("span").textContent = isLoading ? "Processing..." : "Reset Password";
        resetButton.querySelector(".spinner").classList.toggle("hidden", !isLoading);
        [emailInput, newPasswordInput, securityQuestionInput, securityAnswerInput].forEach(input => input.disabled = isLoading);
    }

    function generateCSRFToken() {
        return 'csrf_' + Math.random().toString(36).substring(2, 15);
    }

    function validateCSRFToken(token) {
        return token && token.startsWith('csrf_');
    }

    function logSecurityEvent(message) {
        console.warn(`[SECURITY] ${message}`);
    }
});
