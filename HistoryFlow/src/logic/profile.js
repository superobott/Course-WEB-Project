document.addEventListener('DOMContentLoaded', () => {
    // Initialize profile data
    const defaultProfile = {
        fullName: 'John Doe',
        bio: 'History enthusiast with a passion for exploring ancient civilizations and modern events.',
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
                title: 'Planes',
                date: 'April 15, 2025',
                events: 15,
                lastModified: '2 days ago',
                id: '1'
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
        document.getElementById('profileName').textContent = profile.fullName;
        document.getElementById('profileMemberSince').textContent = `Member since ${profile.memberSince}`;
        
        // Update form fields
        document.getElementById('fullName').value = profile.fullName;
        document.getElementById('profileBio').value = profile.bio;
        document.getElementById('email').value = profile.email;

        // Update interests
        profile.interests.forEach(interest => {
            const checkbox = document.getElementById(`interest-${interest}`);
            if (checkbox) checkbox.checked = true;
        });

        // Update search history
        updateSearchHistory();
        updateSavedTimelines();
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
                        <button class="text-red-500 hover:text-red-700 delete-btn" onclick="deleteSearchHistory('${search.id}')">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 24 24" stroke="currentColor">
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
        container.innerHTML = profile.savedTimelines.map(item => {
            console.log('Item title:', item.title); // Changed to show exact title
            return `
            <div class="history-item p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow" data-id="${item.id}">
                <div class="flex justify-between items-start">
                    <div class="flex-grow">
                        <h4 class="font-medium text-lg mb-1">${item.title}</h4>
                        <p class="text-sm text-gray-600 mb-2">Saved on ${item.date}</p>
                        <p class="text-sm text-gray-700">Contains ${item.events} events • Last modified ${item.lastModified}</p>
                    </div>
                    <div class="flex gap-3 items-center">
                        <a href="results.html?query=${item.title}&returnTo=profile" 
                           class="text-[#006A71] hover:underline view-results-btn">View Results</a>
                        <button class="text-red-500 hover:text-red-700 delete-btn" onclick="deleteTimeline('${item.id}')">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `}).join('');
    }

    // Handle form submission
    document.getElementById('editProfileForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        profile.fullName = formData.get('fullName');
        profile.bio = formData.get('profileBio');
        profile.interests = [...formData.getAll('interests[]')];
        
        localStorage.setItem('userProfile', JSON.stringify(profile));
        updateProfileUI();
        
        // Close modal and show success message
        document.getElementById('editProfileModal').style.display = 'none';
        showToast('Profile updated successfully!');
    });

    // Initialize the UI
    updateProfileUI();

    // Delete handlers
    window.deleteSearchHistory = (id) => {
        profile.searchHistory = profile.searchHistory.filter(item => item.id !== id);
        localStorage.setItem('users', JSON.stringify(profile));
        updateSearchHistory();
        showToast('Search history item deleted');
    };

    window.deleteTimeline = (id) => {
        profile.savedTimelines = profile.savedTimelines.filter(item => item.id !== id);
        localStorage.setItem('users', JSON.stringify(profile));
        updateSavedTimelines();
        showToast('Timeline deleted');
    };

    function showToast(message) {
        const toast = document.getElementById('toastNotification');
        document.getElementById('toastMessage').textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // Modal elements
    const editProfileModal = document.getElementById('editProfileModal');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const closeBtn = editProfileModal.querySelector('.close');
    
    // Profile form elements
    const editProfileForm = document.getElementById('editProfileForm');
    const chooseImageBtn = document.getElementById('chooseImageBtn');
    const profileImageInput = document.getElementById('profileImageInput');
    
    // Delete confirmation elements
    const deleteConfirmation = document.getElementById('deleteConfirmation');
    const deleteItemTitle = document.getElementById('deleteItemTitle');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    
    // Toast notification
    const toastNotification = document.getElementById('toastNotification');
    const toastMessage = document.getElementById('toastMessage');

    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

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

    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const item = e.target.closest('.history-item');
            const itemTitle = item.querySelector('h4').textContent;
            showDeleteConfirmation(itemTitle, () => {
                item.remove();
                showToast('Item deleted successfully');
            });
        });
    });

    // Form submissions
    editProfileForm.addEventListener('submit', handleProfileUpdate);
    document.getElementById('accountSettingsForm')?.addEventListener('submit', handleSettingsUpdate);

    // Helper functions
    function switchTab(tabId) {
        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
        });
        
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tabId}-content`);
        });
    }

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
            showToast('File size must be less than 2MB');
        }
    }

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

    function handleSettingsUpdate(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        profile.email = formData.get('email');
        
        localStorage.setItem('userProfile', JSON.stringify(profile));
        updateProfileUI();
        
        showToast('Settings updated successfully');
    }

    function showDeleteConfirmation(itemTitle, onConfirm) {
        deleteItemTitle.textContent = itemTitle;
        deleteConfirmation.style.display = 'flex';
        
        confirmDeleteBtn.onclick = () => {
            onConfirm();
            deleteConfirmation.style.display = 'none';
        };
        
        cancelDeleteBtn.onclick = () => {
            deleteConfirmation.style.display = 'none';
        };
    }

    function showToast(message) {
        toastMessage.textContent = message;
        toastNotification.classList.add('show');
        setTimeout(() => {
            toastNotification.classList.remove('show');
        }, 3000);
    }

    // Tab switching functionality
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(`${tabName}-content`).classList.add('active');
        });
    });

    // Handle view timeline click
    const viewTimelineLinks = document.querySelectorAll('.saved-timeline-view');
    viewTimelineLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            window.location.href = href;
        });
    });
});