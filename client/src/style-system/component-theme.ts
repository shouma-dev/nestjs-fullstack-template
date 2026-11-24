import type { ConfigProviderProps, ThemeConfig } from 'antd';
import type { CSSProperties } from 'react';
import { controlHeight, fontFamily, radius, spacing, typeScale, type ColorScheme, type getWorkosColors } from './tokens';

type Colors = ReturnType<typeof getWorkosColors>;

// 尺寸对应 my-component-docs 的 YDButton、YDTable、YDPagination、YDSelect、YDDropdown、YDModal 与 YDDrawer。
export const componentMetrics = {
  table: { header: 32, smallHeader: 28, regularRow: 36, smallRow: 32, largeRow: 64 },
  pagination: { item: 28, gap: 4 },
  popup: { option: 32, gap: 2, selectPadding: 4, menuPadding: 6 },
  modal: { width: 480, wideWidth: 640, wideRadius: 16, maxHeight: 720, titleSize: 14, titleWeight: 520, close: 28, footerAction: 72 },
  drawer: { width: 360, header: 52, titleSize: 14, titleLine: 24, maskBlur: 8, close: 28 },
} as const;

function controlPaint(scheme: ColorScheme, colors: Colors) {
  return {
    outline: scheme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(11, 11, 12, 0.10)',
    softShadow: scheme === 'dark' ? 'rgba(0, 0, 0, 0.25)' : 'rgba(11, 11, 12, 0.07)',
    drawerMask: scheme === 'dark' ? 'rgba(0, 0, 0, 0.25)' : colors.border,
  };
}

export function createWorkosComponentTheme(scheme: ColorScheme, colors: Colors): NonNullable<ThemeConfig['components']> {
  const { outline, softShadow } = controlPaint(scheme, colors);
  const { selection } = colors;
  const popupShadow = `0 6px 16px ${colors.shadow}, 0 3px 6px -4px ${softShadow}`;
  const popup = { borderRadiusLG: radius.control, borderRadiusSM: radius.small, boxShadowSecondary: popupShadow };
  const disabled = { colorTextDisabled: colors.disabledText, colorBgContainerDisabled: 'transparent' };

  return {
    Button: {
      ...disabled, borderRadiusLG: radius.control,
      colorPrimary: colors.solid, colorPrimaryHover: colors.solidHover, colorPrimaryActive: colors.solid,
      primaryColor: colors.inverse, primaryShadow: 'none', defaultShadow: 'none', dangerShadow: 'none',
      defaultColor: colors.text, defaultBg: 'transparent', defaultBorderColor: outline,
      defaultHoverColor: colors.text, defaultHoverBorderColor: outline, defaultHoverBg: colors.selected,
      defaultActiveColor: colors.text, defaultActiveBorderColor: outline, defaultActiveBg: colors.pressed,
      defaultBgDisabled: 'transparent', borderColorDisabled: colors.border,
      textHoverBg: colors.selected, textTextColor: colors.text, textTextHoverColor: colors.text, textTextActiveColor: colors.text,
      paddingInline: spacing.md, paddingInlineSM: spacing.sm, paddingInlineLG: spacing.md, iconGap: 6,
      fontWeight: typeScale.body.weight,
    },
    Table: {
      headerBg: colors.container, headerColor: colors.quiet, headerSplitColor: 'transparent',
      headerBorderRadius: radius.control, borderColor: colors.border, colorText: colors.muted,
      headerSortActiveBg: colors.container, headerSortHoverBg: colors.container, fixedHeaderSortActiveBg: colors.container,
      bodySortBg: colors.container, headerFilterHoverBg: colors.fill,
      rowHoverBg: colors.fill, rowSelectedBg: selection.surface, rowSelectedHoverBg: selection.surface,
      cellPaddingBlock: 2, cellPaddingBlockMD: 2, cellPaddingBlockSM: 0,
      cellPaddingInline: spacing.lg, cellPaddingInlineMD: spacing.lg, cellPaddingInlineSM: spacing.lg,
      cellFontSize: typeScale.body.size, cellFontSizeMD: typeScale.body.size, cellFontSizeSM: typeScale.body.size,
    },
    Pagination: {
      ...disabled, itemSize: componentMetrics.pagination.item, itemSizeSM: componentMetrics.pagination.item,
      itemSizeLG: controlHeight.regular, itemBg: 'transparent', itemLinkBg: 'transparent',
      itemActiveBg: colors.selected, itemActiveColor: colors.text, itemActiveColorHover: colors.text,
      itemActiveColorDisabled: colors.disabledText, itemActiveBgDisabled: colors.fill,
      colorPrimary: outline, colorPrimaryHover: outline, colorBorder: outline,
    },
    Select: {
      ...popup, optionHeight: componentMetrics.popup.option, optionPadding: '5px 12px',
      optionFontSize: typeScale.body.size, optionLineHeight: '20px', optionSelectedColor: colors.text,
      optionSelectedBg: colors.selected, optionActiveBg: colors.fill, optionSelectedFontWeight: typeScale.body.weight,
      controlItemBgActiveHover: colors.selected, multipleItemBg: colors.selected,
    },
    Dropdown: {
      ...popup, paddingBlock: 6, controlPaddingHorizontal: spacing.sm,
      colorPrimary: colors.text, colorPrimaryBorder: selection.base,
      controlItemBgHover: colors.fill, controlItemBgActive: colors.selected, controlItemBgActiveHover: colors.selected,
    },
    Modal: {
      titleFontSize: componentMetrics.modal.titleSize, titleLineHeight: typeScale.body.line / componentMetrics.modal.titleSize,
      fontWeightStrong: componentMetrics.modal.titleWeight, contentBg: colors.container, headerBg: colors.container,
      footerBg: colors.container, colorBgMask: colors.mask, borderRadiusLG: radius.container,
    },
    Drawer: {
      colorBgElevated: colors.container, colorText: colors.text, footerPaddingBlock: spacing.lg, footerPaddingInline: spacing.lg,
      draggerSize: 16,
    },
  };
}

export function createWorkosComponentProps(scheme: ColorScheme, colors: Colors, fieldProps: ConfigProviderProps['select']) {
  const { outline, softShadow, drawerMask } = controlPaint(scheme, colors);
  const type = {
    fontFamily, fontWeight: typeScale.body.weight, fontFeatureSettings: '"ss01" 1',
  } as const;
  const interaction = {
    '--workos-strong': typeScale.heading.weight,
    '--workos-action-solid': colors.solid,
    '--workos-action-solid-text': colors.inverse,
    '--workos-action-danger': colors.danger.base,
    '--workos-action-danger-text': '#fff',
    '--workos-action-border': outline,
    '--workos-action-selected': colors.selected,
    '--workos-action-pressed': colors.pressed,
    '--workos-action-shadow': colors.shadow,
    '--workos-action-focus': colors.selection.base,
    '--workos-action-glow': colors.selection.border,
  } as CSSProperties;

  return {
    button: {
      autoInsertSpace: false, classNames: { root: 'workos-button' },
      style: { ...type, ...interaction, fontWeight: `var(--workos-button-weight, ${typeScale.body.weight})` },
    },
    table: {
      classNames: ({ props }) => ({ root: props.size === 'large' ? 'workos-data-table workos-data-table-large' : 'workos-data-table' }),
      styles: ({ props }) => ({
        root: {
          ...type,
          '--workos-table-header': `${props.size === 'small' ? componentMetrics.table.smallHeader : componentMetrics.table.header}px`,
          '--workos-table-row': `${props.size === 'small' ? componentMetrics.table.smallRow : props.size === 'large' ? componentMetrics.table.largeRow : componentMetrics.table.regularRow}px`,
          '--workos-table-radius': `${radius.control}px`,
        } as CSSProperties,
      }),
    },
    pagination: {
      classNames: { root: 'workos-pagination' },
      style: { ...type, ...interaction, '--workos-page-gap': `${componentMetrics.pagination.gap}px` } as CSSProperties,
    },
    select: {
      ...fieldProps,
      classNames: { popup: { root: 'workos-select-popup' } },
      styles: { popup: { root: {
        ...type, border: `1px solid ${outline}`, padding: componentMetrics.popup.selectPadding,
        '--workos-popup-gap': `${componentMetrics.popup.gap}px`,
      } as CSSProperties } },
    },
    dropdown: {
      classNames: { root: 'workos-dropdown', item: 'workos-dropdown-item' },
      styles: {
        root: {
          ...type, '--workos-popup-border': outline, '--workos-popup-padding': `${componentMetrics.popup.menuPadding}px`,
          '--workos-popup-gap': `${componentMetrics.popup.gap}px`, '--workos-popup-check': colors.selection.base,
          '--workos-popup-active': colors.selected,
        } as CSSProperties,
        item: type,
      },
    },
    modal: {
      centered: true,
      classNames: { root: 'workos-modal', footer: 'workos-modal-actions' },
      styles: ({ props }) => ({
        root: { maxWidth: 'calc(100vw - 32px)' },
        container: {
          ...type, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden',
          borderRadius: typeof props.width === 'number' && props.width >= componentMetrics.modal.wideWidth
            ? componentMetrics.modal.wideRadius : radius.container,
          maxHeight: `min(${componentMetrics.modal.maxHeight}px, 100dvh - 32px)`,
          '--workos-modal-action-width': `${componentMetrics.modal.footerAction}px`,
          '--workos-modal-action-gap': '6px',
        } as CSSProperties,
        header: { padding: '24px 48px 8px 16px', margin: 0, flexShrink: 0 },
        body: { minHeight: 0, overflow: 'auto', padding: '0 16px 16px' },
        footer: { padding: spacing.lg, margin: 0, flexShrink: 0 },
        close: { insetBlockStart: spacing.sm, insetInlineEnd: spacing.sm, width: componentMetrics.modal.close, height: componentMetrics.modal.close, borderRadius: radius.small },
      }),
    },
    drawer: {
      closable: { placement: 'end' },
      styles: {
        section: {
          ...type, borderRadius: 0,
          boxShadow: `0 4px 8px ${softShadow}, 0 16px 48px -8px ${colors.shadow}`,
        },
        mask: { background: drawerMask, backdropFilter: `blur(${componentMetrics.drawer.maskBlur}px)` },
        header: { minHeight: componentMetrics.drawer.header, padding: '12px 12px 12px 20px', borderBottom: 0, gap: spacing.md },
        title: { fontSize: componentMetrics.drawer.titleSize, fontWeight: typeScale.heading.weight, lineHeight: `${componentMetrics.drawer.titleLine}px` },
        close: { width: componentMetrics.drawer.close, height: componentMetrics.drawer.close, borderRadius: radius.control },
        body: { padding: spacing.lg, overscrollBehavior: 'contain' },
        footer: { display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 6, padding: spacing.lg, borderColor: outline },
        wrapper: { maxWidth: '100%', boxShadow: 'none' },
      },
    },
  } satisfies Pick<ConfigProviderProps, 'button' | 'table' | 'pagination' | 'select' | 'dropdown' | 'modal' | 'drawer'>;
}
