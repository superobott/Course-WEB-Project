/**
 * HistoryFlow Login Page JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get form elements
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    // Form validation and submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Basic form validation
        if (!validateEmail(emailInput.value)) {
            showError(emailInput, 'Please enter a valid email address');
            return;
        }
        
        if (passwordInput.value.length < 6) {
            showError(passwordInput, 'Password must be at least 6 characters');
            return;
        }
        
        // Create a fake user if none exists yet (for demo purposes)
        if (!localStorage.getItem('hfUser')) {
            const demoUser = {
                name: 'Demo User',
                email: emailInput.value,
                bio: 'History enthusiast',
                registerDate: new Date().toLocaleDateString()
            };
            localStorage.setItem('hfUser', JSON.stringify(demoUser));
        }
        
        // Show loading state (optional)
        const submitButton = loginForm.querySelector('button[type="submit"]');
        submitButton.textContent = 'Logging in...';
        submitButton.disabled = true;
        
        // Simulate login process (remove in production and replace with actual login)
        setTimeout(function() {
            // Redirect to home page after successful login
            window.location.href = 'home.html';
        }, 1000);
    });
    
    // Input event listeners to clear errors when user types
    emailInput.addEventListener('input', function() {
        clearError(emailInput);
    });
    
    passwordInput.addEventListener('input', function() {
        clearError(passwordInput);
    });
    
    /**
     * Basic email validation function
     * @param {string} email - The email to validate
     * @returns {boolean} Whether the email is valid
     */
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    /**
     * Show error message for an input
     * @param {HTMLElement} input - The input element
     * @param {string} message - The error message
     */
    function showError(input, message) {
        clearError(input);
        input.classList.add('error');
        
        // Create error message element
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        
        // Insert error message after the input
        input.parentNode.insertBefore(errorElement, input.nextSibling);
    }
    
    /**
     * Clear error styling and message
     * @param {HTMLElement} input - The input element
     */
    function clearError(input) {
        input.classList.remove('error');
        
        // Remove any existing error message
        const parent = input.parentNode;
        const errorElement = parent.querySelector('.error-message');
        if (errorElement) {
            parent.removeChild(errorElement);
        }
    }
    
    /**
     * Check if user is already logged in
     * Redirect to home page if user data exists
     */
    function checkLoggedInStatus() {
        const userData = localStorage.getItem('hfUser');
        if (userData) {
            // User is already logged in, redirect to home
            window.location.href = 'home.html';
        }
    }
    
    // Uncomment to enable automatic redirect if user is already logged in
    // checkLoggedInStatus();
});