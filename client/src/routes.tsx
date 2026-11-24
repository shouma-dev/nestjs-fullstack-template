import { createRootRoute, createRoute } from '@tanstack/react-router';
import { App } from './app';
import { AiEmployeesPage } from './pages/ai-employees';

const rootRoute = createRootRoute({
  component: App,
  notFoundComponent: () => <main className="ai-not-found" role="status">页面不存在，请返回 AI 员工工作台。</main>,
});

const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: AiEmployeesPage });

export const routeTree = rootRoute.addChildren([homeRoute]);
