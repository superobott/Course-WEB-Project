// login.js
/**
 * HistoryFlow Login Page JavaScript
 * Enhanced for security, accessibility and user experience
 * @version 1.0.2
 */

document.addEventListener("DOMContentLoaded", () => {
  // Form elements
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const togglePasswordButton = document.getElementById("togglePassword");
  const loginButton = document.getElementById("loginButton");
  const errorContainer = document.getElementById("errorContainer");
  const messageBanner = document.getElementById("messageBanner");
  const rateLimitNotice = document.getElementById("rateLimitNotice");
  const cookieConsent = document.getElementById("cookieConsent");
  const acceptCookiesButton = document.getElementById("acceptCookies");
  const rejectCookiesButton = document.getElementById("rejectCookies");
  
  // Generate and set CSRF token
  const csrfToken = generateCSRFToken();
  document.getElementById("csrfToken").value = csrfToken;
  
  // Login attempts counter for rate limiting demo
  let loginAttempts = 0;
  const MAX_LOGIN_ATTEMPTS = 3;
  let cooldownTimer = 30;
  let cooldownInterval;
  
  // Initialize cookie consent banner
  initCookieConsent();
  
  // Toggle password visibility
  togglePasswordButton.addEventListener("click", () => {
    const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);
    
    // Update button text for accessibility
    const label = type === "password" ? "Show password" : "Hide password";
    togglePasswordButton.setAttribute("aria-label", label);
    
    // Update icon
    const eyeIcon = togglePasswordButton.querySelector(".eye-icon");
    eyeIcon.textContent = type === "password" ? "👁️" : "👁️‍🗨️";
  });
  
  // Form validation and submission
  loginForm.addEventListener("submit", (event) => {
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
    const password = passwordInput.value.trim();
    
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
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    
    // Simulate server request with a timeout
    setTimeout(() => {
      if (user) {
        // Success path
        handleSuccessfulLogin(user);
      } else {
        // Failed login path
        handleFailedLogin();
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
    
    // Validate password
    if (!passwordInput.value.trim()) {
      showFieldError(passwordInput, "Please enter your password");
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
   * Handles a successful login
   * @param {Object} user - The user data
   */
  function handleSuccessfulLogin(user) {
    setLoadingState(false);
    
    // Reset login attempts
    loginAttempts = 0;
    
    // Show success message
    showSuccess("Login successful! Redirecting to dashboard...");
    
    // In a real app, we would:
    // 1. Receive a JWT or session token from the server
    // 2. Store it in localStorage or secure cookie
    // 3. Set up authentication headers for future API requests
    
    // Create a mock session token and store it
    const sessionToken = generateSessionToken(user.email);
    localStorage.setItem("sessionToken", sessionToken);
    localStorage.setItem("currentUser", JSON.stringify({
      name: user.name,
      email: user.email,
      lastLogin: new Date().toISOString()
    }));
    
    // Log the event (in production, send to analytics)
    logEvent("login_success", { email: user.email });
    
    // Redirect to dashboard
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1500);
  }
  
  /**
   * Handles a failed login attempt
   */
  function handleFailedLogin() {
    setLoadingState(false);
    
    // Increment login attempts
    loginAttempts++;
    
    // Show appropriate error message
    if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      showRateLimitNotice();
      startCooldownTimer();
    } else {
      showError(`Invalid email or password. Please try again. (${MAX_LOGIN_ATTEMPTS - loginAttempts} attempts remaining)`);
    }
    
    // Log the event (in production, send to security monitoring)
    logEvent("login_failure", { 
      attempts: loginAttempts, 
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
      errorElement.classList.remove("hidden");
    }
  }
  
  /**
   * Shows a global error message
   * @param {string} message - The error message
   */
  function showError(message) {
    errorContainer.textContent = message;
    errorContainer.classList.remove("hidden");
    errorContainer.classList.add("error-message");
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
    [emailInput, passwordInput].forEach(field => {
      field.setAttribute("aria-invalid", "false");
      field.classList.remove("error");
      
      const errorElement = document.getElementById(`${field.id}Error`);
      if (errorElement) {
        errorElement.textContent = "";
        errorElement.classList.add("hidden");
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
    const buttonText = loginButton.querySelector("span");
    const spinner = loginButton.querySelector(".spinner");
    
    if (isLoading) {
      buttonText.textContent = "Logging in...";
      spinner.classList.remove("hidden");
      loginButton.disabled = true;
      loginButton.classList.add("loading");
      
      // Disable form fields
      emailInput.disabled = true;
      passwordInput.disabled = true;
    } else {
      buttonText.textContent = "Login";
      spinner.classList.add("hidden");
      loginButton.disabled = false;
      loginButton.classList.remove("loading");
      
      // Re-enable form fields
      emailInput.disabled = false;
      passwordInput.disabled = false;
    }
  }
  
  /**
   * Checks if the user is rate limited
   * @returns {boolean} Whether the user is rate limited
   */
  function isRateLimited() {
    return loginAttempts >= MAX_LOGIN_ATTEMPTS;
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
        loginAttempts = 0;
      }
    }, 1000);
  }
  
  /**
   * Initializes the cookie consent banner
   */
  function initCookieConsent() {
    // Check if user has already made a choice
    const cookieChoice = localStorage.getItem("cookieConsent");
    if (cookieChoice) {
      cookieConsent.classList.add("hidden");
      return;
    }
    
    // Show the banner
    cookieConsent.classList.remove("hidden");
    
    // Accept cookies
    acceptCookiesButton.addEventListener("click", () => {
      localStorage.setItem("cookieConsent", "accepted");
      cookieConsent.classList.add("hidden");
    });
    
    // Reject cookies
    rejectCookiesButton.addEventListener("click", () => {
      localStorage.setItem("cookieConsent", "rejected");
      cookieConsent.classList.add("hidden");
    });
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
   * Generates a mock session token
   * In a real app, this would be issued by the server
   * @param {string} email - The user's email
   * @returns {string} A session token
   */
  function generateSessionToken(email) {
    // In production, this would be a JWT or other token from the server
    return `mock_jwt_${btoa(email)}_${Date.now()}`;
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