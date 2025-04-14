document.addEventListener('DOMContentLoaded', function() {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const searchType = urlParams.get('type');
    const searchInfo = document.getElementById('searchInfo');
    const resultsList = document.getElementById('resultsList');

    if (searchType === 'search') {
        const query = urlParams.get('query');
        searchInfo.textContent = `Search results for: "${query}"`;
        // Here you would typically fetch search results from your backend
        displayDummyResults(query);
    } else if (searchType === 'timeline') {
        const year = urlParams.get('year');
        searchInfo.textContent = `Historical events from year: ${year}`;
        // Here you would typically fetch timeline events from your backend
        displayDummyTimelineEvents(year);
    }
});

function displayDummyResults(query) {
    const resultsList = document.getElementById('resultsList');
    resultsList.innerHTML = `
        <div class="grid gap-4">
            <div class="bg-white p-4 rounded-lg shadow">
                <h3 class="text-xl font-semibold mb-2">Search Result 1</h3>
                <p>Sample result related to "${query}"</p>
            </div>
            <div class="bg-white p-4 rounded-lg shadow">
                <h3 class="text-xl font-semibold mb-2">Search Result 2</h3>
                <p>Another sample result for "${query}"</p>
            </div>
        </div>
    `;
}

function displayDummyTimelineEvents(year) {
    const resultsList = document.getElementById('resultsList');
    resultsList.innerHTML = `
        <div class="grid gap-4">
            <div class="bg-white p-4 rounded-lg shadow">
                <h3 class="text-xl font-semibold mb-2">Event in ${year}</h3>
                <p>Sample historical event that occurred in ${year}</p>
            </div>
            <div class="bg-white p-4 rounded-lg shadow">
                <h3 class="text-xl font-semibold mb-2">Another Event in ${year}</h3>
                <p>Another important historical event from ${year}</p>
            </div>
        </div>
    `;
}