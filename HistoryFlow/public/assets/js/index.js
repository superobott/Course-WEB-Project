function generateTimelineLines() {
    const track = document.getElementById('timelineTrack');
    const trackWidth = track.clientWidth;
    const smallSpacing = 5;  // Base spacing unit
    const startYear = 1000;
    const endYear = 2020;
    
    track.innerHTML = '';
    
    // Calculate total number of small lines needed
    const totalYears = endYear - startYear;
    const totalLines = totalYears + 1;
    
    // Create all small lines first
    for(let i = 0; i < totalLines; i++) {
        const year = startYear + i;
        const lineWrapper = document.createElement('div');
        lineWrapper.className = 'line-wrapper';
        
        const line = document.createElement('div');
        line.className = 'line bg-[#9ACBD0] h-4 w-[1px]';
        line.style.marginLeft = `${smallSpacing}px`;
        line.setAttribute('data-tooltip', `${year}`);
        
        // If it's a decade year (divisible by 10), create medium line
        if (year % 10 === 0) {
            line.className = 'line bg-[#48A6A7] h-8 w-[2px]';
            line.style.zIndex = '5';
        }
        
        // If it's a century year (divisible by 100), create big line
        if (year % 100 === 0) {
            line.className = 'line bg-[#006A71] h-16 w-1';
            line.style.zIndex = '10';
        }
        
        lineWrapper.appendChild(line);
        track.appendChild(lineWrapper);
    }
}

// Generate lines initially when DOM is loaded
document.addEventListener('DOMContentLoaded', generateTimelineLines);

// Regenerate lines when window is resized
window.addEventListener('resize', generateTimelineLines);

function initializeScrollButtons() {
    const track = document.getElementById('timelineTrack');
    const scrollLeftBtn = document.getElementById('scrollLeft');
    const scrollRightBtn = document.getElementById('scrollRight');
    const scrollAmount = 240; // Scroll by 2 major lines (120px * 2)

    scrollLeftBtn.addEventListener('click', () => {
        track.scrollLeft -= scrollAmount;
    });

    scrollRightBtn.addEventListener('click', () => {
        track.scrollLeft += scrollAmount;
    });
}

// Update event listeners
document.addEventListener('DOMContentLoaded', () => {
    generateTimelineLines();
    initializeScrollButtons();
});

window.addEventListener('resize', generateTimelineLines);