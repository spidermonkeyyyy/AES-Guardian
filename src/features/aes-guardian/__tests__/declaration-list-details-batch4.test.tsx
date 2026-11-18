/**
 * AES Guardian Phase 2E.1.4.3.1: Batch 4 Acceptance & Targeted Verification Tests
 *
 * Comprehensive acceptance audit test suite verifying:
 * 1. AesStatusBadge domain-segregated mapping, CAPA statuses, fallback behavior, accessibility
 * 2. DeclarationListScreen role-guarding, 5 truthful filter chips, loading/empty/error states, identity change
 * 3. DeclarationDetailsScreen 5-tab layout, tab navigation, exact projections, role changes, action boundaries
 * 4. Localization integrity in FR, EN, and AR without raw fallback keys
 */

import React from 'react';
import { Alert, StyleSheet } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import {
  initializeDatabase,
  resetDatabaseForTesting,
  getDatabase,
  useDemoRoleStore,
} from '../../../core';
import { ThemeProvider } from '../../../theme/ThemeContext';
import { setLocale, t, translations } from '../../../localization';
import { AesStatusBadge } from '../components/AesStatusBadge';
import { DeclarationListScreen } from '../screens/DeclarationListScreen';
import { DeclarationDetailsScreen } from '../screens/DeclarationDetailsScreen';
import {
  aesDeclarationStatusColors,
  aesOhCoordinationStatusColors,
  aesCapaStatusColors,
} from '../../../theme/tokens/aesColors';

const { clearAllMockStores } = require('@op-engineering/op-sqlite');

// ─── Navigation Mock ─────────────────────────────────────────────────────────

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
let mockRouteParams: { declarationId?: number } = {};

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
    }),
    useRoute: () => ({
      params: mockRouteParams,
    }),
    useIsFocused: () => true,
  };
});

describe('AES Guardian Phase 2E.1.4.3.1: Batch 4 Acceptance Audit & Targeted Verification', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockRouteParams = {};
    setLocale('fr');
    clearAllMockStores();
    resetDatabaseForTesting();
    await initializeDatabase();
    useDemoRoleStore.getState().setRole('exposed_professional');
  });

  afterEach(() => {
    useDemoRoleStore.getState().setRole('exposed_professional');
    clearAllMockStores();
    resetDatabaseForTesting();
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // 1. AesStatusBadge Component Tests
  // ═════════════════════════════════════════════════════════════════════════════
  describe('1. AesStatusBadge Component Audit', () => {
    it('renders all 6 persisted declaration status values correctly', () => {
      const statuses = [
        { key: 'draft', label: 'Brouillon' },
        { key: 'submitted', label: 'Soumise' },
        { key: 'under_review', label: 'En révision' },
        { key: 'correction_requested', label: 'Correction demandée' },
        { key: 'resubmitted', label: 'Réponse transmise' },
        { key: 'closed', label: 'Clôturée' },
      ];

      for (const item of statuses) {
        const { getByText } = render(
          <ThemeProvider>
            <AesStatusBadge status={item.key} domain="declaration" />
          </ThemeProvider>
        );
        expect(getByText(item.label)).toBeTruthy();
      }
    });

    it('renders all 4 OH coordination domain statuses correctly', () => {
      const ohStatuses = [
        { key: 'pending_acknowledgement', label: 'En attente de prise en charge' },
        { key: 'acknowledged', label: 'Pris en charge' },
        { key: 'completed', label: 'Suivi terminé' },
        { key: 'cancelled', label: 'Annulé' },
      ];

      for (const item of ohStatuses) {
        const { getByText } = render(
          <ThemeProvider>
            <AesStatusBadge status={item.key} domain="ohCoordination" />
          </ThemeProvider>
        );
        expect(getByText(item.label)).toBeTruthy();
      }
    });

    it('renders all 4 CAPA action statuses correctly', () => {
      const capaStatuses = [
        { key: 'proposed', label: 'Proposée' },
        { key: 'in_progress', label: 'En cours' },
        { key: 'completed', label: 'Clôturée' },
        { key: 'cancelled', label: 'Annulée' },
      ];

      for (const item of capaStatuses) {
        const { getByText } = render(
          <ThemeProvider>
            <AesStatusBadge status={item.key} domain="capa" />
          </ThemeProvider>
        );
        expect(getByText(item.label)).toBeTruthy();
      }
    });

    it('falls back gracefully on unknown status string with neutral styling', () => {
      const { getByText } = render(
        <ThemeProvider>
          <AesStatusBadge status="non_existent_status" domain="declaration" />
        </ThemeProvider>
      );
      expect(getByText('non_existent_status')).toBeTruthy();
    });

    it('enforces domain segregation: declaration status in OH domain falls back to unmapped', () => {
      // 'draft' is not an OH coordination status
      const { getByText, getByTestId } = render(
        <ThemeProvider>
          <AesStatusBadge status="draft" domain="ohCoordination" />
        </ThemeProvider>
      );
      // Renders 'draft' string, not the declaration label 'Brouillon'
      expect(getByText('draft')).toBeTruthy();
      const badge = getByTestId('aes-status-badge');
      // Style uses fallback colors #EEEEEE background, not declaration colors
      expect(badge.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#EEEEEE', borderColor: '#E0E0E0' }),
        ])
      );
    });

    it('renders meaningful accessibilityLabel containing status text, not color or icon', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <AesStatusBadge status="submitted" domain="declaration" />
        </ThemeProvider>
      );
      const textElement = getByTestId('aes-status-badge');
      expect(textElement.props.accessibilityLabel).toBe('Soumise');
    });

    it('handles unsupported statuses like overdue and validated as neutral fallbacks', () => {
      for (const unsupported of ['overdue', 'validated']) {
        const { getByText } = render(
          <ThemeProvider>
            <AesStatusBadge status={unsupported} domain="declaration" />
          </ThemeProvider>
        );
        expect(getByText(unsupported)).toBeTruthy();
      }
    });

    // ─── Phase 2E.1.4.3.2: Dynamic WCAG 2.1 AA Contrast Verification (>= 4.5:1) ─

    function sRGBtoLinear(component8Bit: number): number {
      const c = component8Bit / 255;
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }

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

    function getContrastRatio(hex1: string, hex2: string): number {
      const l1 = getRelativeLuminance(hex1);
      const l2 = getRelativeLuminance(hex2);
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      const ratio = (lighter + 0.05) / (darker + 0.05);
      return Math.round(ratio * 100) / 100;
    }

    it('dynamically verifies all 6 declaration status badges satisfy WCAG AA (>= 4.5:1) from rendered styles', () => {
      const declStatuses = [
        'draft',
        'submitted',
        'under_review',
        'correction_requested',
        'resubmitted',
        'closed',
      ];

      for (const status of declStatuses) {
        const testID = `badge-decl-${status}`;
        const { getByTestId } = render(
          <ThemeProvider>
            <AesStatusBadge status={status} domain="declaration" testID={testID} />
          </ThemeProvider>
        );

        const badgeContainer = getByTestId(testID);
        const textElement = getByTestId(`${testID}-text`);

        const badgeStyle = StyleSheet.flatten(badgeContainer.props.style);
        const textStyle = StyleSheet.flatten(textElement.props.style);

        const bg = badgeStyle.backgroundColor as string;
        const fg = textStyle.color as string;
        const ratio = getContrastRatio(fg, bg);

        expect(ratio).toBeGreaterThanOrEqual(4.5);
        // Verify normal-text typography: fontSize 11, fontWeight 600
        expect(textStyle.fontSize).toBe(11);
        expect(textStyle.fontWeight).toBe('600');
        // Verify accessibility
        expect(badgeContainer.props.accessibilityRole).toBe('text');
        expect(badgeContainer.props.accessibilityLabel).toBeTruthy();
      }
    });

    it('dynamically verifies all 4 OH coordination status badges satisfy WCAG AA (>= 4.5:1) from rendered styles', () => {
      const ohStatuses = [
        'pending_acknowledgement',
        'acknowledged',
        'completed',
        'cancelled',
      ];

      for (const status of ohStatuses) {
        const testID = `badge-oh-${status}`;
        const { getByTestId } = render(
          <ThemeProvider>
            <AesStatusBadge status={status} domain="ohCoordination" testID={testID} />
          </ThemeProvider>
        );

        const badgeContainer = getByTestId(testID);
        const textElement = getByTestId(`${testID}-text`);

        const badgeStyle = StyleSheet.flatten(badgeContainer.props.style);
        const textStyle = StyleSheet.flatten(textElement.props.style);

        const bg = badgeStyle.backgroundColor as string;
        const fg = textStyle.color as string;
        const ratio = getContrastRatio(fg, bg);

        expect(ratio).toBeGreaterThanOrEqual(4.5);
        expect(textStyle.fontSize).toBe(11);
        expect(textStyle.fontWeight).toBe('600');
        expect(badgeContainer.props.accessibilityRole).toBe('text');
        expect(badgeContainer.props.accessibilityLabel).toBeTruthy();
      }
    });

    it('dynamically verifies all 4 CAPA action status badges satisfy WCAG AA (>= 4.5:1) from rendered styles', () => {
      const capaStatuses = [
        'proposed',
        'in_progress',
        'completed',
        'cancelled',
      ];

      for (const status of capaStatuses) {
        const testID = `badge-capa-${status}`;
        const { getByTestId } = render(
          <ThemeProvider>
            <AesStatusBadge status={status} domain="capa" testID={testID} />
          </ThemeProvider>
        );

        const badgeContainer = getByTestId(testID);
        const textElement = getByTestId(`${testID}-text`);

        const badgeStyle = StyleSheet.flatten(badgeContainer.props.style);
        const textStyle = StyleSheet.flatten(textElement.props.style);

        const bg = badgeStyle.backgroundColor as string;
        const fg = textStyle.color as string;
        const ratio = getContrastRatio(fg, bg);

        expect(ratio).toBeGreaterThanOrEqual(4.5);
        expect(textStyle.fontSize).toBe(11);
        expect(textStyle.fontWeight).toBe('600');
        expect(badgeContainer.props.accessibilityRole).toBe('text');
        expect(badgeContainer.props.accessibilityLabel).toBeTruthy();
      }
    });

    it('dynamically verifies fallback badges (unknown status, domain mismatch) satisfy WCAG AA (>= 4.5:1)', () => {
      const fallbackCases = [
        { status: 'unsupported_state', domain: 'declaration' as const, id: 'fb-unknown-decl' },
        { status: 'overdue', domain: 'declaration' as const, id: 'fb-overdue-decl' },
        { status: 'draft', domain: 'ohCoordination' as const, id: 'fb-mismatch-oh' },
        { status: 'pending_acknowledgement', domain: 'declaration' as const, id: 'fb-mismatch-decl' },
      ];

      for (const item of fallbackCases) {
        const { getByTestId } = render(
          <ThemeProvider>
            <AesStatusBadge status={item.status} domain={item.domain} testID={item.id} />
          </ThemeProvider>
        );

        const badgeContainer = getByTestId(item.id);
        const textElement = getByTestId(`${item.id}-text`);

        const badgeStyle = StyleSheet.flatten(badgeContainer.props.style);
        const textStyle = StyleSheet.flatten(textElement.props.style);

        const bg = badgeStyle.backgroundColor as string;
        const fg = textStyle.color as string;
        const ratio = getContrastRatio(fg, bg);

        expect(ratio).toBeGreaterThanOrEqual(4.5);
        expect(bg.toUpperCase()).toBe('#EEEEEE');
        expect(fg.toUpperCase()).toBe('#616161');
        expect(textStyle.fontSize).toBe(11);
        expect(textStyle.fontWeight).toBe('600');
      }
    });

    it('demonstrates that legacy problematic color pairs fail the 4.5:1 threshold using the exact WCAG formula', () => {
      // Legacy unhardened color pairs that were previously reported incorrectly:
      const failingPairs = [
        { label: 'legacy under_review (#E65100 on #FFF3E0)', fg: '#E65100', bg: '#FFF3E0', expectedRatio: 3.46 },
        { label: 'legacy correction_requested (#D84315 on #FBE9E7)', fg: '#D84315', bg: '#FBE9E7', expectedRatio: 3.78 },
        { label: 'legacy OH acknowledged (#F57F17 on #FFF8E1)', fg: '#F57F17', bg: '#FFF8E1', expectedRatio: 2.49 },
        { label: 'legacy cancelled (#757575 on #FAFAFA)', fg: '#757575', bg: '#FAFAFA', expectedRatio: 4.41 },
      ];

      for (const pair of failingPairs) {
        const ratio = getContrastRatio(pair.fg, pair.bg);
        expect(ratio).toBe(pair.expectedRatio);
        expect(ratio).toBeLessThan(4.5);
      }
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // 2. DeclarationListScreen Acceptance Tests
  // ═════════════════════════════════════════════════════════════════════════════
  describe('2. DeclarationListScreen Acceptance Audit', () => {
    let d1: number;
    let d2: number;
    let d3: number;
    let d4: number;
    let d5: number;
    let d6: number;

    beforeEach(async () => {
      const db = getDatabase();

      // User 1 declarations:
      // 1. draft
      d1 = await db.createDraft({
        declared_by_user_id: 1,
        incident_date: '2026-03-01',
        incident_type: 'percutaneous_exposure',
        circumstances: 'Sharp needlestick in ICU',
      });
      // 2. submitted
      d2 = await db.createDraft({
        declared_by_user_id: 1,
        incident_date: '2026-03-02',
        incident_type: 'mucocutaneous_exposure',
        circumstances: 'Blood splash in ER',
      });
      await db.submitDeclaration(d2);

      // 3. under_review (submitted -> under_review via review)
      d3 = await db.createDraft({
        declared_by_user_id: 1,
        incident_date: '2026-03-03',
        incident_type: 'other',
        circumstances: 'Splash under review',
      });
      await db.submitDeclaration(d3);
      await db.createAdministrativeReview({
        declaration_id: d3,
        reviewer_user_id: 2,
        outcome: 'acknowledged',
      });

      // 4. resubmitted (submitted -> correction_requested -> resubmitted)
      d4 = await db.createDraft({
        declared_by_user_id: 1,
        incident_date: '2026-03-04',
        incident_type: 'percutaneous_exposure',
        circumstances: 'Resubmitted case',
      });
      await db.submitDeclaration(d4);
      const rev = await db.createAdministrativeReview({
        declaration_id: d4,
        reviewer_user_id: 2,
        outcome: 'correction_requested',
        correction_reason: 'Please clarify PPE',
      });
      await db.createCorrectionResponse({
        declaration_id: d4,
        review_id: rev.reviewId,
        user_id: 1,
        response_text: 'Double gloves were used',
      });

      // 5. User 4 submitted declaration (another declarant)
      d5 = await db.createDraft({
        declared_by_user_id: 4,
        incident_date: '2026-03-05',
        incident_type: 'other',
        circumstances: 'Foreign declarant exposure',
      });
      await db.submitDeclaration(d5);
    });

    it('exposed_professional lists strictly own declarations and never foreign declarants', async () => {
      useDemoRoleStore.getState().setRole('exposed_professional');

      const { findByText, queryByText } = render(
        <ThemeProvider>
          <DeclarationListScreen />
        </ThemeProvider>
      );

      expect(await findByText('Sharp needlestick in ICU')).toBeTruthy();
      expect(await findByText('Blood splash in ER')).toBeTruthy();
      expect(await findByText('Splash under review')).toBeTruthy();
      expect(await findByText('Resubmitted case')).toBeTruthy();

      // Foreign record from User 4 is strictly absent
      expect(queryByText('Foreign declarant exposure')).toBeNull();

      // Header is "Mes déclarations"
      expect(await findByText('Mes déclarations')).toBeTruthy();

      // "+ Nouvelle déclaration" button is present
      expect(await findByText('+ Nouvelle déclaration')).toBeTruthy();
    });

    it('admin_reviewer sees facility-wide declarations and has review queue shortcut', async () => {
      useDemoRoleStore.getState().setRole('admin_reviewer');

      const { findByText, getByTestId, queryByText } = render(
        <ThemeProvider>
          <DeclarationListScreen />
        </ThemeProvider>
      );

      // Admin sees records from both User 1 and User 4
      expect(await findByText('Blood splash in ER')).toBeTruthy();
      expect(await findByText('Foreign declarant exposure')).toBeTruthy();

      // Header is "Toutes les déclarations"
      expect(await findByText('Toutes les déclarations')).toBeTruthy();

      // Review queue shortcut button is present and navigates to adminReviewQueue
      const queueBtn = getByTestId('admin-queue-shortcut');
      expect(queueBtn).toBeTruthy();
      fireEvent.press(queueBtn);
      expect(mockNavigate).toHaveBeenCalledWith('adminReviewQueue');

      // Admin does NOT see "+ Nouvelle déclaration" button
      expect(queryByText('+ Nouvelle déclaration')).toBeNull();
    });

    it('blocks oh_professional, quality_staff, and tech_admin from declaration list without DB query', async () => {
      const db = getDatabase();
      const getDeclarationsSpy = jest.spyOn(db, 'getDeclarations');

      const blockedRoles = ['oh_professional', 'quality_staff', 'tech_admin'] as const;

      for (const role of blockedRoles) {
        getDeclarationsSpy.mockClear();
        useDemoRoleStore.getState().setRole(role);

        const { getByText, queryByTestId } = render(
          <ThemeProvider>
            <DeclarationListScreen />
          </ThemeProvider>
        );

        expect(getByText('Accès restreint')).toBeTruthy();
        expect(getByText('Votre rôle ne vous autorise pas à accéder à la liste des déclarations.')).toBeTruthy();
        expect(queryByTestId('declaration-list')).toBeNull();

        // Database method was not even called
        expect(getDeclarationsSpy).not.toHaveBeenCalled();
      }

      getDeclarationsSpy.mockRestore();
    });

    it('filter chip "En révision" correctly includes both under_review and resubmitted declarations', async () => {
      useDemoRoleStore.getState().setRole('exposed_professional');

      const { getByTestId, findByText, queryByText } = render(
        <ThemeProvider>
          <DeclarationListScreen />
        </ThemeProvider>
      );

      expect(await findByText('Mes déclarations')).toBeTruthy();

      // Press 'En révision' chip
      fireEvent.press(getByTestId('filter-chip-under_review'));

      // Both under_review and resubmitted are visible
      expect(await findByText('Splash under review')).toBeTruthy();
      expect(await findByText('Resubmitted case')).toBeTruthy();

      // Draft and purely submitted are excluded
      expect(queryByText('Sharp needlestick in ICU')).toBeNull();
      expect(queryByText('Blood splash in ER')).toBeNull();
    });

    it('renders empty state when filter matches zero declarations', async () => {
      useDemoRoleStore.getState().setRole('exposed_professional');

      const { getByTestId, findByText } = render(
        <ThemeProvider>
          <DeclarationListScreen />
        </ThemeProvider>
      );

      expect(await findByText('Mes déclarations')).toBeTruthy();

      // Press 'closed' chip (we have 0 closed declarations for User 1)
      fireEvent.press(getByTestId('filter-chip-closed'));
      expect(await findByText('Aucune déclaration')).toBeTruthy();
    });

    it('renders repository error state when database query fails', async () => {
      useDemoRoleStore.getState().setRole('exposed_professional');
      const db = getDatabase();
      jest.spyOn(db, 'getDeclarations').mockRejectedValueOnce(new Error('Simulated database failure'));

      const { findByText } = render(
        <ThemeProvider>
          <DeclarationListScreen />
        </ThemeProvider>
      );

      expect(await findByText('Simulated database failure')).toBeTruthy();
    });

    it('clears and reloads declarations when active user/role changes while mounted', async () => {
      useDemoRoleStore.getState().setRole('exposed_professional');

      const { findByText, queryByText } = render(
        <ThemeProvider>
          <DeclarationListScreen />
        </ThemeProvider>
      );

      expect(await findByText('Sharp needlestick in ICU')).toBeTruthy();

      // Change role to admin_reviewer while mounted
      act(() => {
        useDemoRoleStore.getState().setRole('admin_reviewer');
      });

      // Now foreign declarant is visible
      expect(await findByText('Foreign declarant exposure')).toBeTruthy();
      expect(await findByText('Toutes les déclarations')).toBeTruthy();

      // Change role to oh_professional -> instantly restricted
      act(() => {
        useDemoRoleStore.getState().setRole('oh_professional');
      });

      expect(await findByText('Accès restreint')).toBeTruthy();
      expect(queryByText('Foreign declarant exposure')).toBeNull();
    });

    it('navigates to declarationDetails with declarationId on card press', async () => {
      useDemoRoleStore.getState().setRole('exposed_professional');

      const { findByTestId } = render(
        <ThemeProvider>
          <DeclarationListScreen />
        </ThemeProvider>
      );

      const card = await findByTestId(`declaration-card-${d1}`);
      expect(card).toBeTruthy();
      fireEvent.press(card);
      expect(mockNavigate).toHaveBeenCalledWith('declarationDetails', {
        declarationId: d1,
      });
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // 3. DeclarationDetailsScreen Acceptance Tests
  // ═════════════════════════════════════════════════════════════════════════════
  describe('3. DeclarationDetailsScreen Acceptance Audit', () => {
    let declId1: number;
    let declIdDraft: number;
    let declIdCorrection: number;
    let declIdForeign: number;

    beforeEach(async () => {
      const db = getDatabase();

      // 1. Submitted declaration with OH coordination
      declId1 = await db.createDraft({
        declared_by_user_id: 1,
        incident_date: '2026-03-01',
        incident_type: 'percutaneous_exposure',
        department_code: 'SURG-01',
        circumstances: 'Needlestick during suture',
        exposure_description: 'Deep puncture through glove',
        protective_measures_taken: 'Immediate washing with soap and water',
        notes: 'Source patient known',
      });
      await db.submitDeclaration(declId1);
      const coordId = await db.createOhCoordination({
        declaration_id: declId1,
        created_by_user_id: 2,
        coordination_reason: 'routine_followup',
      });
      await db.acknowledgeOhCoordination(coordId, 3);

      // 2. Draft declaration
      declIdDraft = await db.createDraft({
        declared_by_user_id: 1,
        incident_date: '2026-03-02',
        incident_type: 'mucocutaneous_exposure',
      });

      // 3. Correction requested declaration
      declIdCorrection = await db.createDraft({
        declared_by_user_id: 1,
        incident_date: '2026-03-03',
        incident_type: 'other',
      });
      await db.submitDeclaration(declIdCorrection);
      await db.createAdministrativeReview({
        declaration_id: declIdCorrection,
        reviewer_user_id: 2,
        outcome: 'correction_requested',
        correction_reason: 'Please specify room number',
      });

      // 4. Foreign declaration (User 4)
      declIdForeign = await db.createDraft({
        declared_by_user_id: 4,
        incident_date: '2026-03-05',
        incident_type: 'other',
        circumstances: 'Foreign incident details',
      });
      await db.submitDeclaration(declIdForeign);

      mockRouteParams = { declarationId: declId1 };
    });

    it('renders exactly 5 tabs and confirms strict absence of 6th Timeline tab', async () => {
      useDemoRoleStore.getState().setRole('exposed_professional');
      mockRouteParams = { declarationId: declId1 };

      const { findByTestId, queryByTestId, getByText } = render(
        <ThemeProvider>
          <DeclarationDetailsScreen />
        </ThemeProvider>
      );

      // Exactly 5 tabs exist
      expect(await findByTestId('tab-summary')).toBeTruthy();
      expect(await findByTestId('tab-incident')).toBeTruthy();
      expect(await findByTestId('tab-measures')).toBeTruthy();
      expect(await findByTestId('tab-status')).toBeTruthy();
      expect(await findByTestId('tab-followup')).toBeTruthy();

      // Confirms strict absence of Timeline / Chronologie tab
      expect(queryByTestId('tab-timeline')).toBeNull();
      expect(queryByTestId('tab-chronology')).toBeNull();
      expect(queryByTestId('tab-history')).toBeNull();

      expect(getByText('Résumé')).toBeTruthy();
    });

    it('shows safe "Déclaration introuvable." for missing or unauthorized declarations without leaking data', async () => {
      useDemoRoleStore.getState().setRole('exposed_professional');

      // 1. Non-existent ID
      mockRouteParams = { declarationId: 999999 };
      const { findAllByText: findAll1 } = render(
        <ThemeProvider>
          <DeclarationDetailsScreen />
        </ThemeProvider>
      );
      expect((await findAll1('Déclaration introuvable.')).length).toBeGreaterThanOrEqual(1);

      // 2. Foreign declarant record (User 4's declaration)
      mockRouteParams = { declarationId: declIdForeign };
      const { findAllByText: findAll2, queryByText } = render(
        <ThemeProvider>
          <DeclarationDetailsScreen />
        </ThemeProvider>
      );
      expect((await findAll2('Déclaration introuvable.')).length).toBeGreaterThanOrEqual(1);
      expect(queryByText('Foreign incident details')).toBeNull();
    });

    it('renders "Accès non autorisé" for blocked roles (oh_professional, quality_staff, tech_admin)', async () => {
      const blockedRoles = ['oh_professional', 'quality_staff', 'tech_admin'] as const;

      for (const role of blockedRoles) {
        useDemoRoleStore.getState().setRole(role);
        mockRouteParams = { declarationId: declId1 };

        const { getAllByText, queryByTestId } = render(
          <ThemeProvider>
            <DeclarationDetailsScreen />
          </ThemeProvider>
        );

        expect(getAllByText('Accès non autorisé').length).toBeGreaterThanOrEqual(1);
        expect(queryByTestId('details-tab-bar')).toBeNull();
      }
    });

    it('switches between all tabs and displays correct corresponding data', async () => {
      useDemoRoleStore.getState().setRole('exposed_professional');
      mockRouteParams = { declarationId: declId1 };

      const { findByTestId, getByTestId, findByText, findAllByText } = render(
        <ThemeProvider>
          <DeclarationDetailsScreen />
        </ThemeProvider>
      );

      expect(await findByTestId('tab-summary')).toBeTruthy();

      // Incident Tab
      fireEvent.press(getByTestId('tab-incident'));
      expect(await findByText('Needlestick during suture')).toBeTruthy();
      expect(await findByText('Deep puncture through glove')).toBeTruthy();
      expect(await findByText('SURG-01')).toBeTruthy();

      // Measures Tab
      fireEvent.press(getByTestId('tab-measures'));
      expect(await findByText('Immediate washing with soap and water')).toBeTruthy();
      expect(await findByText('Source patient known')).toBeTruthy();

      // Status Tab
      fireEvent.press(getByTestId('tab-status'));
      const statusLabels = await findAllByText('Statut');
      expect(statusLabels.length).toBeGreaterThanOrEqual(1);

      // Follow-up Tab
      fireEvent.press(getByTestId('tab-followup'));
      expect(await findByText('Statut du suivi')).toBeTruthy();
    });

    it('follow-up tab enforces strict data minimization for exposed_professional (no staff IDs, no reason)', async () => {
      useDemoRoleStore.getState().setRole('exposed_professional');
      mockRouteParams = { declarationId: declId1 };

      const { findByTestId, getByTestId, queryByText, findByText } = render(
        <ThemeProvider>
          <DeclarationDetailsScreen />
        </ThemeProvider>
      );

      await findByTestId('tab-followup');
      fireEvent.press(getByTestId('tab-followup'));

      expect(await findByText('Statut du suivi')).toBeTruthy();
      expect(await findByText('Initié le')).toBeTruthy();

      // Strictly hidden from exposed professional:
      expect(queryByText('Motif de coordination')).toBeNull();
      expect(queryByText('routine_followup')).toBeNull();
      expect(queryByText('Résumé de coordination (administratif)')).toBeNull();
      expect(queryByText('acknowledged_by_user_id')).toBeNull();
    });

    it('follow-up tab renders AdminOhCoordinationSummary for admin_reviewer (shows reason and dates, shields staff IDs)', async () => {
      useDemoRoleStore.getState().setRole('admin_reviewer');
      mockRouteParams = { declarationId: declId1 };

      const { findByTestId, getByTestId, findByText, queryByText } = render(
        <ThemeProvider>
          <DeclarationDetailsScreen />
        </ThemeProvider>
      );

      await findByTestId('tab-followup');
      fireEvent.press(getByTestId('tab-followup'));

      expect(await findByText('Résumé de coordination (administratif)')).toBeTruthy();
      expect(await findByText('Motif de coordination')).toBeTruthy();
      expect(await findByText('Pris en charge le')).toBeTruthy();

      // Personnel IDs are not rendered
      expect(queryByText('acknowledged_by_user_id')).toBeNull();
      expect(queryByText('completed_by_user_id')).toBeNull();
    });

    it('renders empty follow-up notice when declaration has no OH coordination', async () => {
      useDemoRoleStore.getState().setRole('exposed_professional');
      mockRouteParams = { declarationId: declIdDraft }; // Draft has no OH coordination

      const { findByTestId, getByTestId, findByText } = render(
        <ThemeProvider>
          <DeclarationDetailsScreen />
        </ThemeProvider>
      );

      await findByTestId('tab-followup');
      fireEvent.press(getByTestId('tab-followup'));

      expect(await findByText('Aucun suivi de santé au travail enregistré.')).toBeTruthy();
    });

    it('displays draft edit button for exposed_professional and navigates to newDeclaration', async () => {
      useDemoRoleStore.getState().setRole('exposed_professional');
      mockRouteParams = { declarationId: declIdDraft };

      const { findByTestId } = render(
        <ThemeProvider>
          <DeclarationDetailsScreen />
        </ThemeProvider>
      );

      const editBtn = await findByTestId('edit-draft-button');
      expect(editBtn).toBeTruthy();
      fireEvent.press(editBtn);
      expect(mockNavigate).toHaveBeenCalledWith('newDeclaration', {
        declarationId: declIdDraft,
      });
    });

    it('displays correction banner and navigates to correctionResponse for exposed_professional', async () => {
      useDemoRoleStore.getState().setRole('exposed_professional');
      mockRouteParams = { declarationId: declIdCorrection };

      const { findByTestId, findByText } = render(
        <ThemeProvider>
          <DeclarationDetailsScreen />
        </ThemeProvider>
      );

      expect(await findByText('Demande de correction reçue')).toBeTruthy();
      expect(await findByText('Please specify room number')).toBeTruthy();

      const respondBtn = await findByTestId('respond-correction-button');
      expect(respondBtn).toBeTruthy();
      fireEvent.press(respondBtn);
      expect(mockNavigate).toHaveBeenCalledWith('correctionResponse', {
        declarationId: declIdCorrection,
        reviewId: expect.any(Number),
      });
    });

    it('displays admin review action and create coordination buttons only for admin_reviewer', async () => {
      // 1. As exposed_professional -> absent
      useDemoRoleStore.getState().setRole('exposed_professional');
      mockRouteParams = { declarationId: declId1 };

      const { findByTestId, getByTestId, queryByTestId, unmount } = render(
        <ThemeProvider>
          <DeclarationDetailsScreen />
        </ThemeProvider>
      );

      await findByTestId('tab-status');
      fireEvent.press(getByTestId('tab-status'));
      expect(queryByTestId('admin-review-action-button')).toBeNull();
      expect(queryByTestId('create-coordination-button')).toBeNull();

      unmount();

      // 2. As admin_reviewer -> present and navigate correctly
      useDemoRoleStore.getState().setRole('admin_reviewer');
      const adminRender = render(
        <ThemeProvider>
          <DeclarationDetailsScreen />
        </ThemeProvider>
      );

      await adminRender.findByTestId('tab-status');
      fireEvent.press(adminRender.getByTestId('tab-status'));

      const reviewBtn = adminRender.getByTestId('admin-review-action-button');
      const coordBtn = adminRender.getByTestId('create-coordination-button');
      expect(reviewBtn).toBeTruthy();
      expect(coordBtn).toBeTruthy();

      fireEvent.press(reviewBtn);
      expect(mockNavigate).toHaveBeenCalledWith('adminReviewAction', {
        declarationId: declId1,
      });

      fireEvent.press(coordBtn);
      expect(mockNavigate).toHaveBeenCalledWith('createCoordination', {
        declarationId: declId1,
      });
    });

    it('clears previous declaration and reloads when switching role or user while open', async () => {
      useDemoRoleStore.getState().setRole('exposed_professional');
      mockRouteParams = { declarationId: declId1 };

      const { findByTestId, getByTestId, findByText, findAllByText } = render(
        <ThemeProvider>
          <DeclarationDetailsScreen />
        </ThemeProvider>
      );

      expect(await findByTestId('tab-summary')).toBeTruthy();
      fireEvent.press(getByTestId('tab-incident'));
      expect(await findByText('Needlestick during suture')).toBeDefined();

      // Switch role to blocked tech_admin
      act(() => {
        useDemoRoleStore.getState().setRole('tech_admin');
      });

      expect((await findAllByText('Accès non autorisé')).length).toBeGreaterThanOrEqual(1);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // 4. Localization Dictionary Completeness Tests
  // ═════════════════════════════════════════════════════════════════════════════
  describe('4. Localization Integrity Audit', () => {
    const requiredBatch4Keys = [
      'list.filter.all',
      'list.filter.draft',
      'list.filter.submitted',
      'list.filter.under_review',
      'list.filter.closed',
      'list.adminQueueShortcut',
      'list.restrictedTitle',
      'list.restrictedMessage',
      'list.incidentType',
      'list.title.admin',
      'details.tab.summary',
      'details.tab.incident',
      'details.tab.measures',
      'details.tab.status',
      'details.tab.followup',
      'details.followup.noCoordination',
      'details.followup.coordinationStatus',
      'details.followup.coordinationDate',
      'details.followup.updatedAt',
      'details.followup.adminSummary',
      'details.followup.reason',
      'details.followup.acknowledgedAt',
      'details.followup.completedAt',
      'details.restrictedAccess',
      'details.notFound',
      'details.reviewHistory',
      'details.reviewAction',
      'details.createCoordination',
      'details.respondToCorrection',
      'details.correctionPending',
    ] as const;

    const locales = ['fr', 'en', 'ar'] as const;

    it('every Batch 4 key exists and is non-empty across FR, EN, and AR', () => {
      for (const loc of locales) {
        for (const key of requiredBatch4Keys) {
          const val = translations[loc]?.[key];
          expect(val).toBeDefined();
          expect(typeof val).toBe('string');
          expect(val.trim().length).toBeGreaterThan(0);
          // Value must not equal raw key
          expect(val).not.toBe(key);
        }
      }
    });

    it('t() function returns correct localized string for all supported locales', () => {
      for (const loc of locales) {
        setLocale(loc);
        for (const key of requiredBatch4Keys) {
          const result = t(key);
          expect(result).toBe(translations[loc][key]);
          expect(result).not.toBe(key);
        }
      }
    });
  });
});
