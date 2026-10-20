import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {initializeLanguage} from './i18n';

void initializeLanguage().catch(()=>{/* English remains available; the selector can retry Danish. */}).finally(()=>createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
));
