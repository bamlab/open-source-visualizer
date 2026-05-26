import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import './index.css';
import App from './App.tsx';
import { PersonPage } from './pages/PersonPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/person" element={<PersonPage />} />
        </Routes>
      </HashRouter>
    </QueryClientProvider>
  </StrictMode>,
);
