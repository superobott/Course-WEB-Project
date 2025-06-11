// BubblePage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import topicsData from "../data/topics.json";
import "../style/pagestyle/bubble.css";

const BubblePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTopics, setFilteredTopics] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const filtered = topicsData.filter((topic) =>
      topic.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTopics(filtered);
  }, [searchTerm]);

  const handleBubbleClick = (topicName, topicType) => {
    // שמירת המידע ב-localStorage
    localStorage.setItem("selectedTopic", topicName);
    localStorage.setItem("selectedType", topicType);
    // ניווט לדף הציר זמן בלי פרמטרים
    navigate("/timeline");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Explore Topics</h1>
      <div className="flex justify-center mb-8">
        <input
          type="text"
          placeholder="Search topic..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md border border-gray-300 rounded-xl p-2"
        />
      </div>
      <div className="bubble-container">
        {filteredTopics.map((topic, idx) => {
          const x = Math.random() * 90;
          const y = Math.random() * 70;
          const delay = Math.random() * 5;

          return (
            <button
              key={idx}
              className="bubble"
              style={{
                backgroundColor: topic.color,
                left: `${x}%`,
                top: `${y}%`,
                animationDelay: `${delay}s`,
              }}
              onClick={() => handleBubbleClick(topic.name, topic.type)}
              title={topic.name}
            >
              {topic.image && (
                <img src={topic.image} alt={topic.name} className="bubble-img" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BubblePage;
