import { useState } from 'react';
import { Alert, App, Button, Card, Descriptions, InputNumber, Select, Space, Table, Tabs, type TableColumnsType } from 'antd';
import { freight } from './data';
import { decimal, FormActions, PageTitle, RecordLink, Status, sum } from './ui';

const stock = [
  { sku: 'MK-1662', name: '氟橡胶密封圈 Ø48', ordered: 120, arrived: 100, accepted: 96, rejected: 4 },
  { sku: 'MK-1774', name: '不锈钢定位销 M8', ordered: 36, arrived: 36, accepted: 36, rejected: 0 },
];
const receiptDetails = [
  ['供应商', '苏州凯程工业配件'], ['过账日期', '2026-11-18'], ['采购订单', 'PO-23084'],
  ['合格仓', '昆山中心仓 / A01'], ['拒收仓', '昆山中心仓 / 待退区'], ['操作员', '苏宁'],
];
type Quantity = 'accepted' | 'rejected';
type StockItem = (typeof stock)[number];

export function Receipt() {
  const { message } = App.useApp();
  const [saved, setSaved] = useState(stock);
  const [isSaved, setIsSaved] = useState(false);
  const [draft, setDraft] = useState<Record<string, Partial<Record<Quantity, number | null>>>>({});
  const [error, setError] = useState('');
  const value = (sku: string, field: Quantity, fallback: number) =>
    draft[sku]?.[field] === undefined ? fallback : draft[sku][field];
  const tally = (key: 'ordered' | 'arrived' | Quantity) => sum(saved.map(item => item[key]));
  const quantityColumn = (field: Quantity, label: string) => ({
    title: label + ' / 件', key: field, align: 'right' as const,
    render: (_: unknown, row: StockItem) => <InputNumber aria-label={`${row.sku} ${label}量`}
      value={value(row.sku, field, row[field])} min={0} max={row.arrived} precision={0} className="erp-quantity"
      onChange={next => setDraft(previous => ({ ...previous, [row.sku]: { ...previous[row.sku], [field]: next } }))} />,
  });
  const columns: TableColumnsType<StockItem> = [
    { title: '物料编码', dataIndex: 'sku', render: value => <span className="erp-code">{value}</span> },
    { title: '物料名称', dataIndex: 'name' }, { title: '订购 / 件', dataIndex: 'ordered', align: 'right' },
    { title: '到货 / 件', dataIndex: 'arrived', align: 'right' }, quantityColumn('accepted', '合格'), quantityColumn('rejected', '拒收'),
  ];
  function save() {
    const updates = saved.map(item => ({ ...item, accepted: value(item.sku, 'accepted', item.accepted), rejected: value(item.sku, 'rejected', item.rejected) }));
    const invalid = updates.find(item => item.accepted == null || item.rejected == null
      || item.accepted < 0 || item.rejected < 0 || item.accepted + item.rejected !== item.arrived);
    if (invalid) {
      setError(`${invalid.sku} 的合格量与拒收量之和应为 ${invalid.arrived} 件。`);
      return;
    }
    setSaved(updates.map(item => ({ ...item, accepted: item.accepted!, rejected: item.rejected! })));
    setDraft({});
    setError('');
    setIsSaved(true);
    void message.success('收货草稿已暂存');
  }
  return <>
    <PageTitle extra={<Status value={isSaved ? '已保存草稿' : '草稿'} />}>收货单 GR-0816</PageTitle>
    <Card className="erp-document">
      <Tabs items={[
        { key: 'details', label: '收货详情', children: <div className="erp-stack">
          <Descriptions title="单据信息" layout="vertical" size="small" column={{ xs: 2, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 }}
            items={receiptDetails.map(([label, children]) => ({ key: label, label, children }))} />
          <section><h2>收货明细</h2>
            <Table rowKey="sku" dataSource={saved} columns={columns} scroll={{ x: 620 }} pagination={false}
              summary={() => <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={2}>合计 / 件</Table.Summary.Cell>
                {(['ordered', 'arrived', 'accepted', 'rejected'] as const).map((key, index) =>
                  <Table.Summary.Cell key={key} index={index + 2} align="right">{tally(key)}</Table.Summary.Cell>)}
              </Table.Summary.Row>} />
          </section>
          {error && <Alert type="error" title={error} showIcon />}
          <div className="erp-document-actions">
            <RecordLink page="purchase" record="PO-23084">查看采购订单</RecordLink>
            <Button type="primary" onClick={save}>保存收货草稿</Button>
          </div>
        </div> },
        { key: 'stock', label: '库存去向', children: <div className="erp-stack">
          <Descriptions title="库存去向" layout="vertical" size="small" column={{ xs: 2, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 }} items={[
            { key: 'accepted', label: '合格品 · 昆山中心仓 / A01', children: tally('accepted') + ' 件' },
            { key: 'rejected', label: '拒收品 · 昆山中心仓 / 待退区', children: tally('rejected') + ' 件' },
            { key: 'open', label: '余量待收', children: tally('ordered') - tally('arrived') + ' 件' },
          ]} />
          <RecordLink page="returns" record="RT-0028">查看关联退货单</RecordLink>
        </div> },
      ]} />
    </Card>
  </>;
}

type Decision = '已复核' | '已退回';
const yuan = (amount: number) => '¥ ' + decimal(amount);
export function Review() {
  const { message } = App.useApp();
  const [view, setView] = useState('all');
  const [selectedId, setSelected] = useState(freight[0].id);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const filtered = freight.filter(item => view === 'all' || (view === 'open' ? !decisions[item.id] : decisions[item.id]));
  const selected = filtered.find(item => item.id === selectedId) ?? filtered[0];
  const status = (id: string) => decisions[id] ?? '待复核';

  function decide(decision: Decision) {
    setDecisions(previous => ({ ...previous, [selected.id]: decision }));
    void message.success(`${selected.id} ${decision}`);
  }

  return <>
    <PageTitle>运费审核</PageTitle>
    <Card size="small" className="erp-review-filter">
      <Space wrap><label htmlFor="review-status">审核状态</label>
        <Select id="review-status" value={view} onChange={setView} options={[
          { value: 'all', label: '全部记录' }, { value: 'open', label: '待复核' }, { value: 'closed', label: '已处理' },
        ]} className="erp-select" />
        <span className="erp-muted">共 {filtered.length} 条</span>
      </Space>
    </Card>
    <div className="erp-review">
      <Card title="账单队列" className="erp-table-card">
        <Table rowKey="id" dataSource={filtered} size="small" pagination={false}
          rowClassName={item => item.id === selected?.id ? 'erp-selected' : ''}
          columns={[
            { title: '承运商 / 异常', key: 'name', render: (_, item) => <div className="erp-queue-item">
              <Button type="link" className="erp-record-link" aria-pressed={item.id === selected?.id} onClick={() => setSelected(item.id)}>{item.name}</Button>
              <small>{item.id} · {item.issue}</small><small>{item.route}</small>
            </div> },
            { title: '状态', key: 'status', render: (_, item) => <Status value={status(item.id)} /> },
          ]} />
      </Card>
      <Card title={selected ? selected.name : '账单详情'} extra={selected && <Status value={status(selected.id)} />}>
        {selected ? <div className="erp-stack">
          <div className="erp-muted"><span className="erp-code">{selected.id}</span> · {selected.route}</div>
          <Descriptions title="运单与账单对照" layout="vertical" size="small" column={{ xs: 2, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 }} items={[
            { key: 'waybill', label: '运单编号', children: selected.waybill },
            { key: 'bill', label: '承运商账单', children: selected.bill },
            { key: 'issue', label: '异常原因', children: selected.issue },
          ]} />
          <Table key={selected.id} rowKey="id" dataSource={[selected]} size="small" pagination={false} scroll={{ x: 340 }}
            columns={[
              { key: 'fee', title: '费用项', render: () => '含税运费' },
              { title: '运单金额', dataIndex: 'expected', align: 'right', render: yuan },
              { title: '账单金额', dataIndex: 'billed', align: 'right', render: yuan },
              { key: 'difference', title: '差额', align: 'right', render: (_, item) => yuan(item.billed - item.expected) },
            ]} />
          {decisions[selected.id] ? <Alert type="info" title={`处理结果 · ${decisions[selected.id]}`} />
            : <FormActions><Button onClick={() => decide('已退回')}>退回补充</Button>
              <Button type="primary" onClick={() => decide('已复核')}>确认复核</Button></FormActions>}
        </div> : <Alert type="info" title="切换审核状态可查看其他记录。" />}
      </Card>
    </div>
  </>;
}
