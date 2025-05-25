import React from 'react';
import './TimelineImages.css'; // Create this CSS file for styling

const TimelineImages = ({ images }) => {
  if (!images || images.length === 0) {
    return null; // Don't render if no images
  }

  return (
    <div className="timeline-images-grid">
      {images.map((image, index) => (
        <div key={index} className="timeline-image-item">
          <img src={image.src} alt={image.alt} />
          {image.alt && <p className="image-caption">{image.alt}</p>}
        </div>
      ))}
    </div>
  );
};

export default TimelineImages;