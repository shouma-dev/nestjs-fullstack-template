# 本地全栈应用

使用 Node.js 24.15+。首次运行时先安装依赖，再构建并启动应用。

```sh
npm ci
npm run build
npm start
```

打开 [AI 员工工作台](http://127.0.0.1:3001/)。Nest 同时提供 `dist/client` 的页面、静态资源和 `/api` 接口，可用 `PORT` 更换端口。

开发时可用 `npm run dev` 启动热更新，打开 [开发预览](http://127.0.0.1:5173/)。Vite 代理 `/api` 到 Nest，可用 `CLIENT_PORT` 和 `PORT` 更换端口。`npm run typecheck` 检查前后端类型。

client/src、server、shared 分别包含 React 页面、Nest API 和共享协议。示例待办使用 .data/app.sqlite；APP_DATA_DIR 可指定本地目录，平台设置 MIAODA_DATA_DIR。无需外部数据库。

前端使用 TanStack Router 1.170.46、Ant Design 6.6.4 和 WorkOS Pewter 风格包 antd@2.3.0，控件与浮层随系统切换明暗主题。创建页面时从 [AGENTS.md](AGENTS.md) 选择对应的页面生成指南，控件按 WorkOS Ant Design 适配指南实现。tokens.ts 定义语义令牌，antd-theme.ts 映射组件主题，field-theme.ts 管理表单编辑与键盘焦点，component-theme.ts 定义按钮、表格、分页、下拉和弹层的组件令牌。自定义布局可使用 `--workos-*` CSS 变量。Tailwind CSS 4 提供工具类，不加载 Preflight。

入口以 TanStack Router 的 Hash history 支持预览和发布子路径与直接刷新。router.tsx 注册路由类型，routes.tsx 使用 `createRoute` 声明静态页面，app.tsx 提供布局和 `Outlet`。主题基础位于 client/src/style-system/，平台按版本固定这些文件。

skills/ 下发了抓取样本的 16 个参考 Skill（保留许可证与来源摘要），另有本地全栈和 WorkOS Ant Design 适配指南，以及落地页、后台、工具与案例风格指南。ERP 业务页面从[企业后台设计 Skill](skills/miaoda-erp-design/SKILL.md)选择可运行的整页模板。组件沿用项目已有的 StyleProvider。安装依赖后，运行 `npm exec -- vite --config skills/miaoda-erp-design/references/erp-preview.config.mjs --open /gallery.html` 预览 12 个页面，使用浏览器内的示例数据。参考 Skill 不是本地可用工具清单；不自动运行其中脚本。

.miaoda-template.json 固定模板 ID、版本与初始文件哈希；template-source.json 记录参考来源。后续业务修改不回写初始清单。平台通过相同模板函数创建工程，生成后按任务验证结果提交代码并更新预览。
