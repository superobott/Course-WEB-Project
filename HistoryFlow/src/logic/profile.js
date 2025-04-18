// Tab Navigation
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            document.getElementById(`${button.dataset.tab}-content`).classList.add('active');
        });
    });
}

// Modal Handling
function setupModals() {
    const editProfileBtn = document.getElementById('editProfileBtn');
    const editProfileModal = document.getElementById('editProfileModal');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const closeModal = document.querySelector('.modal .close');
    const chooseImageBtn = document.getElementById('chooseImageBtn');
    const profileImageInput = document.getElementById('profileImageInput');

    editProfileBtn.addEventListener('click', () => {
        editProfileModal.style.display = 'block';
    });

    cancelEditBtn.addEventListener('click', () => {
        editProfileModal.style.display = 'none';
    });

    closeModal.addEventListener('click', () => {
        editProfileModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === editProfileModal) {
            editProfileModal.style.display = 'none';
        }
    });

    chooseImageBtn.addEventListener('click', () => {
        profileImageInput.click();
    });

    profileImageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && file.size <= 2 * 1024 * 1024) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const profileImageDiv = document.querySelector('#editProfileModal .w-16.h-16');
                profileImageDiv.innerHTML = `<img src="${e.target.result}" class="w-full h-full rounded-full object-cover">`;
            };
            reader.readAsDataURL(file);
        } else {
            showToast('Image size exceeds 2MB', 'error');
        }
    });
}

// Form Handling
function setupForms() {
    const editProfileForm = document.getElementById('editProfileForm');
    const accountSettingsForm = document.getElementById('accountSettingsForm');

    editProfileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fullName = document.getElementById('fullName').value.trim();
        const profileBio = document.getElementById('profileBio').value.trim();
        if (!fullName) {
            showToast('Full name is required', 'error');
            return;
        }
        document.getElementById('profileName').textContent = fullName;
        document.getElementById('editProfileModal').style.display = 'none';
        showToast('Profile updated successfully', 'success');
    });

    accountSettingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!email) {
            showToast('Email is required', 'error');
            return;
        }
        if (password && password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }
        showToast('Account settings updated successfully', 'success');
    });
}

// Aviation Timeline Preview
function initializeAviationTimeline() {
    const timelineContainers = document.querySelectorAll('.aviation-timeline');
    timelineContainers.forEach(container => {
        const events = JSON.parse(container.dataset.events || '[]');
        initializePlanesTimeline(container, events);
    });
}

function initializePlanesTimeline(container, events) {
    if (!events.length) return;

    container.innerHTML = '';
    events.forEach((event, index) => {
        const node = document.createElement('div');
        node.className = 'timeline-node';
        node.dataset.year = event.year;
        node.dataset.title = event.title;
        node.dataset.description = event.description;
        node.style.left = `${(index / (events.length - 1)) * 100}%`;

        const modal = document.createElement('div');
        modal.className = 'timeline-event-modal';
        modal.innerHTML = `
            <h4>${event.title}</h4>
            <p>${event.description}</p>
            <div class="event-image"></div>
        `;
        node.appendChild(modal);

        node.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.timeline-event-modal').forEach(m => m.style.display = 'none');
            modal.style.display = 'block';
        });

        container.appendChild(node);
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.timeline-event-modal').forEach(modal => modal.style.display = 'none');
    });
}

// Delete Confirmation
function setupDeleteButtons() {
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const timelineItem = button.closest('.history-item');
            const itemTitle = timelineItem.querySelector('h4').textContent;
            showDeleteConfirmation(itemTitle, () => {
                timelineItem.style.opacity = '0';
                timelineItem.style.height = timelineItem.offsetHeight + 'px';
                timelineItem.style.transition = 'opacity 0.3s, height 0.3s 0.3s';
                setTimeout(() => {
                    timelineItem.style.height = '0';
                    timelineItem.style.padding = '0';
                    timelineItem.style.margin = '0';
                    timelineItem.style.overflow = 'hidden';
                }, 300);
                setTimeout(() => {
                    timelineItem.remove();
                    showToast('Item deleted successfully', 'success');
                }, 600);
            });
        });
    });
}

function showDeleteConfirmation(itemTitle, onConfirm) {
    const confirmationDialog = document.getElementById('deleteConfirmation');
    const itemTitleSpan = document.getElementById('deleteItemTitle');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const cancelBtn = document.getElementById('cancelDeleteBtn');

    itemTitleSpan.textContent = itemTitle;
    confirmationDialog.style.display = 'block';

    const confirmHandler = () => {
        onConfirm();
        confirmationDialog.style.display = 'none';
        confirmBtn.removeEventListener('click', confirmHandler);
    };

    confirmBtn.addEventListener('click', confirmHandler);
    cancelBtn.addEventListener('click', () => {
        confirmationDialog.style.display = 'none';
    });
}

// Toast Notifications
function showToast(message, type) {
    const toast = document.getElementById('toastNotification');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.querySelector('.toast-icon');

    toastMessage.textContent = message;
    toast.className = `toast-notification ${type} show`;
    toastIcon.innerHTML = type === 'success' ? '✅' : '❌';

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Planes Timeline
function addPlanesTimeline() {
    fetch('/HistoryFlow/public/data/planesData.json')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(planesData => {
            const savedTimelinesContainer = document.querySelector('#saved-timelines-content .space-y-4');
            if (!savedTimelinesContainer) return;

            const events = [];
            Object.keys(planesData.timeline).forEach(year => {
                planesData.timeline[year].forEach(item => {
                    events.push({
                        year: parseInt(year),
                        title: item.title,
                        description: item.description,
                        category: item.category
                    });
                });
            });
            events.sort((a, b) => a.year - b.year);

            const firstYear = events[0].year;
            const lastYear = events[events.length - 1].year;

            const timelineItem = document.createElement('div');
            timelineItem.className = 'history-item p-4 pl-6 bg-white rounded-lg highlight-item';
            timelineItem.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <h4 class="font-medium">Planes Timeline</h4>
                        <p class="text-sm text-gray-600">Saved on April 16, 2025</p>
                    </div>
                    <div class="flex gap-2">
                        <a href="results.html?id=planes-timeline" class="text-[#006A71] hover:underline view-results-btn">View Timeline</a>
                        <button class="text-red-500 hover:text-red-700 delete-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="mt-4 pt-4 border-t border-gray-200">
                    <h5 class="font-medium text-sm mb-2">Timeline Preview:</h5>
                    <div class="overflow-x-auto">
                        <div class="planes-timeline aviation-timeline flex items-center space-x-4 py-2 min-w-max" data-events='${JSON.stringify(events)}'></div>
                    </div>
                    <p class="text-sm text-gray-600 mt-2">${events.length} events spanning from ${firstYear} to ${lastYear}</p>
                </div>
            `;

            savedTimelinesContainer.insertBefore(timelineItem, savedTimelinesContainer.firstChild);
            initializePlanesTimeline(timelineItem.querySelector('.planes-timeline'), events);
            setupDeleteButtons();
            setupViewResultsButtons();
        })
        .catch(error => {
            console.error('Error fetching planes data:', error);
            showToast('Failed to load planes timeline data', 'error');
        });
}

function setupViewResultsButtons() {
    const viewResultsButtons = document.querySelectorAll('.view-results-btn');
    viewResultsButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            const timelineItem = this.closest('.history-item');
            const timelineTitle = timelineItem.querySelector('h4').textContent;
            const parentTab = timelineItem.closest('.tab-content').id;

            // If the button is in the "Search History" tab, allow navigation
            if (parentTab === 'search-history-content') {
                return; // Proceed with the default navigation (e.g., to results.html?type=search&query=planes)
            }

            // For "Saved Timelines" tab, apply the existing logic
            if (timelineTitle !== 'Planes Timeline') {
                e.preventDefault();
                showToast('This timeline is no longer available', 'error');
                setTimeout(() => {
                    showDeleteConfirmation(timelineTitle, () => {
                        timelineItem.style.opacity = '0';
                        timelineItem.style.height = timelineItem.offsetHeight + 'px';
                        timelineItem.style.transition = 'opacity 0.3s, height 0.3s 0.3s';
                        setTimeout(() => {
                            timelineItem.style.height = '0';
                            timelineItem.style.padding = '0';
                            timelineItem.style.margin = '0';
                            timelineItem.style.overflow = 'hidden';
                        }, 300);
                        setTimeout(() => {
                            timelineItem.remove();
                            showToast('Item deleted successfully', 'success');
                        }, 600);
                    });
                }, 1000);
            }
        });
    });
}

function loadSearchHistory() {
    const searchHistoryContainer = document.querySelector('#search-history-content .space-y-4');
    const searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];

    // Clear existing entries (remove hardcoded ones)
    searchHistoryContainer.innerHTML = '';

    searchHistory.forEach(search => {
        const searchItem = document.createElement('div');
        searchItem.className = 'history-item p-4 pl-6 bg-white rounded-lg';
        searchItem.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <h4 class="font-medium">${search.query}</h4>
                    <p class="text-sm text-gray-600">Searched on ${new Date(search.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div class="flex gap-10">
                    <a href="results.html?type=search&query=${encodeURIComponent(search.query)}" class="text-[#006A71] hover:underline view-results-btn">View Results</a>
                    <button class="text-red-500 hover:text-red-700 delete-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
        `;
        searchHistoryContainer.appendChild(searchItem);
    });

    // Reattach delete button event listeners
    setupDeleteButtons();
    setupViewResultsButtons();
}

// Initial user data structure
const defaultUserData = {
    fullName: 'John Doe',
    bio: 'History enthusiast with a passion for exploring ancient civilizations and modern events.',
    memberSince: 'April 2025',
    email: 'john.doe@example.com',
    interests: ['ancient', 'medieval', 'wars', 'aviation'],
    notifications: {
        email: true,
        news: true
    },
    searchHistory: [
        {
            query: 'World War II',
            date: 'April 15, 2025'
        }
    ]
};

// Load user data from localStorage or use default
function loadUserData() {
    const storedData = localStorage.getItem('userData');
    return storedData ? JSON.parse(storedData) : defaultUserData;
}

// Save user data to localStorage
function saveUserData(data) {
    localStorage.setItem('userData', JSON.stringify(data));
}

// Initialize page with user data
function initializeProfile() {
    const userData = loadUserData();
    
    // Update profile section
    document.getElementById('profileName').textContent = userData.fullName;
    document.getElementById('profileMemberSince').textContent = `Member since ${userData.memberSince}`;
    
    // Update form fields
    document.getElementById('fullName').value = userData.fullName;
    document.getElementById('profileBio').value = userData.bio;
    document.getElementById('email').value = userData.email;
    
    // Update interests
    userData.interests.forEach(interest => {
        const checkbox = document.getElementById(`interest-${interest}`);
        if (checkbox) checkbox.checked = true;
    });

    // Update notification preferences
    document.getElementById('emailNotifications').checked = userData.notifications.email;
    document.getElementById('newsUpdates').checked = userData.notifications.news;
}

// Handle form submission
document.getElementById('editProfileForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const userData = loadUserData();
    userData.fullName = document.getElementById('fullName').value;
    userData.bio = document.getElementById('profileBio').value;
    
    // Get selected interests
    userData.interests = [];
    document.querySelectorAll('input[name="interests[]"]:checked').forEach(checkbox => {
        userData.interests.push(checkbox.value);
    });
    
    saveUserData(userData);
    initializeProfile();
    
    // Close modal and show success message
    document.getElementById('editProfileModal').style.display = 'none';
    showToast('Profile updated successfully!');
});

// Handle account settings form
document.getElementById('accountSettingsForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const userData = loadUserData();
    userData.email = document.getElementById('email').value;
    userData.notifications = {
        email: document.getElementById('emailNotifications').checked,
        news: document.getElementById('newsUpdates').checked
    };
    
    saveUserData(userData);
    showToast('Settings saved successfully!');
});

// Show toast message
function showToast(message) {
    const toast = document.getElementById('toastNotification');
    document.getElementById('toastMessage').textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeProfile);

// Update the DOMContentLoaded event listener to include loadSearchHistory
document.addEventListener('DOMContentLoaded', () => {
    setupTabNavigation();
    setupModals();
    setupForms();
    addPlanesTimeline();
    setupViewResultsButtons();
    loadSearchHistory();
});
