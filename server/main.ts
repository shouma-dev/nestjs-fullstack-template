import 'reflect-metadata';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';
import { Controller, Get, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, type NestExpressApplication } from '@nestjs/platform-express';
import { EmployeesController, EmployeesService } from './modules/employees.js';
import { TodosController, TodosService } from './modules/todos.js';

@Controller('health')
class HealthController { @Get() health() { return { ok: true }; } }

@Module({ controllers: [HealthController, TodosController, EmployeesController], providers: [TodosService, EmployeesService] })
class AppModule {}

const port = Number(process.env.PORT ?? 3001);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT 必须是 1–65535 的整数');
const app = await NestFactory.create<NestExpressApplication>(AppModule, new ExpressAdapter());
const clientDirectory = fileURLToPath(new URL('../client/', import.meta.url));
app.useStaticAssets(clientDirectory, { redirect: false });

// The built client uses /api, while Vite and the platform still forward unprefixed paths.
app.use((request: IncomingMessage, _response: ServerResponse, next: () => void) => {
  const apiPrefix = '/api';
  if (request.url?.startsWith(`${apiPrefix}/`)) {
    request.url = request.url.slice(apiPrefix.length);
  }
  next();
});

app.enableShutdownHooks();
await app.listen(port, '127.0.0.1');
