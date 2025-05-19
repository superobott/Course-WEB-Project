import React, { useState } from 'react';

const TimelineEvent = ({ date, summary, index }) => {
  const [showSummary, setShowSummary] = useState(false);
  const isLeft = index % 2 === 0;

  return (
    <div
      className={`w-1/2 mt-6 flex ${isLeft ? 'justify-start pr-8' : 'justify-end pl-8'} relative`}
    >
      <div className="flex flex-col items-center text-center max-w-xs">
        <button
          className="bg-[#00CED1] text-black font-semibold py-2 px-4 rounded-full shadow-md hover:bg-[#00b8ba] transition"
          onClick={() => setShowSummary(!showSummary)}
        >
          {date}
        </button>
        {showSummary && (
          <div className="mt-4 bg-white text-black rounded-lg shadow-lg p-4 text-sm">
            {summary}
          </div>
        )}
      </div>
    </div>
  );
};


export default TimelineEvent;
