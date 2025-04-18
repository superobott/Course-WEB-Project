document.addEventListener('DOMContentLoaded', () => {
    // Initialize profile data
    const defaultProfile = {
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        memberSince: 'April 2025',
        interests: ['ancient', 'medieval', 'wars', 'aviation'],
        searchHistory: [
            {
                query: 'World War II',
                date: 'April 15, 2025',
                id: '1'
            }
        ],
        savedTimelines: [
            {
                title: 'World War II',
                date: 'April 15, 2025',
                events: 25,
                lastModified: '2 days ago',
                id: '1',
                dataSource: 'ww2Data.json'  // Updated data source file
            }
        ]
    };

    // Load or initialize profile
    let profile = JSON.parse(localStorage.getItem('userProfile')) || defaultProfile;
    localStorage.setItem('userProfile', JSON.stringify(profile));

    // Global variables
    let currentItemToDelete = null;
    let currentDeleteCallback = null;

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

    // Update UI with profile data
    function updateProfileUI() {
        // Update main profile display
        document.getElementById('profileName').textContent = profile.fullName;
        const bioElement = document.getElementById('profileBio');
        if (bioElement) {
            bioElement.textContent = profile.bio || 'No bio added yet.';
        }
        document.getElementById('profileEmail').textContent = profile.email;
        
        // Update form fields
        document.getElementById('fullName').value = profile.fullName;
        const bioTextarea = document.querySelector('textarea[name="bio"]');
        if (bioTextarea) {
            bioTextarea.value = profile.bio || '';
        }
        document.getElementById('email').value = profile.email;

        // Update interests
        const interestsContainer = document.getElementById('profileInterests');
        if (interestsContainer) {
            interestsContainer.innerHTML = profile.interests
                .map(interest => `
                    <span class="interest-tag" data-interest="${interest}">
                        ${interest}
                    </span>
                `).join('');
        }

        // Update search history and saved timelines
        updateSearchHistory();
        updateSavedTimelines();
        
        // Attach event handlers
        attachDeleteHandlers();
        attachViewHandlers();

        // Add animation classes
        document.querySelectorAll('.history-item').forEach(item => {
            item.classList.add('fade-in');
        });
    }

    function updateSearchHistory() {
        const container = document.querySelector('#search-history-content .space-y-4');
        container.innerHTML = profile.searchHistory.map(search => `
            <div class="history-item p-4 pl-6 bg-white rounded-lg" data-id="${search.id}">
                <div class="flex justify-between items-center">
                    <div>
                        <h4 class="font-medium">${search.query}</h4>
                        <p class="text-sm text-gray-600">Searched on ${search.date}</p>
                    </div>
                    <div class="flex gap-10">
                        <a href="results.html?type=search&query=${encodeURIComponent(search.query)}&returnTo=profile" 
                           class="text-[#006A71] hover:underline view-results-btn">View Results</a>
                        <button class="text-red-500 hover:text-red-700 delete-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function updateSavedTimelines() {
        const container = document.querySelector('#saved-timelines-content .space-y-4');
        // Only show the titles and basic info
        container.innerHTML = profile.savedTimelines.map(timeline => `
            <div class="history-item p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow" data-id="${timeline.id}">
                <div class="flex justify-between items-start">
                    <div class="flex-grow">
                        <h4 class="font-medium text-lg mb-1">${timeline.title}</h4>
                        <p class="text-sm text-gray-600 mb-2">Saved on ${timeline.date}</p>
                    </div>
                    <div class="flex gap-3 items-center">
                        <a href="results.html?type=timeline&source=${encodeURIComponent(timeline.dataSource)}&title=${encodeURIComponent(timeline.title)}" 
                           class="text-[#006A71] hover:text-[#48A6A7] transition-colors flex items-center gap-2 view-timeline-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>View</span>
                        </a>
                        <button class="text-red-500 hover:text-red-700 transition-colors delete-btn p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Function to delete search history
    function deleteSearchHistory(id) {
        profile.searchHistory = profile.searchHistory.filter(item => item.id !== id);
        localStorage.setItem('userProfile', JSON.stringify(profile));
        updateSearchHistory();
        attachDeleteHandlers();
        showToast('Search history item deleted');
    }

    // Function to delete timeline
    function deleteTimeline(id) {
        profile.savedTimelines = profile.savedTimelines.filter(item => item.id !== id);
        localStorage.setItem('userProfile', JSON.stringify(profile));
        updateSavedTimelines();
        attachDeleteHandlers();
        showToast('Timeline deleted');
    }

    // Function to show toast notification
    function showToast(message, type = 'success') {
        toastMessage.textContent = message;
        toastNotification.className = 'toast-notification';
        toastNotification.classList.add(type);
        toastNotification.classList.add('show');
        
        setTimeout(() => {
            toastNotification.classList.remove('show');
        }, 3000);
    }

    // Function to switch tabs
    function switchTab(tabId) {
        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
        });
        
        tabContents.forEach(content => {
            if (content.id === `${tabId}-content`) {
                content.classList.add('active');
                content.classList.add('fade-in');
            } else {
                content.classList.remove('active');
                content.classList.remove('fade-in');
            }
        });
    }

    // Function to handle image upload
    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (file && file.size <= 2 * 1024 * 1024) { // 2MB limit
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('profileImage').innerHTML = `
                    <img src="${e.target.result}" class="w-full h-full object-cover rounded-full">
                `;
            };
            reader.readAsDataURL(file);
        } else {
            showToast('File size must be less than 2MB', 'error');
        }
    }

    // Function to handle profile update
    function handleProfileUpdate(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        profile.fullName = formData.get('fullName');
        profile.bio = formData.get('bio') || '';
        profile.interests = [...formData.getAll('interests[]')];
        
        localStorage.setItem('userProfile', JSON.stringify(profile));
        updateProfileUI();
        
        editProfileModal.style.display = 'none';
        showToast('Profile updated successfully');
    }

    // Function to handle settings update
    function handleSettingsUpdate(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        profile.email = formData.get('email');
        
        localStorage.setItem('userProfile', JSON.stringify(profile));
        updateProfileUI();
        
        showToast('Settings updated successfully');
    }

    // Function to show delete confirmation
    function showDeleteConfirmation(itemTitle, onConfirm) {
        deleteItemTitle.textContent = itemTitle;
        deleteConfirmation.style.display = 'flex';
        deleteConfirmation.classList.add('show');
        
        currentDeleteCallback = onConfirm;
    }

    // Function to attach delete handlers
    function attachDeleteHandlers() {
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const item = e.target.closest('.history-item');
                const itemTitle = item.querySelector('h4').textContent;
                const itemId = item.dataset.id;
                
                currentItemToDelete = itemId;
                
                if (item.closest('#search-history-content')) {
                    showDeleteConfirmation(itemTitle, () => deleteSearchHistory(itemId));
                } else if (item.closest('#saved-timelines-content')) {
                    showDeleteConfirmation(itemTitle, () => deleteTimeline(itemId));
                }
            });
        });
    }

    // Function to attach view handlers
    function attachViewHandlers() {
        document.querySelectorAll('.view-timeline-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Default link behavior will work, but we can add tracking or other functionality here if needed
            });
        });
    }

    // Event listeners
    editProfileBtn.addEventListener('click', () => {
        // Update form fields with current profile data before showing modal
        document.getElementById('fullName').value = profile.fullName;
        document.getElementById('profileBio').value = profile.bio;
        
        // Update checkboxes based on current interests
        document.querySelectorAll('input[name="interests[]"]').forEach(checkbox => {
            checkbox.checked = profile.interests.includes(checkbox.value);
        });
        
        editProfileModal.style.display = 'block';
    });
    closeBtn.addEventListener('click', () => editProfileModal.style.display = 'none');
    cancelEditBtn.addEventListener('click', () => editProfileModal.style.display = 'none');
    chooseImageBtn.addEventListener('click', () => profileImageInput.click());
    profileImageInput.addEventListener('change', handleImageUpload);
    editProfileForm.addEventListener('submit', handleProfileUpdate);
    
    if (document.getElementById('accountSettingsForm')) {
        document.getElementById('accountSettingsForm').addEventListener('submit', handleSettingsUpdate);
    }
    
    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Delete confirmation events
    confirmDeleteBtn.addEventListener('click', () => {
        if (currentDeleteCallback) {
            currentDeleteCallback();
            deleteConfirmation.style.display = 'none';
            currentDeleteCallback = null;
            currentItemToDelete = null;
        }
    });
    
    cancelDeleteBtn.addEventListener('click', () => {
        deleteConfirmation.style.display = 'none';
        currentDeleteCallback = null;
        currentItemToDelete = null;
    });

    // Window click to close modals
    window.addEventListener('click', (e) => {
        if (e.target === editProfileModal) {
            editProfileModal.style.display = 'none';
        }
        if (e.target === deleteConfirmation) {
            deleteConfirmation.style.display = 'none';
            currentDeleteCallback = null;
            currentItemToDelete = null;
        }
    });

    // Initialize
    updateProfileUI();
});