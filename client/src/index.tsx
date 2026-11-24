import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { palette } from './app-info';
import { router } from './router';
import { StyleProvider } from './style-system/StyleProvider';
import './index.css';

// Hash history keeps CLI, preview, and release subpaths independent of server rewrites.
createRoot(document.getElementById('root')!).render(
  <StyleProvider palette={palette}><RouterProvider router={router} /></StyleProvider>,
);
