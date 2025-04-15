/**
 * HistoryFlow Registration Page JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get form elements
    const registerForm = document.getElementById('registerForm');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const bioInput = document.getElementById('bio');
    
    // Form validation and submission
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Reset any existing errors
        clearAllErrors();
        
        // Validate name
        if (nameInput.value.trim() === '') {
            showError(nameInput, 'Please enter your name');
            return;
        }
        
        // Validate email
        if (!validateEmail(emailInput.value)) {
            showError(emailInput, 'Please enter a valid email address');
            return;
        }
        
        // Validate password
        if (passwordInput.value.length < 6) {
            showError(passwordInput, 'Password must be at least 6 characters');
            return;
        }
        
        // Validate password confirmation
        if (passwordInput.value !== confirmPasswordInput.value) {
            showError(confirmPasswordInput, 'Passwords do not match');
            return;
        }
        
        // Show loading state
        const submitButton = registerForm.querySelector('button[type="submit"]');
        submitButton.textContent = 'Registering...';
        submitButton.disabled = true;
        
        // Create user object and store in localStorage
        const user = {
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            bio: bioInput.value.trim(),
            registerDate: new Date().toLocaleDateString()
        };
        
        // Simulate registration process (remove in production)
        setTimeout(function() {
            // Store user data
            localStorage.setItem('hfUser', JSON.stringify(user));
            
            // Show success message or redirect
            showSuccessMessage('Registration successful! Redirecting to home page...');
            
            // Redirect to home page after short delay
            setTimeout(function() {
                window.location.href = 'home.html';
            }, 1500);
        }, 1000);
    });
    
    // Input event listeners to clear errors when user types
    const allInputs = [nameInput, emailInput, passwordInput, confirmPasswordInput, bioInput];
    allInputs.forEach(input => {
        input.addEventListener('input', function() {
            clearError(input);
        });
    });
    
    // Live password confirmation validation
    confirmPasswordInput.addEventListener('input', function() {
        if (passwordInput.value !== confirmPasswordInput.value && confirmPasswordInput.value !== '') {
            showError(confirmPasswordInput, 'Passwords do not match', false);
        } else {
            clearError(confirmPasswordInput);
        }
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
     * @param {boolean} focus - Whether to focus the input (default: true)
     */
    function showError(input, message, focus = true) {
        clearError(input);
        input.classList.add('error');
        
        // Create error message element
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        
        // Insert error message after the input
        input.parentNode.insertBefore(errorElement, input.nextSibling);
        
        // Focus the input
        if (focus) {
            input.focus();
        }
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
     * Clear all error messages from the form
     */
    function clearAllErrors() {
        allInputs.forEach(input => clearError(input));
    }
    
    /**
     * Show success message after form submission
     * @param {string} message - The success message
     */
    function showSuccessMessage(message) {
        // Hide the form
        registerForm.style.display = 'none';
        
        // Create success message container
        const successContainer = document.createElement('div');
        successContainer.className = 'success-message text-center py-8';
        
        // Create message element
        const messageElement = document.createElement('p');
        messageElement.className = 'text-hf-teal text-xl';
        messageElement.textContent = message;
        
        // Create loading spinner/icon
        const loadingElement = document.createElement('div');
        loadingElement.className = 'loading-spinner mt-4';
        loadingElement.innerHTML = '⏳';
        
        // Append elements
        successContainer.appendChild(messageElement);
        successContainer.appendChild(loadingElement);
        
        // Insert success container where the form was
        const formParent = registerForm.parentNode;
        formParent.insertBefore(successContainer, registerForm);
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