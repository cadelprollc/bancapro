import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { CustomizationProvider } from './context/CustomizationContext.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <CustomizationProvider>
          <App />
        </CustomizationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);
