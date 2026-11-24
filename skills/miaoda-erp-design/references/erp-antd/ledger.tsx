import { useEffect, useMemo, useState } from 'react';
import { App, Button, Card, Checkbox, DatePicker, Descriptions, Form, Input, InputNumber, Popover, Select, Space, Table, Tabs, Tree, type TableColumnsType } from 'antd';
import { SearchField, WorkosDrawer, WorkosModal } from '../../../../client/src/style-system/components';
import { catalog, inventory, type Ledger } from './data';
import { decimal, FormActions, options, PageTitle, RecordLink, Status } from './ui';

type Filters = { keyword?: string; status?: string; facet?: string; date?: { format: (pattern: string) => string } };
type Contract = { title: string; company: string; direction: string; amount: number; due: NonNullable<Filters['date']> };

type DepartmentNode = { key: string; title: string; selectable?: boolean; children?: DepartmentNode[] };
const organization: DepartmentNode[] = [
  { key: '*', title: '全部部门' },
  { key: 'east', title: '华东仓储', selectable: false, children: [{ key: '苏州仓', title: '苏州仓' }, { key: '嘉兴仓', title: '嘉兴仓' }] },
  { key: 'south', title: '华南仓储', selectable: false, children: [{ key: '广州仓', title: '广州仓' }] },
  { key: 'group', title: '集团职能', selectable: false, children: [{ key: '财务部', title: '财务部' }] },
];

function OrganizationTree({ scope, onSelect }: { scope: string; onSelect: (scope: string) => void }) {
  const [keyword, search] = useState('');
  const match = keyword.trim();
  const nodes = match ? organization.flatMap(node => {
    if (node.title.includes(match)) return [node];
    const children = node.children?.filter(child => child.title.includes(match));
    return children?.length ? [{ ...node, children }] : [];
  }) : organization;
  return <Card title="组织机构" size="small" className="erp-organization">
    <SearchField placeholder="搜索部门名称" aria-label="搜索部门名称" value={keyword} onChange={event => search(event.target.value)} />
    <Tree treeData={nodes} defaultExpandAll selectedKeys={[scope || '*']} blockNode
      onSelect={keys => { if (keys.length) onSelect(keys[0] === '*' ? '' : String(keys[0])); }} />
  </Card>;
}

function CreateContract({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (value: Contract) => void }) {
  return <WorkosModal title="新增合同" open={open} onCancel={onClose} destroyOnHidden footer={null}>
    <Form<Contract> layout="vertical" onFinish={onSave} initialValues={{ direction: '应收' }}>
      <Form.Item label="合同名称" name="title" rules={[{ required: true, whitespace: true }]}><Input autoFocus /></Form.Item>
      <Form.Item label="对方单位" name="company" rules={[{ required: true, whitespace: true }]}><Input /></Form.Item>
      <Form.Item label="收付方向" name="direction" rules={[{ required: true }]}><Select options={options(['应收', '应付'])} /></Form.Item>
      <Form.Item label="待结算 / 元" name="amount" rules={[{ required: true, type: 'number', min: .01 }]}>
        <InputNumber min={.01} precision={2} className="erp-full-width" />
      </Form.Item>
      <Form.Item label="到期日" name="due" rules={[{ required: true }]}><DatePicker className="erp-full-width" /></Form.Item>
      <FormActions><Button onClick={onClose}>取消</Button><Button type="primary" htmlType="submit">保存合同</Button></FormActions>
    </Form>
  </WorkosModal>;
}

export function LedgerPage({ id, config, record, visible }: { id: string; config: Ledger; record?: string; visible: boolean }) {
  const page = catalog.find(item => item.id === id)!;
  const people = id === 'people';
  const contracts = id === 'contracts';
  const content = id === 'content';
  const procurement = Boolean(inventory[id]);
  const { message } = App.useApp();
  const [form] = Form.useForm<Filters>();
  const [filters, setFilters] = useState<Filters>({});
  const [scope, setScope] = useState(people ? '苏州仓' : '');
  const [showRecord, setRecord] = useState(record);
  const [contractOpen, setContractOpen] = useState(false);
  const [added, setAdded] = useState<string[][]>([]);
  const [dense, setDense] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<number[]>([]);
  const [current, setCurrent] = useState(1);
  const rows = useMemo(() => [...added, ...config.rows], [added, config.rows]);
  const statuses = [...new Set(rows.map(row => row.at(-1)!))];
  const facet = config.facet;
  const facets = facet ? [...new Set(rows.map(row => row[facet.column]))] : [];
  const keyword = filters.keyword?.trim().toLowerCase() ?? '';
  const searchDate = filters.date?.format('YYYY-MM-DD');
  const matches = rows.filter(row => row.join(' ').toLowerCase().includes(keyword)
    && (!filters.status || row.at(-1) === filters.status)
    && (!facet || !(filters.facet || scope) || row[facet.column] === (filters.facet || scope))
    && (!searchDate || row.some(value => value.startsWith(searchDate))));
  const selected = rows.find(item => item[0] === showRecord);
  const related = showRecord ? config.related?.[showRecord] ?? [] : [];
  useEffect(() => { if (visible) setRecord(record); }, [record, visible]);

  const columns: TableColumnsType<string[]> = config.columns.flatMap((title, index) => {
    if (hiddenColumns.includes(index)) return [];
    const amount = title.includes('元');
    return [{
      title, key: index, dataIndex: index,
      align: amount ? 'right' as const : 'left' as const,
      sorter: contracts && amount ? (a, b) => Number(a[index].replaceAll(',', '')) - Number(b[index].replaceAll(',', '')) : undefined,
      render: (value: string) => index === config.columns.length - 1 ? <Status value={value} />
        : index === 0 ? <span className="erp-code">{value}</span> : value,
    }];
  });
  columns.push({ title: '操作', key: 'actions', width: 74, render: (_, row) => (
    <Button type="link" size="small" aria-label={`查看 ${row[0]}`} onClick={() => setRecord(row[0])}>详情</Button>
  ) });

  const reset = () => { setFilters({}); setCurrent(1); form.resetFields(); };
  const closeRecord = () => {
    setRecord(undefined);
    if (record && location.hash.startsWith(`#${id}/`)) history.replaceState(null, '', `#${id}`);
  };
  const columnTools = content ? <Space wrap>
    <Button onClick={() => setDense(value => !value)}>{dense ? '标准行距' : '紧凑行距'}</Button>
    <Popover trigger="click" placement="bottomRight" content={<Checkbox.Group className="erp-column-options" options={[2, 3, 4].map(index => ({
      label: config.columns[index], value: index,
    }))} value={[2, 3, 4].filter(index => !hiddenColumns.includes(index))}
    onChange={values => setHiddenColumns([2, 3, 4].filter(index => !values.includes(index)))} />}>
      <Button>显示列</Button>
    </Popover>
  </Space> : undefined;

  return <>
    <PageTitle extra={id === 'requests' ? <Button type="primary" href="#advanced">发起费用申请</Button> : undefined}>
      {page.title}{people && scope && <small>{scope}</small>}
    </PageTitle>
    {procurement && <Tabs activeKey={id} onChange={key => { location.hash = key; }}
      items={Object.entries(inventory).map(([key, item]) => ({ key, label: item.object }))} />}
    <div className={people ? 'erp-directory' : 'erp-list'}>
      {people && <OrganizationTree scope={scope} onSelect={value => { setScope(value); setCurrent(1); }} />}
      <div className="erp-stack">
        <Card size="small">
          <Form<Filters> form={form} layout="vertical" className="erp-filters"
            onFinish={values => { setFilters(values); setCurrent(1); }}>
            {contracts && <Button type="primary" onClick={() => setContractOpen(true)}>＋ 新增合同</Button>}
            <Form.Item name="keyword" label={people ? '人员' : '关键词'} className="erp-keyword">
              <SearchField placeholder={config.search} />
            </Form.Item>
            {facet && !people && <Form.Item name="facet" label={facet.label}><Select allowClear placeholder="全部" options={options(facets)} /></Form.Item>}
            <Form.Item name="status" label="状态"><Select allowClear placeholder="全部" options={options(statuses)} /></Form.Item>
            {content && <Form.Item name="date" label="创建日期"><DatePicker /></Form.Item>}
            <Space><Button type="primary" htmlType="submit">查询</Button><Button onClick={reset}>重置</Button></Space>
          </Form>
        </Card>
        <Card title={<>{people ? '人员列表' : content ? '内容列表' : id === 'requests' ? page.title : page.title + '列表'} <small className="erp-muted">{matches.length} 条</small></>}
          extra={columnTools} className="erp-table-card">
          <Table rowKey={row => row[0]} columns={columns} dataSource={matches} size={dense ? 'small' : 'middle'}
            scroll={{ x: 620 }} pagination={{ current, pageSize: 6, hideOnSinglePage: false, showSizeChanger: false,
              showTotal: total => `共 ${total} 条`, onChange: setCurrent }} />
        </Card>
      </div>
    </div>
    <WorkosDrawer title={showRecord && `${config.columns[0]} ${showRecord}`} size={460}
      open={visible && Boolean(selected)} onClose={closeRecord}>
      {selected && <Descriptions layout="vertical" size="small" column={2}
        items={config.columns.map((label, index) => ({ key: label, label, children: selected[index] }))} />}
      {showRecord === 'GR-0816' && <Descriptions title="本次点收" size="small" layout="vertical" column={3}
        items={['到货', '合格', '拒收'].map((label, index) => ({ key: label, label, children: ['136 件', '132 件', '4 件'][index] }))} />}
      {related.length > 0 && <section><h3>关联单据</h3><Space wrap>
        {related.map(([to, label]) => <RecordLink key={label} page={to} record={to === 'receipt' ? undefined : label}>{label}</RecordLink>)}
      </Space></section>}
    </WorkosDrawer>
    {contracts && <CreateContract open={visible && contractOpen} onClose={() => setContractOpen(false)} onSave={value => {
      const next = 'CT-2026-' + (319 + added.length);
      setAdded(previous => [[next, value.title.trim(), value.company.trim(), value.direction, decimal(value.amount), value.due.format('YYYY-MM-DD'), '待审核'], ...previous]);
      reset();
      setContractOpen(false);
      void message.success(`合同 ${next} 已添加`);
    }} />}
  </>;
}
