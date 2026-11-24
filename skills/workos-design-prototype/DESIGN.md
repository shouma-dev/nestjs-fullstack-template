---
version: alpha
name: Ant Design · WorkOS
description: WorkOS Pewter 控件密度、排版和明暗交互状态，基于 Ant Design 6.6.4。
colors:
  bg-layout: "#F4F4F7"
  bg-container: "#FFFFFF"
  bg-secondary: "#F9F9FB"
  primary: "#171719"
  text-default: "#0B0B0C"
  text-muted: "rgba(11, 11, 12, 0.7)"
  border-divider: "rgba(11, 11, 12, 0.05)"
  border-control: "rgba(11, 11, 12, 0.15)"
  border-field: "rgba(11, 11, 12, 0.10)"
  border-field-editing: "rgba(11, 11, 12, 0.80)"
  fill-hover: "rgba(11, 11, 12, 0.03)"
  fill-selected: "rgba(11, 11, 12, 0.05)"
  info: "#1474F2"
  brand: "#F73F4B"
  danger: "#DC2846"
  success: "#0D9E51"
  warning: "#EC671F"
typography:
  page:
    fontFamily: "MiSans, system-ui, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: 20px
    fontWeight: 450
    lineHeight: 28px
  heading:
    fontFamily: "MiSans, system-ui, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: 16px
    fontWeight: 450
    lineHeight: 24px
  body:
    fontFamily: "MiSans, system-ui, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: 14px
    fontWeight: 330
    lineHeight: 20px
rounded:
  tight: 4px
  small: 6px
  control: 8px
  container: 12px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  section: 24px
---

## Overview

使用 WorkOS Pewter 区分工作区背景、内容和操作。视觉规范优先取自 WorkOS Skill，语义色与控件状态参考 `my-component-docs` 中的 YDDesign。直接从 `antd@6.6.4` 导入组件，沿用其键盘操作和主题 API。

## Colors

用页面底、内容底与细分隔组织信息。普通主按钮用中性实底。信息色用于勾选、链接和输入焦点，菜单及下拉选项使用中性选中底色。品牌、成功、警告和错误沿用各自语义色。

## Themes

`tokens.ts` 定义明暗语义令牌，`antd-theme.ts` 映射全局主题。`StyleProvider` 通过 `component-theme.ts` 下发组件令牌和语义槽样式，并通过 `components.css` 处理状态选择器。组件和浮层共享当前主题。业务布局可使用 `--workos-*` CSS 变量，显式配色模板可替换浅色工作区底色和选择强调色。

| 角色 | 深色 |
| --- | --- |
| 背景、容器、次级容器 | `#121214`、`#1E1E20`、`#171719` |
| 主操作底、主操作前景 | `#ECEDF1`、`#0B0B0C` |
| 正文、次级文字 | `rgba(255, 255, 255, 0.8)`、`rgba(255, 255, 255, 0.6)` |
| 信息、品牌、错误 | `#398BFF`、`#FF5863`、`#E74769` |

## Typography

页标题用 20/28，区块标题用 16/24，正文用 14/20。浏览器优先使用已安装的 MiSans，再按系统及中文字体顺序回退。

## Layout

标题、表单与列表沿同一阅读轴。表单宽度按字段内容收敛；数据表格使用可用宽度，列溢出在表格内横向滚动。窄屏先保留列表主信息和主要操作。

## Components

- 保留入口 `StyleProvider`，复用 `PageShell`、`SectionCard` 或当前页面布局。按上下文使用 24、32、36 px 控件尺寸。
- 主操作用 `Button type="primary"`；破坏性操作标注 `danger`。使用 `Form`、`Input`、`Select`、`Checkbox`、`Tabs`、`Table`、`Tag`、`Modal` 等原生组件。
- 搜索栏使用带图标和清除操作的 `SearchField`。表单使用 Ant Design 原生控件和 `status`。共享 Provider 统一 32 px 常规控件、10 px 内边距与输入状态。
- 点击有边框的输入控件后使用中性描边、容器底与轻阴影。Tab 导航使用信息色细边与柔和光晕。错误和警告保留各自的状态与键盘提示。
- 选中项由组件语义状态驱动，页内切换用 `Tabs`，页面导航用 `Route` 和 `Link`。
- 普通开关与进度条使用中性色。表格用同底表头与细分隔，保留行选中、分页、空态与加载。
- 临时反馈用 `App.useApp()`，持续反馈用 `Alert`。弹窗、抽屉和下拉浮层共享当前主题。

| 组件 | 规格与状态 |
| --- | --- |
| Button | 24 / 32 / 36 px，高度对应小、常规、大。圆角为 6 / 8 / 8 px。常规正文为 330 字重，实底为 450。边框按钮悬浮和按压逐级加深；主按钮禁用保留中性底并减弱到 20%。 |
| Table | 常规表头 32 px，行 36 px，两侧 16 px。紧凑模式用 28 / 32 px，大行 64 px。表头与表面同底，悬浮用中性浅底，选中行保留信息色浅底。 |
| Pagination | 常规页码和箭头 28 px、圆角 8 px、间距 4 px。当前页为中性浅底，Tab 使用信息色边与光晕。 |
| Select、Dropdown | 8 px 浮层、6 px 选项圆角与 32 px 选项。Select 面板内边距 4 px，操作菜单 6 px。选中项保留中性浅底与信息色勾选。 |
| Modal | `WorkosModal` 默认 480 px；面板圆角 12 px，宽度达到 640 px 的面板使用 16 px。标题 14/20、520 字重，关闭按钮 28 px，底部操作最窄 72 px。 |
| Drawer | `WorkosDrawer` 默认 360 px。标题栏 52 px、标题 14/24、正文与底部 16 px 内边距，关闭按钮为 28 px，位于标题栏末端。遮罩使用淡底和 8 px 模糊。 |

使用 `WorkosModal` 和 `WorkosDrawer` 获取默认宽度；业务可用对应组件参数指定宽度。表格排序、页码、浮层开关与表单状态沿用 Ant Design API。
