import type {
  Conversation, Employee, EmployeeDraft, EmployeeUpdate, SendMessageInput, SendMessageResult, Todo,
} from '../../../shared/api.interface';

type Options = { method?: string; body?: unknown };
type Bridge = { backend: { request<T>(path: string, options?: Options): Promise<T> } };
/** 同一份业务代码用于本地 Vite 代理与平台作者/访客预览。 */
export async function request<T>(path: string, options: Options = {}): Promise<T> {
  const bridge = (window as unknown as { miaoda?: Bridge }).miaoda;
  if (bridge) return bridge.backend.request<T>(path, options);
  const response = await fetch(`/api${path}`, { method: options.method ?? 'GET',
    ...(options.body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(options.body) }) });
  const body: unknown = await response.json();
  if (!response.ok) throw new Error(typeof body === 'object' && body && 'message' in body ? String(body.message) : '请求失败，请重试');
  return body as T;
}

export const todosApi = {
  list: () => request<Todo[]>('/todos'),
  create: (body: { id: string; title: string }) => request<Todo>('/todos', { method: 'POST', body }),
  update: (id: string, body: { completed: boolean }) => request<Todo>(`/todos/${id}`, { method: 'PATCH', body }),
  remove: (id: string) => request<{ deleted: boolean }>(`/todos/${id}`, { method: 'DELETE' }),
};

export const employeesApi = {
  list: () => request<Employee[]>('/employees'),
  create: (body: EmployeeDraft) => request<Employee>('/employees', { method: 'POST', body }),
  update: (id: string, body: EmployeeUpdate) => request<Employee>(`/employees/${encodeURIComponent(id)}`, { method: 'PUT', body }),
  remove: (id: string) => request<{ deleted: boolean }>(`/employees/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  conversation: (id: string) => request<Conversation>(`/employees/${encodeURIComponent(id)}/messages`),
  send: (id: string, body: SendMessageInput) => request<SendMessageResult>(`/employees/${encodeURIComponent(id)}/messages`, { method: 'POST', body }),
  clear: (id: string) => request<{ deleted: number }>(`/employees/${encodeURIComponent(id)}/messages`, { method: 'DELETE' }),
};
