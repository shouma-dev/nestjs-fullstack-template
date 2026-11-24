import { useEffect, useMemo, useSyncExternalStore, type CSSProperties, type PropsWithChildren } from 'react';
import { App as AntApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { createWorkosTheme } from './antd-theme';
import { fontFamily, getWorkosColors, radius, spacing, typeScale, type Palette } from './tokens';
import { createWorkosFieldProps } from './field-theme';
import { createWorkosComponentProps } from './component-theme';
import { trackKeyboardFocus } from './keyboard-focus';
import './fields.css';
import './components.css';

const preference = '(prefers-color-scheme: dark)';
const readDark = () => typeof window !== 'undefined' && window.matchMedia(preference).matches;
const subscribe = (onChange: () => void) => {
  const media = window.matchMedia(preference);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
};

export function StyleProvider({ children, palette }: PropsWithChildren<{ palette?: Palette }>) {
  useEffect(() => trackKeyboardFocus(document), []);
  const scheme = useSyncExternalStore(subscribe, readDark, () => false) ? 'dark' : 'light';
  const colors = useMemo(() => getWorkosColors(scheme, palette), [scheme, palette]);
  const config = useMemo(() => createWorkosTheme(scheme, colors), [scheme, colors]);
  const style = {
    colorScheme: scheme,
    background: colors.layout, color: colors.text, minHeight: '100dvh',
    fontFamily, fontSize: typeScale.body.size, fontWeight: typeScale.body.weight, lineHeight: `${typeScale.body.line}px`,
    '--workos-layout': colors.layout, '--workos-container': colors.container, '--workos-secondary': colors.secondary,
    '--workos-text': colors.text, '--workos-muted': colors.muted, '--workos-divider': colors.border,
    '--workos-fill': colors.fill, '--workos-selected': colors.selected, '--workos-info': colors.selection.base,
    '--workos-brand': colors.brand, '--workos-spotlight': colors.solid,
    '--workos-radius-control': `${radius.control}px`, '--workos-radius-container': `${radius.container}px`,
    '--workos-space-xs': `${spacing.xs}px`, '--workos-space-sm': `${spacing.sm}px`,
    '--workos-space-md': `${spacing.md}px`, '--workos-space-lg': `${spacing.lg}px`,
    '--workos-space-xl': `${spacing.xl}px`, '--workos-space-section': `${spacing.section}px`,
    '--workos-title-size': `${typeScale.page.size}px`, '--workos-title-line': `${typeScale.page.line}px`,
    '--workos-title-weight': typeScale.page.weight,
  } as CSSProperties;
  const fields = useMemo(() => createWorkosFieldProps(colors, typeScale.body.weight), [colors]);
  const components = useMemo(() => createWorkosComponentProps(scheme, colors, fields.select), [scheme, colors, fields]);
  return (
    <ConfigProvider locale={zhCN} theme={config} wave={{ disabled: true }} {...fields} {...components}>
      <AntApp className="workos-app" style={style}>{children}</AntApp>
    </ConfigProvider>
  );
}
