document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('query'); // Get the search query from URL

    // Show a message based on the search query
    const searchInfo = document.getElementById('searchInfo');
    searchInfo.textContent = `Search results for: "${searchQuery}"`;

    // If the search query matches 'planes', load and display data
    if (searchQuery.toLowerCase() === 'planes') {
        loadTimelineData('data/planesData.json');
    }
});

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

    // Create the wrapper for the vertical timeline
    const timelineWrapper = document.createElement('div');
    timelineWrapper.classList.add('timeline-wrapper');
    timelineWrapper.style.position = 'relative';
    timelineWrapper.style.padding = '20px';

    // Create the timeline container (vertical line)
    const timelineContainer = document.createElement('div');
    timelineContainer.classList.add('timeline-container');
    timelineContainer.style.position = 'relative';
    timelineContainer.style.display = 'flex';
    timelineContainer.style.flexDirection = 'column';
    timelineContainer.style.alignItems = 'center';

    // Create the timeline line
    const timelineLine = document.createElement('div');
    timelineLine.classList.add('timeline-line');
    timelineLine.style.position = 'absolute';
    timelineLine.style.left = '50%';
    timelineLine.style.top = '0';
    timelineLine.style.height = '100%';
    timelineLine.style.width = '2px';
    timelineLine.style.backgroundColor = '#006A71';
    timelineContainer.appendChild(timelineLine);

    // Sort years in ascending order
    const years = Object.keys(data.timeline).sort((a, b) => a - b);

    // Define the scale for year spacing
    const yearSpacing = 120; // Space between each year (adjust for layout)

    years.forEach((year, index) => {
        const yearData = data.timeline[year];

        // Create a container for this year's events
        const yearContainer = document.createElement('div');
        yearContainer.classList.add('year-container');
        yearContainer.style.position = 'relative';
        yearContainer.style.marginTop = `${index * yearSpacing}px`;

        // Create the year marker
        const yearMarker = document.createElement('div');
        yearMarker.classList.add('year-marker');
        yearMarker.textContent = year;
        yearMarker.style.textAlign = 'center';
        yearMarker.style.fontWeight = 'bold';
        yearMarker.style.padding = '10px';
        yearContainer.appendChild(yearMarker);

        // Create a list for events in this year
        const eventsList = document.createElement('ul');
        eventsList.classList.add('events-list');

        // Create each event under this year
        yearData.forEach((event, eventIndex) => {
            const eventItem = document.createElement('li');
            eventItem.classList.add('event-item');
            eventItem.style.position = 'relative';

            // Alternate the events left and right of the timeline
            const isLeft = eventIndex % 2 === 0;
            eventItem.style.left = isLeft ? '-200px' : '200px'; // Move events to the left or right

            // Create the event box
            const eventBox = document.createElement('div');
            eventBox.classList.add('event-box');
            eventBox.style.backgroundColor = '#F2EFE7';
            eventBox.style.border = '1px solid #006A71';
            eventBox.style.padding = '10px';
            eventBox.style.borderRadius = '8px';
            eventBox.style.width = '200px';

            // Event title
            const eventTitle = document.createElement('h4');
            eventTitle.classList.add('font-semibold');
            eventTitle.textContent = event.title;
            eventBox.appendChild(eventTitle);

            // Event category
            const eventCategory = document.createElement('p');
            eventCategory.classList.add('text-sm', 'text-[#9ACBD0]');
            eventCategory.textContent = `Category: ${event.category}`;
            eventBox.appendChild(eventCategory);

            // Event description
            const eventDescription = document.createElement('p');
            eventDescription.classList.add('text-gray-600');
            eventDescription.textContent = event.description;
            eventBox.appendChild(eventDescription);

            // Append the event box to the event item
            eventItem.appendChild(eventBox);

            // Append the event item to the events list
            eventsList.appendChild(eventItem);
        });

        // Append the events list to the year container
        yearContainer.appendChild(eventsList);

        // Append the year container to the timeline container
        timelineContainer.appendChild(yearContainer);
    });

    // Append the timeline container to the wrapper
    timelineWrapper.appendChild(timelineContainer);

    // Append the timeline wrapper to the results list
    resultsList.appendChild(timelineWrapper);
}
