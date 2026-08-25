// Auto-rewrite localhost:5500 to production server https://server.apexbee.in
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    if (typeof input === 'string' && (input.includes('localhost:5500') || input.includes('127.0.0.1:5500'))) {
      input = input.replace(/http:\/\/(localhost|127\.0\.0\.1):5500/g, 'https://server.apexbee.in').replace(/(localhost|127\.0\.0\.1):5500/g, 'server.apexbee.in');
    }
    return originalFetch.call(this, input, init);
  };

  const originalOpen = window.XMLHttpRequest.prototype.open;
  (window.XMLHttpRequest.prototype as any).open = function (method: any, url: any, ...args: any[]) {
    if (typeof url === 'string' && (url.includes('localhost:5500') || url.includes('127.0.0.1:5500'))) {
      url = url.replace(/http:\/\/(localhost|127\.0\.0\.1):5500/g, 'https://server.apexbee.in').replace(/(localhost|127\.0\.0\.1):5500/g, 'server.apexbee.in');
    }
    return (originalOpen as any).apply(this, [method, url, ...args]);
  };
}

import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';
import { AdminStateProvider } from './context/AdminStateContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AdminStateProvider>
      <App />
    </AdminStateProvider>
  </StrictMode>
);
