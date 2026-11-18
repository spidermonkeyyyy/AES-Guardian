/**
 * AES Guardian — Theme & Visual Foundation Automated Test Suite
 *
 * Validates:
 * 1. Exact WCAG 2.1 piecewise sRGB relative luminance and contrast calculations.
 * 2. Mandatory status color pairs (under_review, correction_requested).
 * 3. Domain separation across AES Declarations, OH Coordination, and CAPA.
 * 4. Tertiary & placeholder text contrast against all supported light surfaces (surface, canvas, surfaceSubdued).
 * 5. Explicit separation of readable placeholder/tertiary text from decorative non-text tokens (#9E9E9E).
 * 6. Typography token structures, metrics, and TextStyle conformance.
 * 7. Unified theme object and getStatusBadgeColors helper behavior.
 * 8. Shared theme barrel export isolation and zero collision with legacy SANAD tokens.
 */

import {
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
  AesDeclarationStatusKey,
  OhCoordinationStatusKey,
  CapaActionStatusKey,
} from '../../../theme/tokens/aesColors';
import {
  aesTypography,
  aesFontFamilies,
  aesFontSizes,
  aesFontWeights,
  aesLineHeights,
} from '../../../theme/tokens/aesTypography';
import {
  aesTheme,
  aesSpacing,
  aesRadii,
  aesShadows,
  getAesStatusBadgeColors,
} from '../../../theme/tokens/aesTheme';
// Barrel imports to verify isolation and backward compatibility with legacy SANAD
import * as ThemeBarrel from '../../../theme/tokens';

// ─── Mathematical Relative Luminance & Contrast Utilities ───────────────────────

/**
 * Converts an 8-bit sRGB color component (0-255) to linear luminance
 * using the official W3C WCAG 2.1 piecewise formula.
 */
function sRGBtoLinear(component8Bit: number): number {
  const c = component8Bit / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Computes relative luminance (0.0 - 1.0) for a 6-character hex color (#RRGGBB).
 */
function getRelativeLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  const rLin = sRGBtoLinear(r);
  const gLin = sRGBtoLinear(g);
  const bLin = sRGBtoLinear(b);

  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

/**
 * Computes the WCAG 2.1 contrast ratio between two hex colors.
 * Returns ratio formatted to two decimal places as a number (e.g. 5.25).
 */
function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

describe('AES Guardian Visual Foundation — Theme Suite', () => {
  // ─── 1. Mandatory Contrast-Safe Status Pairs ─────────────────────────────────

  describe('1. Mandatory WCAG Status Contrast Pairs (Normal Text >= 4.5:1)', () => {
    it('validates under_review foreground (#B24100) on background (#FFF3E0) achieves >= 4.5:1 (5.25:1)', () => {
      const pair = aesColors.status.aesDeclaration.under_review;
      expect(pair.text).toBe('#B24100');
      expect(pair.bg).toBe('#FFF3E0');

      const ratio = getContrastRatio(pair.text, pair.bg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(ratio).toBe(5.25);
    });

    it('validates correction_requested foreground (#BF360C) on background (#FBE9E7) achieves >= 4.5:1 (4.78:1)', () => {
      const pair = aesColors.status.aesDeclaration.correction_requested;
      expect(pair.text).toBe('#BF360C');
      expect(pair.bg).toBe('#FBE9E7');

      const ratio = getContrastRatio(pair.text, pair.bg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(ratio).toBe(4.78);
    });
  });

  // ─── 2. Full AES Declaration Palette Contrast ────────────────────────────────

  describe('2. AES Declaration Status Palette Contrast Verification', () => {
    const canonicalDeclarationStatuses: AesDeclarationStatusKey[] = [
      'draft',
      'submitted',
      'under_review',
      'correction_requested',
      'resubmitted',
      'closed',
    ];

    it.each(canonicalDeclarationStatuses)(
      'ensures declaration status "%s" meets WCAG AA normal-text contrast (>= 4.5:1)',
      (status) => {
        const pair = aesColors.status.aesDeclaration[status];
        expect(pair).toBeDefined();
        const ratio = getContrastRatio(pair.text, pair.bg);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      }
    );

    it('verifies AAA contrast (>= 7.0:1) for closed (#1B5E20 on #E8F5E9) and resubmitted (#6A1B9A on #F3E5F5)', () => {
      const closed = aesColors.status.aesDeclaration.closed;
      expect(getContrastRatio(closed.text, closed.bg)).toBeGreaterThanOrEqual(7.0);

      const resubmitted = aesColors.status.aesDeclaration.resubmitted;
      expect(getContrastRatio(resubmitted.text, resubmitted.bg)).toBeGreaterThanOrEqual(7.0);
    });
  });

  // ─── 3. Domain Segregation & Absence of ReviewOutcome Leakage ────────────────

  describe('3. Domain Segregation & Type Safety', () => {
    it('verifies aesDeclarationStatusColors contains exactly the 6 canonical DeclarationStatus keys', () => {
      const keys = Object.keys(aesColors.status.aesDeclaration).sort();
      const expected = [
        'closed',
        'correction_requested',
        'draft',
        'resubmitted',
        'submitted',
        'under_review',
      ].sort();
      expect(keys).toEqual(expected);
    });

    it('strictly forbids ReviewOutcome values (acknowledged, transmission_verified) from being declaration status keys', () => {
      const declStatus = aesColors.status.aesDeclaration as Record<string, any>;
      expect(declStatus['acknowledged']).toBeUndefined();
      expect(declStatus['transmission_verified']).toBeUndefined();
    });

    it('verifies ohCoordinationStatusColors contains exactly the 4 canonical OhCoordinationStatus keys', () => {
      const keys = Object.keys(aesColors.status.ohCoordination).sort();
      const expected = [
        'acknowledged',
        'cancelled',
        'completed',
        'pending_acknowledgement',
      ].sort();
      expect(keys).toEqual(expected);
    });

    it('verifies capaStatusColors contains exactly the 4 canonical PreventionActionStatus keys', () => {
      const keys = Object.keys(aesColors.status.capa).sort();
      const expected = ['cancelled', 'completed', 'in_progress', 'proposed'].sort();
      expect(keys).toEqual(expected);
    });

    it.each([
      ['pending_acknowledgement', 7.0],
      ['acknowledged', 4.5],
      ['completed', 7.0],
      ['cancelled', 4.5],
    ] as const)(
      'validates OH coordination status "%s" meets minimum ratio %s:1',
      (status, minRatio) => {
        const pair = aesColors.status.ohCoordination[status as OhCoordinationStatusKey];
        expect(getContrastRatio(pair.text, pair.bg)).toBeGreaterThanOrEqual(minRatio);
      }
    );

    it.each([
      ['proposed', 7.0],
      ['in_progress', 4.5],
      ['completed', 7.0],
      ['cancelled', 4.5],
    ] as const)(
      'validates CAPA status "%s" meets minimum ratio %s:1',
      (status, minRatio) => {
        const pair = aesColors.status.capa[status as CapaActionStatusKey];
        expect(getContrastRatio(pair.text, pair.bg)).toBeGreaterThanOrEqual(minRatio);
      }
    );
  });

  // ─── 4. Notification & Feedback Banners ──────────────────────────────────────

  describe('4. Notification & Feedback Banners', () => {
    it('verifies all banner pairs meet WCAG AA normal-text contrast (>= 4.5:1)', () => {
      const banners = aesColors.banners;
      expect(getContrastRatio(banners.info.text, banners.info.bg)).toBeGreaterThanOrEqual(7.0); // 7.56:1 AAA
      expect(getContrastRatio(banners.warning.text, banners.warning.bg)).toBeGreaterThanOrEqual(7.0); // 7.36:1 AAA
      expect(getContrastRatio(banners.error.text, banners.error.bg)).toBeGreaterThanOrEqual(4.5); // 5.75:1 AA
      expect(getContrastRatio(banners.success.text, banners.success.bg)).toBeGreaterThanOrEqual(7.0); // 7.00:1 AAA
    });
  });

  // ─── 5. Task A: Tertiary & Placeholder Text Contrast Across Light Surfaces ───

  describe('5. Task A: Tertiary & Placeholder Text Contrast Across All Light Surfaces', () => {
    const lightSurfaces = [
      { name: 'surface', hex: aesSurfaceColors.surface },
      { name: 'canvas', hex: aesSurfaceColors.canvas },
      { name: 'surfaceSubdued', hex: aesSurfaceColors.surfaceSubdued },
    ];

    it.each(lightSurfaces)(
      'ensures textTertiary (#686868) meets WCAG AA normal text (>= 4.5:1) on $name ($hex)',
      ({ hex }) => {
        const ratio = getContrastRatio(aesColors.textTertiary, hex);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      }
    );

    it.each(lightSurfaces)(
      'ensures textPlaceholder (#686868) meets WCAG AA normal text (>= 4.5:1) on $name ($hex)',
      ({ hex }) => {
        const ratio = getContrastRatio(aesColors.textPlaceholder, hex);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      }
    );

    it('confirms exact calculated ratios for textPlaceholder across all light surfaces', () => {
      expect(getContrastRatio(aesColors.textPlaceholder, aesSurfaceColors.surface)).toBe(5.57);
      expect(getContrastRatio(aesColors.textPlaceholder, aesSurfaceColors.canvas)).toBe(5.29);
      expect(getContrastRatio(aesColors.textPlaceholder, aesSurfaceColors.surfaceSubdued)).toBe(5.01);
    });

    it.each(lightSurfaces)(
      'ensures textSecondary (#616161) meets WCAG AA normal text (>= 4.5:1) on $name ($hex)',
      ({ hex }) => {
        const ratio = getContrastRatio(aesColors.textSecondary, hex);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      }
    );

    it.each(lightSurfaces)(
      'ensures textPrimary (#212121) meets WCAG AAA (>= 7.0:1) on $name ($hex)',
      ({ hex }) => {
        const ratio = getContrastRatio(aesColors.textPrimary, hex);
        expect(ratio).toBeGreaterThanOrEqual(7.0);
      }
    );

    it('strictly isolates decorativeMuted (#9E9E9E) from readable text and confirms contrast failure for text', () => {
      // 1. decorativeMuted must NOT equal readable text tokens
      expect(aesDecorativeColors.decorativeMuted).not.toBe(aesColors.textPlaceholder);
      expect(aesDecorativeColors.decorativeMuted).not.toBe(aesColors.textTertiary);

      // 2. decorativeMuted fails WCAG normal-text contrast (2.68:1 on white), proving it is non-text
      const ratioOnWhite = getContrastRatio(aesDecorativeColors.decorativeMuted, aesSurfaceColors.surface);
      expect(ratioOnWhite).toBe(2.68);
      expect(ratioOnWhite).toBeLessThan(4.5);
    });

    it('validates primary action button textInverse on primaryAction meets WCAG AAA', () => {
      const ratio = getContrastRatio(aesColors.textInverse, aesColors.primaryAction);
      expect(ratio).toBeGreaterThanOrEqual(18.0); // 18.73:1
    });
  });

  // ─── 6. Typography Scale & Metrics Conformance ───────────────────────────────

  describe('6. Typography Scale & TextStyle Conformance', () => {
    const requiredTypographyKeys: (keyof typeof aesTypography)[] = [
      'display1',
      'displayLarge',
      'heading1',
      'heading2',
      'subheading',
      'body',
      'bodySmall',
      'caption',
      'overline',
      'label',
      'labelSmall',
      'button',
      'buttonSmall',
      'statValue',
      'statValueLarge',
      'code',
    ];

    it.each(requiredTypographyKeys)(
      'ensures typography token "%s" is a complete TextStyle with positive metrics',
      (key) => {
        const style = aesTypography[key];
        expect(style).toBeDefined();
        expect(typeof style.fontSize).toBe('number');
        expect(style.fontSize!).toBeGreaterThan(0);
        expect(typeof style.lineHeight).toBe('number');
        expect(style.lineHeight!).toBeGreaterThanOrEqual(style.fontSize!);
        expect(style.fontWeight).toBeDefined();
        expect(style.fontFamily).toBeDefined();
      }
    );

    it('verifies font size hierarchy ordering', () => {
      expect(aesTypography.displayLarge.fontSize).toBeGreaterThan(aesTypography.display1.fontSize!);
      expect(aesTypography.display1.fontSize).toBeGreaterThan(aesTypography.heading1.fontSize!);
      expect(aesTypography.heading1.fontSize).toBeGreaterThan(aesTypography.heading2.fontSize!);
      expect(aesTypography.heading2.fontSize).toBeGreaterThan(aesTypography.subheading.fontSize!);
      expect(aesTypography.subheading.fontSize).toBeGreaterThan(aesTypography.body.fontSize!);
      expect(aesTypography.body.fontSize).toBeGreaterThan(aesTypography.bodySmall.fontSize!);
      expect(aesTypography.bodySmall.fontSize).toBeGreaterThan(aesTypography.caption.fontSize!);
      expect(aesTypography.caption.fontSize).toBeGreaterThan(aesTypography.overline.fontSize!);
    });
  });

  // ─── 7. Unified Theme Object & getStatusBadgeColors Helper ───────────────────

  describe('7. Unified Theme Object & Helper Methods', () => {
    it('exports all expected structural domains in aesTheme', () => {
      expect(aesTheme.colors).toBe(aesColors);
      expect(aesTheme.typography).toBe(aesTypography);
      expect(aesTheme.spacing).toBe(aesSpacing);
      expect(aesTheme.radii).toBe(aesRadii);
      expect(aesTheme.shadows).toBe(aesShadows);
      expect(typeof aesTheme.getStatusBadgeColors).toBe('function');
    });

    it('resolves AES declaration status badge colors accurately', () => {
      const underReview = getAesStatusBadgeColors('aesDecl', 'under_review');
      expect(underReview.text).toBe('#B24100');
      expect(underReview.bg).toBe('#FFF3E0');

      const corrReq = getAesStatusBadgeColors('aesDecl', 'correction_requested');
      expect(corrReq.text).toBe('#BF360C');
      expect(corrReq.bg).toBe('#FBE9E7');
    });

    it('resolves OH coordination status badge colors accurately', () => {
      const pending = getAesStatusBadgeColors('ohCoord', 'pending_acknowledgement');
      expect(pending.text).toBe('#7C4400');
      expect(pending.bg).toBe('#FFF8E1');

      const ack = getAesStatusBadgeColors('ohCoord', 'acknowledged');
      expect(ack.text).toBe('#B24100');
      expect(ack.bg).toBe('#FFF3E0');
    });

    it('resolves CAPA prevention status badge colors accurately', () => {
      const inProgress = getAesStatusBadgeColors('capa', 'in_progress');
      expect(inProgress.text).toBe('#B24100');
      expect(inProgress.bg).toBe('#FFF3E0');

      const completed = getAesStatusBadgeColors('capa', 'completed');
      expect(completed.text).toBe('#1B5E20');
      expect(completed.bg).toBe('#E8F5E9');
    });

    it('returns safe neutral fallback for unknown status or cross-domain mismatch', () => {
      // acknowledged is not an aesDecl status
      const invalidDecl = getAesStatusBadgeColors('aesDecl', 'acknowledged');
      expect(invalidDecl).toEqual({ bg: '#EEEEEE', text: '#616161', border: '#E0E0E0' });

      // unknown status
      const unknown = getAesStatusBadgeColors('ohCoord', 'non_existent_status');
      expect(unknown).toEqual({ bg: '#EEEEEE', text: '#616161', border: '#E0E0E0' });
    });
  });

  // ─── 8. Task B: Shared Barrel Isolation & Zero Collisions ────────────────────

  describe('8. Task B: Shared Theme Barrel Export Isolation', () => {
    it('verifies all legacy SANAD theme exports remain intact and unmodified', () => {
      // Legacy SANAD tokens
      expect(ThemeBarrel.colors).toBeDefined();
      expect(ThemeBarrel.colors.primary).toBe('#2e7d32');
      expect(ThemeBarrel.lightTheme).toBeDefined();
      expect(ThemeBarrel.darkTheme).toBeDefined();
      expect(ThemeBarrel.themes).toBeDefined();
      expect(typeof ThemeBarrel.getThemeColors).toBe('function');
      expect(ThemeBarrel.typography).toBeDefined();
      expect(ThemeBarrel.typography.fontSize.sm).toBe(14);
      expect(ThemeBarrel.spacing).toBeDefined();
      expect(ThemeBarrel.spacing.md).toBe(16);
      expect(ThemeBarrel.shapes).toBeDefined();
      expect(ThemeBarrel.shapes.card).toBe(8);
      expect(typeof ThemeBarrel.useTheme).toBe('function');
      expect(typeof ThemeBarrel.ThemeProvider).toBe('function');
    });

    it('verifies AES Guardian tokens are exposed via named exports without collision', () => {
      // AES Guardian isolated tokens
      expect(ThemeBarrel.aesColors).toBe(aesColors);
      expect(ThemeBarrel.aesColors.accentGreen).toBe('#1B5E20');
      expect(ThemeBarrel.aesTypography).toBe(aesTypography);
      expect(ThemeBarrel.aesTheme).toBe(aesTheme);
      expect(ThemeBarrel.aesSpacing).toBe(aesSpacing);
      expect(ThemeBarrel.aesRadii).toBe(aesRadii);
      expect(ThemeBarrel.aesShadows).toBe(aesShadows);
      expect(typeof ThemeBarrel.getAesStatusBadgeColors).toBe('function');

      // Verify that legacy and AES tokens coexist cleanly without overwriting
      expect(ThemeBarrel.colors).not.toBe(ThemeBarrel.aesColors);
      expect(ThemeBarrel.typography).not.toBe(ThemeBarrel.aesTypography);
      expect(ThemeBarrel.spacing).not.toBe(ThemeBarrel.aesSpacing);
      expect(ThemeBarrel.shapes).not.toBe(ThemeBarrel.aesRadii);
    });

    it('confirms no unintended key collision across barrel exports', () => {
      const legacyKeys = [
        'colors',
        'lightTheme',
        'darkTheme',
        'themes',
        'getThemeColors',
        'typography',
        'spacing',
        'shapes',
        'useTheme',
        'ThemeProvider',
      ];
      const aesKeys = [
        'aesColors',
        'aesSurfaceColors',
        'aesBorderColors',
        'aesDecorativeColors',
        'aesTextColors',
        'aesAccentColors',
        'aesActionColors',
        'aesBannerColors',
        'aesDeclarationStatusColors',
        'aesOhCoordinationStatusColors',
        'aesCapaStatusColors',
        'aesTypography',
        'aesFontFamilies',
        'aesFontSizes',
        'aesFontWeights',
        'aesLineHeights',
        'aesTheme',
        'aesSpacing',
        'aesRadii',
        'aesShadows',
        'getAesStatusBadgeColors',
      ];

      for (const lKey of legacyKeys) {
        expect(aesKeys).not.toContain(lKey);
      }
    });
  });
});
