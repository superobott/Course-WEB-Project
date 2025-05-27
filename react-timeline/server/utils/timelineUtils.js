function sortTimelineEvents(events) {
  return events.sort((a, b) => {
    const yearA = extractYear(a.date);
    const yearB = extractYear(b.date);
    if (yearA === null && yearB === null) return 0;
    if (yearA === null) return -1;
    if (yearB === null) return 1;
    return yearA - yearB;
  });
}

function extractYear(dateStr) {
  if (!dateStr) return null;
  const bcMatch = dateStr.match(/(?:[A-Za-z]+\s)?(\d{1,4})\s*BC/i);
  if (bcMatch) return -parseInt(bcMatch[1]);
  const adMatch = dateStr.match(/(?:[A-Za-z]+\s)?(\d{3,4})$/);
  if (adMatch) return parseInt(adMatch[1]);
  return null;
}

function filterTimelineEventsByYear(events, startYear, endYear) {
  return events.filter(event => {
    const year = extractYear(event.date);
    if (year === null) return false;
    return year >= startYear && year <= endYear;
  });
}

module.exports = { sortTimelineEvents, extractYear, filterTimelineEventsByYear };