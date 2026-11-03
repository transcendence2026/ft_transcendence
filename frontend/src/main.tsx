import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css';
import { registerSW } from 'virtual:pwa-register'; // 1. AÑADIR ESTA IMPORTACIÓN

// 2. AÑADIR ESTA EJECUCIÓN
registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);