const fetch = require('node-fetch');

/**
 * Fetches relevant images for a timeline from Unsplash
 * @param {string} query - The search term to find images for
 * @returns {Array} Array of image objects with src and alt properties
 */
const fetchUnsplashImages = async (query) => {
  try {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
      console.error('No Unsplash access key found in environment variables');
      return [];
    }

    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10`,
      {
        headers: {
          'Authorization': `Client-ID ${accessKey}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Unsplash API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data.results.map(image => ({
      src: image.urls.regular,
      alt: image.alt_description || `Image related to ${query}`
    }));

  } catch (error) {
    console.error('Error fetching timeline images:', error);
    return [];
  }
};

module.exports = { fetchUnsplashImages };
