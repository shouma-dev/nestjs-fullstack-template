import { Button, Space, Tag } from 'antd';
import type { PropsWithChildren, ReactNode } from 'react';

const positive = new Set(['已完成', '已入库', '已退货', '已结清', '已上线', '在职', '已通过', '已复核']);
const pending = new Set(['待审核', '待收货', '部分收货', '待执行', '审核中', '待入职', '待复核']);
const negative = new Set(['逾期', '已退回']);

export function Status({ value }: { value: string }) {
  const color = positive.has(value) ? 'success' : pending.has(value) ? 'warning' : negative.has(value) ? 'error' : undefined;
  return <Tag color={color}>{value}</Tag>;
}

export function PageTitle({ children, extra }: PropsWithChildren<{ extra?: ReactNode }>) {
  return <header className="erp-title"><h1>{children}</h1>{extra}</header>;
}

export function RecordLink({ page, record, children }: PropsWithChildren<{ page: string; record?: string }>) {
  return <Button type="link" className="erp-record-link" href={`#${page}${record ? '/' + record : ''}`}>{children}</Button>;
}

export function FormActions({ children }: PropsWithChildren) {
  return <Space wrap className="erp-actions">{children}</Space>;
}

export const integer = (value: number) => value.toLocaleString('zh-CN');
export const decimal = (value: number) => value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
export const options = (values: string[]) => values.map(value => ({ label: value, value }));
