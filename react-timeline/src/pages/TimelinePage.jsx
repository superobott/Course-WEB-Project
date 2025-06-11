// TimelinePage.jsx
import React, { useEffect, useState } from "react";
import "../style/pagestyle/TimelinePage.css";

const TimelinePage = () => {
  const [topic, setTopic] = useState(null);
  const [type, setType] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState("asc");
  const [color, setColor] = useState("#2563eb");
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    // קבלת הערכים מה-localStorage
    const storedTopic = localStorage.getItem("selectedTopic");
    const storedType = localStorage.getItem("selectedType");

    if (!storedTopic || !storedType) {
      // אם אין מידע ב-localStorage, אפשר להפנות חזרה לדף הבועות או להציג הודעה
      alert("No topic or type selected! Redirecting to topics page.");
      window.location.href = "/"; // או הכתובת שלך לדף הבועות
      return;
    }

    setTopic(storedTopic);
    setType(storedType);

    setLoading(true);

    fetch(`http://localhost:4000/api/dataset?topic=${encodeURIComponent(storedTopic)}&type=${encodeURIComponent(storedType)}`)

      .then((res) => {
        if (!res.ok) {
          console.error("Server responded with an error:", res.statusText);
          throw new Error(`Server responded with status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setTimeline(data);
      })
      .catch((error) => {
        console.error("Failed to fetch timeline data:", error);
        setTimeline([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSort = () => setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  const handleColorChange = (e) => setColor(e.target.value);
  const handleExportPDF = () => {
    alert("Export to PDF not implemented yet.");
  };

  const sortedTimeline = [...timeline].sort((a, b) => {
    const aDate = new Date(`${a.Month || "January"} ${a.Date || 1}, ${a.Year}`);
    const bDate = new Date(`${b.Month || "January"} ${b.Date || 1}, ${b.Year}`);
    return sortOrder === "asc" ? aDate - bDate : bDate - aDate;
  });

  if (!topic || !type) {
    return <div className="text-center p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-100 p-6">
      <h1 className="text-3xl font-bold text-center mb-6">
        {topic} Timeline <span className="text-base text-gray-500">({type})</span>
      </h1>

      {/* Controls */}
      <div className="flex gap-4 justify-center mb-6">
        <button onClick={handleSort} className="btn">
          {sortOrder === "asc" ? "Past → Future" : "Future → Past"}
        </button>
        <input
          type="color"
          value={color}
          onChange={handleColorChange}
          title="Pick timeline color"
        />
        <button onClick={handleExportPDF} className="btn">
          Export to PDF
        </button>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <div className="timeline-horizontal">
          {sortedTimeline.map((event, idx) => (
            <div
              key={idx}
              className="timeline-card"
              style={{ borderColor: color }}
              onClick={() => setSelectedEvent(event)}
            >
              <div className="timeline-date">
                {event.Month || "Unknown"} {event.Year}
              </div>
              <div className="timeline-title">{event["Name of Incident"]}</div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedEvent && (
        <div className="timeline-modal" onClick={() => setSelectedEvent(null)}>
          <div className="timeline-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedEvent["Name of Incident"]}</h2>
            <p><strong>Date:</strong> {selectedEvent.Date || "Unknown"} {selectedEvent.Month || ""} {selectedEvent.Year}</p>
            <p><strong>Country:</strong> {selectedEvent.Country}</p>
            <p><strong>Place:</strong> {selectedEvent["Place Name"]}</p>
            <p><strong>Impact:</strong> {selectedEvent.Impact}</p>
            <p><strong>Affected Population:</strong> {selectedEvent["Affected Population"]}</p>
            <p><strong>Important Person/Group:</strong> {selectedEvent["Important Person/Group"]}</p>
            <p><strong>Responsible:</strong> {selectedEvent.Responsible}</p>
            <p><strong>Outcome:</strong> {selectedEvent.Outcome}</p>
            <button onClick={() => setSelectedEvent(null)} className="btn mt-4">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelinePage;
