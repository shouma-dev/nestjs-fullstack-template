import { useEffect, useRef, useState } from 'react';
import { Card, Progress, Select, Statistic, Table, Tabs } from 'antd';
import { integer, PageTitle, sum } from './ui';

const salesHistory = [180, 352, 450, 394, 319, 584, 486, 530, 676, 608, 865, 964];
const lastYear = [154, 311, 350, 348, 283, 501, 453, 526, 591, 505, 725, 856];
const traffic = [8.4, 11.6, 12.2, 10.8, 9.2, 16.5, 13.1, 12.4, 15.0, 18.2, 21.6, 24.9];
const branches = [['湖东汇店', .253], ['滨江银泰店', .201], ['城西万象店', .176], ['江北中心店', .136], ['南站广场店', .112], ['新城时代店', .075], ['中山路店', .047]] as const;
const channels = [['线下门店', .48], ['小程序', .32], ['合作团购', .20]] as const;
const windows = [
  { value: 'year', label: '全年', from: 0, to: 12 }, { value: 'second', label: '下半年', from: 6, to: 12 },
  { value: 'third', label: '第三季度', from: 6, to: 9 }, { value: 'fourth', label: '第四季度', from: 9, to: 12 },
];

function Sparkline({ values }: { values: number[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = canvas.current!;
    const context = element.getContext('2d')!;
    const { width, height } = element;
    context.clearRect(0, 0, width, height);
    context.beginPath();
    const maximum = Math.max(...values);
    values.forEach((value, index) => {
      const x = index * width / (values.length - 1);
      const y = height - 6 - value * (height - 12) / maximum;
      if (index) context.lineTo(x, y);
      else context.moveTo(x, y);
    });
    const accent = getComputedStyle(element).getPropertyValue('--workos-info').trim();
    context.strokeStyle = accent;
    context.lineWidth = 2;
    context.stroke();
    context.lineTo(width, height);
    context.lineTo(0, height);
    context.closePath();
    context.globalAlpha = .14;
    context.fillStyle = accent;
    context.fill();
    context.globalAlpha = 1;
  }, [values]);
  return <canvas ref={canvas} width={360} height={68} className="erp-sparkline" aria-label="本期每月访问量趋势" />;
}

function Columns({ values, from, maximum, unit }: { values: number[]; from: number; maximum: number; unit: string }) {
  return <div className="erp-plot" role="img" aria-label={values.map((v, i) => `${from + i + 1} 月 ${v} ${unit}`).join('，')}>
    <div className="erp-axis" aria-hidden>{[1, .8, .6, .4, .2, 0].map(tick => <span key={tick}>{Math.round(maximum * tick)}</span>)}</div>
    <div className="erp-bars">{values.map((value, index) => <div key={index} className="erp-bar-slot">
      <i className="erp-bar" style={{ height: `${value * 100 / maximum}%` }} title={`${from + index + 1} 月 · ${value} ${unit}`} />
      <small>{from + index + 1}月</small>
    </div>)}</div>
  </div>;
}

export function Dashboard() {
  const [range, setRange] = useState('year');
  const [metric, setMetric] = useState('sales');
  const { from, to } = windows.find(item => item.value === range)!;
  const sales = salesHistory.slice(from, to);
  const visits = traffic.slice(from, to);
  const total = Math.round(sum(sales) * 10000);
  const visitTotal = Math.round(sum(visits) * 10000);
  const target = (to - from) * 6400000;
  const achievement = Math.round(total / target * 100);
  const annual = ((sum(sales) / sum(lastYear.slice(from, to)) - 1) * 100).toFixed(1);
  const isSales = metric === 'sales';
  const label = isSales ? '销售额' : '访问量';
  const unit = isSales ? '万元' : '万人次';
  const metrics = [
    { title: '总销售额', value: total, suffix: undefined, prefix: '¥', detail: <span>↑ {annual}% 较去年同期</span>, foot: `月均销售额 ¥ ${integer(Math.round(total / sales.length))}` },
    { title: '访问量', value: visitTotal, detail: <Sparkline values={visits} />, foot: `月均访问量 ${integer(Math.round(visitTotal / visits.length))}` },
    { title: '支付笔数', value: Math.round(total / 178), detail: <div className="erp-mini-bars" aria-hidden>
      {sales.map((value, index) => <i key={index} style={{ height: `${value * 100 / Math.max(...sales)}%` }} />)}
    </div>, foot: '平均订单金额 ¥ 178' },
    { title: '销售目标达成率', value: achievement, suffix: '%', detail: <Progress percent={Math.min(achievement, 100)} showInfo={false} />,
      foot: `本期销售目标 ¥ ${integer(target)}` },
  ];
  const searches = [['冷链次日达', 320, '8.3%'], ['门店自提', 270, '6.1%'], ['会员配送券', 206, '4.0%']] as const;
  return <>
    <PageTitle extra={<span className="erp-muted">2026 年 · 华东区域</span>}>经营分析</PageTitle>
    <div className="erp-stack">
      <div className="erp-kpis">{metrics.map(item => <Card key={item.title} size="small">
        <Statistic title={item.title} value={item.value} prefix={item.prefix} suffix={item.suffix} />
        <div className="erp-kpi-graphic">{item.detail}</div>
        <footer className="erp-kpi-footer">{item.foot}</footer>
      </Card>)}</div>
      <Card className="erp-chart-card">
        <Tabs activeKey={metric} onChange={setMetric} items={[{ key: 'sales', label: '销售额' }, { key: 'visits', label: '访问量' }]}
          tabBarExtraContent={<Select aria-label="统计区间" value={range} onChange={setRange} options={windows} className="erp-select" />} />
        <div className="erp-chart-content">
          <section><h2>{label}趋势 <small className="erp-muted">{unit}</small></h2>
            <Columns values={isSales ? sales : visits} from={from} maximum={isSales ? 1000 : 25} unit={unit} />
          </section>
          <section><h2>门店{label}排名</h2><ol className="erp-ranking">
            {branches.map(([name, ratio]) => <li key={name}><span>{name}</span><strong>{integer(Math.round((isSales ? total : visitTotal) * ratio))}</strong></li>)}
          </ol></section>
        </div>
      </Card>
      <div className="erp-chart-bottom">
        <Card title="线上热门搜索" className="erp-table-card">
          <Table rowKey="name" pagination={false} size="small" dataSource={searches.map(([name, count, rate]) => ({ name, count: integer(count * (to - from)), rate }))}
            columns={[{ title: '关键词', dataIndex: 'name' }, { title: '搜索量', dataIndex: 'count', align: 'right' }, { title: '搜索成交率', dataIndex: 'rate', align: 'right' }]} />
        </Card>
        <Card title="销售额渠道占比"><div className="erp-channels">
          <div className="erp-donut" role="img" aria-label="线下门店 48%，小程序 32%，合作团购 20%"><span>销售额</span></div>
          <ul>{channels.map(([name, share]) => <li key={name}><span>{name}</span><strong>{Math.round(share * 100)}%</strong><span>¥ {integer(Math.round(total * share))}</span></li>)}</ul>
        </div></Card>
      </div>
    </div>
  </>;
}
