---
name: workos-design-prototype
description: 妙搭应用的优先 UI 指南，使用 Ant Design 实现 WorkOS Pewter 的界面和控件。
---

# WorkOS 界面规范（Ant Design 适配）

涉及页面、布局、控件或主题时，先读本指南和本目录的 [DESIGN.md](DESIGN.md)，再按需查原站参考 Skill。原始 WorkOS 技能在平台仓库中保留；这里使用它的视觉规范，控件用本工程已有的 `antd@6.6.4`。

- 直接从 `antd` 导入控件。保留入口的 `StyleProvider`、固定依赖和 `client/src/style-system/`。控件与浮层从同一个主题继承。临时反馈使用 `App.useApp()` 获得主题上下文。
- 常规主要操作用 `Button type="primary"`，破坏性操作用 `danger`。品牌色不替代普通主按钮；复选框、选择器和输入焦点保持信息色。
- 使用布局底、白色或深灰容器、细分隔组织内容。表单、说明和辅助区域优先共用容器底色。标题与说明按角色分层，避免所有内容一起加粗。
- 使用原生 `Form`、`Input`、`Select`、`Tabs`、`Table`、`Tag`、`Modal` 和 `Drawer`；保留键盘交互、焦点、取消和错误恢复。页面内持续反馈用 `Alert`，空列表用 `Empty` 或 `Table` 的空态插槽。
- 在桌面、窄屏、明暗模式和关键浮层中检查布局与交互。长内容、加载、失败和空态不能破坏现有业务路径。
