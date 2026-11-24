---
name: miaoda-erp-design
description: 生成经营分析、ERP、组织管理、合同或运营后台时，从十二个 Ant Design 整页模板选参考。适用于 Ant Design Pro 分析页、芋道采购、ERPNext 收货、SAP Fiori 审单、若依组织、TDesign 合同与 Arco 查询。
---

# 企业后台页面模板

使用[模板与来源目录](references/catalog.md)选择对应页面。按业务场景沿用导航、筛选、表格、单据和主要操作的层级。七个来源提供布局与业务模式，页面控件使用 Ant Design 及工程的 WorkOS StyleProvider。

| 业务场景 | 参考实现 |
| --- | --- |
| 经营分析 | [dashboard.tsx](references/erp-antd/dashboard.tsx) 的 Card、Statistic、Tabs、Select、Progress 和 Table |
| 采购订单、入库、退货、合同、内容与费用台账 | [ledger.tsx](references/erp-antd/ledger.tsx) 的 Form、Table、Tabs、Popover、SearchField、WorkosModal 和 WorkosDrawer |
| 收货和连续审单 | [documents.tsx](references/erp-antd/documents.tsx) 的 Descriptions、Table、InputNumber、Tag、Alert 和跨单据入口 |
| 组织人员 | [ledger.tsx](references/erp-antd/ledger.tsx) 的 Tree、部门搜索与人员表筛选 |
| 高级表单与分步录入 | [forms.tsx](references/erp-antd/forms.tsx) 的 Form、Steps、DatePicker 和提交校验 |

应用入口沿用现有的 `StyleProvider` 及应用配色。导航用 Layout 和 Menu，操作与浮层用工程的 Ant Design 组件。组件尺寸、焦点、弹层、禁用态与明暗色由固定风格包供应。业务 CSS 管理列宽、响应式、图表和对齐，面色和间距使用 `--workos-*` 令牌。组合反馈用 `App.useApp()`。

在已安装依赖的生成工程根目录运行以下命令并打开模板页。

```sh
npm exec -- vite --config skills/miaoda-erp-design/references/erp-preview.config.mjs --open /gallery.html
```

预览与实现选同一张页面。先核对桌面和窄屏构图、真实数据密度与状态，再执行筛选或定位、打开详情、主要操作和返回。宽列在表格容器独立滚动。发布业务页面时把示例数据接到实际接口，保存和审核结果以业务响应为准。
