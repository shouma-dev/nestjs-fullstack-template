import { useEffect, useRef, useState } from 'react';
import type { Todo } from '../../../shared/api.interface';
import { todosApi } from '../api';
import { Alert, Button, Checkbox, Empty, Input, Spin } from 'antd';

export function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]), [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const pending = useRef<{ id: string; title: string } | null>(null), locked = useRef(false), revision = useRef(0);
  async function reload() {
    const version = ++revision.current;
    setLoading(true); setError('');
    try { const result = await todosApi.list(); if (version === revision.current) setTodos(result); }
    catch { if (version === revision.current) setError('暂时无法加载待办，请重试。'); }
    finally { if (version === revision.current) setLoading(false); }
  }
  useEffect(() => { void reload(); return () => { revision.current++; }; }, []);
  async function mutate(action: () => Promise<void>) {
    if (locked.current || loading) return;
    locked.current = true; setBusy(true); setError('');
    try { await action(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '操作结果未确认，请重试。'); }
    finally { locked.current = false; setBusy(false); }
  }
  return <>
    <div className="workspace__heading">
      <h1>待办清单</h1>
      <p>记录要做的事，刷新后仍可继续处理。</p>
    </div>
    <section className="todo-list" aria-label="待办事项">
      <form className="todo-form" onSubmit={event => {
        event.preventDefault(); const text = title.trim(); if (!text) return;
        void mutate(async () => {
          if (pending.current?.title !== text) pending.current = { id: crypto.randomUUID(), title: text };
          const saved = await todosApi.create(pending.current);
          setTodos(items => [...items.filter(item => item.id !== saved.id), saved]);
          pending.current = null; setTitle('');
        });
      }}>
        <div className="todo-form__field">
          <label htmlFor="todo-title">添加待办</label>
          <Input id="todo-title" value={title} onChange={event => setTitle(event.target.value)}
            maxLength={200} disabled={busy || loading} placeholder="例如：准备会议资料" />
        </div>
        <Button disabled={busy || loading || !title.trim()} type="primary" htmlType="submit">添加</Button>
      </form>
      {error && <Alert type="error" showIcon title={error}
        action={<Button size="small" disabled={busy} onClick={() => void reload()}>重试</Button>} />}
      {loading ? <div className="todo-loading" role="status"><Spin size="small" /> 正在读取待办…</div>
        : !todos.length ? (!error && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有待办，从上方添加第一条。" />)
        : <ul className="todo-items">{todos.map(todo => <li key={todo.id}>
          <Checkbox aria-label={`完成：${todo.title}`} checked={todo.completed} disabled={busy}
            onChange={event => {
              const completed = event.target.checked;
              void mutate(async () => {
                const saved = await todosApi.update(todo.id, { completed });
                setTodos(items => items.map(item => item.id === saved.id ? saved : item));
              });
            }} />
          <span className={todo.completed ? 'todo-title todo-title--done' : 'todo-title'}>{todo.title}</span>
          <Button type="text" danger size="small" disabled={busy} aria-label={`删除：${todo.title}`}
            onClick={() => void mutate(async () => {
              await todosApi.remove(todo.id);
              setTodos(items => items.filter(item => item.id !== todo.id));
            })}>删除</Button>
        </li>)}</ul>}
    </section>
  </>;
}
