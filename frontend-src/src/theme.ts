export interface Theme {
  primary: string; onPrimary: string
  primaryContainer: string; onPrimaryContainer: string
  secondary: string; onSecondary: string
  secondaryContainer: string; onSecondaryContainer: string
  tertiary: string; onTertiary: string
  tertiaryContainer: string; onTertiaryContainer: string
  error: string; errorContainer: string; onErrorContainer: string
  background: string; onBackground: string
  surface: string; onSurface: string
  surfaceVariant: string; onSurfaceVariant: string
  outline: string; outlineVariant: string
  surfaceContainerLowest: string; surfaceContainerLow: string
  surfaceContainer: string; surfaceContainerHigh: string
  surfaceContainerHighest: string
  elevatedSurface: string
}

const morning: Theme = {
  primary: '#4A8C5C', onPrimary: '#FFFFFF',
  primaryContainer: '#C8EDD0', onPrimaryContainer: '#0D4020',
  secondary: '#5C6E60', onSecondary: '#FFFFFF',
  secondaryContainer: '#DEEADF', onSecondaryContainer: '#1A2E1D',
  tertiary: '#4A7A96', onTertiary: '#FFFFFF',
  tertiaryContainer: '#C6E5F5', onTertiaryContainer: '#0A2E40',
  error: '#BA1A1A', errorContainer: '#FFDAD6', onErrorContainer: '#410002',
  background: '#F8FEFB', onBackground: '#1A1E1A',
  surface: '#F8FEFB', onSurface: '#1A1E1A',
  surfaceVariant: '#DAE5DB', onSurfaceVariant: '#3E4B3F',
  outline: '#6E7B6F', outlineVariant: '#BEC9BF',
  surfaceContainerLowest: '#FFFFFF', surfaceContainerLow: '#F2F8F3',
  surfaceContainer: '#EBF2EC', surfaceContainerHigh: '#E4ECE5',
  surfaceContainerHighest: '#DEE6DF',
  elevatedSurface: '#EAF3EB',
}

const afternoon: Theme = {
  primary: '#6B4E00', onPrimary: '#FFFFFF',
  primaryContainer: '#FFE08A', onPrimaryContainer: '#221500',
  secondary: '#5C5230', onSecondary: '#FFFFFF',
  secondaryContainer: '#E8DEB0', onSecondaryContainer: '#1A1600',
  tertiary: '#2E5E47', onTertiary: '#FFFFFF',
  tertiaryContainer: '#AEEACE', onTertiaryContainer: '#00201A',
  error: '#BA1A1A', errorContainer: '#FFDAD6', onErrorContainer: '#410002',
  background: '#FFFCF0', onBackground: '#1A1700',
  surface: '#FFFCF0', onSurface: '#1A1700',
  surfaceVariant: '#E8E1C8', onSurfaceVariant: '#4A4630',
  outline: '#5E5630', outlineVariant: '#CFC89A',
  surfaceContainerLowest: '#FFFFFF', surfaceContainerLow: '#F8F4E5',
  surfaceContainer: '#F2EDDE', surfaceContainerHigh: '#ECE7D8',
  surfaceContainerHighest: '#E6E1D2',
  elevatedSurface: '#F2EDDE',
}

const evening: Theme = {
  primary: '#5C2E90', onPrimary: '#FFFFFF',
  primaryContainer: '#E5D5FF', onPrimaryContainer: '#1A0040',
  secondary: '#5A4568', onSecondary: '#FFFFFF',
  secondaryContainer: '#EDD8FF', onSecondaryContainer: '#1A0530',
  tertiary: '#3A3E98', onTertiary: '#FFFFFF',
  tertiaryContainer: '#D8DAFF', onTertiaryContainer: '#000870',
  error: '#BA1A1A', errorContainer: '#FFDAD6', onErrorContainer: '#410002',
  background: '#F9F5FF', onBackground: '#150E25',
  surface: '#F9F5FF', onSurface: '#150E25',
  surfaceVariant: '#E5DEED', onSurfaceVariant: '#484058',
  outline: '#5E5075', outlineVariant: '#CAC3D5',
  surfaceContainerLowest: '#FFFFFF', surfaceContainerLow: '#F5F0FA',
  surfaceContainer: '#F0EBFA', surfaceContainerHigh: '#EAE5F5',
  surfaceContainerHighest: '#E4DFF0',
  elevatedSurface: '#F0EBFA',
}

const night: Theme = {
  primary: '#A8D4FF', onPrimary: '#001E36',
  primaryContainer: '#003559', onPrimaryContainer: '#D0E8FF',
  secondary: '#C0D4EC', onSecondary: '#142030',
  secondaryContainer: '#1E3448', onSecondaryContainer: '#D8ECFF',
  tertiary: '#A8DDE0', onTertiary: '#003538',
  tertiaryContainer: '#003F44', onTertiaryContainer: '#C0F8FC',
  error: '#FFB4AB', errorContainer: '#690005', onErrorContainer: '#FFDAD6',
  background: '#0A1520', onBackground: '#D8ECFF',
  surface: '#0A1520', onSurface: '#D8ECFF',
  surfaceVariant: '#283C50', onSurfaceVariant: '#A0B8D0',
  outline: '#8AAABF', outlineVariant: '#283C50',
  surfaceContainerLowest: '#050E18', surfaceContainerLow: '#101D2A',
  surfaceContainer: '#162638', surfaceContainerHigh: '#1C2E42',
  surfaceContainerHighest: '#24364C',
  elevatedSurface: '#162638',
}

const dawn: Theme = {
  primary: '#9E3418', onPrimary: '#FFFFFF',
  primaryContainer: '#FFD5C8', onPrimaryContainer: '#360800',
  secondary: '#6A4840', onSecondary: '#FFFFFF',
  secondaryContainer: '#FFD8D0', onSecondaryContainer: '#2A0E08',
  tertiary: '#614870', onTertiary: '#FFFFFF',
  tertiaryContainer: '#F0D5FF', onTertiaryContainer: '#200840',
  error: '#BA1A1A', errorContainer: '#FFDAD6', onErrorContainer: '#410002',
  background: '#FFF6F3', onBackground: '#220E08',
  surface: '#FFF6F3', onSurface: '#220E08',
  surfaceVariant: '#EDE0DC', onSurfaceVariant: '#504340',
  outline: '#6A4F49', outlineVariant: '#DEC6C1',
  surfaceContainerLowest: '#FFFFFF', surfaceContainerLow: '#FBF0EC',
  surfaceContainer: '#F7EBE8', surfaceContainerHigh: '#F1E5E2',
  surfaceContainerHighest: '#EBDFDC',
  elevatedSurface: '#F7EBE8',
}

type TimeOfDay = 'night' | 'dawn' | 'morning' | 'afternoon' | 'evening'

export function getTimeOfDay(h: number): TimeOfDay {
  if (h >= 22 || h < 5) return 'night'
  if (h < 8) return 'dawn'
  if (h < 13) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}

const themes: Record<TimeOfDay, Theme> = { morning, afternoon, evening, night, dawn }

export function getTheme(h: number): Theme {
  return themes[getTimeOfDay(h)]
}

export function injectCSSVars(t: Theme): string {
  return `
    --m3-pri:${t.primary}; --m3-on-pri:${t.onPrimary};
    --m3-pri-c:${t.primaryContainer}; --m3-on-pri-c:${t.onPrimaryContainer};
    --m3-sec:${t.secondary}; --m3-on-sec:${t.onSecondary};
    --m3-sec-c:${t.secondaryContainer}; --m3-on-sec-c:${t.onSecondaryContainer};
    --m3-ter:${t.tertiary}; --m3-on-ter:${t.onTertiary};
    --m3-ter-c:${t.tertiaryContainer}; --m3-on-ter-c:${t.onTertiaryContainer};
    --m3-err:${t.error}; --m3-err-c:${t.errorContainer}; --m3-on-err-c:${t.onErrorContainer};
    --m3-bg:${t.background}; --m3-on-bg:${t.onBackground};
    --m3-surf:${t.surface}; --m3-on-surf:${t.onSurface};
    --m3-surf-var:${t.surfaceVariant}; --m3-on-surf-var:${t.onSurfaceVariant};
    --m3-out:${t.outline}; --m3-out-var:${t.outlineVariant};
    --m3-sc-lowest:${t.surfaceContainerLowest}; --m3-sc-low:${t.surfaceContainerLow};
    --m3-sc:${t.surfaceContainer}; --m3-sc-high:${t.surfaceContainerHigh};
    --m3-sc-highest:${t.surfaceContainerHighest};
    --m3-elev:${t.elevatedSurface};
  `
}

/** CSS variable references for inline styles */
export const P = {
  primary: 'var(--m3-pri)', onPrimary: 'var(--m3-on-pri)',
  primaryContainer: 'var(--m3-pri-c)', onPrimaryContainer: 'var(--m3-on-pri-c)',
  secondary: 'var(--m3-sec)', onSecondary: 'var(--m3-on-sec)',
  secondaryContainer: 'var(--m3-sec-c)', onSecondaryContainer: 'var(--m3-on-sec-c)',
  tertiary: 'var(--m3-ter)', onTertiary: 'var(--m3-on-ter)',
  tertiaryContainer: 'var(--m3-ter-c)', onTertiaryContainer: 'var(--m3-on-ter-c)',
  error: 'var(--m3-err)', errorContainer: 'var(--m3-err-c)', onErrorContainer: 'var(--m3-on-err-c)',
  background: 'var(--m3-bg)', onBackground: 'var(--m3-on-bg)',
  surface: 'var(--m3-surf)', onSurface: 'var(--m3-on-surf)',
  surfaceVariant: 'var(--m3-surf-var)', onSurfaceVariant: 'var(--m3-on-surf-var)',
  outline: 'var(--m3-out)', outlineVariant: 'var(--m3-out-var)',
  surfaceContainerLowest: 'var(--m3-sc-lowest)', surfaceContainerLow: 'var(--m3-sc-low)',
  surfaceContainer: 'var(--m3-sc)', surfaceContainerHigh: 'var(--m3-sc-high)',
  surfaceContainerHighest: 'var(--m3-sc-highest)',
  elevatedSurface: 'var(--m3-elev)',
}
