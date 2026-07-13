import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import apiClient from './services/apiClient.js';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AlertProvider } from './context/AlertContext.jsx';

// Ghi đè hàm fetch mặc định của trình duyệt bằng apiClient (Axios)
window.originalFetch = window.fetch;
window.fetch = apiClient;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <ErrorBoundary>
        <AlertProvider>
          <App />
        </AlertProvider>
      </ErrorBoundary>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
