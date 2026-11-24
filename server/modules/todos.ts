import { BadRequestException, Body, ConflictException, Controller, Inject, Delete, Get, Injectable, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import type { OnModuleDestroy } from '@nestjs/common';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { Todo } from '../../shared/api.interface.js';

const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function todoId(value: string): string {
  if (!idPattern.test(value)) throw new BadRequestException('待办标识无效');
  return value;
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BadRequestException('请求必须是 JSON 对象');
  return value as Record<string, unknown>;
}

@Injectable()
export class TodosService implements OnModuleDestroy {
  private readonly db: DatabaseSync;
  constructor() {
    const data = resolve(process.env.MIAODA_DATA_DIR ?? process.env.APP_DATA_DIR ?? resolve('.data'));
    mkdirSync(data, { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(resolve(data, 'app.sqlite'));
    this.db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS todos (id TEXT PRIMARY KEY, title TEXT NOT NULL, completed INTEGER NOT NULL DEFAULT 0, createdAt INTEGER NOT NULL)');
  }
  onModuleDestroy() { this.db.close(); }
  list(): Todo[] {
    return this.db.prepare('SELECT * FROM todos ORDER BY createdAt, id').all().map(row => ({
      id: String(row.id), title: String(row.title), completed: row.completed === 1, createdAt: Number(row.createdAt),
    }));
  }
  create(body: unknown): Todo {
    const input = object(body);
    if (typeof input.id !== 'string' || typeof input.title !== 'string' || !input.title.trim() || input.title.trim().length > 200
      || Object.keys(input).some(key => !['id', 'title'].includes(key))) throw new BadRequestException('请输入 1–200 字的待办标题和有效标识');
    const id = todoId(input.id), title = input.title.trim();
    // 客户端重试使用相同 ID；插入与冲突判断不覆盖已存在的业务数据。
    this.db.prepare('INSERT INTO todos (id,title,createdAt) VALUES (?,?,?) ON CONFLICT(id) DO NOTHING').run(id, title, Date.now());
    const saved = this.list().find(item => item.id === id)!;
    if (saved.title !== title) throw new ConflictException('该请求标识已用于另一条待办');
    return saved;
  }
  update(id: string, body: unknown): Todo {
    const input = object(body);
    if (typeof input.completed !== 'boolean' || Object.keys(input).some(key => key !== 'completed')) throw new BadRequestException('完成状态无效');
    const result = this.db.prepare('UPDATE todos SET completed=? WHERE id=?').run(Number(input.completed), todoId(id));
    if (!result.changes) throw new NotFoundException('待办不存在');
    return this.list().find(item => item.id === id)!;
  }
  remove(id: string) { this.db.prepare('DELETE FROM todos WHERE id=?').run(todoId(id)); return { deleted: true }; }
}

@Controller('todos')
export class TodosController {
  constructor(@Inject(TodosService) private readonly todos: TodosService) {}
  @Get() list() { return this.todos.list(); }
  @Post() create(@Body() body: unknown) { return this.todos.create(body); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: unknown) { return this.todos.update(id, body); }
  @Delete(':id') remove(@Param('id') id: string) { return this.todos.remove(id); }
}
