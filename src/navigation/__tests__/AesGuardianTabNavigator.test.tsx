import React from 'react';
import { fireEvent, render, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../../theme/ThemeContext';
import {
  AesGuardianRole,
  SYNTHETIC_ADMIN_REVIEWER_CONTEXT,
  SYNTHETIC_DEMO_CONTEXT,
  SYNTHETIC_OH_PROFESSIONAL_CONTEXT,
  SYNTHETIC_QUALITY_STAFF_CONTEXT,
  SYNTHETIC_TECH_ADMIN_CONTEXT,
  useDemoRoleStore,
} from '../../core';
import { setLocale, t } from '../../localization';
import {
  AdminReviewQueueScreen,
  DeclarationListScreen,
  OhCoordinationQueueScreen,
  PreventionOverviewScreen,
  PreventionActionRegisterScreen,
  SurveillanceDashboardScreen,
} from '../../features/aes-guardian';
import {
  AesGuardianTabNavigator,
  getPrimaryDestinations,
} from '../AesGuardianTabNavigator';

function renderTabs() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      }}
    >
      <ThemeProvider>
        <NavigationContainer>
          <AesGuardianTabNavigator />
        </NavigationContainer>
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

jest.mock('../../features/aes-guardian', () => {
  const ReactRuntime = require('react');
  const { View } = require('react-native');
  const screen = (testID: string) => () =>
    ReactRuntime.createElement(View, { testID });
  return {
    AdminReviewQueueScreen: screen('screen-admin-review'),
    AesGuardianProfileScreen: screen('screen-profile'),
    AesGuardianWorkspaceScreen: screen('screen-home'),
    DeclarationFormScreen: screen('screen-declare'),
    DeclarationListScreen: screen('screen-declarations'),
    OhCoordinationQueueScreen: screen('screen-oh-queue'),
    PreventionActionRegisterScreen: screen('screen-prevention-register'),
    PreventionOverviewScreen: screen('screen-prevention-overview'),
    SurveillanceDashboardScreen: screen('screen-surveillance'),
  };
});

jest.mock('react-native-reanimated', () => {
  const ReactRuntime = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View },
    useAnimatedStyle: (factory: () => object) => factory(),
    useReducedMotion: () => false,
    useSharedValue: (value: number) => {
      const state = ReactRuntime.useRef({ value });
      return state.current;
    },
    withSpring: (value: number) => value,
  };
});

describe('AesGuardianTabNavigator', () => {
  beforeEach(() => {
    setLocale('fr');
    useDemoRoleStore.getState().setRole('exposed_professional');
  });

  const keysFor = (context: Parameters<typeof getPrimaryDestinations>[0]) =>
    getPrimaryDestinations(context).map((destination) => destination.key);

  it('maps each role to only permitted existing workflows', () => {
    expect(keysFor(SYNTHETIC_DEMO_CONTEXT))
      .toEqual(['home', 'declare', 'followup', 'profile']);
    expect(keysFor(SYNTHETIC_ADMIN_REVIEWER_CONTEXT))
      .toEqual(['home', 'followup', 'prevention', 'profile']);
    expect(keysFor(SYNTHETIC_OH_PROFESSIONAL_CONTEXT))
      .toEqual(['home', 'followup', 'prevention', 'profile']);
    expect(keysFor(SYNTHETIC_QUALITY_STAFF_CONTEXT))
      .toEqual(['home', 'followup', 'prevention', 'profile']);
    expect(keysFor(SYNTHETIC_TECH_ADMIN_CONTEXT))
      .toEqual(['home', 'profile']);

    expect(getPrimaryDestinations(SYNTHETIC_ADMIN_REVIEWER_CONTEXT)[1].component)
      .toBe(AdminReviewQueueScreen);
    expect(getPrimaryDestinations(SYNTHETIC_OH_PROFESSIONAL_CONTEXT)[1].labelKey)
      .toBe('navigation.tab.followup');
    expect(getPrimaryDestinations(SYNTHETIC_OH_PROFESSIONAL_CONTEXT)[1].component)
      .toBe(OhCoordinationQueueScreen);
    expect(getPrimaryDestinations(SYNTHETIC_OH_PROFESSIONAL_CONTEXT)[2].component)
      .toBe(PreventionActionRegisterScreen);
    expect(getPrimaryDestinations(SYNTHETIC_DEMO_CONTEXT)[2].component)
      .toBe(DeclarationListScreen);
    expect(getPrimaryDestinations(SYNTHETIC_QUALITY_STAFF_CONTEXT)[1].component)
      .toBe(SurveillanceDashboardScreen);
    expect(getPrimaryDestinations(SYNTHETIC_QUALITY_STAFF_CONTEXT)[2].component)
      .toBe(PreventionOverviewScreen);
  });

  it('provides localized labels for all three supported languages', () => {
    const destinations = getPrimaryDestinations(SYNTHETIC_DEMO_CONTEXT);
    const keys = destinations.map((destination) => destination.labelKey);

    setLocale('fr');
    expect(keys.map((key) => t(key))).toEqual(['Accueil', 'Déclarer', 'Suivi', 'Profil']);
    setLocale('en');
    expect(keys.map((key) => t(key))).toEqual(['Home', 'Report', 'Follow-up', 'Profile']);
    setLocale('ar');
    expect(keys.map((key) => t(key))).toEqual([
      'الرئيسية',
      'الإبلاغ',
      'المتابعة',
      'الملف الشخصي',
    ]);
  });

  it('navigates to real tab destinations and resets safely when a role removes a tab', () => {
    const screen = renderTabs();

    expect(screen.getByTestId('screen-home')).toBeTruthy();
    fireEvent.press(screen.getByTestId('liquid-nav-item-declare'));
    expect(screen.getByTestId('screen-declare')).toBeTruthy();

    act(() => useDemoRoleStore.getState().setRole('quality_staff'));
    expect(screen.getByTestId('screen-home')).toBeTruthy();
    expect(screen.queryByTestId('liquid-nav-item-declare')).toBeNull();
    expect(screen.getByTestId('liquid-nav-item-prevention')).toBeTruthy();
  });

  it.each([
    ['exposed_professional', 'declare', 'screen-declare'],
    ['exposed_professional', 'followup', 'screen-declarations'],
    ['exposed_professional', 'profile', 'screen-profile'],
    ['admin_reviewer', 'followup', 'screen-admin-review'],
    ['admin_reviewer', 'prevention', 'screen-prevention-register'],
    ['admin_reviewer', 'profile', 'screen-profile'],
    ['oh_professional', 'followup', 'screen-oh-queue'],
    ['oh_professional', 'prevention', 'screen-prevention-register'],
    ['oh_professional', 'profile', 'screen-profile'],
    ['quality_staff', 'followup', 'screen-surveillance'],
    ['quality_staff', 'prevention', 'screen-prevention-overview'],
    ['quality_staff', 'profile', 'screen-profile'],
    ['tech_admin', 'profile', 'screen-profile'],
  ] as const)(
    'renders the authorized %s destination %s',
    (role, destination, screenTestId) => {
      act(() => useDemoRoleStore.getState().setRole(role as AesGuardianRole));
      const screen = renderTabs();

      fireEvent.press(screen.getByTestId(`liquid-nav-item-${destination}`));
      expect(screen.getByTestId(screenTestId)).toBeTruthy();
    },
  );

  it('retains the active role restrictions after locale changes', () => {
    act(() => useDemoRoleStore.getState().setRole('tech_admin'));
    setLocale('ar');
    const screen = renderTabs();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((tab) => tab.props.accessibilityLabel))
      .toEqual(['الملف الشخصي', 'الرئيسية']);
  });
});
