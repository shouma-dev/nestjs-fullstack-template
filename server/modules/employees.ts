import { BadRequestException, Body, ConflictException, Controller, Delete, Get, Inject, Injectable, NotFoundException, Param, Post, Put } from '@nestjs/common';
import type { OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { ChatMessage, Conversation, Employee, EmployeeUpdate, SendMessageResult } from '../../shared/api.interface.js';
import { generateAgentReply } from './agent-reply.js';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const employeeKeys = ['id', 'name', 'role', 'avatar', 'prompt', 'greeting', 'capabilities'];

type Row = Record<string, unknown>;

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BadRequestException('请求必须是 JSON 对象');
  return value as Record<string, unknown>;
}

function parseUuid(value: unknown, label: string): string {
  if (typeof value !== 'string' || !uuidPattern.test(value)) throw new BadRequestException(`${label}无效`);
  return value.toLowerCase();
}

function text(value: unknown, label: string, min: number, max: number): string {
  if (typeof value !== 'string') throw new BadRequestException(`${label}格式不正确`);
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) throw new BadRequestException(`${label}需为 ${min}–${max} 个字符`);
  return trimmed;
}

function optionalText(value: unknown, label: string, max: number): string {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw new BadRequestException(`${label}格式不正确`);
  const trimmed = value.trim();
  if (trimmed.length > max) throw new BadRequestException(`${label}不能超过 ${max} 个字符`);
  return trimmed;
}

function normalizeEmployee(body: unknown, withId: boolean): { id: string | null; fields: EmployeeUpdate } {
  const input = object(body);
  const allowed = withId ? employeeKeys : employeeKeys.filter(key => key !== 'id');
  if (Object.keys(input).some(key => !allowed.includes(key))) throw new BadRequestException('请求包含未知字段');

  const rawCapabilities = input.capabilities ?? [];
  if (!Array.isArray(rawCapabilities) || rawCapabilities.length > 6) throw new BadRequestException('能力标签最多 6 个');
  const capabilities = [...new Set(rawCapabilities.map(item => text(item, '能力标签', 1, 20)))];

  return {
    id: withId ? parseUuid(input.id, '员工标识') : null,
    fields: {
      name: text(input.name, '员工名称', 1, 24),
      role: text(input.role, '岗位', 1, 30),
      avatar: input.avatar === undefined || input.avatar === '' ? '🤖' : text(input.avatar, '头像', 1, 16),
      prompt: text(input.prompt, '人设提示词', 10, 4000),
      greeting: optionalText(input.greeting, '开场白', 500),
      capabilities,
    },
  };
}

function parseCapabilities(value: unknown): string[] {
  try {
    const parsed: unknown = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function rowToEmployee(row: Row): Employee {
  return {
    id: String(row.id),
    name: String(row.name),
    role: String(row.role),
    avatar: String(row.avatar),
    prompt: String(row.prompt),
    greeting: row.greeting === null || row.greeting === undefined ? '' : String(row.greeting),
    capabilities: parseCapabilities(row.capabilities),
    createdAt: Number(row.createdAt),
    updatedAt: Number(row.updatedAt),
    messageCount: row.messageCount === undefined ? 0 : Number(row.messageCount),
    lastMessage: row.lastMessage === null || row.lastMessage === undefined ? null : String(row.lastMessage),
    lastMessageAt: row.lastMessageAt === null || row.lastMessageAt === undefined ? null : Number(row.lastMessageAt),
  };
}

function rowToMessage(row: Row): ChatMessage {
  return {
    id: String(row.id),
    employeeId: String(row.employeeId),
    role: row.role === 'agent' ? 'agent' : 'user',
    content: String(row.content),
    replyTo: row.replyTo === null || row.replyTo === undefined ? null : String(row.replyTo),
    createdAt: Number(row.createdAt),
  };
}

@Injectable()
export class EmployeesService implements OnModuleDestroy {
  private readonly db: DatabaseSync;

  constructor() {
    const data = resolve(process.env.MIAODA_DATA_DIR ?? process.env.APP_DATA_DIR ?? resolve('.data'));
    mkdirSync(data, { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(resolve(data, 'app.sqlite'));
    this.db.exec(`
      PRAGMA journal_mode=WAL;
      PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        avatar TEXT NOT NULL,
        prompt TEXT NOT NULL,
        greeting TEXT NOT NULL DEFAULT '',
        capabilities TEXT NOT NULL DEFAULT '[]',
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        employeeId TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        replyTo TEXT,
        createdAt INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS messages_employee_created ON messages(employeeId, createdAt);
      CREATE INDEX IF NOT EXISTS messages_reply_to ON messages(replyTo);
    `);
  }

  onModuleDestroy() { this.db.close(); }

  list(): Employee[] {
    const employees = this.db.prepare('SELECT * FROM employees').all().map(row => rowToEmployee(row));
    const counts = new Map<string, number>();
    const latest = new Map<string, { content: string; createdAt: number }>();
    for (const row of this.db.prepare('SELECT employeeId, content, createdAt FROM messages ORDER BY createdAt, rowid').all()) {
      const employeeId = String(row.employeeId);
      counts.set(employeeId, (counts.get(employeeId) ?? 0) + 1);
      latest.set(employeeId, { content: String(row.content), createdAt: Number(row.createdAt) });
    }
    return employees
      .map(employee => ({
        ...employee,
        messageCount: counts.get(employee.id) ?? 0,
        lastMessage: latest.get(employee.id)?.content ?? null,
        lastMessageAt: latest.get(employee.id)?.createdAt ?? null,
      }))
      .sort((left, right) => (right.lastMessageAt ?? right.updatedAt) - (left.lastMessageAt ?? left.updatedAt));
  }

  private findEmployee(id: string): Employee {
    const employee = this.list().find(item => item.id === id);
    if (!employee) throw new NotFoundException('AI 员工不存在或已被删除');
    return employee;
  }

  create(body: unknown): Employee {
    const { id, fields } = normalizeEmployee(body, true);
    if (!id) throw new BadRequestException('员工标识无效');
    const existing = this.list().find(item => item.id === id);
    if (existing) {
      const same = existing.name === fields.name && existing.role === fields.role && existing.avatar === fields.avatar
        && existing.prompt === fields.prompt && existing.greeting === fields.greeting
        && existing.capabilities.join('\n') === fields.capabilities.join('\n');
      if (!same) throw new ConflictException('该员工标识已用于其他资料');
      return existing;
    }
    const now = Date.now();
    this.db.prepare('INSERT INTO employees (id,name,role,avatar,prompt,greeting,capabilities,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(id, fields.name, fields.role, fields.avatar, fields.prompt, fields.greeting, JSON.stringify(fields.capabilities), now, now);
    return this.findEmployee(id);
  }

  update(id: string, body: unknown): Employee {
    const employeeId = parseUuid(id, '员工标识');
    const { fields } = normalizeEmployee(body, false);
    const result = this.db.prepare('UPDATE employees SET name=?, role=?, avatar=?, prompt=?, greeting=?, capabilities=?, updatedAt=? WHERE id=?')
      .run(fields.name, fields.role, fields.avatar, fields.prompt, fields.greeting, JSON.stringify(fields.capabilities), Date.now(), employeeId);
    if (!Number(result.changes)) throw new NotFoundException('AI 员工不存在或已被删除');
    return this.findEmployee(employeeId);
  }

  remove(id: string) {
    const employeeId = parseUuid(id, '员工标识');
    const exists = this.db.prepare('SELECT id FROM employees WHERE id=?').get(employeeId);
    if (!exists) return { deleted: true };
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare('DELETE FROM messages WHERE employeeId=?').run(employeeId);
      this.db.prepare('DELETE FROM employees WHERE id=?').run(employeeId);
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
    return { deleted: true };
  }

  conversation(id: string): Conversation {
    const employee = this.findEmployee(parseUuid(id, '员工标识'));
    return { employee, messages: this.messages(employee.id) };
  }

  private messages(employeeId: string): ChatMessage[] {
    return this.db.prepare('SELECT * FROM messages WHERE employeeId=? ORDER BY createdAt, rowid').all(employeeId).map(row => rowToMessage(row));
  }

  send(id: string, body: unknown): SendMessageResult {
    const employee = this.findEmployee(parseUuid(id, '员工标识'));
    const input = object(body);
    if (Object.keys(input).some(key => !['id', 'content'].includes(key))) throw new BadRequestException('请求包含未知字段');
    const messageId = parseUuid(input.id, '消息标识');
    const content = text(input.content, '消息内容', 1, 2000);

    const existing = this.db.prepare('SELECT * FROM messages WHERE id=?').get(messageId);
    if (existing) {
      if (String(existing.employeeId) !== employee.id || String(existing.role) !== 'user' || String(existing.content) !== content) {
        throw new ConflictException('该消息标识已用于另一条消息');
      }
      const replyRow = this.db.prepare('SELECT * FROM messages WHERE replyTo=?').get(messageId);
      if (replyRow) return { userMessage: rowToMessage(existing), reply: rowToMessage(replyRow) };

      // 用户消息已存在但回复缺失时补齐，保证同一条消息重试不会产生重复。
      const createdAt = Number(existing.createdAt) + 1;
      const replyContent = generateAgentReply(employee, this.messages(employee.id).filter(item => item.id !== messageId), content);
      const reply: ChatMessage = { id: randomUUID(), employeeId: employee.id, role: 'agent', content: replyContent, replyTo: messageId, createdAt };
      this.db.prepare('INSERT INTO messages (id,employeeId,role,content,replyTo,createdAt) VALUES (?,?,?,?,?,?)')
        .run(reply.id, reply.employeeId, reply.role, reply.content, reply.replyTo, reply.createdAt);
      this.db.prepare('UPDATE employees SET updatedAt=? WHERE id=?').run(createdAt, employee.id);
      return { userMessage: rowToMessage(existing), reply };
    }

    const history = this.messages(employee.id);
    const createdAt = Date.now();
    const replyContent = generateAgentReply(employee, history, content);
    const userMessage: ChatMessage = { id: messageId, employeeId: employee.id, role: 'user', content, replyTo: null, createdAt };
    const reply: ChatMessage = { id: randomUUID(), employeeId: employee.id, role: 'agent', content: replyContent, replyTo: messageId, createdAt: createdAt + 1 };

    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare('INSERT INTO messages (id,employeeId,role,content,replyTo,createdAt) VALUES (?,?,?,?,?,?)')
        .run(userMessage.id, userMessage.employeeId, userMessage.role, userMessage.content, userMessage.replyTo, userMessage.createdAt);
      this.db.prepare('INSERT INTO messages (id,employeeId,role,content,replyTo,createdAt) VALUES (?,?,?,?,?,?)')
        .run(reply.id, reply.employeeId, reply.role, reply.content, reply.replyTo, reply.createdAt);
      this.db.prepare('UPDATE employees SET updatedAt=? WHERE id=?').run(createdAt, employee.id);
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      // 并发重试可能同时通过前置校验，唯一键冲突时按幂等分支返回已有回复。
      if (this.db.prepare('SELECT id FROM messages WHERE id=?').get(messageId)) return this.send(id, body);
      throw error;
    }
    return { userMessage, reply };
  }

  clear(id: string) {
    const employee = this.findEmployee(parseUuid(id, '员工标识'));
    const result = this.db.prepare('DELETE FROM messages WHERE employeeId=?').run(employee.id);
    this.db.prepare('UPDATE employees SET updatedAt=? WHERE id=?').run(Date.now(), employee.id);
    return { deleted: Number(result.changes) };
  }
}

@Controller('employees')
export class EmployeesController {
  constructor(@Inject(EmployeesService) private readonly employees: EmployeesService) {}

  @Get() list() { return this.employees.list(); }

  @Post() create(@Body() body: unknown) { return this.employees.create(body); }

  @Get(':id/messages') conversation(@Param('id') id: string) { return this.employees.conversation(id); }

  @Post(':id/messages') send(@Param('id') id: string, @Body() body: unknown) { return this.employees.send(id, body); }

  @Delete(':id/messages') clear(@Param('id') id: string) { return this.employees.clear(id); }

  @Put(':id') update(@Param('id') id: string, @Body() body: unknown) { return this.employees.update(id, body); }

  @Delete(':id') remove(@Param('id') id: string) { return this.employees.remove(id); }
}
