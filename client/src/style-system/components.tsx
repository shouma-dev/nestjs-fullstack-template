import type { PropsWithChildren, ReactNode } from 'react';
import { Card, Drawer, Modal, type DrawerProps, type ModalProps } from 'antd';
import { componentMetrics } from './component-theme';
import './layout.css';

export function PageShell({ title, subtitle, children }: PropsWithChildren<{ title: string; subtitle?: string }>) {
  return (
    <main className="app-shell">
      <div className="app-shell__content">
        <header className="app-shell__header">
          <h1 className="app-shell__title">{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </header>
        {children}
      </div>
    </main>
  );
}

export function SectionCard({ title, extra, children }: PropsWithChildren<{ title: string; extra?: ReactNode }>) {
  return <Card title={title} extra={extra}>{children}</Card>;
}

export { SearchField } from './search-field';

// Ant Design 的 ConfigProvider 无默认面板宽度入口。尺寸通过应用可复用的组件默认值提供。
export function WorkosModal(props: ModalProps) {
  return <Modal width={componentMetrics.modal.width} {...props} />;
}

export function WorkosDrawer(props: DrawerProps) {
  return <Drawer defaultSize={componentMetrics.drawer.width} {...props} />;
}
