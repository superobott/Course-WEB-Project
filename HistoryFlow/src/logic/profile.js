// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tab functionality
    initializeTabs();
    
    // Add event listener to the edit profile button
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            alert('Edit profile functionality will be implemented here.');
        });
    }
    
    // Add event listeners to the account settings form
    const accountSettingsForm = document.getElementById('accountSettingsForm');
    if (accountSettingsForm) {
        accountSettingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveAccountSettings();
        });
    }
    
    // Add event listeners to delete buttons
    const deleteButtons = document.querySelectorAll('.text-red-500');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const itemElement = this.closest('.history-item');
            if (itemElement) {
                if (confirm('Are you sure you want to delete this item?')) {
                    // Add animation for smoother deletion
                    itemElement.style.opacity = '0';
                    itemElement.style.height = itemElement.offsetHeight + 'px';
                    itemElement.style.transition = 'opacity 0.3s ease, height 0.5s ease 0.3s, margin 0.5s ease 0.3s, padding 0.5s ease 0.3s';
                    
                    setTimeout(() => {
                        itemElement.style.height = '0';
                        itemElement.style.margin = '0';
                        itemElement.style.padding = '0';
                        
                        setTimeout(() => {
                            itemElement.remove();
                        }, 500);
                    }, 300);
                }
            }
        });
    });
    
    // Make sure the profile link in the home page works properly
    setupProfileNavigation();
});

/**
 * Initialize the tab functionality
 */
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Get the tab identifier
            const tabId = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and content
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Add active class to current tab and content
            this.classList.add('active');
            document.getElementById(tabId + '-content').classList.add('active');
        });
    });
}

/**
 * Save account settings from the form
 */
function saveAccountSettings() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const emailNotifications = document.getElementById('emailNotifications').checked;
    const newsUpdates = document.getElementById('newsUpdates').checked;
    
    // Validate password match
    if (password && password !== confirmPassword) {
        alert('Passwords do not match. Please try again.');
        return;
    }
    
    // In a real application, we would send this data to a server
    // For now, just show a success message
    alert('Settings successfully saved!');
    
    // Clear password fields
    document.getElementById('password').value = '';
    document.getElementById('confirmPassword').value = '';
}

/**
 * Set up navigation from home page to profile page
 */
function setupProfileNavigation() {
    // This function would be called from home.html to set up the profile button
    // This is for documentation purposes as it would actually live in the home.js file
}

/**
 * Update the profile info from the home page to ensure header button works 
 */
function updateHomePageProfileButton() {
    // Add this code to the home.js file to enable navigation to profile page
    const profileButton = document.querySelector('button.absolute.right-4');
    if (profileButton) {
        profileButton.addEventListener('click', function() {
            window.location.href = 'profile.html';
        });
    }
}