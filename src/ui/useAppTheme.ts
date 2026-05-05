import { palette, type ThemePalette } from '@/src/styles/colors';

/** Resolved app palette (single light palette; hook kept for ergonomic `const colors = useAppTheme()` in screens). */
export function useAppTheme(): ThemePalette {
  return palette;
}
