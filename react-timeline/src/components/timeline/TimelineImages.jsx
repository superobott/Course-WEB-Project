import React from 'react';
import '../../style/componentsStyle/TimelineImages.css';

const TimelineImages = ({ images }) => {
  if (!images || images.length === 0) {
    return null; // Don't render if no images
  }

  return (
    <div className="timeline-images-grid">
      {images.map((image, index) => (
        <div key={index} className="timeline-image-item">
          <img src={image.src} alt={image.alt} />
        </div>
      ))}
    </div>
  );
};

export default TimelineImages;