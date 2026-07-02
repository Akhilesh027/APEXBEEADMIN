// Auto-rewrite localhost:5500 to dynamic hostname to support offline testing
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    if (typeof input === 'string' && input.includes('localhost:5500')) {
      const hostname = window.location.hostname || 'localhost';
      input = input.replace('localhost:5500', `${hostname}:5500`);
    }
    return originalFetch.call(this, input, init);
  };

  const originalOpen = window.XMLHttpRequest.prototype.open;
  window.XMLHttpRequest.prototype.open = function (method, url, ...args) {
    if (typeof url === 'string' && url.includes('localhost:5500')) {
      const hostname = window.location.hostname || 'localhost';
      url = url.replace('localhost:5500', `${hostname}:5500`);
    }
    return originalOpen.call(this, method, url, ...args as any);
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
