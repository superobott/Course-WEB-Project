// register.js
/**
 * HistoryFlow Registration Page JavaScript
 * Enhanced for accessibility, security, and UX
 * @version 1.0.2
 */

document.addEventListener('DOMContentLoaded', function() {
    // Generate CSRF token and set in form
    const csrfToken = generateCSRFToken();
    document.getElementById('csrfToken').value = csrfToken;
    
    // Store form elements
    const registerForm = document.getElementById('registerForm');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const gdprConsentCheckbox = document.getElementById('gdprConsent');
    const registerButton = document.getElementById('registerButton');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');
    const errorContainer = document.getElementById('errorContainer');
    const successMessage = document.getElementById('successMessage');
    
    // CAPTCHA elements
    const mockCaptcha = document.getElementById('mockCaptcha');
    const captchaCheckbox = document.getElementById('captchaCheckbox');
    const captchaChallenge = document.getElementById('captchaChallenge');
    const mathProblem = document.getElementById('mathProblem');
    const captchaInput = document.getElementById('captchaInput');
    const verifyCaptchaBtn = document.getElementById('verifyCaptchaBtn');
    const captchaError = document.getElementById('captchaError');
    
    // Captcha state
    let captchaVerified = false;
    let currentMathAnswer = null;
    
    // Initialize CAPTCHA
    initCaptcha();
    
    // Focus the first input on page load for accessibility
    nameInput.focus();
    
    // Password toggle visibility functionality
    togglePasswordBtn.addEventListener('click', function() {
        togglePasswordVisibility(passwordInput, this);
    });
    
    toggleConfirmPasswordBtn.addEventListener('click', function() {
        togglePasswordVisibility(confirmPasswordInput, this);
    });
    
    // Live password strength meter
    passwordInput.addEventListener('input', function() {
        updatePasswordStrength(this.value);
    });
    
    // Form validation and submission
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Reset all errors
        clearAllErrors();
        
        // Validate all fields
        const isValid = validateAllFields();
        
        if (!isValid) {
            // Focus the first invalid field for accessibility
            focusFirstInvalidField();
            return;
        }
        
        // Show loading state
        showLoadingState();
        
        // Verify CAPTCHA
        if (!captchaVerified) {
            showGlobalError('Please complete the "I\'m not a robot" verification.');
            hideLoadingState();
            return;
        }
        
        // Check if user already exists in localStorage
        const username = nameInput.value.trim();
        const email = emailInput.value.trim();
        
        // Get existing users or initialize empty array
        let users = JSON.parse(localStorage.getItem('users')) || [];
        
        // Check for existing users
        const usernameExists = users.some(user => user.name.toLowerCase() === username.toLowerCase());
        const emailExists = users.some(user => user.email.toLowerCase() === email.toLowerCase());
        
        if (usernameExists) {
            showGlobalError('Username already exists. Please choose a different username.');
            hideLoadingState();
            nameInput.focus();
            return;
        }
        
        if (emailExists) {
            showGlobalError('Email already exists. Please use a different email or login.');
            hideLoadingState();
            emailInput.focus();
            return;
        }
        
        // Create user object - in a real app, you would hash the password
        const user = {
            name: username,
            email: email,
            password: passwordInput.value, // NEVER store plain passwords in production
            registerDate: new Date().toISOString(),
            gdprConsent: gdprConsentCheckbox.checked
        };
        
        // Add new user to array
        users.push(user);
        
        // Simulate network request to server
        setTimeout(function() {
            try {
                // Store updated users array in localStorage
                localStorage.setItem('users', JSON.stringify(users));
                
                // Log registration success (in production, send to analytics)
                logEvent('registration_success', { username });
                
                // Hide form and show success message
                registerForm.hidden = true;
                successMessage.hidden = false;
                
                // Redirect to login page after delay
                setTimeout(function() {
                    window.location.href = 'login.html';
                }, 2000);
            } catch (error) {
                // Handle errors (localStorage full, etc)
                logError('registration_error', error);
                hideLoadingState();
                showGlobalError('An error occurred during registration. Please try again.');
            }
        }, 1500);
    });
    
    // Input event listeners to clear errors when user types
    const allInputs = [nameInput, emailInput, passwordInput, confirmPasswordInput];
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
        
        // Update aria-invalid attribute for screen readers
        confirmPasswordInput.setAttribute('aria-invalid', 
            passwordInput.value !== confirmPasswordInput.value && confirmPasswordInput.value !== '');
    });
    
    // Checkbox event listener
    gdprConsentCheckbox.addEventListener('change', function() {
        const errorElement = document.getElementById(`${this.id}Error`);
        if (errorElement) {
            errorElement.hidden = true;
        }
    });
    
    /**
     * CAPTCHA implementation
     */
    function initCaptcha() {
        // When user clicks the captcha checkbox
        mockCaptcha.addEventListener('click', function() {
            if (!captchaVerified) {
                // Generate and display a math problem
                generateMathProblem();
                captchaChallenge.classList.add('active');
            }
        });
        
        // Verify button click handler
        verifyCaptchaBtn.addEventListener('click', verifyCaptchaAnswer);
        
        // Allow Enter key to submit the captcha
        captchaInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                verifyCaptchaAnswer();
            }
        });
    }
    
    /**
     * Generates a simple math problem for CAPTCHA
     */
    function generateMathProblem() {
        // Generate two random numbers (1-20)
        const num1 = Math.floor(Math.random() * 20) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        
        // Randomly choose operation (addition, subtraction, multiplication)
        const operations = ['+', '-', '×'];
        const opIndex = Math.floor(Math.random() * operations.length);
        const operation = operations[opIndex];
        
        let answer;
        switch(operation) {
            case '+':
                answer = num1 + num2;
                break;
            case '-':
                // Ensure result is positive
                if (num1 >= num2) {
                    answer = num1 - num2;
                } else {
                    answer = num2 - num1;
                    mathProblem.textContent = `${num2} ${operation} ${num1} = ?`;
                    currentMathAnswer = answer;
                    return;
                }
                break;
            case '×':
                answer = num1 * num2;
                break;
        }
        
        mathProblem.textContent = `${num1} ${operation} ${num2} = ?`;
        currentMathAnswer = answer;
        
        // Clear previous input and errors
        captchaInput.value = '';
        captchaError.style.display = 'none';
    }
    
    /**
     * Verifies the user's CAPTCHA answer
     */
    function verifyCaptchaAnswer() {
        const userAnswer = parseInt(captchaInput.value.trim(), 10);
        
        if (isNaN(userAnswer)) {
            captchaError.textContent = 'Please enter a number.';
            captchaError.style.display = 'block';
            return;
        }
        
        if (userAnswer === currentMathAnswer) {
            // Success - mark captcha as verified
            captchaVerified = true;
            mockCaptcha.classList.add('verified');
            captchaChallenge.classList.remove('active');
            captchaCheckbox.style.backgroundColor = 'var(--hf-success)';
            captchaCheckbox.style.borderColor = 'var(--hf-success)';
            
            // Add checkmark
            const checkmark = document.createElement('span');
            checkmark.textContent = '✓';
            checkmark.style.color = 'white';
            checkmark.style.position = 'absolute';
            checkmark.style.top = '50%';
            checkmark.style.left = '50%';
            checkmark.style.transform = 'translate(-50%, -50%)';
            captchaCheckbox.innerHTML = '';
            captchaCheckbox.appendChild(checkmark);
        } else {
            // Failed - show error and generate a new problem
            captchaError.textContent = 'Incorrect answer. Try another problem:';
            captchaError.style.display = 'block';
            generateMathProblem();
        }
    }
    
    /**
     * Validates all form fields
     * @returns {boolean} Whether all fields are valid
     */
    function validateAllFields() {
        let isValid = true;
        
        // Validate username
        if (nameInput.value.trim() === '') {
            showError(nameInput, 'Please enter your username');
            isValid = false;
        } else if (nameInput.value.trim().length < 3) {
            showError(nameInput, 'Username must be at least 3 characters');
            isValid = false;
        } else if (!/^[a-zA-Z0-9_]+$/.test(nameInput.value.trim())) {
            showError(nameInput, 'Username can only contain letters, numbers, and underscores');
            isValid = false;
        }
        
        // Validate email
        if (!validateEmail(emailInput.value)) {
            showError(emailInput, 'Please enter a valid email address');
            isValid = false;
        }
        
        // Validate password
        const passwordStrength = checkPasswordStrength(passwordInput.value);
        if (passwordInput.value.length < 8) {
            showError(passwordInput, 'Password must be at least 8 characters');
            isValid = false;
        } else if (passwordStrength < 3) {
            showError(passwordInput, 'Password is too weak. Include uppercase, lowercase, numbers, and symbols');
            isValid = false;
        }
        
        // Validate password confirmation
        if (passwordInput.value !== confirmPasswordInput.value) {
            showError(confirmPasswordInput, 'Passwords do not match');
            isValid = false;
        }
        
        // Validate GDPR consent
        if (!gdprConsentCheckbox.checked) {
            showCheckboxError(gdprConsentCheckbox, 'You must consent to the data storage policy');
            isValid = false;
        }
        
        return isValid;
    }
    
    /**
     * Focuses the first invalid field for better accessibility
     */
    function focusFirstInvalidField() {
        // Find first input with an error message
        const invalidInputs = [
            nameInput, emailInput, passwordInput, confirmPasswordInput,
            gdprConsentCheckbox
        ].filter(input => {
            const errorId = `${input.id}Error`;
            const errorElement = document.getElementById(errorId);
            return errorElement && !errorElement.hidden;
        });
        
        if (invalidInputs.length > 0) {
            invalidInputs[0].focus();
        }
    }
    
    /**
     * Show error message for an input
     * @param {HTMLElement} input - The input element
     * @param {string} message - The error message
     * @param {boolean} focus - Whether to focus the input
     */
    function showError(input, message, focus = false) {
        const errorId = `${input.id}Error`;
        const errorElement = document.getElementById(errorId);
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.hidden = false;
            input.setAttribute('aria-invalid', 'true');
            input.classList.add('error');
            
            // Focus the input if specified
            if (focus) {
                input.focus();
            }
        }
    }
    
    /**
     * Show error message for checkbox fields
     * @param {HTMLElement} checkbox - The checkbox element
     * @param {string} message - The error message
     */
    function showCheckboxError(checkbox, message) {
        const errorId = `${checkbox.id}Error`;
        const errorElement = document.getElementById(errorId);
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.hidden = false;
            checkbox.setAttribute('aria-invalid', 'true');
        }
    }
    
    /**
     * Show global error message not tied to a specific input
     * @param {string} message - The error message to display
     */
    function showGlobalError(message) {
        errorContainer.innerHTML = '';
        
        const errorElement = document.createElement('div');
        errorElement.className = 'global-error-message';
        errorElement.textContent = message;
        
        errorContainer.appendChild(errorElement);
        errorContainer.setAttribute('aria-hidden', 'false');
    }
    
    /**
     * Clear error styling and message for an input
     * @param {HTMLElement} input - The input element
     */
    function clearError(input) {
        const errorId = `${input.id}Error`;
        const errorElement = document.getElementById(errorId);
        
        if (errorElement) {
            errorElement.hidden = true;
            input.setAttribute('aria-invalid', 'false');
            input.classList.remove('error');
        }
    }
    
    /**
     * Clear all error messages from the form
     */
    function clearAllErrors() {
        // Clear field-specific errors
        const allInputsAndCheckboxes = [
            nameInput, emailInput, passwordInput, confirmPasswordInput,
            gdprConsentCheckbox
        ];
        
        allInputsAndCheckboxes.forEach(input => {
            const errorId = `${input.id}Error`;
            const errorElement = document.getElementById(errorId);
            
            if (errorElement) {
                errorElement.hidden = true;
                input.setAttribute('aria-invalid', 'false');
                
                if (input.type !== 'checkbox') {
                    input.classList.remove('error');
                }
            }
        });
        
        // Clear global error
        errorContainer.innerHTML = '';
        errorContainer.setAttribute('aria-hidden', 'true');
    }
    
    /**
     * Show loading state on the submit button
     */
    function showLoadingState() {
        const buttonText = registerButton.querySelector('span');
        const buttonLoader = registerButton.querySelector('.button-loader');
        
        buttonText.textContent = 'Registering...';
        buttonLoader.hidden = false;
        registerButton.disabled = true;
        registerButton.classList.add('loading');
    }
    
    /**
     * Hide loading state on the submit button
     */
    function hideLoadingState() {
        const buttonText = registerButton.querySelector('span');
        const buttonLoader = registerButton.querySelector('.button-loader');
        
        buttonText.textContent = 'Register';
        buttonLoader.hidden = true;
        registerButton.disabled = false;
        registerButton.classList.remove('loading');
    }
    
    /**
     * Toggle password visibility
     * @param {HTMLElement} inputField - The password input element
     * @param {HTMLElement} toggleButton - The toggle button element
     */
    function togglePasswordVisibility(inputField, toggleButton) {
        const eyeIcon = toggleButton.querySelector('.eye-icon');
        
        if (inputField.type === 'password') {
            inputField.type = 'text';
            eyeIcon.textContent = '👁️‍🗨️'; // Closed eye
            toggleButton.setAttribute('aria-label', 'Hide password');
        } else {
            inputField.type = 'password';
            eyeIcon.textContent = '👁️'; // Open eye
            toggleButton.setAttribute('aria-label', 'Show password');
        }
    }
    
    /**
     * Generate a CSRF token for form security
     * In a real application, this would come from the server
     * @returns {string} A mock CSRF token
     */
    function generateCSRFToken() {
        return 'csrf-' + Math.random().toString(36).substring(2, 15);
    }
    
    /**
     * Enhanced email validation using regex
     * @param {string} email - The email to validate
     * @returns {boolean} Whether the email is valid
     */
    function validateEmail(email) {
        // More comprehensive email regex
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
    
    /**
     * Check password strength
     * @param {string} password - The password to check
     * @returns {number} Strength score from 0-4
     */
    function checkPasswordStrength(password) {
        let strength = 0;
        
        // Check length
        if (password.length >= 8) strength += 1;
        
        // Check for lowercase letters
        if (/[a-z]/.test(password)) strength += 1;
        
        // Check for uppercase letters
        if (/[A-Z]/.test(password)) strength += 1;
        
        // Check for numbers
        if (/[0-9]/.test(password)) strength += 1;
        
        // Check for special characters
        if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
        
        return strength;
    }
    
    /**
     * Update password strength meter
     * @param {string} password - The password to evaluate
     */
    function updatePasswordStrength(password) {
        const strength = checkPasswordStrength(password);
        const meterFill = document.querySelector('.strength-meter-fill');
        const strengthText = document.querySelector('.strength-text');
        
        // Update strength meter fill
        meterFill.setAttribute('data-strength', strength);
        
        // Update strength text
        let strengthLabel = 'Too weak';
        switch (strength) {
            case 0:
            case 1:
                strengthLabel = 'Too weak';
                break;
            case 2:
                strengthLabel = 'Weak';
                break;
            case 3:
                strengthLabel = 'Good';
                break;
            case 4:
                strengthLabel = 'Strong';
                break;
            case 5:
                strengthLabel = 'Very strong';
                break;
        }
        
        strengthText.textContent = `Password strength: ${strengthLabel}`;
        
        // Update for screen readers
        document.getElementById('passwordStrength').setAttribute('aria-label', `Password strength: ${strengthLabel}`);
    }
    
    /**
     * Log events to console and/or send to server
     * @param {string} eventName - Name of the event
     * @param {Object} eventData - Event data
     */
    function logEvent(eventName, eventData) {
        console.log(`[EVENT] ${eventName}:`, eventData);
    }
    
    /**
     * Log errors to console and/or send to server
     * @param {string} errorType - Type of error
     * @param {Error|string} error - Error object or message
     */
    function logError(errorType, error) {
        console.error(`[ERROR] ${errorType}:`, error);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get form data
        const formData = {
            username: document.getElementById('name').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            securityQuestion: document.getElementById('securityQuestion').value,
            securityAnswer: document.getElementById('securityAnswer').value
        };

        // Get existing users or initialize empty array
        const users = JSON.parse(localStorage.getItem('users') || '[]');

        // Check if user already exists
        if (users.some(user => user.email === formData.email)) {
            showError('Email already registered');
            return;
        }

        // Add new user
        users.push({
            username: formData.username,
            email: formData.email,
            password: formData.password, // In a real app, never store plain passwords
            securityQuestion: formData.securityQuestion,
            securityAnswer: formData.securityAnswer,
            registrationDate: new Date().toISOString(),
            id: generateUserId()
        });

        // Save updated users array
        localStorage.setItem('users', JSON.stringify(users));

        // Show success message
        const successMessage = document.getElementById('successMessage');
        successMessage.hidden = false;

        // Redirect to login page after 2 seconds
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    });
});

function showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    errorContainer.textContent = message;
    errorContainer.hidden = false;
}

function generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
}