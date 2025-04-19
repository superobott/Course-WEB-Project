document.addEventListener('DOMContentLoaded', () => {
    // Function to load and validate user data
    function loadUserData() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        // Redirect to login if no user data
        if (!currentUser || !currentUser.email) {
            showToast('No user data found. Please log in.');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return null;
        }

        return {
            firstName: currentUser.firstName || '',
            lastName: currentUser.lastName || '',
            fullName: currentUser.fullName || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim(),
            email: currentUser.email || '',
            securityQuestion: currentUser.securityQuestion || '',
            securityAnswer: currentUser.securityAnswer || '',
            gdprConsent: currentUser.gdprConsent ? 'Consented' : 'Not consented',
            id: currentUser.id || '',
            registerDate: currentUser.registerDate ? new Date(currentUser.registerDate).toLocaleString('en-US', { month: 'long', year: 'numeric' }) : '',
            bio: currentUser.bio || 'No bio available',
            interests: currentUser.interests || [],
            searchHistory: currentUser.searchHistory || [],
            savedTimelines: currentUser.savedTimelines || [],
            profileImage: currentUser.profileImage || null
        };
    }

    // Initialize profile data
    let profile = loadUserData();
    if (!profile) return; // Stop if no valid user data

    // DOM Elements
    const editProfileModal = document.getElementById('editProfileModal');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const closeBtn = editProfileModal.querySelector('.close');
    const editProfileForm = document.getElementById('editProfileForm');
    const chooseImageBtn = document.getElementById('chooseImageBtn');
    const profileImageInput = document.getElementById('profileImageInput');
    const deleteConfirmation = document.getElementById('deleteConfirmation');
    const deleteItemTitle = document.getElementById('deleteItemTitle');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const toastNotification = document.getElementById('toastNotification');
    const toastMessage = document.getElementById('toastMessage');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const downloadProfileBtn = document.getElementById('downloadProfileBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    // Update profile section UI
    function updateProfileUI() {
        document.getElementById('profileName').textContent = profile.fullName || 'Name not provided';
        document.getElementById('profileFirstName').textContent = `First Name: ${profile.firstName || 'Not provided'}`;
        document.getElementById('profileLastName').textContent = `Last Name: ${profile.lastName || 'Not provided'}`;
        document.getElementById('profileEmail').textContent = `Email: ${profile.email || 'Not provided'}`;
        document.getElementById('profileSecurityQuestion').textContent = `Security Question: ${profile.securityQuestion || 'Not provided'}`;
        document.getElementById('profileSecurityAnswer').textContent = `Security Answer: ${profile.securityAnswer || 'Not provided'}`;
        document.getElementById('profileGdprConsent').textContent = `GDPR Consent: ${profile.gdprConsent}`;
        document.getElementById('profileId').textContent = `User ID: ${profile.id || 'Not provided'}`;
        document.getElementById('profileRegisterDate').textContent = `Member since: ${profile.registerDate || 'Not provided'}`;
        document.getElementById('profileBio').textContent = profile.bio;

        // Update profile image
        const profileImageContainer = document.getElementById('profileImage');
        profileImageContainer.innerHTML = profile.profileImage
            ? `<img src="${profile.profileImage}" class="w-full h-full object-cover rounded-full">`
            : `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-[#006A71]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            `;

        // Update interests
        const interestsContainer = document.getElementById('profileInterests');
        interestsContainer.innerHTML = profile.interests.length > 0
            ? profile.interests.map(interest => `<span class="inline-block bg-[#9ACBD0] text-[#006A71] px-3 py-1 rounded-full mr-2 mb-2">${interest}</span>`).join('')
            : '<p>No interests set</p>';

        // Update edit form fields
        document.getElementById('firstName').value = profile.firstName;
        document.getElementById('lastName').value = profile.lastName;
        document.getElementById('email').value = profile.email;
        document.getElementById('securityQuestion').value = profile.securityQuestion;
        document.getElementById('securityAnswer').value = profile.securityAnswer;
        document.getElementById('profileBioInput').value = profile.bio;

        profile.interests.forEach(interest => {
            const checkbox = document.getElementById(`interest-${interest}`);
            if (checkbox) checkbox.checked = true;
        });

        // Update search history and saved timelines
        updateSearchHistory();
        updateSavedTimelines();
        updateAccountSettingsUI();
    }

    // Update Account Settings tab UI
    function updateAccountSettingsUI() {
        const settingsContainer = document.querySelector('#settings-content .space-y-4');
        settingsContainer.innerHTML = `
            <div class="p-4 bg-white rounded-lg shadow-sm">
                <h4 class="font-medium">User Information</h4>
                <p class="text-sm text-gray-600">First Name: ${profile.firstName || 'Not provided'}</p>
                <p class="text-sm text-gray-600">Last Name: ${profile.lastName || 'Not provided'}</p>
                <p class="text-sm text-gray-600">User ID: ${profile.id || 'Not provided'}</p>
                <p class="text-sm text-gray-600">Member since: ${profile.registerDate || 'Not provided'}</p>
                <p class="text-sm text-gray-600">Security Question: ${profile.securityQuestion || 'Not provided'}</p>
                <p class="text-sm text-gray-600">Security Answer: ${profile.securityAnswer || 'Not provided'}</p>
            </div>
        `;

        // Update form fields
        document.getElementById('settingsEmail').value = profile.email;
        document.getElementById('gdprConsent').checked = profile.gdprConsent === 'Consented';
    }

    function updateSearchHistory() {
        const container = document.querySelector('#search-history-content .space-y-4');
        container.innerHTML = profile.searchHistory.length > 0
            ? profile.searchHistory.map(search => `
                <div class="history-item p-4 pl-6 bg-white rounded-lg" data-id="${search.id}">
                    <div class="flex justify-between items-center">
                        <div>
                            <h4 class="font-medium">${search.query}</h4>
                            <p class="text-sm text-gray-600">Searched on ${search.date}</p>
                        </div>
                        <div class="flex gap-10">
                            <a href="results.html?type=search&query=${encodeURIComponent(search.query)}&returnTo=profile" 
                               class="text-[#006A71] hover:underline view-results-btn">View Results</a>
                            <button class="text-red-500 hover:text-red-700 delete-btn" onclick="deleteSearchHistory('${search.id}')">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')
            : '<p>No search history available</p>';
    }

    function updateSavedTimelines() {
        const container = document.querySelector('#saved-timelines-content .space-y-4');
        container.innerHTML = profile.savedTimelines.length > 0
            ? profile.savedTimelines.map(item => `
                <div class="history-item p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow" data-id="${item.id}">
                    <div class="flex justify-between items-start">
                        <div class="flex-grow">
                            <h4 class="font-medium text-lg mb-1">${item.title}</h4>
                            <p class="text-sm text-gray-600 mb-2">Saved on ${item.date}</p>
                            <p class="text-sm text-gray-700">Contains ${item.events} events • Last modified ${item.lastModified}</p>
                        </div>
                        <div class="flex gap-3 items-center">
                            <a href="results.html?query=${encodeURIComponent(item.title)}&returnTo=profile" 
                               class="text-[#006A71] hover:underline view-results-btn">View Results</a>
                            <button class="text-red-500 hover:text-red-700 delete-btn" onclick="deleteTimeline('${item.id}')">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')
            : '<p>No saved timelines available</p>';
    }

    // Listen for storage changes (e.g., from another tab)
    window.addEventListener('storage', (event) => {
        if (event.key === 'currentUser') {
            const newProfile = loadUserData();
            if (newProfile) {
                profile = newProfile;
                updateProfileUI();
                updateAccountSettingsUI();
                showToast('Profile data updated from storage');
            }
        }
    });

    // Handle Edit Profile form submission
    editProfileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        profile.firstName = formData.get('firstName').trim();
        profile.lastName = formData.get('lastName').trim();
        profile.fullName = `${profile.firstName} ${profile.lastName}`.trim();
        profile.email = formData.get('email').trim();
        profile.securityQuestion = formData.get('securityQuestion').trim();
        profile.securityAnswer = formData.get('securityAnswer').trim();
        profile.bio = formData.get('profileBio').trim();
        profile.interests = [...formData.getAll('interests[]')];

        // Update currentUser
        const updatedUser = {
            ...JSON.parse(localStorage.getItem('currentUser')),
            firstName: profile.firstName,
            lastName: profile.lastName,
            fullName: profile.fullName,
            email: profile.email,
            securityQuestion: profile.securityQuestion,
            securityAnswer: profile.securityAnswer,
            bio: profile.bio,
            interests: profile.interests,
            profileImage: profile.profileImage
        };

        // Update local storage
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));

        // Update users collection
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const userIndex = users.findIndex(u => u.id === profile.id);
        if (userIndex !== -1) {
            users[userIndex] = updatedUser;
            localStorage.setItem('users', JSON.stringify(users));
        }

        // Update UI
        updateProfileUI();
        updateAccountSettingsUI();
        editProfileModal.style.display = 'none';
        showToast('Profile updated successfully!');
    });

    // Account Settings form submission
    document.getElementById('accountSettingsForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newEmail = formData.get('email').trim();
        const password = formData.get('password').trim();
        const gdprConsent = formData.get('gdprConsent') === 'on';

        // Update profile
        profile.email = newEmail;
        profile.gdprConsent = gdprConsent ? 'Consented' : 'Not consented';

        // Update currentUser
        const updatedUser = {
            ...JSON.parse(localStorage.getItem('currentUser')),
            email: newEmail,
            ...(password && { password }), // Only update password if provided
            gdprConsent: gdprConsent
        };

        // Update local storage
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const userIndex = users.findIndex(u => u.id === profile.id);
        if (userIndex !== -1) {
            users[userIndex] = updatedUser;
            localStorage.setItem('users', JSON.stringify(users));
        }

        updateProfileUI();
        updateAccountSettingsUI();
        showToast('Settings updated successfully');
    });

    // Download profile data as JSON
    downloadProfileBtn.addEventListener('click', () => {
        const userData = JSON.parse(localStorage.getItem('currentUser'));
        const dataStr = JSON.stringify(userData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${userData.email}_profile.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast('Profile data downloaded');
    });

    // Logout handler
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('sessionToken');
        showToast('Logged out successfully');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    });

    // Delete handlers
    window.deleteSearchHistory = (id) => {
        profile.searchHistory = profile.searchHistory.filter(item => item.id !== id);
        updateUserData({ searchHistory: profile.searchHistory });
        updateSearchHistory();
        showToast('Search history item deleted');
    };

    window.deleteTimeline = (id) => {
        profile.savedTimelines = profile.savedTimelines.filter(item => item.id !== id);
        updateUserData({ savedTimelines: profile.savedTimelines });
        updateSavedTimelines();
        showToast('Timeline deleted');
    };

    // Helper function to update user data
    function updateUserData(newData) {
        const updatedUser = { ...JSON.parse(localStorage.getItem('currentUser')), ...newData };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));

        // Update users collection
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const userIndex = users.findIndex(u => u.id === profile.id);
        if (userIndex !== -1) {
            users[userIndex] = updatedUser;
            localStorage.setItem('users', JSON.stringify(users));
        }
    }

    // Modal handlers
    editProfileBtn.addEventListener('click', () => editProfileModal.style.display = 'block');
    closeBtn.addEventListener('click', () => editProfileModal.style.display = 'none');
    cancelEditBtn.addEventListener('click', () => editProfileModal.style.display = 'none');

    // Profile image upload
    chooseImageBtn.addEventListener('click', () => profileImageInput.click());
    profileImageInput.addEventListener('change', handleImageUpload);

    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Helper functions
    function switchTab(tabId) {
        tabButtons.forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId));
        tabContents.forEach(content => content.classList.toggle('active', content.id === `${tabId}-content`));
    }

    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (file && file.size <= 2 * 1024 * 1024) { // 2MB limit
            const reader = new FileReader();
            reader.onload = (e) => {
                profile.profileImage = e.target.result;
                updateUserData({ profileImage: profile.profileImage });
                updateProfileUI();
                showToast('Profile image updated');
            };
            reader.readAsDataURL(file);
        } else {
            showToast('File size must be less than 2MB');
        }
    }

    function showDeleteConfirmation(itemTitle, onConfirm) {
        deleteItemTitle.textContent = itemTitle;
        deleteConfirmation.style.display = 'flex';
        
        confirmDeleteBtn.onclick = () => {
            onConfirm();
            deleteConfirmation.style.display = 'none';
        };
        
        cancelDeleteBtn.onclick = () => deleteConfirmation.style.display = 'none';
    }

    function showToast(message) {
        toastMessage.textContent = message;
        toastNotification.classList.add('show');
        setTimeout(() => toastNotification.classList.remove('show'), 3000);
    }

    // Initialize the UI
    updateProfileUI();
    updateAccountSettingsUI();
});