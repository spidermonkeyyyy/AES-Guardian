import React from 'react';
import { DefaultTheme, DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import {
  AdminReviewActionScreen,
  AdminReviewQueueScreen,
  AesGuardianProfileScreen,
  AesGuardianWorkspaceScreen,
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
  WelcomeCarouselScreen,
} from '../features/aes-guardian';
import {
  DirectionalStackBackButton,
  DirectionalStackHeaderTitle,
  getDirectionalStackBackSide,
  getLocalizedStackTitle,
} from './DirectionalStackBackButton';
import { RootStackParamList } from './routes';
import { useLocale } from '../localization';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
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
          headerLeft: () => (
            <DirectionalStackBackButton side={getDirectionalStackBackSide(locale)} />
          ),
          headerRight: () => (
            <DirectionalStackBackButton side={getDirectionalStackBackSide(locale) === 'left' ? 'right' : 'left'} />
          ),
          headerTitleStyle: { color: colors.foreground },
          contentStyle: { backgroundColor: colors.background },
        })}
      >
        <Stack.Screen name="aesSplash" component={AesSplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="aesLanguageSelect" component={LanguageSelectionScreen} options={{ headerShown: false }} />
        <Stack.Screen name="aesWelcomeCarousel" component={WelcomeCarouselScreen} options={{ headerShown: false }} />
        <Stack.Screen name="aesDisclaimer" component={PrototypeDisclaimerScreen} options={{ headerShown: false }} />
        <Stack.Screen name="aesDemoPicker" component={DemoAccountPickerScreen} options={{ headerShown: false }} />
        <Stack.Screen name="aesGuardianWorkspace" component={AesGuardianWorkspaceScreen} />
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
