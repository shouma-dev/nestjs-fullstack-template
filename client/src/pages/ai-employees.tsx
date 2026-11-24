import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, App as AntApp, Button, Drawer, Dropdown, Empty, Form, Input, Select, Spin, Tag,
  type MenuProps, type SelectProps,
} from 'antd';
import type { ChatMessage, Conversation, Employee } from '../../../shared/api.interface';
import { appTitle } from '../app-info';
import { employeesApi } from '../api';
import { SearchField, WorkosModal } from '../style-system/components';
import './ai-employees.css';

type EmployeeFormValues = {
  name: string;
  role: string;
  avatar: string;
  prompt: string;
  greeting?: string;
  capabilities?: string[];
};

const AVATAR_OPTIONS: SelectProps['options'] = [
  { value: '🧑‍💼', label: '🧑‍💼 业务顾问' },
  { value: '🎧', label: '🎧 客户服务' },
  { value: '✍️', label: '✍️ 内容创作' },
  { value: '📊', label: '📊 数据分析' },
  { value: '🛠️', label: '🛠️ 技术支持' },
  { value: '🧭', label: '🧭 策略顾问' },
  { value: '🎨', label: '🎨 设计搭档' },
  { value: '📣', label: '📣 市场增长' },
  { value: '🧠', label: '🧠 研究助理' },
  { value: '⚖️', label: '⚖️ 合规顾问' },
  { value: '💼', label: '💼 项目管家' },
  { value: '🤖', label: '🤖 通用助手' },
];

const PRESETS: Array<{ label: string; hint: string; values: EmployeeFormValues }> = [
  {
    label: '客户成功',
    hint: '共情沟通与问题跟进',
    values: {
      name: '小满', role: '客户成功顾问', avatar: '🎧',
      greeting: '你好，我是小满，负责客户成功。遇到问题直接告诉我，我陪你一起解决。',
      capabilities: ['客户沟通', '问题跟进', '续约提醒'],
      prompt: '你是一位客户成功顾问，名字叫小满。\n语气亲切、耐心，先共情再解决问题。\n你总是先确认客户的目标和影响范围，再给出可执行的下一步。\n涉及退款、合同或对外承诺时，不要代替公司做决定，先提示需要人工确认。',
    },
  },
  {
    label: '内容运营',
    hint: '选题、文案与复盘',
    values: {
      name: '阿禾', role: '内容运营', avatar: '✍️',
      greeting: '我是阿禾，负责内容运营。给我一个主题，我们先从选题和结构开始。',
      capabilities: ['选题策划', '文案撰写', '内容复盘'],
      prompt: '你是一位内容运营，名字叫阿禾。\n语气自然、具体，少用空话和夸张表达。\n你写内容时先确认受众、渠道和目标，再给标题与结构。\n不编造数据或案例，缺少信息时主动向对方确认。',
    },
  },
  {
    label: '技术顾问',
    hint: '需求澄清与方案评估',
    values: {
      name: '阿拓', role: '技术顾问', avatar: '🛠️',
      greeting: '我是阿拓，负责技术方案。把现象、环境和期望结果告诉我，我来帮你定位。',
      capabilities: ['需求澄清', '方案评估', '故障排查'],
      prompt: '你是一位技术顾问，名字叫阿拓。\n语气直接、严谨，先讲结论再解释原因。\n你处理问题时先确认现象、环境、影响范围和最近改动。\n不确定的地方明确标注假设，不凭空断定根因。',
    },
  },
];

const AVATAR_TINTS = ['#F3E8FF', '#E7F0FF', '#E4F6EC', '#FFF1E2', '#FFE8ED', '#E9F0F7', '#F0EEE6', '#E8F5F5'];

function avatarTint(id: string): string {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  return AVATAR_TINTS[hash % AVATAR_TINTS.length];
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function formatTime(timestamp: number | null): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const sameDay = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
  if (sameDay) return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  if (date.getFullYear() === now.getFullYear()) return `${date.getMonth() + 1}月${date.getDate()}日`;
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function previewText(value: string | null): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

const PORTAL_THEME_KEYS = [
  '--workos-layout', '--workos-container', '--workos-secondary', '--workos-text', '--workos-muted',
  '--workos-divider', '--workos-fill', '--workos-selected', '--workos-info', '--workos-brand',
  '--workos-spotlight', '--workos-radius-control', '--workos-radius-container',
  '--workos-space-xs', '--workos-space-sm', '--workos-space-md', '--workos-space-lg',
  '--workos-space-xl', '--workos-space-section',
  '--workos-title-size', '--workos-title-line', '--workos-title-weight',
];

/** 抽屉、弹窗通过 portal 挂到 body，需要把 StyleProvider 的主题变量同步到 body。 */
function usePortalThemeVariables() {
  useEffect(() => {
    const app = document.querySelector<HTMLElement>('.workos-app');
    if (!app) return;
    const root = document.body;
    let frame = 0;
    const sync = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const styles = window.getComputedStyle(app);
        for (const key of PORTAL_THEME_KEYS) {
          const value = styles.getPropertyValue(key).trim();
          if (value) root.style.setProperty(key, value);
          else root.style.removeProperty(key);
        }
      });
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(app, { attributes: true, attributeFilter: ['style'] });
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', sync);
    return () => {
      observer.disconnect();
      media.removeEventListener('change', sync);
      if (frame) window.cancelAnimationFrame(frame);
      for (const key of PORTAL_THEME_KEYS) root.style.removeProperty(key);
    };
  }, []);
}

function SparkIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1.5 9.55 6.1 14 7.5l-4.45 1.4L8 13.5 6.45 8.9 2 7.5l4.45-1.4L8 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M12.8 1.8v2.4M11.6 3h2.4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M2.5 5h13M2.5 9h13M2.5 13h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.1 7.6 13.2 2.9c.5-.2 1 .3.8.8l-4.7 11.1c-.2.5-.9.5-1.1 0L6.6 10 2.1 8.7c-.5-.2-.5-.9 0-1.1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="m6.6 10 2.7-2.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function SidebarContent({
  employees, filtered, state, error, search, selectedId, onSearch, onSelect, onCreate, onRetry, onHelp,
}: {
  employees: Employee[];
  filtered: Employee[];
  state: 'loading' | 'ready' | 'error';
  error: string;
  search: string;
  selectedId: string | null;
  onSearch: (value: string) => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onRetry: () => void;
  onHelp: () => void;
}) {
  return (
    <aside className="ai-sidebar" aria-label="AI 员工列表">
      <div className="ai-sidebar__top">
        <SearchField
          aria-label="搜索 AI 员工"
          placeholder="搜索员工或岗位"
          value={search}
          onChange={event => onSearch(event.target.value)}
        />
        <div className="ai-sidebar__label">
          <span>我的员工</span>
          <span>{filtered.length}{search.trim() ? ` / ${employees.length}` : ''}</span>
        </div>
      </div>
      <div className="ai-sidebar__list">
        {state === 'loading' ? (
          <div className="employee-skeleton" role="status" aria-label="正在加载员工">
            {[0, 1, 2, 3].map(item => (
              <div className="employee-skeleton__row" key={item}>
                <span className="employee-skeleton__avatar" />
                <span className="employee-skeleton__lines"><i /><i /></span>
              </div>
            ))}
          </div>
        ) : state === 'error' ? (
          <div className="ai-sidebar__message">
            <Alert
              type="error"
              showIcon
              title="员工列表加载失败"
              action={<Button size="small" onClick={onRetry}>重试</Button>}
            />
            <p>{error}</p>
          </div>
        ) : !employees.length ? (
          <div className="sidebar-empty">
            <span className="sidebar-empty__art" aria-hidden="true">✦</span>
            <strong>还没有 AI 员工</strong>
            <span>写一段人设提示词，创建你的第一位数字同事。</span>
            <Button type="primary" size="small" icon={<PlusIcon />} onClick={onCreate}>创建员工</Button>
          </div>
        ) : !filtered.length ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有匹配的员工" />
        ) : filtered.map(employee => {
          const active = employee.id === selectedId;
          return (
            <button
              type="button"
              key={employee.id}
              className={active ? 'employee-card is-active' : 'employee-card'}
              aria-pressed={active}
              onClick={() => onSelect(employee.id)}
            >
              <span className="employee-avatar" style={{ background: avatarTint(employee.id) }} aria-hidden="true">{employee.avatar}</span>
              <span className="employee-card__text">
                <span className="employee-card__top">
                  <span className="employee-card__name">{employee.name}</span>
                  <span className="employee-card__time">{formatTime(employee.lastMessageAt ?? employee.createdAt)}</span>
                </span>
                <span className="employee-card__role">{employee.role}</span>
                <span className="employee-card__preview">{previewText(employee.lastMessage) || '还没有对话，点击开始'}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="ai-sidebar__foot">
        <span>每位员工固定一个对话</span>
        <Button type="text" size="small" onClick={onHelp}>使用说明</Button>
      </div>
    </aside>
  );
}

function ProfilePanel({
  employee, onEdit, onClear, clearing, clearingBusy,
}: {
  employee: Employee;
  onEdit: () => void;
  onClear: () => void;
  clearing: boolean;
  clearingBusy: boolean;
}) {
  return (
    <div className="ai-profile__inner">
      <div className="profile-identity">
        <span className="profile-avatar" style={{ background: avatarTint(employee.id) }} aria-hidden="true">{employee.avatar}</span>
        <h2>{employee.name}</h2>
        <p>{employee.role}</p>
        <div className="profile-tags">
          <Tag>单会话</Tag>
          <Tag>人设驱动</Tag>
        </div>
      </div>

      <section className="profile-section" aria-labelledby="profile-prompt-title">
        <div className="profile-section__head">
          <h3 id="profile-prompt-title">人设提示词</h3>
          <Button type="text" size="small" onClick={onEdit}>编辑</Button>
        </div>
        <p className="profile-prompt">{employee.prompt}</p>
      </section>

      <section className="profile-section" aria-labelledby="profile-capability-title">
        <div className="profile-section__head"><h3 id="profile-capability-title">能力标签</h3></div>
        {employee.capabilities.length ? (
          <div className="profile-chips">
            {employee.capabilities.map(capability => <span className="chip" key={capability}>{capability}</span>)}
          </div>
        ) : <p className="profile-empty">还没有设置能力标签，可以在编辑人设时补充。</p>}
      </section>

      <section className="profile-section" aria-labelledby="profile-greeting-title">
        <div className="profile-section__head"><h3 id="profile-greeting-title">开场白</h3></div>
        <p className="profile-opening">{employee.greeting || '首次进入对话时使用默认问候。'}</p>
      </section>

      <section className="profile-section" aria-labelledby="profile-stats-title">
        <div className="profile-section__head"><h3 id="profile-stats-title">对话数据</h3></div>
        <div className="profile-stats">
          <div className="profile-stat"><span>消息数</span><strong>{employee.messageCount}</strong></div>
          <div className="profile-stat"><span>创建于</span><strong>{formatDate(employee.createdAt)}</strong></div>
          <div className="profile-stat"><span>最近对话</span><strong>{employee.lastMessageAt ? formatTime(employee.lastMessageAt) : '暂无'}</strong></div>
          <div className="profile-stat"><span>对话模式</span><strong>固定单会话</strong></div>
        </div>
        <p className="profile-note">回复由应用内人设引擎生成，未接入外部模型服务。</p>
      </section>

      <div className="profile-actions">
        <Button size="small" onClick={onEdit}>编辑人设</Button>
        <Button size="small" danger disabled={clearingBusy} onClick={onClear}>{clearing ? '清空中…' : '清空对话'}</Button>
      </div>
    </div>
  );
}

function EmployeeFormModal({
  open, mode, employee, onCancel, onSubmit,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  employee: Employee | null;
  onCancel: () => void;
  onSubmit: (values: EmployeeFormValues) => Promise<void>;
}) {
  const [form] = Form.useForm<EmployeeFormValues>();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError('');
    setSubmitting(false);
    form.resetFields();
    if (employee) {
      form.setFieldsValue({
        name: employee.name,
        role: employee.role,
        avatar: employee.avatar,
        prompt: employee.prompt,
        greeting: employee.greeting,
        capabilities: employee.capabilities,
      });
    } else {
      form.setFieldsValue({ avatar: '🤖', capabilities: [] });
    }
  }, [open, mode, employee?.id, form]);

  return (
    <WorkosModal
      title={mode === 'create' ? '创建 AI 员工' : '编辑人设'}
      className="employee-form-modal"
      open={open}
      width={620}
      okText={mode === 'create' ? '创建员工' : '保存人设'}
      cancelText="取消"
      confirmLoading={submitting}
      maskClosable={false}
      onOk={() => form.submit()}
      onCancel={() => { if (!submitting) onCancel(); }}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={async values => {
          setSubmitting(true);
          setError('');
          try {
            await onSubmit({ ...values, greeting: values.greeting ?? '', capabilities: values.capabilities ?? [] });
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : '保存失败，请重试。');
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {mode === 'create' ? (
          <div className="preset-block">
            <div className="preset-block__label">从模板开始，再改成你的人设</div>
            <div className="preset-grid">
              {PRESETS.map(preset => (
                <button
                  type="button"
                  key={preset.label}
                  className="preset-card"
                  onClick={() => form.setFieldsValue(preset.values)}
                >
                  <span className="preset-card__emoji" aria-hidden="true">{preset.values.avatar}</span>
                  <span className="preset-card__text">
                    <strong>{preset.label}</strong>
                    <small>{preset.hint}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="form-note">修改后，新消息会按新人设回复，历史对话会保留。</p>
        )}

        <div className="form-grid">
          <Form.Item label="头像" name="avatar" rules={[{ required: true, message: '请选择头像' }]}>
            <Select options={AVATAR_OPTIONS} />
          </Form.Item>
          <Form.Item
            label="员工名称"
            name="name"
            rules={[{ required: true, whitespace: true, message: '请输入员工名称' }, { max: 24, message: '最多 24 个字符' }]}
          >
            <Input placeholder="例如：林知夏" maxLength={24} autoFocus={mode === 'create'} />
          </Form.Item>
          <Form.Item
            label="岗位"
            name="role"
            rules={[{ required: true, whitespace: true, message: '请输入岗位' }, { max: 30, message: '最多 30 个字符' }]}
          >
            <Input placeholder="例如：客户成功顾问" maxLength={30} />
          </Form.Item>
        </div>

        <Form.Item
          label="人设提示词"
          name="prompt"
          extra="提示词即人设。写清身份、语气、工作原则和边界，员工会按这段设定回应。"
          rules={[
            { required: true, whitespace: true, message: '请输入人设提示词' },
            { min: 10, message: '至少写 10 个字符，人设会更稳定' },
            { max: 4000, message: '最多 4000 个字符' },
          ]}
        >
          <Input.TextArea
            autoSize={{ minRows: 5, maxRows: 9 }}
            maxLength={4000}
            showCount
            placeholder={'你是……\n你的语气是……\n你总是先……\n遇到……时不要……'}
          />
        </Form.Item>

        <Form.Item
          label="开场白（可选）"
          name="greeting"
          extra="首次进入对话时员工主动说的第一句话。"
          rules={[{ max: 500, message: '最多 500 个字符' }]}
        >
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} maxLength={500} placeholder="例如：你好，我是小满，负责客户成功。" />
        </Form.Item>

        <Form.Item
          label="能力标签（可选）"
          name="capabilities"
          extra="回车添加，最多 6 个。会显示在聊天开场和员工资料中。"
        >
          <Select
            mode="tags"
            maxCount={6}
            tokenSeparators={[',', '，']}
            placeholder="例如：需求梳理、写周报、客户沟通"
          />
        </Form.Item>

        {error ? <Alert type="error" showIcon title={error} /> : null}
      </Form>
    </WorkosModal>
  );
}

export function AiEmployeesPage() {
  const { message, modal } = AntApp.useApp();
  usePortalThemeVariables();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [listState, setListState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [listError, setListError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [chatState, setChatState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [chatError, setChatError] = useState('');
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const aliveRef = useRef(true);
  const pendingRef = useRef<{ id: string; content: string } | null>(null);
  const sendingRef = useRef<string | null>(null);
  const createIdRef = useRef<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const listRequestRef = useRef(0);
  const chatRequestRef = useRef(0);

  useEffect(() => {
    aliveRef.current = true;
    return () => { aliveRef.current = false; };
  }, []);

  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  const loadEmployees = useCallback(async (preferId?: string) => {
    const requestId = ++listRequestRef.current;
    setListState('loading');
    setListError('');
    try {
      const list = await employeesApi.list();
      if (!aliveRef.current || requestId !== listRequestRef.current) return;
      setEmployees(list);
      setListState('ready');
      setSelectedId(current => {
        if (preferId && list.some(item => item.id === preferId)) return preferId;
        if (current && list.some(item => item.id === current)) return current;
        return list[0]?.id ?? null;
      });
    } catch (cause) {
      if (!aliveRef.current || requestId !== listRequestRef.current) return;
      setListState('error');
      setListError(cause instanceof Error ? cause.message : '员工列表加载失败，请重试。');
    }
  }, []);

  useEffect(() => { void loadEmployees(); }, [loadEmployees]);

  const loadConversation = useCallback(async (employeeId: string) => {
    const requestId = ++chatRequestRef.current;
    setChatState('loading');
    setChatError('');
    try {
      const result = await employeesApi.conversation(employeeId);
      if (!aliveRef.current || requestId !== chatRequestRef.current) return;
      setConversation(result);
      setChatState('ready');
      setEmployees(current => current.map(item => (item.id === result.employee.id ? result.employee : item)));
    } catch (cause) {
      if (!aliveRef.current || requestId !== chatRequestRef.current) return;
      setChatState('error');
      setChatError(cause instanceof Error ? cause.message : '对话加载失败，请重试。');
    }
  }, []);

  useEffect(() => {
    pendingRef.current = null;
    setDraft('');
    setChatError('');
    if (!selectedId) {
      chatRequestRef.current += 1;
      setConversation(null);
      setChatState('idle');
      return;
    }
    setChatState('loading');
    void loadConversation(selectedId);
    return () => { chatRequestRef.current += 1; };
  }, [selectedId, loadConversation]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    element.scrollTop = element.scrollHeight;
  }, [conversation?.messages.length, sendingId, selectedId, chatState]);

  const selectedEmployee = useMemo(() => {
    const found = employees.find(item => item.id === selectedId);
    if (found) return found;
    if (conversation && conversation.employee.id === selectedId) return conversation.employee;
    return null;
  }, [employees, selectedId, conversation]);

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return employees;
    return employees.filter(employee => [employee.name, employee.role, ...employee.capabilities].join(' ').toLowerCase().includes(query));
  }, [employees, search]);

  const totalMessages = useMemo(() => employees.reduce((sum, employee) => sum + employee.messageCount, 0), [employees]);
  const messages = conversation && conversation.employee.id === selectedId ? conversation.messages : [];

  function openCreate() {
    createIdRef.current = crypto.randomUUID();
    setMobileListOpen(false);
    setCreateOpen(true);
  }

  function selectEmployee(employeeId: string) {
    if (employeeId !== selectedId) {
      setConversation(null);
      setChatState('loading');
    }
    setSelectedId(employeeId);
    setMobileListOpen(false);
    setMobileProfileOpen(false);
  }

  async function createEmployee(values: EmployeeFormValues) {
    const created = await employeesApi.create({
      id: createIdRef.current ?? crypto.randomUUID(),
      name: values.name,
      role: values.role,
      avatar: values.avatar,
      prompt: values.prompt,
      greeting: values.greeting ?? '',
      capabilities: values.capabilities ?? [],
    });
    createIdRef.current = null;
    setEmployees(current => [created, ...current]);
    setListState('ready');
    setListError('');
    setSelectedId(created.id);
    setConversation({ employee: created, messages: [] });
    setChatState('ready');
    setChatError('');
    setSearch('');
    setCreateOpen(false);
    void message.success(`「${created.name}」已入职，可以开始第一条对话`);
  }

  async function updateEmployee(values: EmployeeFormValues) {
    if (!selectedEmployee) throw new Error('请先选择一位 AI 员工');
    const updated = await employeesApi.update(selectedEmployee.id, {
      name: values.name,
      role: values.role,
      avatar: values.avatar,
      prompt: values.prompt,
      greeting: values.greeting ?? '',
      capabilities: values.capabilities ?? [],
    });
    setEmployees(current => current.map(item => (item.id === updated.id ? updated : item)));
    setConversation(current => (current && current.employee.id === updated.id ? { ...current, employee: updated } : current));
    setEditOpen(false);
    void message.success('人设已更新，后续回复会按新的设定生成');
  }

  async function removeEmployee(employee: Employee) {
    try {
      await employeesApi.remove(employee.id);
      const remaining = employees.filter(item => item.id !== employee.id);
      setEmployees(remaining);
      // 删除期间用户可能已经切换员工，只处理仍在查看该员工的情况。
      if (selectedIdRef.current === employee.id) {
        const next = remaining[0]?.id ?? null;
        setSelectedId(next);
        if (!next) {
          setConversation(null);
          setChatState('idle');
        }
      }
      setMobileProfileOpen(false);
      void message.success(`已删除「${employee.name}」`);
    } catch (cause) {
      void message.error(cause instanceof Error ? cause.message : '删除失败，请重试');
    }
  }

  async function clearConversation() {
    const employee = selectedEmployee;
    if (!employee || clearing) return;
    setClearing(true);
    try {
      await employeesApi.clear(employee.id);
      // 只清空这位员工的对话，避免覆盖用户切换后的当前会话。
      setConversation(current => (current && current.employee.id === employee.id ? { ...current, messages: [] } : current));
      setEmployees(current => current.map(item => (
        item.id === employee.id ? { ...item, messageCount: 0, lastMessage: null, lastMessageAt: null } : item
      )));
      if (selectedIdRef.current === employee.id) {
        pendingRef.current = null;
        setDraft('');
        setChatError('');
      }
      void message.success('对话已清空，人设和员工资料保留');
    } catch (cause) {
      void message.error(cause instanceof Error ? cause.message : '清空失败，请重试');
    } finally {
      setClearing(false);
    }
  }

  function confirmClear() {
    if (!selectedEmployee || sendingId) return;
    modal.confirm({
      title: '清空当前对话？',
      content: `「${selectedEmployee.name}」的人设和资料会保留，聊天记录将全部删除。`,
      okText: '清空',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: clearConversation,
    });
  }

  function confirmDelete() {
    if (!selectedEmployee || sendingId) return;
    modal.confirm({
      title: `删除「${selectedEmployee.name}」？`,
      content: '人设和全部对话会一并删除，无法恢复。',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => removeEmployee(selectedEmployee),
    });
  }

  async function sendMessage(raw?: string) {
    const content = (raw ?? draft).trim();
    if (!content || !selectedEmployee || sendingRef.current) return;
    if (content.length > 2000) {
      void message.warning('单条消息最多 2000 字');
      return;
    }
    const employeeId = selectedEmployee.id;
    sendingRef.current = employeeId;
    if (!pendingRef.current || pendingRef.current.content !== content) {
      pendingRef.current = { id: crypto.randomUUID(), content };
    }
    const pending = pendingRef.current;
    const nextMessageCount = (conversation && conversation.employee.id === employeeId ? conversation.messages.length : 0) + 2;
    const optimistic: ChatMessage = {
      id: pending.id,
      employeeId,
      role: 'user',
      content,
      replyTo: null,
      createdAt: Date.now(),
    };
    setSendingId(employeeId);
    setDraft('');
    setChatError('');
    setConversation(current => (current && current.employee.id === employeeId
      ? { ...current, messages: [...current.messages, optimistic] }
      : current));
    try {
      const result = await employeesApi.send(employeeId, { id: pending.id, content });
      pendingRef.current = null;
      setConversation(current => {
        if (!current || current.employee.id !== employeeId) return current;
        const withoutOptimistic = current.messages.filter(item => item.id !== optimistic.id);
        return { ...current, messages: [...withoutOptimistic, result.userMessage, result.reply] };
      });
      setEmployees(current => {
        const updated = current.map(item => (item.id === employeeId ? {
          ...item,
          messageCount: nextMessageCount,
          lastMessage: result.reply.content,
          lastMessageAt: result.reply.createdAt,
          updatedAt: result.reply.createdAt,
        } : item));
        return [...updated].sort((left, right) => (right.lastMessageAt ?? right.updatedAt) - (left.lastMessageAt ?? left.updatedAt));
      });
    } catch (cause) {
      setConversation(current => (current && current.employee.id === employeeId
        ? { ...current, messages: current.messages.filter(item => item.id !== optimistic.id) }
        : current));
      if (selectedIdRef.current === employeeId) {
        setDraft(content);
        setChatError(cause instanceof Error ? cause.message : '消息发送失败，请重试。');
      }
    } finally {
      if (sendingRef.current === employeeId) sendingRef.current = null;
      setSendingId(current => (current === employeeId ? null : current));
    }
  }

  const manageMenu: MenuProps = {
    items: [
      { key: 'clear', label: '清空对话', disabled: sendingId !== null },
      { type: 'divider' },
      { key: 'delete', label: '删除员工', danger: true, disabled: sendingId !== null },
    ],
    onClick: ({ key }) => {
      if (key === 'clear') confirmClear();
      if (key === 'delete') confirmDelete();
    },
  };

  const sidebar = (
    <SidebarContent
      employees={employees}
      filtered={filteredEmployees}
      state={listState}
      error={listError}
      search={search}
      selectedId={selectedId}
      onSearch={setSearch}
      onSelect={selectEmployee}
      onCreate={openCreate}
      onRetry={() => void loadEmployees(selectedId ?? undefined)}
      onHelp={() => { setMobileListOpen(false); setHelpOpen(true); }}
    />
  );

  return (
    <div className="ai-app">
      <header className="ai-topbar">
        <div className="ai-topbar__left">
          <Button
            className="ai-topbar__menu"
            type="text"
            aria-label="打开员工列表"
            onClick={() => setMobileListOpen(true)}
          >
            <MenuIcon />
          </Button>
          <div className="ai-topbar__brand">
            <span className="ai-topbar__mark"><SparkIcon size={18} /></span>
            <div>
              <h1 className="ai-topbar__title">{appTitle}</h1>
              <span className="ai-topbar__sub">数字员工工作台</span>
            </div>
          </div>
        </div>
        <div className="ai-topbar__right">
          <span className="ai-topbar__stat">{employees.length} 位员工 · {totalMessages} 条消息</span>
          <Button type="primary" icon={<PlusIcon />} onClick={openCreate}>新建员工</Button>
        </div>
      </header>

      <div className="ai-body">
        {sidebar}

        <section
          className={`ai-chat${selectedEmployee ? '' : ' ai-chat--empty'}`}
          aria-label={selectedEmployee ? `${selectedEmployee.name} 的对话` : 'AI 员工对话'}
        >
          {listState === 'error' && !selectedEmployee ? (
            <div className="ai-welcome">
              <span className="ai-welcome__art" aria-hidden="true">✦</span>
              <h2>员工列表暂时无法加载</h2>
              <p>{listError}</p>
              <Button onClick={() => void loadEmployees()}>重新加载</Button>
            </div>
          ) : !employees.length && listState === 'ready' ? (
            <div className="ai-welcome">
              <div className="ai-welcome__orbs" aria-hidden="true">
                <span className="ai-welcome__orb ai-welcome__orb--left">🧭</span>
                <span className="ai-welcome__orb ai-welcome__orb--main">✦</span>
                <span className="ai-welcome__orb ai-welcome__orb--right">✍️</span>
              </div>
              <span className="ai-welcome__eyebrow">数字员工即 Agent · 提示词即人设</span>
              <h2>创建你的第一位 AI 员工</h2>
              <p>写下身份、语气、工作原则和边界，它会用这个人设与你保持一段固定对话。</p>
              <Button type="primary" size="large" icon={<PlusIcon />} onClick={openCreate}>创建 AI 员工</Button>
              <ol className="ai-welcome__steps">
                <li><span>01</span>命名员工并选择一个岗位头像</li>
                <li><span>02</span>用提示词定义人设与工作边界</li>
                <li><span>03</span>在一个固定对话里持续沟通</li>
              </ol>
            </div>
          ) : listState === 'loading' && !selectedEmployee ? (
            <div className="chat-loading" role="status"><Spin size="small" /> 正在读取员工列表…</div>
          ) : !selectedEmployee ? (
            <div className="ai-welcome ai-welcome--small">
              <span className="ai-welcome__eyebrow">从左侧开始</span>
              <h2>选择一位 AI 员工</h2>
              <p>每位员工只有一个固定对话，上下文会保存在这段对话里。</p>
            </div>
          ) : (
            <>
              <header className="ai-chat__header">
                <div className="ai-chat__identity">
                  <span className="employee-avatar employee-avatar--lg" style={{ background: avatarTint(selectedEmployee.id) }} aria-hidden="true">{selectedEmployee.avatar}</span>
                  <div>
                    <div className="ai-chat__title-row">
                      <h2>{selectedEmployee.name}</h2>
                      <Tag>单会话</Tag>
                    </div>
                    <p className="ai-chat__meta">{selectedEmployee.role} · 人设已载入</p>
                  </div>
                </div>
                <div className="ai-chat__actions">
                  <Button size="small" className="ai-profile-trigger" onClick={() => setMobileProfileOpen(true)}>人设</Button>
                  <Button size="small" className="ai-chat__edit" onClick={() => setEditOpen(true)}>编辑人设</Button>
                  <Dropdown menu={manageMenu} trigger={['click']}>
                    <Button size="small">管理</Button>
                  </Dropdown>
                </div>
              </header>

              <div className="ai-chat__scroll" ref={scrollRef}>
                <div className="ai-chat__scroll-inner">
                  <div className="agent-intro">
                    <div className="agent-intro__eyebrow">
                      <span className="agent-intro__spark" aria-hidden="true"><SparkIcon size={12} /></span>
                      人设已载入 · 固定对话
                    </div>
                    <p className="agent-intro__greeting">
                      {selectedEmployee.greeting || `你好，我是${selectedEmployee.name}，${selectedEmployee.role}。把任务直接发给我，我们在这个对话里持续推进。`}
                    </p>
                    <p className="agent-intro__persona">{previewText(selectedEmployee.prompt)}</p>
                    {selectedEmployee.capabilities.length ? (
                      <div className="agent-intro__chips">
                        {selectedEmployee.capabilities.map(capability => <span className="chip" key={capability}>{capability}</span>)}
                      </div>
                    ) : null}
                    {!messages.length && chatState === 'ready' ? (
                      <div className="agent-suggestions">
                        <div className="agent-suggestions__label">试试这样开始</div>
                        <div className="agent-suggestions__list">
                          <button type="button" className="suggestion-button" disabled={sendingId !== null} onClick={() => void sendMessage('介绍一下你自己')}>介绍一下你自己</button>
                          <button type="button" className="suggestion-button" disabled={sendingId !== null} onClick={() => void sendMessage('你今天能帮我做什么？')}>你今天能帮我做什么？</button>
                          <button type="button" className="suggestion-button" disabled={sendingId !== null} onClick={() => void sendMessage('帮我列一个今日工作计划')}>帮我列一个今日工作计划</button>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {chatState === 'loading' ? (
                    <div className="chat-loading" role="status"><Spin size="small" /> 正在载入人设与对话…</div>
                  ) : chatState === 'error' ? (
                    <div className="chat-error-block">
                      <Alert
                        type="error"
                        showIcon
                        title="对话暂时无法加载"
                        action={<Button size="small" onClick={() => void loadConversation(selectedEmployee.id)}>重试</Button>}
                      />
                      <p>{chatError}</p>
                    </div>
                  ) : (
                    <div className="message-list" role="log" aria-live="polite" aria-relevant="additions">
                      {messages.map(item => (
                        <div className={`message message--${item.role}`} key={item.id}>
                          {item.role === 'agent' ? (
                            <span className="message__avatar" style={{ background: avatarTint(selectedEmployee.id) }} aria-hidden="true">{selectedEmployee.avatar}</span>
                          ) : null}
                          <div className="message__body">
                            <span className="message__meta">
                              {item.role === 'agent' ? selectedEmployee.name : '我'} · {formatTime(item.createdAt)}
                            </span>
                            <div className="message__bubble">{item.content}</div>
                          </div>
                        </div>
                      ))}
                      {sendingId === selectedEmployee.id ? (
                        <div className="message message--agent">
                          <span className="message__avatar" style={{ background: avatarTint(selectedEmployee.id) }} aria-hidden="true">{selectedEmployee.avatar}</span>
                          <div className="message__body">
                            <span className="message__meta">{selectedEmployee.name}</span>
                            <div className="message__bubble message__bubble--typing" role="status" aria-label="正在生成回复">
                              <span>正在按人设组织回复</span>
                              <span className="typing-dots" aria-hidden="true"><i /><i /><i /></span>
                            </div>
                          </div>
                        </div>
                      ) : null}
                      {!messages.length && !sendingId && chatState === 'ready' ? (
                        <p className="message-list__hint">这段对话还没有消息。发第一条消息，员工会按人设回应。</p>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              <footer className="ai-chat__footer">
                {chatError && chatState !== 'error' ? (
                  <div className="ai-chat__error">
                    <Alert
                      type="error"
                      showIcon
                      title={chatError}
                      action={<Button size="small" disabled={sendingId !== null} onClick={() => void sendMessage(draft)}>重试发送</Button>}
                    />
                  </div>
                ) : null}
                <div className="ai-composer">
                  <div className="ai-composer__inner">
                    <Input.TextArea
                      aria-label="消息内容"
                      className="ai-composer__field"
                      variant="borderless"
                      autoSize={{ minRows: 1, maxRows: 5 }}
                      maxLength={2000}
                      value={draft}
                      disabled={sendingId !== null || chatState !== 'ready'}
                      placeholder={`给 ${selectedEmployee.name} 发消息…`}
                      onChange={event => setDraft(event.target.value)}
                      onKeyDown={event => {
                        if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                          event.preventDefault();
                          void sendMessage();
                        }
                      }}
                    />
                    <div className="ai-composer__bar">
                      <span className="ai-composer__hint">Enter 发送 · Shift + Enter 换行</span>
                      <span className={`ai-composer__count${draft.length > 2000 ? ' is-over' : ''}`}>{draft.length}/2000</span>
                      <Button
                        type="primary"
                        icon={<SendIcon />}
                        loading={sendingId === selectedEmployee.id}
                        disabled={sendingId !== null || !draft.trim() || draft.length > 2000 || chatState !== 'ready'}
                        onClick={() => void sendMessage()}
                      >
                        发送
                      </Button>
                    </div>
                  </div>
                </div>
              </footer>
            </>
          )}
        </section>

        <aside className="ai-profile" aria-label="员工资料">
          {selectedEmployee ? (
            <ProfilePanel
              employee={selectedEmployee}
              onEdit={() => setEditOpen(true)}
              onClear={confirmClear}
              clearing={clearing}
              clearingBusy={clearing || sendingId !== null}
            />
          ) : (
            <div className="ai-profile__placeholder">
              <span aria-hidden="true"><SparkIcon size={20} /></span>
              <p>选择一位员工后，这里会显示人设提示词、能力标签和对话数据。</p>
            </div>
          )}
        </aside>
      </div>

      <Drawer
        title="AI 员工"
        placement="left"
        width={320}
        open={mobileListOpen}
        onClose={() => setMobileListOpen(false)}
        styles={{ body: { padding: 0, display: 'flex', minHeight: 0 } }}
      >
        {sidebar}
      </Drawer>

      <Drawer
        title="员工人设"
        placement="right"
        width={360}
        open={mobileProfileOpen}
        onClose={() => setMobileProfileOpen(false)}
        styles={{ body: { padding: 0 } }}
      >
        {selectedEmployee ? (
          <ProfilePanel
            employee={selectedEmployee}
            onEdit={() => { setMobileProfileOpen(false); setEditOpen(true); }}
            onClear={() => { setMobileProfileOpen(false); confirmClear(); }}
            clearing={clearing}
            clearingBusy={clearing || sendingId !== null}
          />
        ) : null}
      </Drawer>

      <EmployeeFormModal
        open={createOpen}
        mode="create"
        employee={null}
        onCancel={() => { createIdRef.current = null; setCreateOpen(false); }}
        onSubmit={createEmployee}
      />

      <EmployeeFormModal
        open={editOpen}
        mode="edit"
        employee={selectedEmployee}
        onCancel={() => setEditOpen(false)}
        onSubmit={updateEmployee}
      />

      <WorkosModal
        title="AI 员工使用说明"
        open={helpOpen}
        onCancel={() => setHelpOpen(false)}
        footer={<Button onClick={() => setHelpOpen(false)}>知道了</Button>}
      >
        <div className="help-copy">
          <p>每位 AI 员工都是一个独立的 Agent，你写的提示词就是它的人设。</p>
          <ol>
            <li><strong>创建员工：</strong>选择头像与岗位，写清身份、语气、原则和边界。</li>
            <li><strong>固定对话：</strong>每位员工只有一个对话，历史上下文持续保留。</li>
            <li><strong>持续沟通：</strong>直接发任务或问题，它会按人设给出可执行的下一步。</li>
          </ol>
          <Alert type="info" showIcon title="当前回复由应用内的人设引擎生成" />
          <p className="help-copy__note">系统会结合人设、能力标签与对话上下文组织回复。接入模型服务后，可获得更强的生成能力。</p>
        </div>
      </WorkosModal>
    </div>
  );
}
