import React from 'react';
import { DefaultTheme, DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import {
  AdminReviewActionScreen,
  AdminReviewQueueScreen,
  AccessScreen,
  AesGuardianProfileScreen,
  CorrectionResponseScreen,
  CreateCoordinationScreen,
  DeclarationCoordinationStatusScreen,
  DeclarationDetailsScreen,
  DeclarationFormScreen,
  DeclarationListScreen,
  DemoAccountPickerScreen,
  HelpGlossaryScreen,
  LanguageSelectionScreen,
  NotificationCentreScreen,
  OhCoordinationDetailScreen,
  OhCoordinationQueueScreen,
  OhFollowUpEventScreen,
  PreventionActionCreateScreen,
  PreventionActionDetailScreen,
  PreventionActionRegisterScreen,
  PreventionOverviewScreen,
  PrototypeDisclaimerScreen,
  SplashScreen as AesSplashScreen,
  SubmissionConfirmationScreen,
  SurveillanceDashboardScreen,
} from '../features/aes-guardian';
import {
  DirectionalStackBackButton,
  DirectionalStackHeaderTitle,
  getDirectionalStackBackSide,
  getLocalizedStackTitle,
} from './DirectionalStackBackButton';
import { RootStackParamList } from './routes';
import { useLocale } from '../localization';
import { AesGuardianTabNavigator } from './AesGuardianTabNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

interface AppNavigatorProps {
  databaseReady?: boolean;
  databaseError?: string | null;
}

export default function AppNavigator({
  databaseReady = true,
  databaseError = null,
}: AppNavigatorProps) {
  const { colors, isDark } = useTheme();
  const locale = useLocale();
  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: colors.background,
      card: colors.card,
      text: colors.foreground,
      border: colors.border,
      primary: colors.primary,
      notification: colors.destructive,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName="aesSplash"
        screenOptions={({ route }) => ({
          headerShown: true,
          headerBackVisible: false,
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.foreground,
          headerTitle: ({ children }) => (
            <DirectionalStackHeaderTitle>
              {getLocalizedStackTitle(route.name, children ?? route.name, locale)}
            </DirectionalStackHeaderTitle>
          ),
          headerLeft: () => getDirectionalStackBackSide(locale) === 'left'
            ? <DirectionalStackBackButton side="left" />
            : null,
          headerRight: () => getDirectionalStackBackSide(locale) === 'right'
            ? <DirectionalStackBackButton side="right" />
            : null,
          headerTitleStyle: { color: colors.foreground },
          contentStyle: {
            backgroundColor: colors.background,
            direction: locale === 'ar' ? 'rtl' : 'ltr',
          },
        })}
      >
        <Stack.Screen name="aesSplash" options={{ headerShown: false }}>
          {() => (
            <AesSplashScreen
              databaseReady={databaseReady}
              databaseError={databaseError}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="aesAccess" component={AccessScreen} options={{ headerShown: false }} />
        <Stack.Screen name="aesLanguageSelect" component={LanguageSelectionScreen} options={{ headerShown: false }} />
        <Stack.Screen name="aesDisclaimer" component={PrototypeDisclaimerScreen} options={{ headerShown: false }} />
        <Stack.Screen name="aesDemoPicker" component={DemoAccountPickerScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="aesGuardianWorkspace"
          component={AesGuardianTabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="declarations" component={DeclarationListScreen} />
        <Stack.Screen name="newDeclaration" component={DeclarationFormScreen} />
        <Stack.Screen name="declarationDetails" component={DeclarationDetailsScreen} />
        <Stack.Screen name="submissionConfirmation" component={SubmissionConfirmationScreen} options={{ headerShown: false }} />
        <Stack.Screen name="adminReviewQueue" component={AdminReviewQueueScreen} />
        <Stack.Screen name="adminReviewAction" component={AdminReviewActionScreen} />
        <Stack.Screen name="correctionResponse" component={CorrectionResponseScreen} />
        <Stack.Screen name="ohCoordinationQueue" component={OhCoordinationQueueScreen} />
        <Stack.Screen name="ohCoordinationDetail" component={OhCoordinationDetailScreen} />
        <Stack.Screen name="createCoordination" component={CreateCoordinationScreen} />
        <Stack.Screen name="recordFollowUpEvent" component={OhFollowUpEventScreen} />
        <Stack.Screen name="declarationCoordinationStatus" component={DeclarationCoordinationStatusScreen} />
        <Stack.Screen name="surveillanceDashboard" component={SurveillanceDashboardScreen} />
        <Stack.Screen name="preventionOverview" component={PreventionOverviewScreen} />
        <Stack.Screen name="preventionRegister" component={PreventionActionRegisterScreen} />
        <Stack.Screen name="preventionCreate" component={PreventionActionCreateScreen} />
        <Stack.Screen name="preventionActionDetail" component={PreventionActionDetailScreen} />
        <Stack.Screen name="helpGlossary" component={HelpGlossaryScreen} />
        <Stack.Screen name="aesGuardianProfile" component={AesGuardianProfileScreen} />
        <Stack.Screen name="notificationCentre" component={NotificationCentreScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
