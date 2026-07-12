import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Intercept all fetches to the API to include credentials (HttpOnly cookies)
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  if (typeof resource === 'string' && resource.startsWith('http://localhost:5000/api')) {
    config = config || {};
    config.credentials = 'include';
  }
  return originalFetch(resource, config);
};
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
