import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Avatar, Breadcrumb, Button, Layout, Menu, Space } from 'antd';
import { StyleProvider } from '../../../../client/src/style-system/StyleProvider';
import { WorkosDrawer } from '../../../../client/src/style-system/components';
import { palette } from '../../../../client/src/app-info';
import { Dashboard } from './dashboard';
import { Receipt, Review } from './documents';
import { AdvancedForm, StepForm } from './forms';
import { LedgerPage } from './ledger';
import { catalog, inventory, ledgers, templateGroups } from './data';
import './layout.css';

function readRoute() {
  const [id, record] = location.hash.slice(1).split('/');
  return { id: catalog.some(page => page.id === id) ? id : 'analysis', record };
}

function Gallery() {
  const [route, setRoute] = useState(readRoute);
  const [visited, setVisited] = useState(() => new Set([route.id]));
  const [navigation, setNavigation] = useState(false);
  const [requests, setRequests] = useState(ledgers.requests.rows);
  const current = catalog.find(page => page.id === route.id)!;
  const group = templateGroups.find(item => item.pages.includes(current))!;
  useEffect(() => {
    const update = () => {
      const next = readRoute();
      setVisited(previous => previous.has(next.id) ? previous : new Set([...previous, next.id]));
      setRoute(next);
      setNavigation(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  useEffect(() => { document.title = `${current.title} · WorkOS 企业后台模板`; }, [current.title]);

  function openPage(id: string) {
    location.hash = id;
    setNavigation(false);
  }

  const menuItems = templateGroups.map(item => ({
    type: 'group' as const, label: item.label,
    children: item.pages.map(page => ({ key: page.id, label: page.title })),
  }));
  const menu = () => <Menu mode="inline" items={menuItems} selectedKeys={[route.id]} onClick={({ key }) => openPage(key)} />;
  const renderPage = (id: string, visible: boolean) => {
    switch (id) {
      case 'analysis': return <Dashboard />;
      case 'receipt': return <Receipt />;
      case 'review': return <Review />;
      case 'advanced': return <AdvancedForm onCreate={item => setRequests(previous => [item, ...previous])} />;
      case 'steps': return <StepForm />;
      default: {
        const config = id === 'requests' ? { ...ledgers.requests, rows: requests } : inventory[id] ?? ledgers[id];
        return <LedgerPage id={id} visible={visible} record={visible ? route.record : undefined} config={config} />;
      }
    }
  };

  return <Layout className="erp-shell">
    <Layout.Header className="erp-header">
      <Space size="middle">
        <Button className="erp-menu-toggle" aria-label="打开模板导航" onClick={() => setNavigation(true)}>☰</Button>
        <a href="#analysis" className="erp-brand"><span aria-hidden="true" className="erp-brand-mark">M</span>{current.brand}</a>
      </Space>
      <Space size="middle">
        <Button className="erp-source" href={current.url} target="_blank" rel="noopener noreferrer" type="text">{current.source} ↗</Button>
        <Avatar size={28}>苏</Avatar>
      </Space>
    </Layout.Header>
    <Layout className="erp-body">
      <Layout.Sider className="erp-sider" width={214}>{menu()}</Layout.Sider>
      <Layout.Content className="erp-main" id="erp-main">
        <Breadcrumb className="erp-breadcrumb" items={[{ title: group.label }, { title: current.title }]} />
        {catalog.filter(page => visited.has(page.id)).map(page => (
          <div key={page.id} hidden={page.id !== route.id}>{renderPage(page.id, page.id === route.id)}</div>
        ))}
      </Layout.Content>
    </Layout>
    <WorkosDrawer title="模板导航" placement="left" open={navigation} onClose={() => setNavigation(false)}>{menu()}</WorkosDrawer>
  </Layout>;
}

createRoot(document.getElementById('root')!).render(<StyleProvider palette={palette}><Gallery /></StyleProvider>);
