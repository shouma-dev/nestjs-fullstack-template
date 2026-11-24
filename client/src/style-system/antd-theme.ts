import { theme, type ThemeConfig } from 'antd';
import { controlHeight, fontFamily, pewter, radius, spacing, typeScale, type ColorScheme, type getWorkosColors } from './tokens';
import { createWorkosFieldTheme } from './field-theme';
import { createWorkosComponentTheme } from './component-theme';

// Ant Design 会在深色算法中再次调暗种子色。WorkOS 已经为每种主题定义了语义色。
const pewterDarkAlgorithm: typeof theme.darkAlgorithm = seed => ({
  ...theme.darkAlgorithm(seed),
  colorPrimary: seed.colorPrimary,
  colorInfo: seed.colorInfo,
  colorError: seed.colorError,
  colorSuccess: seed.colorSuccess,
  colorWarning: seed.colorWarning,
});

export function createWorkosTheme(scheme: ColorScheme, colors: ReturnType<typeof getWorkosColors>): ThemeConfig {
  const { selection, info, danger, success, warning } = colors;
  const selected = { colorPrimary: colors.solid, colorPrimaryHover: colors.solidHover, colorPrimaryActive: colors.solid };
  const fields = createWorkosFieldTheme(scheme, colors);
  const components = createWorkosComponentTheme(scheme, colors);

  return {
    algorithm: scheme === 'dark' ? pewterDarkAlgorithm : theme.defaultAlgorithm,
    token: {
      fontFamily, fontSize: typeScale.body.size, fontSizeSM: typeScale.small.size,
      lineHeight: typeScale.body.line / typeScale.body.size, fontWeightStrong: typeScale.heading.weight,
      fontSizeHeading1: typeScale.page.size, lineHeightHeading1: typeScale.page.line / typeScale.page.size,
      fontSizeHeading2: typeScale.heading.size, lineHeightHeading2: typeScale.heading.line / typeScale.heading.size,
      controlHeight: controlHeight.regular, controlHeightSM: controlHeight.small, controlHeightLG: controlHeight.large,
      borderRadiusXS: radius.tight, borderRadiusSM: radius.small,
      borderRadius: radius.control, borderRadiusLG: radius.container,
      paddingXS: spacing.sm, paddingSM: spacing.md, padding: spacing.lg, paddingLG: spacing.section,
      controlPaddingHorizontal: spacing.md, controlPaddingHorizontalSM: spacing.sm,
      colorBgLayout: colors.layout, colorBgContainer: colors.container, colorBgElevated: colors.container,
      colorBgContainerDisabled: colors.fill, colorBgMask: colors.mask,
      colorText: colors.text, colorTextSecondary: colors.muted, colorTextTertiary: colors.quiet,
      colorTextQuaternary: colors.disabledText, colorTextDisabled: colors.disabledText, colorTextPlaceholder: colors.quiet,
      colorBorder: colors.controlBorder, colorBorderSecondary: colors.border, colorSplit: colors.border,
      colorFill: colors.pressed, colorFillSecondary: colors.selected, colorFillTertiary: colors.fill,
      colorPrimary: selection.base, colorPrimaryHover: selection.hover, colorPrimaryActive: selection.base,
      colorPrimaryBg: selection.surface, colorPrimaryBgHover: selection.border, colorPrimaryBorder: selection.base,
      lineWidthFocus: 1,
      controlOutline: selection.border, controlItemBgHover: colors.fill,
      colorLink: info.base, colorLinkHover: info.hover, colorLinkActive: info.base,
      colorInfo: info.base, colorInfoHover: info.hover, colorInfoBg: info.surface, colorInfoBorder: info.border,
      colorSuccess: success.base, colorSuccessHover: success.hover, colorSuccessBg: success.surface, colorSuccessBorder: success.border,
      colorWarning: warning.base, colorWarningHover: warning.hover, colorWarningBg: warning.surface, colorWarningBorder: warning.border,
      colorError: danger.base, colorErrorHover: danger.hover, colorErrorBg: danger.surface, colorErrorBorder: danger.border,
      boxShadowSecondary: `0 6px 20px ${colors.shadow}, 0 0 0 1px ${colors.border}`,
    },
    components: {
      ...components,
      Card: { headerFontSize: typeScale.heading.size, headerHeight: 48, bodyPadding: spacing.xl, headerPadding: spacing.xl },
      ...fields,
      Select: { ...fields.Select, ...components.Select },
      DatePicker: { ...fields.DatePicker, cellHoverBg: colors.fill },
      Menu: {
        itemColor: colors.muted, itemHoverColor: colors.text, itemSelectedColor: colors.text,
        itemHoverBg: colors.fill, itemSelectedBg: colors.selected, itemActiveBg: colors.pressed,
        horizontalItemHoverColor: colors.text, horizontalItemSelectedColor: colors.text,
        itemHeight: controlHeight.regular, itemBorderRadius: radius.small, itemPaddingInline: spacing.md,
        darkItemBg: pewter.dark.container, darkSubMenuItemBg: pewter.dark.secondary, darkPopupBg: pewter.dark.container,
        darkItemColor: pewter.dark.muted, darkItemHoverColor: pewter.dark.text, darkItemSelectedColor: pewter.dark.text,
        darkItemHoverBg: pewter.dark.fill, darkItemSelectedBg: pewter.dark.selected,
      },
      Tabs: {
        itemColor: colors.muted, itemSelectedColor: colors.text, itemHoverColor: colors.text,
        itemActiveColor: colors.text, inkBarColor: colors.solid,
        horizontalItemGutter: spacing.section, horizontalItemPadding: '8px 0',
      },
      Switch: {
        ...selected, colorTextQuaternary: colors.quiet, colorTextLightSolid: colors.inverse,
        handleBg: colors.inverse, handleShadow: 'none', trackHeight: 20, trackMinWidth: 40, handleSize: 16,
        trackHeightSM: 16, trackMinWidthSM: 32, handleSizeSM: 12,
      },
      Progress: { defaultColor: colors.solid, remainingColor: colors.selected },
      Tag: { defaultBg: colors.fill, defaultColor: colors.muted },
      Alert: { borderRadius: radius.control, defaultPadding: '8px 12px' },
      Message: { contentBg: colors.container, contentPadding: '8px 12px' },
      Popover: { colorBgElevated: colors.container, colorText: colors.text },
      Tooltip: { colorBgSpotlight: colors.solid, colorTextLightSolid: colors.inverse },
    },
  };
}
