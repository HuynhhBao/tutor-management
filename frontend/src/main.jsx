import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import apiClient from './services/apiClient.js';

// Ghi đè hàm fetch mặc định của trình duyệt bằng apiClient (Axios)
window.originalFetch = window.fetch;
window.fetch = apiClient;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
