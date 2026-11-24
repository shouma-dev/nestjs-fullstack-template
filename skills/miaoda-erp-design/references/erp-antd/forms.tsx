import { useState } from 'react';
import { App, Button, Card, DatePicker, Descriptions, Form, Input, InputNumber, Result, Select, Steps } from 'antd';
import { decimal, FormActions, options, PageTitle } from './ui';

type DateField = { format: (pattern: string) => string };
type Application = {
  subject: string; applicant: string; costCenter: string; applicationDate: DateField;
  category: string; amount: number; due: DateField; supplier: string; notes?: string;
};
const required = [{ required: true, message: '请填写此项' }];
const textRequired = [{ required: true, whitespace: true, message: '请填写此项' }];

export function AdvancedForm({ onCreate }: { onCreate: (row: string[]) => void }) {
  const [form] = Form.useForm<Application>();
  const [sequence, setSequence] = useState(26082);
  const { message } = App.useApp();
  return <>
    <PageTitle extra={<Button type="link" href="#requests">返回费用申请列表</Button>}>费用申请</PageTitle>
    <Form<Application> layout="vertical" form={form} className="erp-stack" onFinish={value => {
      const id = 'EX-' + sequence;
      onCreate([id, value.subject.trim(), value.applicant.trim(), value.category, decimal(value.amount),
        value.applicationDate.format('YYYY-MM-DD'), '待审核']);
      setSequence(previous => previous + 1);
      form.resetFields();
      location.hash = `requests/${id}`;
      void message.success(`费用申请 ${id} 已提交`);
    }}>
      <Card title="申请信息"><div className="erp-form-grid">
        <Form.Item name="subject" label="申请事由" rules={textRequired}><Input placeholder="例如：昆山仓盘点临时用工" /></Form.Item>
        <Form.Item name="applicant" label="申请人" rules={textRequired}><Input placeholder="请输入姓名" /></Form.Item>
        <Form.Item name="costCenter" label="成本中心" rules={required}><Select options={options(['华东仓储', '华南仓储', '集团职能'])} /></Form.Item>
        <Form.Item name="applicationDate" label="申请日期" rules={required}><DatePicker className="erp-full-width" /></Form.Item>
      </div></Card>
      <Card title="费用明细"><div className="erp-form-grid">
        <Form.Item name="category" label="费用类别" rules={required}><Select options={options(['用工', '差旅', '设备', '运输', '办公'])} /></Form.Item>
        <Form.Item name="amount" label="预计金额 / 元" rules={[{ required: true, type: 'number', min: 0.01 }]}>
          <InputNumber min={0.01} precision={2} className="erp-full-width" />
        </Form.Item>
        <Form.Item name="due" label="结算日期" rules={required}><DatePicker className="erp-full-width" /></Form.Item>
        <Form.Item name="supplier" label="供应商" rules={textRequired}><Input placeholder="请输入往来单位" /></Form.Item>
      </div></Card>
      <Card title="备注"><Form.Item name="notes" label="用途说明" className="erp-last-field">
        <Input.TextArea rows={3} maxLength={400} placeholder="补充费用用途或审批背景" />
      </Form.Item></Card>
      <FormActions><Button onClick={() => void message.success('费用申请草稿已暂存')}>暂存草稿</Button>
        <Button type="primary" htmlType="submit">提交申请</Button></FormActions>
    </Form>
  </>;
}

type Account = { org: string; id: string; bank: string; account: string };
const stepTitles = ['填写收款对象', '填写银行账户', '核对并提交'];
const accountItems = (value: Account) => [
  { key: 'org', label: '收款单位', children: value.org },
  { key: 'id', label: '统一社会信用代码', children: value.id },
  { key: 'bank', label: '开户银行', children: value.bank },
  { key: 'account', label: '银行账号', children: '尾号 ' + value.account.slice(-4) },
];

export function StepForm() {
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<Account>();
  const [form] = Form.useForm<Account>();
  return <>
    <PageTitle>新增收款账户</PageTitle>
    <Card>
      <Steps current={result ? stepTitles.length : step} size="small" items={stepTitles.map(title => ({ title }))} className="erp-stepper" />
      <Form<Account> form={form} layout="vertical" className="erp-wizard" onFinish={() => {
        if (step < 2) setStep(previous => previous + 1);
        else setResult(form.getFieldsValue(true));
      }}>
        {result ? <Result status="success" title="收款账户已登记" subTitle={`尾号 ${result.account.slice(-4)}`}
          extra={<Button onClick={() => { form.resetFields(); setStep(0); setResult(undefined); }}>登记另一账户</Button>} /> : <>
          <h2>{stepTitles[step]}</h2>
          {step === 0 && <>
            <Form.Item name="org" label="收款单位" rules={textRequired}><Input placeholder="请输入单位全称" /></Form.Item>
            <Form.Item name="id" label="统一社会信用代码" rules={[...required, { pattern: /^[0-9A-Z]{18}$/, message: '请输入18位统一社会信用代码' }]}>
              <Input placeholder="18 位统一社会信用代码" maxLength={18} />
            </Form.Item>
          </>}
          {step === 1 && <>
            <Form.Item name="bank" label="开户银行" rules={textRequired}><Input placeholder="请输入开户行支行全称" /></Form.Item>
            <Form.Item name="account" label="银行账号" rules={[...required, { pattern: /^[0-9]{10,24}$/, message: '请输入10到24位银行账号' }]}>
              <Input inputMode="numeric" maxLength={24} />
            </Form.Item>
          </>}
          {step === 2 && <Descriptions layout="vertical" column={2} items={accountItems(form.getFieldsValue(true))} />}
          <FormActions>{step > 0 && <Button onClick={() => setStep(previous => previous - 1)}>上一步</Button>}
            <Button type="primary" htmlType="submit">{step < 2 ? '下一步' : '确认提交'}</Button></FormActions>
        </>}
      </Form>
    </Card>
  </>;
}
