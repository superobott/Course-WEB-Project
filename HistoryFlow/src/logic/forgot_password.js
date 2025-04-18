document.addEventListener('DOMContentLoaded', () => {
    const recoveryForm = document.getElementById('recoveryForm');
    const errorMessage = document.getElementById('errorMessage');

    recoveryForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const securityQuestion = document.getElementById('securityQuestion').value;
        const securityAnswer = document.getElementById('securityAnswer').value;

        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.email === email);

        if (!user) {
            showError('Email not found.');
            return;
        }

        if (user.securityQuestion === securityQuestion && 
            user.securityAnswer.toLowerCase() === securityAnswer.toLowerCase()) {
            // Redirect to reset password page or show reset form
            localStorage.setItem('resetEmail', email);
            window.location.href = 'reset_password.html';
        } else {
            showError('Invalid security answer.');
        }
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }
});