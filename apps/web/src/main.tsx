import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Aurelian Dark fonts — three weight subsets per typography scale
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import './styles/globals.css';
import { App } from './App';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root element not found');
createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
