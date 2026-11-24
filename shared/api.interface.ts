export type Todo = { id: string; title: string; completed: boolean; createdAt: number };
export type CreateTodo = { id: string; title: string };
export type UpdateTodo = { completed: boolean };

/** 数字员工 = Agent，prompt 即人设。 */
export type Employee = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  prompt: string;
  greeting: string;
  capabilities: string[];
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  lastMessage: string | null;
  lastMessageAt: number | null;
};

/** 创建员工时由浏览器生成稳定 id，失败重试不会产生重复员工。 */
export type EmployeeDraft = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  prompt: string;
  greeting: string;
  capabilities: string[];
};

export type EmployeeUpdate = Omit<EmployeeDraft, 'id'>;

export type ChatMessage = {
  id: string;
  employeeId: string;
  role: 'user' | 'agent';
  content: string;
  replyTo: string | null;
  createdAt: number;
};

export type Conversation = { employee: Employee; messages: ChatMessage[] };
export type SendMessageInput = { id: string; content: string };
export type SendMessageResult = { userMessage: ChatMessage; reply: ChatMessage };
