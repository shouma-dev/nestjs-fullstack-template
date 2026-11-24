import type { CSSProperties } from 'react';

type Scheme = 'light' | 'dark';
type FieldColors = {
  container: string; border: string; controlBorder: string; fill: string; shadow: string;
  selection: { base: string; border: string };
  danger: { border: string };
  warning: { border: string };
};
const fieldBorders = {
  light: { resting: 'rgba(11, 11, 12, 0.10)', editing: 'rgba(11, 11, 12, 0.80)' },
  dark: { resting: 'rgba(255, 255, 255, 0.15)', editing: 'rgba(255, 255, 255, 0.80)' },
} as const;
const dimensions = { padding: 10, iconGap: 6, iconSize: 16 };

export function createWorkosFieldTheme(scheme: Scheme, colors: FieldColors) {
  const borders = fieldBorders[scheme];
  const field = {
    colorBorder: borders.resting, hoverBorderColor: colors.controlBorder,
    activeBorderColor: `var(--workos-field-active-border, ${borders.editing})`,
  };
  const input = {
    ...field, colorBgContainer: 'transparent', colorBgContainerDisabled: 'transparent',
    hoverBg: colors.fill, activeBg: `var(--workos-field-active-bg, ${colors.container})`,
    activeShadow: `var(--workos-field-active-shadow, 0 2px 4px -2px ${colors.shadow})`,
    errorActiveShadow: 'var(--workos-field-error-shadow, none)',
    warningActiveShadow: 'var(--workos-field-warning-shadow, none)',
    borderColorDisabled: colors.border,
  };
  return {
    Input: { ...input, paddingInline: dimensions.padding },
    InputNumber: { ...input, paddingInline: dimensions.padding },
    Select: { ...field, selectorBg: 'transparent', activeOutlineColor: 'transparent', paddingSM: dimensions.padding + 1 },
    DatePicker: input,
    TimePicker: input,
  };
}

export function createWorkosFieldProps(colors: FieldColors, weight: number) {
  const field = {
    className: 'workos-field',
    style: {
      fontWeight: weight, fontFeatureSettings: '"ss01" 1',
      '--workos-field-icon-gap': `${dimensions.iconGap}px`,
      '--workos-field-icon-size': `${dimensions.iconSize}px`,
      '--workos-field-keyboard-border': colors.selection.base,
      '--workos-field-keyboard-shadow': `0 0 4px ${colors.selection.border}`,
      '--workos-field-keyboard-error': `0 0 4px ${colors.danger.border}`,
      '--workos-field-keyboard-warning': `0 0 4px ${colors.warning.border}`,
      '--workos-field-edit-shadow': `0 2px 4px -2px ${colors.shadow}`,
      '--workos-field-edit-bg': colors.container,
      '--workos-field-hover-bg': colors.fill,
    } as CSSProperties,
  };
  return { input: field, textArea: field, inputNumber: field, select: field, datePicker: field, timePicker: field };
}
