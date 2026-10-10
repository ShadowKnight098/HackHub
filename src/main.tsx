import React from 'react';
import ReactDOM from 'react-dom/client';
import { HeroUIProvider } from '@heroui/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { queryClient } from './lib/queryClient';
import { ThemeProvider } from './lib/theme';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <HeroUIProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </HeroUIProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
