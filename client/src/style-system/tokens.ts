// 来源为 my-component-docs/packages/ui/src/styles/tokens.css 的 Pewter 明暗主题。
export const pewter = {
  light: {
    layout: '#F4F4F7', container: '#FFFFFF', secondary: '#F9F9FB',
    text: '#0B0B0C', muted: 'rgba(11, 11, 12, 0.7)', inverse: '#FFFFFF',
    border: 'rgba(11, 11, 12, 0.05)', controlBorder: 'rgba(11, 11, 12, 0.15)',
    fill: 'rgba(11, 11, 12, 0.03)', selected: 'rgba(11, 11, 12, 0.05)',
    pressed: 'rgba(11, 11, 12, 0.10)', quiet: 'rgba(11, 11, 12, 0.5)',
    disabledText: 'rgba(11, 11, 12, 0.25)', mask: 'rgba(11, 11, 12, 0.8)',
    shadow: 'rgba(11, 11, 12, 0.10)',
    solid: '#171719', solidHover: '#555964',
    brand: '#F73F4B',
    info: { base: '#1474F2', hover: '#398BFF', surface: 'rgba(20, 116, 242, 0.05)', border: 'rgba(20, 116, 242, 0.25)' },
    danger: { base: '#DC2846', hover: '#E74769', surface: 'rgba(220, 40, 70, 0.05)', border: 'rgba(220, 40, 70, 0.25)' },
    success: { base: '#0D9E51', hover: '#28C270', surface: 'rgba(13, 158, 81, 0.05)', border: 'rgba(13, 158, 81, 0.25)' },
    warning: { base: '#EC671F', hover: '#F97D35', surface: 'rgba(236, 103, 31, 0.05)', border: 'rgba(236, 103, 31, 0.25)' },
  },
  dark: {
    layout: '#121214', container: '#1E1E20', secondary: '#171719',
    text: 'rgba(255, 255, 255, 0.8)', muted: 'rgba(255, 255, 255, 0.6)', inverse: '#0B0B0C',
    border: 'rgba(255, 255, 255, 0.05)', controlBorder: 'rgba(255, 255, 255, 0.25)',
    fill: 'rgba(255, 255, 255, 0.05)', selected: 'rgba(255, 255, 255, 0.10)',
    pressed: 'rgba(255, 255, 255, 0.15)', quiet: 'rgba(255, 255, 255, 0.4)',
    disabledText: 'rgba(255, 255, 255, 0.3)', mask: 'rgba(0, 0, 0, 0.8)',
    shadow: 'rgba(0, 0, 0, 0.4)',
    solid: '#ECEDF1', solidHover: '#FFFFFF',
    brand: '#FF5863',
    info: { base: '#398BFF', hover: '#1474F2', surface: 'rgba(20, 116, 242, 0.10)', border: 'rgba(20, 116, 242, 0.50)' },
    danger: { base: '#E74769', hover: '#DC2846', surface: 'rgba(220, 40, 70, 0.10)', border: 'rgba(220, 40, 70, 0.50)' },
    success: { base: '#28C270', hover: '#0D9E51', surface: 'rgba(13, 158, 81, 0.10)', border: 'rgba(13, 158, 81, 0.50)' },
    warning: { base: '#F97D35', hover: '#EC671F', surface: 'rgba(236, 103, 31, 0.10)', border: 'rgba(236, 103, 31, 0.50)' },
  },
} as const;

export const fontFamily = "MiSans, system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif";
export const radius = { tight: 4, small: 6, control: 8, container: 12 } as const;
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, section: 24 } as const;
export const controlHeight = { small: 24, regular: 32, large: 36 } as const;
export const typeScale = {
  page: { size: 20, line: 28, weight: 450 },
  heading: { size: 16, line: 24, weight: 450 },
  body: { size: 14, line: 20, weight: 330 },
  small: { size: 12 },
} as const;

export type ColorScheme = keyof typeof pewter;
export type Palette = { accent: string; surface: string };

export function getWorkosColors(scheme: ColorScheme, palette?: Palette) {
  const colors = pewter[scheme];
  const custom = scheme === 'light' ? palette : undefined;
  return {
    ...colors,
    layout: custom?.surface ?? colors.layout,
    selection: custom ? {
      base: custom.accent, hover: custom.accent,
      surface: `${custom.accent}0D`, border: `${custom.accent}40`,
    } : colors.info,
  };
}
