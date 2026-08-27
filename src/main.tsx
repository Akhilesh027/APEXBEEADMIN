
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
