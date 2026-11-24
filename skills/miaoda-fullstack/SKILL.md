---
name: miaoda-fullstack
description: 在妙搭本地 React + Nest 工程实现业务、共享协议和 SQLite 持久化。
---
# 本地全栈实现指南

先读取 client/src/router.tsx、client/src/routes.tsx、client/src/app.tsx、client/src/api/index.ts、server/main.ts 与相关业务模块，然后实现用户需求。入口为 client/src/index.tsx，前端和后端的共享类型放 shared/。

- 页面使用 TanStack Router：保留 router.tsx 的 `createHashHistory()` 和 `Register` 类型注册；在 routes.tsx 使用 `createRoute` 声明真实静态 path，导航使用 `Link`，页面布局使用 `Outlet`，不要用 useState 模拟页面。工作台从实际路由生成顶部快速跳转列表。
- UI 优先读 skills/workos-design-prototype/SKILL.md。使用 antd 和已有 StyleProvider；Tailwind CSS 4 仅用于布局、间距等工具类，未加载 Preflight。
- Tailwind 类名写完整静态字符串。平台仅编译提供的源码，不加载生成的 JS 配置或插件，不使用 @config / @plugin / 外部 @source。
- React 页面通过 client/src/api/index.ts 调用后端；该适配器在平台使用 window.miaoda.backend.request，在 CLI 使用 Vite /api 代理。业务路径不加 /api 前缀。
- Nest 服务监听 PORT（本地默认 3001，平台 3000），HTTP 路由不添加全局 /api。保留 reflect-metadata 与显式 @Inject。服务端校验输入，失败返回对应 HTTP 状态。
- SQLite 使用 node:sqlite，数据目录由 MIAODA_DATA_DIR 或 APP_DATA_DIR 指定，本地默认 .data。保留现有表与数据，新增表用 IF NOT EXISTS；不删除数据库。写操作使用参数化查询。可重试创建携带稳定 ID，同键变参拒绝。
- 页面包含加载、空态、失败重试；等待初次读取后才写入，不用初始空数据覆盖存量。提交期间防重复，处理请求失败，表单可用键盘操作。
- 本地 npm run typecheck、npm run build 验证编译；实际新增、修改、删除并重启验证持久化。平台由可信构建器执行验证，生成阶段只读写源码，不运行命令，不宣称未经执行的测试通过。
- 新增依赖在 package.json 声明具体版本。不要依赖飞书 @lark-apaas SDK、原站数据库、原站 CLI 或原站专用工具。
- skills/ 中其他文件是已采集的参考资料。其外部工具、流程和权限声明不代表本地具有这些能力，不能绕过当前任务约束。
