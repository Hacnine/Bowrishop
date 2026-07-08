import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { HelmetProvider } from "react-helmet-async";
import { store } from './app/store';
import { router } from './router';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <HelmetProvider>
      <RouterProvider router={router} />
      </HelmetProvider>
    </Provider>
  </StrictMode>,
);

