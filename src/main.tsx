import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log("Starting BPress Tracker...");

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error("Root element not found");

  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} catch (e) {
  console.error("Critical boot error:", e);
  document.body.innerHTML = `<div style="padding: 20px; color: white; background: black; font-family: sans-serif;">
    <h1>App Error</h1>
    <p>Nie udało się uruchomić aplikacji. Sprawdź konsolę przeglądarki (F12).</p>
    <pre>${e instanceof Error ? e.message : String(e)}</pre>
  </div>`;
}
