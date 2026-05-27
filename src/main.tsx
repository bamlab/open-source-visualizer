import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import './index.css';
import App from './App.tsx';
import { PersonPage } from './pages/PersonPage';

// Lazy-loaded: pulls in three.js / react-globe.gl, kept out of the main bundle.
const ConferencesPage = lazy(() =>
  import('./pages/ConferencesPage').then((m) => ({ default: m.ConferencesPage })),
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/person" element={<PersonPage />} />
          <Route
            path="/conferences"
            element={
              <Suspense fallback={<div className="min-h-screen bg-background" />}>
                <ConferencesPage />
              </Suspense>
            }
          />
        </Routes>
      </HashRouter>
    </QueryClientProvider>
  </StrictMode>,
);
