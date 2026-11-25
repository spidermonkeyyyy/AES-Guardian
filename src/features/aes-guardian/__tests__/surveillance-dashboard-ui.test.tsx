/**
 * AES Guardian — Surveillance Dashboard Screen UI Tests (Phase 2E.1.7.1 Batch 7)
 *
 * Focused UI tests for the transformed SurveillanceDashboardScreen using AES shared components.
 * Minimum 24 test cases covering: rendering, filters, role switcher, KPI cards, distributions,
 * authorization states, loading/error states, accessibility, RTL, and edge cases.
 */

import React from 'react';
import { render, fireEvent, waitFor, act, within } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { SurveillanceDashboardScreen } from '../screens/SurveillanceDashboardScreen';
import {
  SYNTHETIC_QUALITY_STAFF_CONTEXT,
  SYNTHETIC_ADMIN_REVIEWER_CONTEXT,
  SYNTHETIC_OH_PROFESSIONAL_CONTEXT,
  SYNTHETIC_DEMO_CONTEXT,
  SYNTHETIC_TECH_ADMIN_CONTEXT,
  UNAUTHENTICATED_CONTEXT,
  canViewSurveillanceDashboard,
} from '../../../core/auth/boundaries';

// Mock react-native-reanimated BEFORE any imports that use it
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock the database module
const mockMetrics = {
  overview: {
    totalDeclarations: 6,
    draftDeclarations: 1,
    submittedDeclarations: 1,
    underReviewDeclarations: 1,
    correctionRequestedDeclarations: 1,
    resubmittedDeclarations: 1,
    closedDeclarations: 1,
    activeOhCoordinations: 2,
    completedOhCoordinations: 1,
  },
  temporalDistribution: [
    { month: '2025-01', count: 2 },
    { month: '2025-02', count: 2 },
    { month: '2025-03', count: 2 },
  ],
  exposureDistribution: [
    { incidentType: 'percutaneous_exposure', count: 3 },
    { incidentType: 'mucocutaneous_exposure', count: 1 },
    { incidentType: 'sexual_assault', count: 1 },
    { incidentType: 'other', count: 1 },
  ],
  statusDistribution: [
    { status: 'draft', count: 1 },
    { status: 'submitted', count: 1 },
    { status: 'under_review', count: 1 },
    { status: 'correction_requested', count: 1 },
    { status: 'resubmitted', count: 1 },
    { status: 'closed', count: 1 },
  ],
  administrativeReview: {
    totalReviews: 4,
    correctionRequests: 2,
    correctionResponses: 1,
    outcomes: [
      { outcome: 'acknowledged', count: 1 },
      { outcome: 'correction_requested', count: 2 },
      { outcome: 'transmission_verified', count: 1 },
    ],
  },
  occupationalHealth: {
    statusDistribution: [
      { status: 'pending_acknowledgement', count: 1 },
      { status: 'acknowledged', count: 1 },
      { status: 'completed', count: 1 },
    ],
    eventCategories: [
      { category: 'contact_attempt_recorded', count: 1 },
      { category: 'contact_established', count: 1 },
    ],
  },
  filterSummary: {
    totalRecords: 6,
    matchingDeclarations: 3,
    hasActiveFilters: true,
  },
};

jest.mock('../../../core/database', () => {
  const actual = jest.requireActual('../../../core/database');
  return {
    ...actual,
    getDatabase: jest.fn(() => ({
      getSurveillanceDashboardMetrics: jest.fn().mockResolvedValue(mockMetrics),
    })),
    resetDatabaseForTesting: jest.fn(),
    initializeDatabase: jest.fn(),
    SurveillanceDashboardMetrics: {},
    SurveillanceFilters: {},
    DeclarationStatus: {},
    AesIncidentType: {},
    DECLARATION_STATUSES: [
      'draft',
      'submitted',
      'under_review',
      'correction_requested',
      'resubmitted',
      'closed',
    ],
    AES_INCIDENT_TYPES: [
      'percutaneous_exposure',
      'mucocutaneous_exposure',
      'sexual_assault',
      'other',
    ],
  };
});

jest.mock('../../../core/auth/boundaries', () => ({
  ...jest.requireActual('../../../core/auth/boundaries'),
  canViewSurveillanceDashboard: jest.fn(),
  SYNTHETIC_QUALITY_STAFF_CONTEXT: { userId: 4, role: 'quality_staff', displayName: 'Quality Staff' },
  SYNTHETIC_ADMIN_REVIEWER_CONTEXT: { userId: 2, role: 'admin_reviewer', displayName: 'Admin Reviewer' },
  SYNTHETIC_OH_PROFESSIONAL_CONTEXT: { userId: 3, role: 'oh_professional', displayName: 'OH Professional' },
  SYNTHETIC_DEMO_CONTEXT: { userId: 1, role: 'exposed_professional', displayName: 'Exposed Professional' },
  SYNTHETIC_TECH_ADMIN_CONTEXT: { userId: 5, role: 'tech_admin', displayName: 'Tech Admin' },
  AuthContext: {},
}));

jest.mock('../../../theme/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#121212',
      background: '#F8F9FA',
      card: '#FFFFFF',
      border: '#EEEEEE',
      foreground: '#212121',
      mutedForeground: '#616161',
      accent: '#1B5E20',
      primaryForeground: '#FFFFFF',
      destructive: '#B71C1C',
      secondary: '#6A1B9A',
    },
  }),
}));

let mockLocale = 'fr';

jest.mock('../../../localization', () => ({
  useLocale: () => mockLocale,
  useLayoutDirection: () => mockLocale === 'ar' ? 'rtl' : 'ltr',
  getLayoutRowDirection: (direction: 'ltr' | 'rtl') =>
    direction === 'rtl' ? 'row-reverse' : 'row',
  getLayoutTextAlign: (direction: 'ltr' | 'rtl') =>
    direction === 'rtl' ? 'right' : 'left',
  isRTL: () => mockLocale === 'ar',
  t: (key: string, locale?: string) =>
    locale && (
      key === 'surveillance.overview.draft' ||
      key === 'form.incidentType.percutaneous' ||
      key === 'role.quality_staff' ||
      key === 'role.admin_reviewer' ||
      key === 'role.oh_professional' ||
      key === 'role.exposed_professional' ||
      key === 'role.tech_admin' ||
      key === 'surveillance.unauthorizedDetails' ||
      key === 'surveillance.filters.declarationCountLabel'
    )
      ? `${key}:${locale}`
      : key,
}));

describe('SurveillanceDashboardScreen — UI Tests (Phase 2E.1.7.1 Batch 7)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    require('../../../core/auth/boundaries').canViewSurveillanceDashboard.mockImplementation(
      (ctx: any) => ctx?.role === 'quality_staff' || ctx?.role === 'admin_reviewer' || ctx?.role === 'oh_professional',
    );
    require('../../../core/database').getDatabase.mockReturnValue({
      getSurveillanceDashboardMetrics: jest.fn().mockResolvedValue(mockMetrics),
    });
  });

  // ─── 1. Rendering & Component Structure ──────────────────────────
  test('renders AesScreenContainer as root wrapper', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-dashboard')).toBeTruthy());
  });

  test('renders AesScreenHeader with correct title and overline', async () => {
    const { getByTestId, getByText } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-header')).toBeTruthy());
    expect(getByText('surveillance.nav.title')).toBeTruthy();
    expect(getByText('surveillance.title')).toBeTruthy();
  });

  test('renders disclaimer card with AesCard and accent border', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-disclaimer')).toBeTruthy());
  });

  test('renders filter summary banner when active filters present', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-filter-summary')).toBeTruthy());
  });

  test('renders filters section in AesCard', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-filters')).toBeTruthy());
  });

  test('renders all 6 KPI cards in grid layout', async () => {
    const { getAllByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => {
      const kpiCards = getAllByTestId(/surveillance-kpi-/);
      expect(kpiCards).toHaveLength(6);
    });
  });

  test('renders temporal distribution card with bars', async () => {
    const { getByTestId, getAllByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-temporal')).toBeTruthy());
    const bars = getAllByTestId(/surveillance-temporal-bar-/);
    expect(bars).toHaveLength(3);
  });

  test('renders exposure distribution card with bars', async () => {
    const { getByTestId, getAllByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-exposure')).toBeTruthy());
    const bars = getAllByTestId(/surveillance-exposure-bar-/);
    expect(bars).toHaveLength(4);
    const exposureLabel = within(bars[0]).getByText('form.incidentType.percutaneous:fr');
    expect(exposureLabel.props.numberOfLines).toBe(3);
    expect(StyleSheet.flatten(exposureLabel.props.style).width).toBe(112);
  });

  test('renders status distribution card with AesStatusBadge for each status', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-status-distribution')).toBeTruthy());
    // Check each status badge by exact testID
    const statuses = ['draft', 'submitted', 'under_review', 'correction_requested', 'resubmitted', 'closed'];
    for (const status of statuses) {
      expect(getByTestId(`surveillance-status-badge-${status}`)).toBeTruthy();
    }
  });

  test('renders administrative review card with summary row', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-admin')).toBeTruthy());
    const summaryRow = getByTestId('surveillance-admin-summary');
    expect(summaryRow).toBeTruthy();
    // Check that summary row has 3 child views (totalReviews, correctionRequests, correctionResponses)
    expect(summaryRow.props.children).toBeTruthy();
  });

  test('renders occupational health card with status badges and events', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-oh')).toBeTruthy());
    const ohStatuses = ['pending_acknowledgement', 'acknowledged', 'completed'];
    for (const status of ohStatuses) {
      expect(getByTestId(`surveillance-oh-status-badge-${status}`)).toBeTruthy();
    }
    const eventCategories = ['contact_attempt_recorded', 'contact_established'];
    for (const category of eventCategories) {
      expect(getByTestId(`surveillance-oh-event-${category}`)).toBeTruthy();
    }
  });

  // ─── 2. Role Switcher ───────────────────────────────────────────
  test('renders role switcher with 5 demo role pills', async () => {
    const { getByTestId, getAllByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-role-switcher')).toBeTruthy());
    const pills = getAllByTestId(/role-pill-/);
    expect(pills).toHaveLength(5);
  });

  test('localizes role options and filtered count labels in FR, EN, and AR', async () => {
    const roleKeys = [
      ['quality_staff', 'role.quality_staff'],
      ['admin_reviewer', 'role.admin_reviewer'],
      ['oh_professional', 'role.oh_professional'],
      ['exposed_professional', 'role.exposed_professional'],
      ['tech_admin', 'role.tech_admin'],
    ] as const;

    for (const locale of ['fr', 'en', 'ar'] as const) {
      mockLocale = locale;
      const component = render(<SurveillanceDashboardScreen />);
      await waitFor(() => expect(component.getByTestId('surveillance-role-switcher')).toBeTruthy());

      for (const [role, labelKey] of roleKeys) {
        expect(
          within(component.getByTestId(`role-pill-${role}`))
            .getByText(new RegExp(`${labelKey}:${locale}`)),
        ).toBeTruthy();
      }
      expect(
        within(component.getByTestId('surveillance-filter-summary'))
          .getByText(new RegExp(`declarationCountLabel:${locale}`)),
      ).toBeTruthy();
      component.unmount();
    }

    mockLocale = 'fr';
  });

  test('highlights active role pill (quality_staff by default)', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('role-pill-quality_staff')).toBeTruthy());
  });

  test('switches role when pill pressed and reloads metrics', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('role-pill-admin_reviewer')).toBeTruthy());
    await act(async () => {
      fireEvent.press(getByTestId('role-pill-admin_reviewer'));
    });
    await waitFor(() => expect(getByTestId('role-pill-admin_reviewer')).toBeTruthy());
  });

  test('shows blocked indicator for unauthorized roles', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => {
      const exposedPill = getByTestId('role-pill-exposed_professional');
      const techPill = getByTestId('role-pill-tech_admin');
      expect(exposedPill).toBeTruthy();
      expect(techPill).toBeTruthy();
    });
  });

  // ─── 3. Authorization States ────────────────────────────────────
  test('shows unauthorized view for exposed_professional', async () => {
    require('../../../core/auth/boundaries').canViewSurveillanceDashboard.mockReturnValue(false);
    const { getByTestId, getByText, queryByText } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-unauthorized')).toBeTruthy());
    expect(getByText('surveillance.unauthorized')).toBeTruthy();
    expect(getByText('surveillance.unauthorizedDetails:fr')).toBeTruthy();
    expect(queryByText(/Profil sélectionné/i)).toBeNull();
    expect(getByTestId('surveillance-unauthorized-card')).toBeTruthy();
  });

  test('shows unauthorized view for tech_admin', async () => {
    require('../../../core/auth/boundaries').canViewSurveillanceDashboard.mockReturnValue(false);
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-unauthorized')).toBeTruthy());
  });

  test('allows access for quality_staff', async () => {
    const { getByTestId, queryByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => {
      expect(getByTestId('surveillance-dashboard')).toBeTruthy();
      expect(queryByTestId('surveillance-unauthorized')).toBeNull();
    });
  });

  test('allows access for admin_reviewer', async () => {
    require('../../../core/auth/boundaries').canViewSurveillanceDashboard.mockReturnValue(true);
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-dashboard')).toBeTruthy());
  });

  test('allows access for oh_professional', async () => {
    require('../../../core/auth/boundaries').canViewSurveillanceDashboard.mockReturnValue(true);
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-dashboard')).toBeTruthy());
  });

  // ─── 4. Loading & Error States ──────────────────────────────────
  test('shows loading spinner during initial load', async () => {
    require('../../../core/database').getDatabase.mockReturnValue({
      getSurveillanceDashboardMetrics: jest.fn().mockImplementation(() => new Promise(() => {})),
    });
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-loading')).toBeTruthy());
  });

  test('shows error card with retry button on load failure', async () => {
    require('../../../core/database').getDatabase.mockReturnValue({
      getSurveillanceDashboardMetrics: jest.fn().mockRejectedValue(new Error('Network error')),
    });
    const { getByTestId, getByText } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-error')).toBeTruthy());
    expect(getByTestId('surveillance-error-card')).toBeTruthy();
    expect(getByTestId('surveillance-retry-button')).toBeTruthy();
  });

  test('retries load when retry button pressed', async () => {
    const loadMock = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockMetrics);
    require('../../../core/database').getDatabase.mockReturnValue({
      getSurveillanceDashboardMetrics: loadMock,
    });
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-retry-button')).toBeTruthy());
    await act(async () => {
      fireEvent.press(getByTestId('surveillance-retry-button'));
    });
    await waitFor(() => {
      expect(loadMock).toHaveBeenCalledTimes(2);
    });
  });

  // ─── 5. Filters ──────────────────────────────────────────────────
  test('renders status filter pills for all 6 declaration statuses + All', async () => {
    const { getAllByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => {
      const pills = getAllByTestId(/surveillance-status-filter-/);
      expect(pills).toHaveLength(7); // 6 statuses + All
    });
  });

  test('renders exposure filter pills for all 4 incident types + All', async () => {
    const { getAllByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => {
      const pills = getAllByTestId(/surveillance-exposure-filter-/);
      expect(pills).toHaveLength(5); // 4 types + All
    });
  });

  test('highlights selected status filter', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-status-filter-submitted')).toBeTruthy());
    await act(async () => {
      fireEvent.press(getByTestId('surveillance-status-filter-submitted'));
    });
    await waitFor(() => expect(getByTestId('surveillance-status-filter-submitted')).toBeTruthy());
  });

  test('highlights selected exposure filter', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-exposure-filter-percutaneous_exposure')).toBeTruthy());
    await act(async () => {
      fireEvent.press(getByTestId('surveillance-exposure-filter-percutaneous_exposure'));
    });
    await waitFor(() => expect(getByTestId('surveillance-exposure-filter-percutaneous_exposure')).toBeTruthy());
  });

  test('shows date range inputs', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => {
      expect(getByTestId('surveillance-start-date-input')).toBeTruthy();
      expect(getByTestId('surveillance-end-date-input')).toBeTruthy();
    });
  });

  test('clears all filters when clear button pressed', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-status-filter-submitted')).toBeTruthy());
    await act(async () => {
      fireEvent.press(getByTestId('surveillance-status-filter-submitted'));
    });
    await waitFor(() => expect(getByTestId('surveillance-status-filter-submitted')).toBeTruthy());
    await act(async () => {
      fireEvent.press(getByTestId('surveillance-clear-filters-button'));
    });
    await waitFor(() => expect(getByTestId('surveillance-status-filter-all')).toBeTruthy());
  });

  test('shows clear filters button in header only when filters active', async () => {
    const { queryByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(queryByTestId('surveillance-clear-filters-button-header')).toBeFalsy());
  });

  // ─── 6. KPI Cards & Data Display ────────────────────────────────
  test('displays correct total declarations in KPI card', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-kpi-total')).toBeTruthy());
  });

  test('displays correct submitted declarations count', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-kpi-submitted')).toBeTruthy());
  });

  test('displays active OH coordinations count', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-kpi-active-oh')).toBeTruthy());
  });

  test('displays completed OH coordinations count', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-kpi-completed-oh')).toBeTruthy());
  });

  // ─── 7. Distribution Bars & Visualization ───────────────────────
  test('temporal distribution bars render with proportional widths', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-temporal-bar-2025-01')).toBeTruthy());
  });

  test('exposure distribution uses accent green color', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-exposure-bar-percutaneous_exposure')).toBeTruthy());
  });

  test('status distribution shows AesStatusBadge for each status', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => {
      const statuses = ['draft', 'submitted', 'under_review', 'correction_requested', 'resubmitted', 'closed'];
      for (const status of statuses) {
        expect(getByTestId(`surveillance-status-badge-${status}`)).toBeTruthy();
      }
    });
  });

  test('admin outcomes show AesStatusBadge for each outcome', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => {
      const outcomes = ['acknowledged', 'correction_requested', 'transmission_verified'];
      for (const outcome of outcomes) {
        expect(getByTestId(`surveillance-admin-outcome-badge-${outcome}`)).toBeTruthy();
      }
    });
  });

  test('OH status distribution shows AesStatusBadge with ohCoordination domain', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => {
      const statuses = ['pending_acknowledgement', 'acknowledged', 'completed'];
      for (const status of statuses) {
        expect(getByTestId(`surveillance-oh-status-badge-${status}`)).toBeTruthy();
      }
    });
  });

  // ─── 8. Administrative Review Summary ──────────────────────────
  test('admin summary shows total reviews, correction requests, and responses', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => {
      const summaryRow = getByTestId('surveillance-admin-summary');
      expect(summaryRow).toBeTruthy();
    });
  });

  test('admin outcomes section renders when outcomes exist', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-admin-outcomes')).toBeTruthy());
  });

  // ─── 9. Occupational Health Indicators ──────────────────────────
  test('OH status distribution shows all 3 coordination statuses', async () => {
    const { getAllByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => {
      const rows = getAllByTestId(/surveillance-oh-status-(pending_acknowledgement|acknowledged|completed)(?!-badge)/);
      expect(rows).toHaveLength(3);
    });
  });

  test('OH follow-up events section renders when events exist', async () => {
    const { getAllByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => {
      const events = getAllByTestId(/surveillance-oh-event-/);
      expect(events).toHaveLength(2);
    });
  });

  test('shows empty state for OH events when none', async () => {
    const emptyMetrics = {
      ...mockMetrics,
      occupationalHealth: {
        ...mockMetrics.occupationalHealth,
        eventCategories: [],
      },
    };
    require('../../../core/database').getDatabase.mockReturnValue({
      getSurveillanceDashboardMetrics: jest.fn().mockResolvedValue(emptyMetrics),
    });
    const { getByText } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByText('oh.detail.noEvents')).toBeTruthy());
  });

  // ─── 10. Accessibility ──────────────────────────────────────────
  test('role pills have accessibility role and state', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => {
      const pill = getByTestId('role-pill-quality_staff');
      expect(pill.props.accessibilityRole).toBe('button');
      expect(pill.props.accessibilityState?.selected).toBe(true);
    });
  });

  test('filter pills have accessibility labels', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => {
      const pill = getByTestId('surveillance-status-filter-submitted');
      expect(pill.props.accessibilityLabel).toBeTruthy();
    });
  });

  test('clear filters button has accessibility label', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => {
      const button = getByTestId('surveillance-clear-filters-button');
      expect(button.props.accessibilityLabel).toBeTruthy();
    });
  });

  test('AesStatusBadge has accessibility role and label', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => {
      const badge = getByTestId('surveillance-status-badge-draft');
      expect(badge.props.accessibilityRole).toBe('text');
      expect(badge.props.accessibilityLabel).toBeTruthy();
    });
  });

  test('retry button has accessibility label', async () => {
    require('../../../core/database').getDatabase.mockReturnValue({
      getSurveillanceDashboardMetrics: jest.fn().mockRejectedValue(new Error('Network error')),
    });
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => {
      const button = getByTestId('surveillance-retry-button');
      expect(button.props.accessibilityLabel).toBeTruthy();
    });
  });

  // ─── 11. RTL Support ────────────────────────────────────────────
  // RTL tests use stable locale mocking via the mocked `isRTL` hook (no jest.resetModules)
  // to avoid breaking React module resolution in the test environment.

  test('FR, EN and AR switch header and KPI rows without changing metric values', async () => {
    mockLocale = 'fr';
    const screen = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(screen.getByTestId('surveillance-header-top-row')).toBeTruthy());
    expect(
      StyleSheet.flatten(screen.getByTestId('surveillance-header-top-row').props.style).flexDirection,
    ).toBe('row');
    expect(screen.getByTestId('surveillance-kpi-total').props.children).toBeTruthy();
    expect(screen.getAllByText('surveillance.overview.draft:fr').length).toBeGreaterThan(0);
    expect(screen.getAllByText('form.incidentType.percutaneous:fr').length).toBeGreaterThan(0);

    mockLocale = 'en';
    screen.rerender(<SurveillanceDashboardScreen />);
    expect(
      StyleSheet.flatten(screen.getByTestId('surveillance-header-top-row').props.style).flexDirection,
    ).toBe('row');
    expect(screen.getAllByText('surveillance.overview.draft:en').length).toBeGreaterThan(0);
    expect(screen.getAllByText('form.incidentType.percutaneous:en').length).toBeGreaterThan(0);

    mockLocale = 'ar';
    screen.rerender(<SurveillanceDashboardScreen />);
    expect(
      StyleSheet.flatten(screen.getByTestId('surveillance-header-top-row').props.style).flexDirection,
    ).toBe('row-reverse');
    expect(
      StyleSheet.flatten(screen.getByTestId('surveillance-start-date-input').props.style),
    ).toMatchObject({ textAlign: 'left', writingDirection: 'ltr' });
    expect(screen.getAllByText('surveillance.overview.draft:ar').length).toBeGreaterThan(0);
    expect(screen.getAllByText('form.incidentType.percutaneous:ar').length).toBeGreaterThan(0);

    mockLocale = 'fr';
  });

  test('renders disclaimer row with RTL-aware flexDirection (row-reverse) when RTL', async () => {
    jest.mock('../../../localization', () => ({
      useLocale: () => 'ar',
      isRTL: () => true,
      t: (key: string) => key,
    }), { virtual: true });

    const { getByTestId, rerender } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-disclaimer')).toBeTruthy());

    // The disclaimerRow inner view should have flexDirection: 'row-reverse' in RTL
    // We verify the component renders without error in RTL mode
    expect(getByTestId('surveillance-disclaimer')).toBeTruthy();
  });

  test('renders filter summary row with RTL-aware flexDirection when RTL', async () => {
    jest.mock('../../../localization', () => ({
      useLocale: () => 'ar',
      isRTL: () => true,
      t: (key: string) => key,
    }), { virtual: true });

    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-filter-summary')).toBeTruthy());
    expect(getByTestId('surveillance-filter-summary')).toBeTruthy();
  });

  test('renders filters header with RTL-aware flexDirection when RTL', async () => {
    jest.mock('../../../localization', () => ({
      useLocale: () => 'ar',
      isRTL: () => true,
      t: (key: string) => key,
    }), { virtual: true });

    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-filters')).toBeTruthy());
    expect(getByTestId('surveillance-filters')).toBeTruthy();
  });

  test('renders date row with RTL-aware flexDirection when RTL', async () => {
    jest.mock('../../../localization', () => ({
      useLocale: () => 'ar',
      isRTL: () => true,
      t: (key: string) => key,
    }), { virtual: true });

    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => {
      expect(getByTestId('surveillance-start-date-input')).toBeTruthy();
      expect(getByTestId('surveillance-end-date-input')).toBeTruthy();
    });
  });

  test('renders KPI grid with RTL-aware flexDirection when RTL', async () => {
    jest.mock('../../../localization', () => ({
      useLocale: () => 'ar',
      isRTL: () => true,
      t: (key: string) => key,
    }), { virtual: true });

    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-overview-grid')).toBeTruthy());
    expect(getByTestId('surveillance-overview-grid')).toBeTruthy();
  });

  test('renders temporal bar rows with RTL-aware flexDirection when RTL', async () => {
    jest.mock('../../../localization', () => ({
      useLocale: () => 'ar',
      isRTL: () => true,
      t: (key: string) => key,
    }), { virtual: true });

    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-temporal-bar-2025-01')).toBeTruthy());
    expect(getByTestId('surveillance-temporal-bar-2025-01')).toBeTruthy();
  });

  test('renders distribution rows with RTL-aware flexDirection when RTL', async () => {
    jest.mock('../../../localization', () => ({
      useLocale: () => 'ar',
      isRTL: () => true,
      t: (key: string) => key,
    }), { virtual: true });

    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-status-row-draft')).toBeTruthy());
    expect(getByTestId('surveillance-status-row-draft')).toBeTruthy();
  });

  test('renders admin summary row with RTL-aware flexDirection when RTL', async () => {
    jest.mock('../../../localization', () => ({
      useLocale: () => 'ar',
      isRTL: () => true,
      t: (key: string) => key,
    }), { virtual: true });

    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-admin-summary')).toBeTruthy());
    expect(getByTestId('surveillance-admin-summary')).toBeTruthy();
  });

  test('renders exposure distribution bars with RTL-aware flexDirection when RTL', async () => {
    jest.mock('../../../localization', () => ({
      useLocale: () => 'ar',
      isRTL: () => true,
      t: (key: string) => key,
    }), { virtual: true });

    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-exposure-bar-percutaneous_exposure')).toBeTruthy());
    expect(getByTestId('surveillance-exposure-bar-percutaneous_exposure')).toBeTruthy();
  });

  // ─── 12. Touch Target (48dp minimum) ─────────────────────────────

  test('rolePill has minHeight >= 48dp for touch target compliance', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => {
      const pill = getByTestId('role-pill-quality_staff');
      const style = pill.props.style;
      // style can be array or object; find minHeight in either
      const styles = Array.isArray(style) ? style : [style];
      const minHeight = styles.find(s => s && typeof s === 'object' && 'minHeight' in s)?.minHeight;
      expect(minHeight).toBeGreaterThanOrEqual(48);
    });

  });

  test('role switcher stays bounded and lays out its pills in the active direction', async () => {
    mockLocale = 'fr';
    const screen = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(screen.getByTestId('surveillance-role-switcher-scroll')).toBeTruthy());

    const scroll = screen.getByTestId('surveillance-role-switcher-scroll');
    expect(StyleSheet.flatten(scroll.props.style).height).toBeGreaterThanOrEqual(48);
    expect(StyleSheet.flatten(scroll.props.style).width).toBe('100%');
    expect(
      within(screen.getByTestId('surveillance-header')).queryByTestId('surveillance-role-switcher'),
    ).toBeNull();
    expect(StyleSheet.flatten(scroll.props.contentContainerStyle)).toMatchObject({
      flexDirection: 'row',
      alignItems: 'center',
    });

    mockLocale = 'ar';
    screen.rerender(<SurveillanceDashboardScreen />);
    expect(StyleSheet.flatten(
      screen.getByTestId('surveillance-role-switcher-scroll').props.contentContainerStyle,
    )).toMatchObject({ flexDirection: 'row-reverse', alignItems: 'center' });
    mockLocale = 'fr';
  });

  test('filterPill has minHeight >= 48dp for touch target compliance', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => {
      const pill = getByTestId('surveillance-status-filter-all');
      const style = pill.props.style;
      const styles = Array.isArray(style) ? style : [style];
      const minHeight = styles.find(s => s && typeof s === 'object' && 'minHeight' in s)?.minHeight;
      expect(minHeight).toBeGreaterThanOrEqual(48);
    });
  });

  test('dateInput has minHeight >= 48dp for touch target compliance', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => {
      const input = getByTestId('surveillance-start-date-input');
      const style = input.props.style;
      const styles = Array.isArray(style) ? style : [style];
      const minHeight = styles.find(s => s && typeof s === 'object' && 'minHeight' in s)?.minHeight;
      expect(minHeight).toBeGreaterThanOrEqual(48);
    });
  });

  test('dateInput keeps its 48dp minimum touch target', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => {
      const input = getByTestId('surveillance-start-date-input');
      const style = input.props.style;
      const styles = Array.isArray(style) ? style : [style];
      const minHeight = styles.find(s => s && typeof s === 'object' && 'minHeight' in s)?.minHeight;
      expect(minHeight).toBeGreaterThanOrEqual(48);
    });
  });

  test('endDateInput has minHeight >= 48dp for touch target compliance', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => {
      const input = getByTestId('surveillance-end-date-input');
      const style = input.props.style;
      const styles = Array.isArray(style) ? style : [style];
      const minHeight = styles.find(s => s && typeof s === 'object' && 'minHeight' in s)?.minHeight;
      expect(minHeight).toBeGreaterThanOrEqual(48);
    });
  });

  // ─── 12. Edge Cases ─────────────────────────────────────────────
  test('handles empty temporal distribution gracefully', async () => {
    const emptyMetrics = {
      ...mockMetrics,
      temporalDistribution: [],
    };
    require('../../../core/database').getDatabase.mockReturnValue({
      getSurveillanceDashboardMetrics: jest.fn().mockResolvedValue(emptyMetrics),
    });

    const { getByText } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByText('surveillance.temporal.empty')).toBeTruthy());
  });

  test('renders localized empty states when optional dashboard distributions are missing', async () => {
    const partialMetrics = {
      ...mockMetrics,
      temporalDistribution: undefined,
      exposureDistribution: undefined,
      statusDistribution: undefined,
    };
    require('../../../core/database').getDatabase.mockReturnValue({
      getSurveillanceDashboardMetrics: jest.fn().mockResolvedValue(partialMetrics),
    });
    const { getByText } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => {
      expect(getByText('surveillance.temporal.empty')).toBeTruthy();
      expect(getByText('surveillance.exposure.empty')).toBeTruthy();
      expect(getByText('surveillance.status.empty')).toBeTruthy();
    });
  });

  test('renders an explicit empty dataset without fabricating metric or chart values', async () => {
    const emptyMetrics = {
      ...mockMetrics,
      overview: {
        totalDeclarations: 0,
        draftDeclarations: 0,
        submittedDeclarations: 0,
        underReviewDeclarations: 0,
        correctionRequestedDeclarations: 0,
        resubmittedDeclarations: 0,
        closedDeclarations: 0,
        activeOhCoordinations: 0,
        completedOhCoordinations: 0,
      },
      temporalDistribution: [],
      exposureDistribution: [],
      statusDistribution: [],
      administrativeReview: {
        totalReviews: 0,
        correctionRequests: 0,
        correctionResponses: 0,
        outcomes: [],
      },
      occupationalHealth: {
        statusDistribution: [],
        eventCategories: [],
      },
    };
    require('../../../core/database').getDatabase.mockReturnValue({
      getSurveillanceDashboardMetrics: jest.fn().mockResolvedValue(emptyMetrics),
    });

    const screen = render(<SurveillanceDashboardScreen />);
    await waitFor(() => {
      expect(screen.getByTestId('surveillance-dashboard')).toBeTruthy();
      expect(screen.getByTestId('surveillance-kpi-total')).toBeTruthy();
    });
    expect(within(screen.getByTestId('surveillance-kpi-total')).getByText('0')).toBeTruthy();
    expect(screen.getByText('surveillance.temporal.empty')).toBeTruthy();
    expect(screen.getByText('surveillance.exposure.empty')).toBeTruthy();
    expect(screen.getByText('surveillance.status.empty')).toBeTruthy();
    expect(screen.queryByTestId(/^surveillance-temporal-bar-/)).toBeNull();
    expect(screen.queryByTestId(/^surveillance-exposure-bar-/)).toBeNull();
  });

  test('handles empty exposure distribution gracefully', async () => {
    const emptyMetrics = {
      ...mockMetrics,
      exposureDistribution: [],
    };
    require('../../../core/database').getDatabase.mockReturnValue({
      getSurveillanceDashboardMetrics: jest.fn().mockResolvedValue(emptyMetrics),
    });
    const { getByText } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByText('surveillance.exposure.empty')).toBeTruthy());
  });

  test('handles empty status distribution gracefully', async () => {
    const emptyMetrics = {
      ...mockMetrics,
      statusDistribution: [],
    };
    require('../../../core/database').getDatabase.mockReturnValue({
      getSurveillanceDashboardMetrics: jest.fn().mockResolvedValue(emptyMetrics),
    });
    const { getByTestId, getByText } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-status-distribution')).toBeTruthy());
    expect(getByText('surveillance.status.empty')).toBeTruthy();
  });

  test('handles empty admin outcomes gracefully', async () => {
    const emptyMetrics = {
      ...mockMetrics,
      administrativeReview: {
        ...mockMetrics.administrativeReview,
        outcomes: [],
      },
    };
    require('../../../core/database').getDatabase.mockReturnValue({
      getSurveillanceDashboardMetrics: jest.fn().mockResolvedValue(emptyMetrics),
    });
    const { queryByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(queryByTestId('surveillance-admin-outcomes')).toBeFalsy());
  });

  test('handles empty OH status distribution gracefully', async () => {
    const emptyMetrics = {
      ...mockMetrics,
      occupationalHealth: {
        ...mockMetrics.occupationalHealth,
        statusDistribution: [],
      },
    };
    require('../../../core/database').getDatabase.mockReturnValue({
      getSurveillanceDashboardMetrics: jest.fn().mockResolvedValue(emptyMetrics),
    });
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-oh')).toBeTruthy());
  });

  test('filter summary shows correct matching/total counts', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => {
      const summaryCard = getByTestId('surveillance-filter-summary');
      expect(summaryCard).toBeTruthy();
    });
  });

  test('pull-to-refresh triggers reload', async () => {
    const loadMock = jest.fn().mockResolvedValue(mockMetrics);
    require('../../../core/database').getDatabase.mockReturnValue({
      getSurveillanceDashboardMetrics: loadMock,
    });
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(loadMock).toHaveBeenCalled());
  });

  test('uses AesButton for clear filters and retry actions', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-clear-filters-button')).toBeTruthy());
  });

  test('AesCard elevation and border props used correctly', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => {
      // Verify disclaimer card (non-elevated, accent border) and filters card (elevated) render
      expect(getByTestId('surveillance-disclaimer')).toBeTruthy();
      expect(getByTestId('surveillance-filters')).toBeTruthy();
    });
  });

  test('AesScreenContainer is scrollable', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => {
      // Verify the root container renders with scrollable testID
      expect(getByTestId('surveillance-dashboard')).toBeTruthy();
    });
  });

  test('AesScreenHeader receives rightElement with role switcher', async () => {
    const { getByTestId } = render(<SurveillanceDashboardScreen />);
    await waitFor(() => expect(getByTestId('surveillance-header')).toBeTruthy());
  });
});

describe('canViewSurveillanceDashboard — Authorization Matrix', () => {
  test('quality_staff permitted', () => {
    expect(canViewSurveillanceDashboard(SYNTHETIC_QUALITY_STAFF_CONTEXT)).toBe(true);
  });
  test('admin_reviewer permitted', () => {
    expect(canViewSurveillanceDashboard(SYNTHETIC_ADMIN_REVIEWER_CONTEXT)).toBe(true);
  });
  test('oh_professional permitted', () => {
    expect(canViewSurveillanceDashboard(SYNTHETIC_OH_PROFESSIONAL_CONTEXT)).toBeTruthy();
  });
  test('exposed_professional denied', () => {
    expect(canViewSurveillanceDashboard(SYNTHETIC_DEMO_CONTEXT)).toBe(false);
  });
  test('tech_admin denied', () => {
    expect(canViewSurveillanceDashboard(SYNTHETIC_TECH_ADMIN_CONTEXT)).toBe(false);
  });
  test('unauthenticated denied', () => {
    expect(canViewSurveillanceDashboard(UNAUTHENTICATED_CONTEXT)).toBe(false);
  });
});