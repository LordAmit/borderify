import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
// [REQ-UI-17] All colors, radii and type sizes come from the token block in index.css; components use its classes, not inline styles
import './index.css';
import { StoreProvider } from './store.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
);
