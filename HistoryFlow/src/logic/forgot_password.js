// forgot_password.js
/**
 * HistoryFlow Password Recovery Page JavaScript
 * Enhanced for security, accessibility and user experience
 * @version 1.0.0
 */

document.addEventListener("DOMContentLoaded", () => {
    // Form elements
    const recoveryForm = document.getElementById("recoveryForm");
    const emailInput = document.getElementById("email");
    const securityQuestionInput = document.getElementById("securityQuestion");
    const securityAnswerInput = document.getElementById("securityAnswer");
    const resetButton = document.getElementById("resetButton");
    const errorContainer = document.getElementById("errorContainer");
    const messageBanner = document.getElementById("messageBanner");
    const rateLimitNotice = document.getElementById("rateLimitNotice");
    
    // Generate and set CSRF token
    const csrfToken = generateCSRFToken();
    document.getElementById("csrfToken").value = csrfToken;
    
    // Recovery attempts counter for rate limiting
    let recoveryAttempts = 0;
    const MAX_RECOVERY_ATTEMPTS = 3;
    let cooldownTimer = 30;
    let cooldownInterval;
    
    // Form validation and submission
    recoveryForm.addEventListener("submit", (event) => {
      event.preventDefault();
      
      // Clear previous errors
      clearErrors();
      
      // Check if rate limited
      if (isRateLimited()) {
        showRateLimitNotice();
        return;
      }
      
      // Validate form
      if (!validateForm()) {
        return;
      }
      
      // Show loading state
      setLoadingState(true);
      
      // Get form data
      const email = emailInput.value.trim();
      const securityQuestion = securityQuestionInput.value.trim();
      const securityAnswer = securityAnswerInput.value.trim();
      
      // Check if CSRF token is valid
      if (!validateCSRFToken(csrfToken)) {
        showError("Security validation failed. Please refresh the page and try again.");
        setLoadingState(false);
        return;
      }
      
      // Check if honeypot field was filled (bot detection)
      if (document.getElementById("website").value !== "") {
        logSecurityEvent("Bot detected: honeypot field filled");
        // Silently reject but simulate processing to avoid alerting the bot
        setTimeout(() => {
          setLoadingState(false);
          showSuccess("Processing your request...");
        }, 2000);
        return;
      }
      
      // Get users from localStorage (in a real app, this would be a server request)
      const users = JSON.parse(localStorage.getItem("users")) || [];
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      // Simulate server request with a timeout
      setTimeout(() => {
        if (user && user.securityQuestion === securityQuestion && 
            user.securityAnswer.toLowerCase() === securityAnswer.toLowerCase()) {
          // Success path
          handleSuccessfulRecovery(user);
        } else {
          // Failed recovery path
          handleFailedRecovery();
        }
      }, 1500);
    });
    
    /**
     * Validates the full form
     * @returns {boolean} Whether the form is valid
     */
    function validateForm() {
      let isValid = true;
      
      // Validate email
      if (!emailInput.value.trim()) {
        showFieldError(emailInput, "Please enter your email");
        isValid = false;
      } else if (!validateEmail(emailInput.value.trim())) {
        showFieldError(emailInput, "Please enter a valid email address");
        isValid = false;
      }
      
      // Validate security question
      if (!securityQuestionInput.value.trim()) {
        showFieldError(securityQuestionInput, "Please select a security question");
        isValid = false;
      }
      
      // Validate security answer
      if (!securityAnswerInput.value.trim()) {
        showFieldError(securityAnswerInput, "Please enter your answer");
        isValid = false;
      }
      
      // Focus first invalid field
      if (!isValid) {
        const firstInvalidField = document.querySelector("[aria-invalid='true']");
        if (firstInvalidField) {
          firstInvalidField.focus();
        }
      }
      
      return isValid;
    }
    
    /**
     * Handles a successful recovery
     * @param {Object} user - The user data
     */
    function handleSuccessfulRecovery(user) {
      setLoadingState(false);
      
      // Reset recovery attempts
      recoveryAttempts = 0;
      
      // Show success message
      showSuccess("Password reset email sent. Please check your inbox.");
      
      // In a real app, we would:
      // 1. Send a password reset email to the user
      // 2. Generate a unique token for the reset flow
      // 3. Store the token with an expiration time
      
      // For demo purposes, store email in localStorage
      localStorage.setItem("resetEmail", user.email);
      
      // Log the event (in production, send to analytics)
      logEvent("password_recovery_success", { email: user.email });
      
      // Redirect to reset password page after delay
      setTimeout(() => {
        window.location.href = "reset_password.html";
      }, 3000);
    }
    
    /**
     * Handles a failed recovery attempt
     */
    function handleFailedRecovery() {
      setLoadingState(false);
      
      // Increment recovery attempts
      recoveryAttempts++;
      
      // Show appropriate error message
      if (recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
        showRateLimitNotice();
        startCooldownTimer();
      } else {
        showError(`Invalid email or security answer. Please try again. (${MAX_RECOVERY_ATTEMPTS - recoveryAttempts} attempts remaining)`);
      }
      
      // Log the event (in production, send to security monitoring)
      logEvent("password_recovery_failure", { 
        attempts: recoveryAttempts, 
        email: emailInput.value.trim() 
      });
    }
    
    /**
     * Shows field-specific error messages
     * @param {HTMLElement} field - The input field
     * @param {string} message - The error message
     */
    function showFieldError(field, message) {
      field.setAttribute("aria-invalid", "true");
      field.classList.add("error");
      
      const errorElement = document.getElementById(`${field.id}Error`);
      if (errorElement) {
        errorElement.textContent = message;
        errorElement.hidden = false;
      }
    }
    
    /**
     * Shows a global error message
     * @param {string} message - The error message
     */
    function showError(message) {
      errorContainer.textContent = message;
      errorContainer.classList.remove("hidden");
      errorContainer.classList.add("error-banner");
    }
    
    /**
     * Shows a success message banner
     * @param {string} message - The success message
     */
    function showSuccess(message) {
      messageBanner.textContent = message;
      messageBanner.classList.remove("hidden", "error-banner");
      messageBanner.classList.add("success-banner");
    }
    
    /**
     * Clears all error messages
     */
    function clearErrors() {
      // Clear field errors
      [emailInput, securityQuestionInput, securityAnswerInput].forEach(field => {
        field.setAttribute("aria-invalid", "false");
        field.classList.remove("error");
        
        const errorElement = document.getElementById(`${field.id}Error`);
        if (errorElement) {
          errorElement.textContent = "";
          errorElement.hidden = true;
        }
      });
      
      // Clear global error
      errorContainer.textContent = "";
      errorContainer.classList.add("hidden");
      
      // Hide message banner
      messageBanner.classList.add("hidden");
    }
    
    /**
     * Sets the loading state of the form
     * @param {boolean} isLoading - Whether the form is in a loading state
     */
    function setLoadingState(isLoading) {
      const buttonText = resetButton.querySelector("span");
      const spinner = resetButton.querySelector(".spinner");
      
      if (isLoading) {
        buttonText.textContent = "Processing...";
        spinner.classList.remove("hidden");
        resetButton.disabled = true;
        resetButton.classList.add("loading");
        
        // Disable form fields
        emailInput.disabled = true;
        securityQuestionInput.disabled = true;
        securityAnswerInput.disabled = true;
      } else {
        buttonText.textContent = "Reset Password";
        spinner.classList.add("hidden");
        resetButton.disabled = false;
        resetButton.classList.remove("loading");
        
        // Re-enable form fields
        emailInput.disabled = false;
        securityQuestionInput.disabled = false;
        securityAnswerInput.disabled = false;
      }
    }
    
    /**
     * Checks if the user is rate limited
     * @returns {boolean} Whether the user is rate limited
     */
    function isRateLimited() {
      return recoveryAttempts >= MAX_RECOVERY_ATTEMPTS;
    }
    
    /**
     * Shows the rate limit notice
     */
    function showRateLimitNotice() {
      rateLimitNotice.classList.remove("hidden");
      errorContainer.classList.add("hidden");
    }
    
    /**
     * Starts the cooldown timer
     */
    function startCooldownTimer() {
      // Reset the timer
      cooldownTimer = 30;
      document.getElementById("cooldownTimer").textContent = cooldownTimer;
      
      // Clear any existing interval
      if (cooldownInterval) {
        clearInterval(cooldownInterval);
      }
      
      // Start the countdown
      cooldownInterval = setInterval(() => {
        cooldownTimer--;
        document.getElementById("cooldownTimer").textContent = cooldownTimer;
        
        if (cooldownTimer <= 0) {
          // Reset when timer expires
          clearInterval(cooldownInterval);
          rateLimitNotice.classList.add("hidden");
          recoveryAttempts = 0;
        }
      }, 1000);
    }
    
    /**
     * Validates email format
     * @param {string} email - The email to validate
     * @returns {boolean} Whether the email is valid
     */
    function validateEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    /**
     * Generates a CSRF token
     * In a real app, this would come from the server
     * @returns {string} A CSRF token
     */
    function generateCSRFToken() {
      // In production, this would be set by the server
      return 'csrf_' + Math.random().toString(36).substring(2, 15);
    }
    
    /**
     * Validates the CSRF token
     * In a real app, this would be validated server-side
     * @param {string} token - The CSRF token to validate
     * @returns {boolean} Whether the token is valid
     */
    function validateCSRFToken(token) {
      // In production, this would be validated by the server
      return token && token.startsWith('csrf_');
    }
    
    /**
     * Logs events for analytics
     * @param {string} eventName - The name of the event
     * @param {Object} data - Additional event data
     */
    function logEvent(eventName, data) {
      console.log(`[EVENT] ${eventName}:`, data);
      // In production, send to analytics service
    }
    
    /**
     * Logs security events
     * @param {string} message - The security event message
     */
    function logSecurityEvent(message) {
      console.warn(`[SECURITY] ${message}`);
      // In production, send to security monitoring
    }
  });