// Local Storage Keys
const STORAGE_KEYS = {
    PROFILE: 'userProfile',
    SEARCH_HISTORY: 'searchHistory',
    SAVED_TIMELINES: 'savedTimelines'
};

// Initialize default data
const defaultProfile = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    memberSince: 'April 2025',
    bio: 'History enthusiast with a passion for exploring ancient civilizations and modern events.',
    interests: ['ancient', 'medieval', 'wars', 'aviation'],
    emailNotifications: true,
    newsUpdates: true,
    password: 'defaultpassword123' // You should implement proper password hashing in production
};

const defaultSearchHistory = [
    {
        id: '1',
        query: 'World War II',
        date: 'April 15, 2025'
    }
];

const defaultSavedTimelines = [
    {
        id: '1',
        title: 'Planes',
        date: 'April 15, 2025',
        eventCount: 15,
        lastModified: '2 days ago'
    }
];

// Initialize local storage with default data if empty
function initializeLocalStorage() {
    try {
        // Test if localStorage is available
        const test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);

        if (!localStorage.getItem(STORAGE_KEYS.PROFILE)) {
            localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(defaultProfile));
        }
        if (!localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY)) {
            localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(defaultSearchHistory));
        }
        if (!localStorage.getItem(STORAGE_KEYS.SAVED_TIMELINES)) {
            localStorage.setItem(STORAGE_KEYS.SAVED_TIMELINES, JSON.stringify(defaultSavedTimelines));
        }
        return true;
    } catch (e) {
        console.error('Local storage is not available:', e);
        showToast('Error: Local storage is not available');
        return false;
    }
}

// Load and display search history
function loadSearchHistory() {
    try {
        const searchHistory = JSON.parse(localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY) || '[]');
        const container = document.getElementById('searchHistoryContainer');
        if (!container) {
            console.error('Search history container not found');
            return;
        }
        container.innerHTML = searchHistory.map(item => `
            <div class="history-item p-4 pl-6 bg-white rounded-lg" data-id="${item.id}">
                <div class="flex justify-between items-center">
                    <div>
                        <h4 class="font-medium">${item.query}</h4>
                        <p class="text-sm text-gray-600">Searched on ${item.date}</p>
                    </div>
                    <div class="flex gap-10">
                        <a href="results.html?type=search&query=${encodeURIComponent(item.query)}&returnTo=profile" 
                           class="text-[#006A71] hover:underline view-results-btn">View Results</a>
                        <button class="text-red-500 hover:text-red-700 delete-btn" onclick="deleteSearchHistory('${item.id}')">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error('Error loading search history:', e);
        showToast('Error loading search history');
    }
}

// Load and display saved timelines
function loadSavedTimelines() {
    try {
        const savedTimelines = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVED_TIMELINES) || '[]');
        const container = document.getElementById('savedTimelinesContainer');
        if (!container) {
            console.error('Saved timelines container not found');
            return;
        }
        container.innerHTML = savedTimelines.map(timeline => `
            <div class="history-item p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow" data-id="${timeline.id}">
                <div class="flex justify-between items-start">
                    <div class="flex-grow">
                        <h4 class="font-medium text-lg mb-1">${timeline.title}</h4>
                        <p class="text-sm text-gray-600 mb-2">Saved on ${timeline.date}</p>
                        <p class="text-sm text-gray-700">Contains ${timeline.eventCount} events • Last modified ${timeline.lastModified}</p>
                    </div>
                    <div class="flex gap-3 items-center">
                        <a href="results.html?type=timeline&id=${timeline.id}" 
                           class="text-[#006A71] hover:text-[#48A6A7] transition-colors flex items-center gap-2">
                            <span>View</span>
                        </a>
                        <button class="text-red-500 hover:text-red-700 transition-colors delete-btn" 
                                onclick="deleteTimeline('${timeline.id}')">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error('Error loading saved timelines:', e);
        showToast('Error loading saved timelines');
    }
}

// Delete handlers
function deleteSearchHistory(id) {
    let searchHistory = JSON.parse(localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY));
    searchHistory = searchHistory.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(searchHistory));
    loadSearchHistory();
    showToast('Search history item deleted');
}

function deleteTimeline(id) {
    let savedTimelines = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVED_TIMELINES));
    savedTimelines = savedTimelines.filter(timeline => timeline.id !== id);
    localStorage.setItem(STORAGE_KEYS.SAVED_TIMELINES, JSON.stringify(savedTimelines));
    loadSavedTimelines();
    showToast('Timeline deleted');
}

// Toast notification
function showToast(message) {
    const toast = document.getElementById('toastNotification');
    document.getElementById('toastMessage').textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Profile management functions
function loadProfile() {
    try {
        const profile = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILE));
        document.getElementById('profileName').textContent = profile.name;
        document.getElementById('email').value = profile.email;
        document.getElementById('profileBio').value = profile.bio;
        document.getElementById('profileMemberSince').textContent = `Member since ${profile.memberSince}`;
        
        // Set checkboxes for interests
        profile.interests.forEach(interest => {
            const checkbox = document.getElementById(`interest-${interest}`);
            if (checkbox) checkbox.checked = true;
        });
        
        // Set notification preferences
        document.getElementById('emailNotifications').checked = profile.emailNotifications;
        document.getElementById('newsUpdates').checked = profile.newsUpdates;
    } catch (e) {
        console.error('Error loading profile:', e);
        showToast('Error loading profile');
    }
}

// Modal handling
const editProfileModal = document.getElementById('editProfileModal');
const editProfileBtn = document.getElementById('editProfileBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const closeModalBtn = document.querySelector('.close');

function showEditModal() {
    editProfileModal.style.display = 'block';
}

function hideEditModal() {
    editProfileModal.style.display = 'none';
}

// Tab handling
function initializeTabs() {
    const tabs = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = `${tab.getAttribute('data-tab')}-content`;
            
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and its content
            tab.classList.add('active');
            document.getElementById(targetId).classList.add('active');
        });
    });
}

// Form handling
document.getElementById('editProfileForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    try {
        const profile = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILE));
        profile.name = document.getElementById('fullName').value;
        profile.bio = document.getElementById('profileBio').value;
        
        // Get selected interests
        const interests = [];
        document.querySelectorAll('input[name="interests[]"]:checked').forEach(checkbox => {
            interests.push(checkbox.value);
        });
        profile.interests = interests;
        
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
        loadProfile();
        hideEditModal();
        showToast('Profile updated successfully');
    } catch (e) {
        console.error('Error saving profile:', e);
        showToast('Error saving profile changes');
    }
});

// Add account settings form handler
document.getElementById('accountSettingsForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    try {
        const profile = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILE));
        const newPassword = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (newPassword) {
            if (newPassword !== confirmPassword) {
                showToast('Passwords do not match');
                return;
            }
            profile.password = newPassword; // Remember to hash in production
        }
        
        profile.email = document.getElementById('email').value;
        profile.emailNotifications = document.getElementById('emailNotifications').checked;
        profile.newsUpdates = document.getElementById('newsUpdates').checked;
        
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
        
        // Clear password fields
        document.getElementById('password').value = '';
        document.getElementById('confirmPassword').value = '';
        
        showToast('Account settings updated successfully');
    } catch (e) {
        console.error('Error saving account settings:', e);
        showToast('Error saving account settings');
    }
});

// Image upload handling
document.getElementById('chooseImageBtn').addEventListener('click', () => {
    document.getElementById('profileImageInput').click();
});

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    const isStorageAvailable = initializeLocalStorage();
    if (isStorageAvailable) {
        loadProfile();
        loadSearchHistory();
        loadSavedTimelines();
        initializeTabs();
        
        // Modal event listeners
        editProfileBtn?.addEventListener('click', showEditModal);
        cancelEditBtn?.addEventListener('click', hideEditModal);
        closeModalBtn?.addEventListener('click', hideEditModal);
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === editProfileModal) {
                hideEditModal();
            }
        });
    }
});
