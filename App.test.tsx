import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import App from './App';

jest.mock('./src/core', () => ({
  initializeDatabase: jest.fn(() => new Promise(() => {})),
  logAuditEvent: jest.fn(),
  SYNTHETIC_DEMO_CONTEXT: { userId: 1 },
}));

jest.mock('./src/features/aes-guardian', () => {
  const ReactRuntime = require('react');
  const { View } = require('react-native');
  const StubScreen = () => ReactRuntime.createElement(View);
  const { SplashScreen } = jest.requireActual(
    './src/features/aes-guardian/screens/SplashScreen',
  );
  const exports: Record<string, unknown> = { SplashScreen, __esModule: true };

  [
    'AccessScreen',
    'AdminReviewActionScreen',
    'AdminReviewQueueScreen',
    'AesGuardianProfileScreen',
    'AesGuardianWorkspaceScreen',
    'CorrectionResponseScreen',
    'CreateCoordinationScreen',
    'DeclarationCoordinationStatusScreen',
    'DeclarationDetailsScreen',
    'DeclarationFormScreen',
    'DeclarationListScreen',
    'DemoAccountPickerScreen',
    'HelpGlossaryScreen',
    'LanguageSelectionScreen',
    'NotificationCentreScreen',
    'OhCoordinationDetailScreen',
    'OhCoordinationQueueScreen',
    'OhFollowUpEventScreen',
    'PreventionActionCreateScreen',
    'PreventionActionDetailScreen',
    'PreventionActionRegisterScreen',
    'PreventionOverviewScreen',
    'PrototypeDisclaimerScreen',
    'SubmissionConfirmationScreen',
    'SurveillanceDashboardScreen',
  ].forEach((name) => {
    exports[name] = StubScreen;
  });

  return exports;
});

describe('Application startup entry', () => {
  it('renders the canonical SANAD welcome while SQLite initializes', async () => {
    const { getByText, getByRole, getByTestId } = render(<App />);

    await waitFor(() => {
      expect(getByTestId('aes-splash-screen')).toBeTruthy();
    });
    expect(getByText('SANAD')).toBeTruthy();
    expect(getByText('Déclarer. Suivre. Prévenir.')).toBeTruthy();
    expect(getByRole('button').props.accessibilityState.disabled).toBe(true);
    expect(getByTestId('welcome-db-loading')).toBeTruthy();
  });
});
