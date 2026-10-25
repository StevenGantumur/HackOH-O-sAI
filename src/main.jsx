import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './shared/ui/ui.css';
import App from './app/App.jsx';
import { initializeTheme } from './shared/theme.js';

initializeTheme();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
