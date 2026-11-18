/**
 * AES Guardian Design System — Color Tokens
 *
 * Implements the approved serene, clinical, and institutional editorial palette
 * per Phase 2E UI Implementation Blueprint Section 4.1.
 *
 * All contrast ratios are calculated using exact WCAG 2.1 piecewise sRGB relative luminance.
 * Domain palettes are strictly segregated to prevent semantic cross-contamination.
 */

export interface StatusColorPair {
  readonly bg: string;
  readonly text: string;
  readonly border: string;
}

export interface BannerColorPair {
  readonly bg: string;
  readonly text: string;
  readonly border: string;
}

export type AesDeclarationStatusKey =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'correction_requested'
  | 'resubmitted'
  | 'closed';

export type OhCoordinationStatusKey =
  | 'pending_acknowledgement'
  | 'acknowledged'
  | 'completed'
  | 'cancelled';

export type CapaActionStatusKey =
  | 'proposed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

/**
 * Canvases & Surfaces
 */
export const aesSurfaceColors = {
  canvas: '#F8F9FA',          // Warm off-white background canvas
  surface: '#FFFFFF',         // Clean white surface for cards and sheets
  surfaceSubdued: '#F1F3F4',  // Light grey surface for table headers, inactive tabs
  surfaceElevated: '#FFFFFF', // Elevated cards and modal surfaces
} as const;

/**
 * Borders & Dividers
 */
export const aesBorderColors = {
  borderSubdued: '#EEEEEE',   // Soft border for cards and dividers
  borderMedium: '#E0E0E0',    // Default border for inactive inputs and chips
  borderStrong: '#BDBDBD',    // High-visibility border for focused or active elements
} as const;

/**
 * Strictly Non-Text Decorative Colors
 *
 * CAUTION: Contrast against #FFFFFF is 2.68:1 (FAILS WCAG for readable text).
 * Must ONLY be used for non-text decorative elements (dividers, inactive icons,
 * empty state illustrations). NEVER use for text, labels, hints, or placeholders.
 */
export const aesDecorativeColors = {
  decorativeMuted: '#9E9E9E', // Strictly non-text decorative elements only
} as const;

/**
 * Typography & Text Colors
 *
 * All readable text tokens (primary, secondary, tertiary, placeholder) achieve
 * >= 4.5:1 (WCAG AA normal text) against all supported light surfaces
 * (surface #FFFFFF, canvas #F8F9FA, surfaceSubdued #F1F3F4).
 */
export const aesTextColors = {
  textPrimary: '#212121',     // Primary near-black text (16.10:1 on #FFF, 15.29:1 on #F8F9FA, 14.47:1 on #F1F3F4) - AAA
  textSecondary: '#616161',   // Secondary body/helper text (6.19:1 on #FFF, 5.88:1 on #F8F9FA, 5.56:1 on #F1F3F4) - AA
  textTertiary: '#686868',    // Accessible tertiary text/captions (5.57:1 on #FFF, 5.29:1 on #F8F9FA, 5.01:1 on #F1F3F4) - AA
  textPlaceholder: '#686868', // Accessible input field placeholders (5.57:1 on #FFF, 5.29:1 on #F8F9FA, 5.01:1 on #F1F3F4) - AA
  textInverse: '#FFFFFF',     // White text on dark buttons and green badges (18.73:1 on #121212) - AAA
} as const;

/**
 * Brand & Clinical Accents
 */
export const aesAccentColors = {
  accentGreen: '#1B5E20',     // Clinical deep forest green (primary identity accent)
  accentGreenHover: '#144618',// Pressed state for green elements
  accentGreenMuted: '#E8F5E9',// Soft green background for positive badges and success cards
  accentPlum: '#4A154B',      // Secondary administrative accent (used sparingly)
} as const;

/**
 * Interactive Action States
 */
export const aesActionColors = {
  primaryAction: '#121212',          // Dominant near-black pill action button
  primaryActionPressed: '#2A2A2A',   // Pressed state
  primaryActionDisabled: '#E0E0E0',  // Disabled state
  secondaryAction: '#F1F3F4',        // Muted surface pill button for secondary choices
  secondaryActionPressed: '#E5E7EB', // Pressed state
  secondaryActionDisabled: '#F8F9FA',// Disabled state
} as const;

/**
 * Notification & Feedback Banners
 * Distinct from status badges — used for informational banners only
 */
export const aesBannerColors: Record<'info' | 'warning' | 'error' | 'success', BannerColorPair> = {
  info: { bg: '#E3F2FD', text: '#0D47A1', border: '#90CAF9' },    // 7.56:1 AAA
  warning: { bg: '#FFF8E1', text: '#7C4400', border: '#FFE082' }, // 7.36:1 AAA
  error: { bg: '#FFEBEE', text: '#B71C1C', border: '#EF9A9A' },   // 5.75:1 AA
  success: { bg: '#E8F5E9', text: '#1B5E20', border: '#A5D6A7' }, // 7.00:1 AAA
} as const;

/**
 * Domain-Specific Status Palettes
 *
 * All pairs satisfy WCAG 2.1 AA for normal text (>= 4.5:1), calculated via exact
 * piecewise sRGB linearization.
 *
 * Note on under_review and correction_requested:
 * Uses approved darker foreground tokens:
 * - under_review: #B24100 on #FFF3E0 = 5.25:1
 * - correction_requested: #BF360C on #FBE9E7 = 4.78:1
 */
export const aesDeclarationStatusColors: Record<AesDeclarationStatusKey, StatusColorPair> = {
  draft: { bg: '#EEEEEE', text: '#616161', border: '#E0E0E0' },                // 5.34:1 AA
  submitted: { bg: '#E3F2FD', text: '#1565C0', border: '#BBDEFB' },            // 5.03:1 AA
  under_review: { bg: '#FFF3E0', text: '#B24100', border: '#FFE0B2' },         // 5.25:1 AA (Approved token)
  correction_requested: { bg: '#FBE9E7', text: '#BF360C', border: '#FFCCBC' }, // 4.78:1 AA (Approved token)
  resubmitted: { bg: '#F3E5F5', text: '#6A1B9A', border: '#E1BEE7' },          // 7.75:1 AAA
  closed: { bg: '#E8F5E9', text: '#1B5E20', border: '#C8E6C9' },               // 7.00:1 AAA
} as const;

export const aesOhCoordinationStatusColors: Record<OhCoordinationStatusKey, StatusColorPair> = {
  pending_acknowledgement: { bg: '#FFF8E1', text: '#7C4400', border: '#FFECB3' }, // 7.36:1 AAA
  acknowledged: { bg: '#FFF3E0', text: '#B24100', border: '#FFE0B2' },            // 5.25:1 AA
  completed: { bg: '#E8F5E9', text: '#1B5E20', border: '#C8E6C9' },               // 7.00:1 AAA
  cancelled: { bg: '#FFEBEE', text: '#C62828', border: '#FFCDD2' },               // 4.92:1 AA
} as const;

export const aesCapaStatusColors: Record<CapaActionStatusKey, StatusColorPair> = {
  proposed: { bg: '#FFF8E1', text: '#7C4400', border: '#FFECB3' },                // 7.36:1 AAA
  in_progress: { bg: '#FFF3E0', text: '#B24100', border: '#FFE0B2' },             // 5.25:1 AA
  completed: { bg: '#E8F5E9', text: '#1B5E20', border: '#C8E6C9' },               // 7.00:1 AAA
  cancelled: { bg: '#FFEBEE', text: '#C62828', border: '#FFCDD2' },               // 4.92:1 AA
} as const;

/**
 * Consolidated AES Guardian Color Palette
 */
export const aesColors = {
  ...aesSurfaceColors,
  ...aesBorderColors,
  ...aesDecorativeColors,
  ...aesTextColors,
  ...aesAccentColors,
  ...aesActionColors,
  banners: aesBannerColors,
  status: {
    aesDeclaration: aesDeclarationStatusColors,
    ohCoordination: aesOhCoordinationStatusColors,
    capa: aesCapaStatusColors,
  },
} as const;

export type AesColors = typeof aesColors;
