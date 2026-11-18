export { colors, lightTheme, darkTheme, themes, getThemeColors } from './colors';
export { typography } from './typography';
export { spacing } from './spacing';
export { shapes } from './shapes';
export { useTheme, ThemeProvider } from '../ThemeContext';
export type { ThemeMode } from '../ThemeContext';

// AES Guardian Isolated Visual Foundation Tokens
export {
  aesColors,
  aesSurfaceColors,
  aesBorderColors,
  aesDecorativeColors,
  aesTextColors,
  aesAccentColors,
  aesActionColors,
  aesBannerColors,
  aesDeclarationStatusColors,
  aesOhCoordinationStatusColors,
  aesCapaStatusColors,
  type StatusColorPair,
  type BannerColorPair,
  type AesDeclarationStatusKey,
  type OhCoordinationStatusKey,
  type CapaActionStatusKey,
  type AesColors,
} from './aesColors';

export {
  aesTypography,
  aesFontFamilies,
  aesFontSizes,
  aesFontWeights,
  aesLineHeights,
  type AesTypography,
  type AesTypographyKey,
} from './aesTypography';

export {
  aesTheme,
  aesSpacing,
  aesRadii,
  aesShadows,
  getAesStatusBadgeColors,
  type AesStatusDomain,
  type AesSpacing,
  type AesRadii,
  type AesShadows,
  type AesTheme,
} from './aesTheme';
