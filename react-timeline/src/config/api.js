// API configuration for both development and production
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // Use relative URLs in production (same domain)
  : 'http://localhost:4000'; // Use localhost in development

export { API_BASE_URL }; 