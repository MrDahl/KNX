import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {initializeLanguage} from './i18n';

// Set before asynchronous language loading so reloads do not restore an old scroll offset.
if('scrollRestoration' in window.history)window.history.scrollRestoration='manual';
window.scrollTo({top:0,left:0,behavior:'instant'});

void initializeLanguage().catch(()=>{/* English remains available; the selector can retry Danish. */}).finally(()=>createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
));
