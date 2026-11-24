import { createHashHistory, createRouter } from '@tanstack/react-router';
import { routeTree } from './routes';

// Static hosts only serve the entry document; hash routes do not require rewrites.
export const router = createRouter({ routeTree, history: createHashHistory(), defaultPreload: 'intent' });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
