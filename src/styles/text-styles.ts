import type { TextStyle } from 'react-native';

export const textScale = {
  xs: { fontSize: 11, lineHeight: 14, fontWeight: '500' } satisfies TextStyle,
  sm: { fontSize: 13, lineHeight: 18, fontWeight: '400' } satisfies TextStyle,
  base: { fontSize: 15, lineHeight: 22, fontWeight: '400' } satisfies TextStyle,
  lg: { fontSize: 17, lineHeight: 24, fontWeight: '600' } satisfies TextStyle,
  xl: { fontSize: 20, lineHeight: 26, fontWeight: '600' } satisfies TextStyle,
  mono: {
    fontSize: 13,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  } satisfies TextStyle,
  display: { fontSize: 32, lineHeight: 36, fontWeight: '600' } satisfies TextStyle,
} as const;
