document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const queryType = urlParams.get('type');
    const searchQuery = urlParams.get('query');
    const year = urlParams.get('year');

    const searchInfo = document.getElementById('searchInfo');
    
    if (queryType === 'search') {
        searchInfo.textContent = `Search results for: "${searchQuery}"`;
        // Load all data and filter it
        loadAndFilterData(searchQuery, 'search');
    } else if (queryType === 'timeline') {
        searchInfo.textContent = `Historical events from year: ${year}`;
        loadAndFilterData(year, 'timeline');
    }
});

function loadAndFilterData(query, type) {
    fetch('data/combinedData.json')
        .then(res => res.json())
        .then(data => {
            const filteredData = filterTimelineData(data, query, type);
            
            if (Object.keys(filteredData.timeline).length > 0) {
                displayTimelineData(filteredData);
            } else {
                showNoResults(`No results found for: "${query}"`);
            }
        })
        .catch(error => {
            console.error('Error loading JSON data:', error);
            showNoResults('Error loading data. Please try again.');
        });
}

function filterTimelineData(data, query, type) {
    const filteredData = { timeline: {} };
    query = query.toLowerCase();

    data.events.forEach(yearData => {
        const year = yearData.year.toString();
        
        if (type === 'timeline') {
            // Timeline view - exact year match
            if (year === query) {
                filteredData.timeline[year] = yearData.events;
            }
        } else {
            // Search view - check all fields
            const filteredEvents = yearData.events.filter(event => 
                event.title.toLowerCase().includes(query) ||
                event.category.toLowerCase().includes(query) ||
                event.description.toLowerCase().includes(query)
            );

            if (filteredEvents.length > 0) {
                filteredData.timeline[year] = filteredEvents;
            }
        }
    });

    return filteredData;
}

// Add this new function to handle no results
function showNoResults(message) {
    const resultsList = document.getElementById('resultsList');
    const noResultsDiv = document.createElement('div');
    noResultsDiv.classList.add('no-results');
    noResultsDiv.style.textAlign = 'center';
    noResultsDiv.style.padding = '2rem';
    noResultsDiv.style.color = '#006A71';
    noResultsDiv.textContent = message;
    resultsList.appendChild(noResultsDiv);
}


// Function to fetch and load data from a JSON file
function loadTimelineData(jsonFile) {
    fetch(jsonFile)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error loading JSON file: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Data Loaded:', data); // Debugging line to check data
            displayTimelineData(data);
        })
        .catch(error => {
            console.error('Error loading JSON data:', error);
        });
}

// Function to display the timeline data
function displayTimelineData(data) {
    const resultsList = document.getElementById('resultsList');
    resultsList.innerHTML = '';

    const timelineWrapper = document.createElement('div');
    timelineWrapper.classList.add('timeline-wrapper');

    const timelineContainer = document.createElement('div');
    timelineContainer.classList.add('timeline-container');

    const timelineLine = document.createElement('div');
    timelineLine.classList.add('timeline-line');
    timelineContainer.appendChild(timelineLine);

    const years = Object.keys(data.timeline).sort((a, b) => a - b);

    years.forEach(year => {
        const yearData = data.timeline[year];
        const yearContainer = document.createElement('div');
        yearContainer.classList.add('year-container');

        const yearMarker = document.createElement('div');
        yearMarker.classList.add('year-marker');
        yearMarker.textContent = year;
        yearContainer.appendChild(yearMarker);

        const eventsList = document.createElement('ul');
        eventsList.classList.add('events-list');

        yearData.forEach(event => {
            const eventItem = document.createElement('li');
            eventItem.classList.add('event-item');

            const eventBox = document.createElement('div');
            eventBox.classList.add('event-box');
            eventBox.innerHTML = `
                <h4 class="font-semibold">${event.title}</h4>
                <p class="text-sm text-[#9ACBD0]">Category: ${event.category}</p>
                <p class="text-gray-600">${event.description}</p>
            `;

            // Add click event to open popup
            eventBox.addEventListener('click', () => {
                openPopup(event);
            });

            eventItem.appendChild(eventBox);
            eventsList.appendChild(eventItem);
        });

        yearContainer.appendChild(eventsList);
        timelineContainer.appendChild(yearContainer);
    });

    timelineWrapper.appendChild(timelineContainer);
    resultsList.appendChild(timelineWrapper);
}

// Function to open the popup window
function openPopup(event) {
    // Create the popup container
    const popupContainer = document.createElement('div');
    popupContainer.classList.add('popup-container');

    // Create the popup content
    const popupContent = document.createElement('div');
    popupContent.classList.add('popup-content');
    popupContent.innerHTML = `
        <button class="popup-close">&times;</button>
        <h2>${event.title}</h2>
        <p><strong>Category:</strong> ${event.category}</p>
        <p>${event.description}</p>
    `;

    // Add close functionality
    popupContent.querySelector('.popup-close').addEventListener('click', () => {
        popupContainer.remove();
    });

    popupContainer.appendChild(popupContent);
    document.body.appendChild(popupContainer);
}
