import AppText from '../components/AppText';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { spacing, typography, shapes } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../features/authentication/hooks/use-auth-store';
import { isNurseSideRole } from '../utils/navigation/redirect';

// Screens
import SplashScreen from '../features/authentication/screens/SplashScreen';
import AuthGateScreen from '../features/authentication/screens/AuthGateScreen';
import AccessScreen from '../features/authentication/screens/AccessScreen';
import LoginScreen from '../features/authentication/screens/LoginScreen';
import RegisterScreen from '../features/authentication/screens/RegisterScreen';
import ForgotPasswordScreen from '../features/authentication/screens/ForgotPasswordScreen';
import PatientHomeScreen from '../features/patient/screens/PatientHomeScreen';
import MonitoringIntroScreen from '../features/monitoring/screens/MonitoringIntroScreen';
import MonitoringQuestionScreen from '../features/monitoring/screens/MonitoringQuestionScreen';
import MonitoringReviewScreen from '../features/monitoring/screens/MonitoringReviewScreen';
import MonitoringResultScreen from '../features/monitoring/screens/MonitoringResultScreen';
import MonitoringHistoryScreen from '../features/monitoring/screens/MonitoringHistoryScreen';
import PatientMessagesScreen from '../features/communication/screens/PatientMessagesScreen';
import PatientProfileScreen from '../features/patient/screens/PatientProfileScreen';
import PatientTreatmentScreen from '../features/patient/screens/PatientTreatmentScreen';
import NurseDashboardScreen from '../features/nurse/screens/NurseDashboardScreen';
import NursePatientsScreen from '../features/nurse/screens/NursePatientsScreen';
import NurseAlertsScreen from '../features/nurse/screens/NurseAlertsScreen';
import NurseMessagesScreen from '../features/communication/screens/NurseMessagesScreen';
import NurseProfileScreen from '../features/nurse/screens/NurseProfileScreen';
import NursePatientProfileScreen from '../features/nurse/patients/screens/NursePatientProfileScreen';
import { RulesScreen } from '../features/nurse/rules/screens/RulesScreen';
import RuleDetailScreen from '../features/nurse/rules/screens/RuleDetailScreen';
import RuleBuilderScreen from '../features/nurse/rules/screens/RuleBuilderScreen';
import DesignSystemScreen from '../features/design_preview/screens/DesignSystemScreen';

// AES Guardian Screens
import {
  SplashScreen as AesSplashScreen,
  LanguageSelectionScreen,
  WelcomeCarouselScreen,
  PrototypeDisclaimerScreen,
  DemoAccountPickerScreen,
  AesGuardianWorkspaceScreen,
  DeclarationListScreen,
  DeclarationFormScreen,
  DeclarationDetailsScreen,
  SubmissionConfirmationScreen,
  AdminReviewQueueScreen,
  AdminReviewActionScreen,
  CorrectionResponseScreen,
  OhCoordinationQueueScreen,
  OhCoordinationDetailScreen,
  OhFollowUpEventScreen,
  CreateCoordinationScreen,
  DeclarationCoordinationStatusScreen,
  SurveillanceDashboardScreen,
  PreventionOverviewScreen,
  PreventionActionRegisterScreen,
  PreventionActionCreateScreen,
  PreventionActionDetailScreen,
  HelpGlossaryScreen,
  AesGuardianProfileScreen,
  NotificationCentreScreen,
} from '../features/aes-guardian';

import { AppIcon } from '../components/AppIcon';

import { RootStackParamList, PatientTabParamList, NurseTabParamList } from './routes';
import {
  DirectionalStackBackButton,
  DirectionalStackHeaderTitle,
  getDirectionalStackBackSide,
  getLocalizedStackTitle,
} from './DirectionalStackBackButton';
import { useLocale } from '../localization';

const Stack = createNativeStackNavigator<RootStackParamList>();
const PatientTabs = createBottomTabNavigator<PatientTabParamList>();
const NurseTabs = createBottomTabNavigator<NurseTabParamList>();
const NursePatientsStack = createNativeStackNavigator<{ patients: undefined; patientDetail: { patientId: string } }>();

function PatientTabsNavigator() {
  const { colors } = useTheme();

  return (
    <PatientTabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontFamily: typography.fontFamily.openSans,
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <PatientTabs.Screen
        name="patientHome"
        component={PatientHomeScreen}
        options={{
          title: 'Accueil',
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color, size }) => <AppIcon name="home" color={color} size={size} />,
        }}
      />
      <PatientTabs.Screen
        name="monitor"
        component={MonitoringIntroScreen}
        options={{
          title: 'Suivi',
          tabBarLabel: 'Suivi',
          tabBarIcon: ({ color, size }) => <AppIcon name="activity" color={color} size={size} />,
        }}
      />
      <PatientTabs.Screen
        name="messages"
        component={PatientMessagesScreen}
        options={{
          title: 'Messages',
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color, size }) => <AppIcon name="message-circle" color={color} size={size} />,
        }}
      />
      <PatientTabs.Screen
        name="treatment"
        component={PatientTreatmentScreen}
        options={{
          title: 'Traitement',
          tabBarLabel: 'Traitement',
          tabBarIcon: ({ color, size }) => <AppIcon name="package" color={color} size={size} />,
        }}
      />
      <PatientTabs.Screen
        name="profile"
        component={PatientProfileScreen}
        options={{
          title: 'Profil',
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => <AppIcon name="user" color={color} size={size} />,
        }}
      />
    </PatientTabs.Navigator>
  );
}

function NurseTabsNavigator() {
  const { colors } = useTheme();

  return (
    <NurseTabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontFamily: typography.fontFamily.openSans,
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <NurseTabs.Screen
        name="nurseDashboard"
        component={NurseDashboardScreen}
        options={{
          title: 'Accueil',
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color, size }) => <AppIcon name="home" color={color} size={size} />,
        }}
      />
      <NurseTabs.Screen
        name="patients"
        component={NursePatientsStackNavigator}
        options={{
          title: 'Patients',
          tabBarLabel: 'Patients',
          tabBarIcon: ({ color, size }) => <AppIcon name="users" color={color} size={size} />,
        }}
      />
      <NurseTabs.Screen
        name="alerts"
        component={NurseAlertsScreen}
        options={{
          title: 'Alertes',
          tabBarLabel: 'Alertes',
          tabBarIcon: ({ color, size }) => <AppIcon name="bell" color={color} size={size} />,
        }}
      />
      <NurseTabs.Screen
        name="messages"
        component={NurseMessagesScreen}
        options={{
          title: 'Messages',
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color, size }) => <AppIcon name="message-circle" color={color} size={size} />,
        }}
      />
      <NurseTabs.Screen
        name="profile"
        component={NurseProfileScreen}
        options={{
          title: 'Profil',
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => <AppIcon name="user" color={color} size={size} />,
        }}
      />
    </NurseTabs.Navigator>
  );
}

function NursePatientsStackNavigator() {
  return (
    <NursePatientsStack.Navigator screenOptions={{ headerShown: false }}>
      <NursePatientsStack.Screen name="patients" component={NursePatientsScreen} />
      <NursePatientsStack.Screen name="patientDetail" component={NursePatientProfileScreen} />
    </NursePatientsStack.Navigator>
  );
}

function SessionExpiryModal({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  const { colors } = useTheme();

  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.card, { backgroundColor: colors.surface }]}>
          <AppText style={[modalStyles.title, { color: colors.foreground }]}>Session Expired</AppText>
          <AppText style={[modalStyles.body, { color: colors.mutedForeground }]}>
            For your security, your session has expired. Please sign in again to continue.
          </AppText>
          <TouchableOpacity style={[modalStyles.button, { backgroundColor: colors.primary }]} onPress={onDismiss}>
            <AppText style={[modalStyles.buttonText, { color: colors.primaryForeground }]}>Sign In Again</AppText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#000000AA', alignItems: 'center', justifyContent: 'center', padding: spacing[6] },
  card: { borderRadius: shapes.lg, padding: spacing[6], width: '100%', maxWidth: 360, alignItems: 'center', gap: spacing[4] },
  title: { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, textAlign: 'center' },
  body: { fontFamily: typography.fontFamily.openSans, fontSize: typography.fontSize.md, textAlign: 'center' },
  button: { padding: spacing[4], borderRadius: shapes.sm, alignItems: 'center', width: '100%' },
  buttonText: { fontWeight: typography.fontWeight.semibold, fontFamily: typography.fontFamily.openSans },
});

export default function AppNavigator() {
  const locale = useLocale();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const errorMessage = useAuthStore((s) => s.errorMessage);
  const role = user?.role ?? null;
  const nurseSide = isNurseSideRole(role);
  const [showSessionExpiry, setShowSessionExpiry] = useState(false);
  const { colors, isDark } = useTheme();

  const navTheme = {
    dark: isDark,
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.foreground,
      border: colors.border,
      notification: colors.destructive,
    },
  };

  useEffect(() => {
    if (status === 'error' && errorMessage) {
      const msg = errorMessage.toLowerCase();
      if (msg.includes('expired') || msg.includes('jwt') || msg.includes('token') || msg.includes('session')) {
        setShowSessionExpiry(true);
      }
    }
  }, [status, errorMessage]);

  const handleSessionExpiryDismiss = () => {
    setShowSessionExpiry(false);
    useAuthStore.getState().logout();
  };

  return (
    <>
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          screenOptions={({ route }) => {
            const backSide = getDirectionalStackBackSide(locale);
            return {
              headerShown: false,
              headerBackVisible: false,
              headerLeft: backSide === 'left'
                ? () => <DirectionalStackBackButton side="left" />
                : undefined,
              headerRight: backSide === 'right'
                ? () => <DirectionalStackBackButton side="right" />
                : undefined,
              headerTitleAlign: 'center',
              headerTitle: ({ children }) => (
                <DirectionalStackHeaderTitle>
                  {getLocalizedStackTitle(route.name, children, locale)}
                </DirectionalStackHeaderTitle>
              ),
            };
          }}
        >
          {status === 'initializing' ? (
            <Stack.Screen name="splash" component={SplashScreen} />
          ) : status === 'unauthenticated' || status === 'error' ? (
            <>
              <Stack.Screen name="authGate" component={AuthGateScreen} />
              <Stack.Screen name="access" component={AccessScreen} options={{ headerShown: true }} />
              <Stack.Screen name="aesSplash" component={AesSplashScreen} options={{ headerShown: false }} />
              <Stack.Screen name="aesLanguageSelect" component={LanguageSelectionScreen} options={{ headerShown: false }} />
              <Stack.Screen name="aesWelcomeCarousel" component={WelcomeCarouselScreen} options={{ headerShown: false }} />
              <Stack.Screen name="aesDisclaimer" component={PrototypeDisclaimerScreen} options={{ headerShown: false }} />
              <Stack.Screen name="aesDemoPicker" component={DemoAccountPickerScreen} options={{ headerShown: false }} />
              <Stack.Screen name="aesGuardianWorkspace" component={AesGuardianWorkspaceScreen} options={{ headerShown: true, title: 'Espace AES Guardian' }} />
              <Stack.Screen name="signIn" component={LoginScreen} />
              <Stack.Screen name="signUp" component={RegisterScreen} />
              <Stack.Screen name="forgotPassword" component={ForgotPasswordScreen} />
              <Stack.Screen name="declarations" component={DeclarationListScreen} options={{ headerShown: true, title: 'Déclarations AES' }} />
              <Stack.Screen name="newDeclaration" component={DeclarationFormScreen} options={{ headerShown: true, title: 'Nouvelle déclaration' }} />
              <Stack.Screen name="declarationDetails" component={DeclarationDetailsScreen} options={{ headerShown: true, title: 'Détails de la déclaration' }} />
              <Stack.Screen name="submissionConfirmation" component={SubmissionConfirmationScreen} options={{ headerShown: false }} />
              <Stack.Screen name="adminReviewQueue" component={AdminReviewQueueScreen} options={{ headerShown: true, title: 'Revue administrative' }} />
              <Stack.Screen name="adminReviewAction" component={AdminReviewActionScreen} options={{ headerShown: true, title: 'Traitement de la revue' }} />
              <Stack.Screen name="correctionResponse" component={CorrectionResponseScreen} options={{ headerShown: true, title: 'Réponse à la correction' }} />
              <Stack.Screen name="ohCoordinationQueue" component={OhCoordinationQueueScreen} options={{ headerShown: true, title: 'Coordination Santé au Travail' }} />
              <Stack.Screen name="ohCoordinationDetail" component={OhCoordinationDetailScreen} options={{ headerShown: true, title: 'Détail de la coordination' }} />
              <Stack.Screen name="createCoordination" component={CreateCoordinationScreen} options={{ headerShown: true, title: 'Créer une coordination' }} />
              <Stack.Screen name="recordFollowUpEvent" component={OhFollowUpEventScreen} options={{ headerShown: true, title: 'Événement de suivi' }} />
              <Stack.Screen name="declarationCoordinationStatus" component={DeclarationCoordinationStatusScreen} options={{ headerShown: true, title: 'Statut de coordination' }} />
              <Stack.Screen name="surveillanceDashboard" component={SurveillanceDashboardScreen} options={{ headerShown: true, title: 'Surveillance AES' }} />
              <Stack.Screen name="preventionOverview" component={PreventionOverviewScreen} options={{ headerShown: true, title: 'Prevention & CAPA' }} />
              <Stack.Screen name="preventionRegister" component={PreventionActionRegisterScreen} options={{ headerShown: true, title: 'Registre des Actions' }} />
              <Stack.Screen name="preventionCreate" component={PreventionActionCreateScreen} options={{ headerShown: true, title: 'Nouvelle Action CAPA' }} />
              <Stack.Screen name="preventionActionDetail" component={PreventionActionDetailScreen} options={{ headerShown: true, title: "Détail de l'Action" }} />
              <Stack.Screen name="helpGlossary" component={HelpGlossaryScreen} options={{ headerShown: true, title: 'Aide & Glossaire AES' }} />
              <Stack.Screen name="aesGuardianProfile" component={AesGuardianProfileScreen} options={{ headerShown: true, title: 'Profil & Réglages' }} />
            </>
          ) : status === 'authenticated' && nurseSide ? (
            <>
              <Stack.Screen name="nurseTabs" component={NurseTabsNavigator} />
              <Stack.Screen name="aesSplash" component={AesSplashScreen} options={{ headerShown: false }} />
              <Stack.Screen name="aesLanguageSelect" component={LanguageSelectionScreen} options={{ headerShown: false }} />
              <Stack.Screen name="aesWelcomeCarousel" component={WelcomeCarouselScreen} options={{ headerShown: false }} />
              <Stack.Screen name="aesDisclaimer" component={PrototypeDisclaimerScreen} options={{ headerShown: false }} />
              <Stack.Screen name="aesDemoPicker" component={DemoAccountPickerScreen} options={{ headerShown: false }} />
              <Stack.Screen name="aesGuardianWorkspace" component={AesGuardianWorkspaceScreen} options={{ headerShown: true, title: 'Espace AES Guardian' }} />
              <Stack.Screen name="rules" component={RulesScreen} options={{ headerShown: true, title: 'Règles' }} />
              <Stack.Screen name="ruleDetail" component={RuleDetailScreen} options={{ headerShown: true, title: 'Détail de la règle' }} />
              <Stack.Screen name="ruleBuilder" component={RuleBuilderScreen} options={{ headerShown: true, title: 'Règle' }} />
              <Stack.Screen name="designSystem" component={DesignSystemScreen} />
              <Stack.Screen name="declarations" component={DeclarationListScreen} options={{ headerShown: true, title: 'Déclarations AES' }} />
              <Stack.Screen name="newDeclaration" component={DeclarationFormScreen} options={{ headerShown: true, title: 'Nouvelle déclaration' }} />
              <Stack.Screen name="declarationDetails" component={DeclarationDetailsScreen} options={{ headerShown: true, title: 'Détails de la déclaration' }} />
              <Stack.Screen name="submissionConfirmation" component={SubmissionConfirmationScreen} options={{ headerShown: false }} />
              <Stack.Screen name="adminReviewQueue" component={AdminReviewQueueScreen} options={{ headerShown: true, title: 'Revue administrative' }} />
              <Stack.Screen name="adminReviewAction" component={AdminReviewActionScreen} options={{ headerShown: true, title: 'Traitement de la revue' }} />
              <Stack.Screen name="correctionResponse" component={CorrectionResponseScreen} options={{ headerShown: true, title: 'Réponse à la correction' }} />
              <Stack.Screen name="ohCoordinationQueue" component={OhCoordinationQueueScreen} options={{ headerShown: true, title: 'Coordination Santé au Travail' }} />
              <Stack.Screen name="ohCoordinationDetail" component={OhCoordinationDetailScreen} options={{ headerShown: true, title: 'Détail de la coordination' }} />
              <Stack.Screen name="createCoordination" component={CreateCoordinationScreen} options={{ headerShown: true, title: 'Créer une coordination' }} />
              <Stack.Screen name="recordFollowUpEvent" component={OhFollowUpEventScreen} options={{ headerShown: true, title: 'Événement de suivi' }} />
              <Stack.Screen name="declarationCoordinationStatus" component={DeclarationCoordinationStatusScreen} options={{ headerShown: true, title: 'Statut de coordination' }} />
              <Stack.Screen name="surveillanceDashboard" component={SurveillanceDashboardScreen} options={{ headerShown: true, title: 'Surveillance AES' }} />
              <Stack.Screen name="preventionOverview" component={PreventionOverviewScreen} options={{ headerShown: true, title: 'Prevention & CAPA' }} />
              <Stack.Screen name="preventionRegister" component={PreventionActionRegisterScreen} options={{ headerShown: true, title: 'Registre des Actions' }} />
              <Stack.Screen name="preventionCreate" component={PreventionActionCreateScreen} options={{ headerShown: true, title: 'Nouvelle Action CAPA' }} />
              <Stack.Screen name="preventionActionDetail" component={PreventionActionDetailScreen} options={{ headerShown: true, title: "Détail de l'Action" }} />
              <Stack.Screen name="helpGlossary" component={HelpGlossaryScreen} options={{ headerShown: true, title: 'Aide & Glossaire AES' }} />
              <Stack.Screen name="aesGuardianProfile" component={AesGuardianProfileScreen} options={{ headerShown: true, title: 'Profil & Réglages' }} />
              <Stack.Screen name="notificationCentre" component={NotificationCentreScreen} options={{ headerShown: true, title: 'Notifications' }} />
            </>
          ) : status === 'authenticated' && !nurseSide ? (
            <>
              <Stack.Screen name="patientTabs" component={PatientTabsNavigator} />
              <Stack.Screen name="aesSplash" component={AesSplashScreen} options={{ headerShown: false }} />
              <Stack.Screen name="aesLanguageSelect" component={LanguageSelectionScreen} options={{ headerShown: false }} />
              <Stack.Screen name="aesWelcomeCarousel" component={WelcomeCarouselScreen} options={{ headerShown: false }} />
              <Stack.Screen name="aesDisclaimer" component={PrototypeDisclaimerScreen} options={{ headerShown: false }} />
              <Stack.Screen name="aesDemoPicker" component={DemoAccountPickerScreen} options={{ headerShown: false }} />
              <Stack.Screen name="aesGuardianWorkspace" component={AesGuardianWorkspaceScreen} options={{ headerShown: true, title: 'Espace AES Guardian' }} />
              <Stack.Screen name="designSystem" component={DesignSystemScreen} />
              <Stack.Screen name="declarations" component={DeclarationListScreen} options={{ headerShown: true, title: 'Déclarations AES' }} />
              <Stack.Screen name="newDeclaration" component={DeclarationFormScreen} options={{ headerShown: true, title: 'Nouvelle déclaration' }} />
              <Stack.Screen name="declarationDetails" component={DeclarationDetailsScreen} options={{ headerShown: true, title: 'Détails de la déclaration' }} />
              <Stack.Screen name="submissionConfirmation" component={SubmissionConfirmationScreen} options={{ headerShown: false }} />
              <Stack.Screen name="adminReviewQueue" component={AdminReviewQueueScreen} options={{ headerShown: true, title: 'Revue administrative' }} />
              <Stack.Screen name="adminReviewAction" component={AdminReviewActionScreen} options={{ headerShown: true, title: 'Traitement de la revue' }} />
              <Stack.Screen name="correctionResponse" component={CorrectionResponseScreen} options={{ headerShown: true, title: 'Réponse à la correction' }} />
              <Stack.Screen name="ohCoordinationQueue" component={OhCoordinationQueueScreen} options={{ headerShown: true, title: 'Coordination Santé au Travail' }} />
              <Stack.Screen name="ohCoordinationDetail" component={OhCoordinationDetailScreen} options={{ headerShown: true, title: 'Détail de la coordination' }} />
              <Stack.Screen name="createCoordination" component={CreateCoordinationScreen} options={{ headerShown: true, title: 'Créer une coordination' }} />
              <Stack.Screen name="recordFollowUpEvent" component={OhFollowUpEventScreen} options={{ headerShown: true, title: 'Événement de suivi' }} />
              <Stack.Screen name="declarationCoordinationStatus" component={DeclarationCoordinationStatusScreen} options={{ headerShown: true, title: 'Statut de coordination' }} />
              <Stack.Screen name="surveillanceDashboard" component={SurveillanceDashboardScreen} options={{ headerShown: true, title: 'Surveillance AES' }} />
              <Stack.Screen name="preventionOverview" component={PreventionOverviewScreen} options={{ headerShown: true, title: 'Prevention & CAPA' }} />
              <Stack.Screen name="preventionRegister" component={PreventionActionRegisterScreen} options={{ headerShown: true, title: 'Registre des Actions' }} />
              <Stack.Screen name="preventionCreate" component={PreventionActionCreateScreen} options={{ headerShown: true, title: 'Nouvelle Action CAPA' }} />
              <Stack.Screen name="preventionActionDetail" component={PreventionActionDetailScreen} options={{ headerShown: true, title: "Détail de l'Action" }} />
              <Stack.Screen name="helpGlossary" component={HelpGlossaryScreen} options={{ headerShown: true, title: 'Aide & Glossaire AES' }} />
              <Stack.Screen name="aesGuardianProfile" component={AesGuardianProfileScreen} options={{ headerShown: true, title: 'Profil & Réglages' }} />
              <Stack.Screen name="notificationCentre" component={NotificationCentreScreen} options={{ headerShown: true, title: 'Notifications' }} />
            </>
          ) : (
            <>
              <Stack.Screen name="authGate" component={AuthGateScreen} />
              <Stack.Screen name="access" component={AccessScreen} options={{ headerShown: true }} />
              <Stack.Screen name="aesSplash" component={AesSplashScreen} options={{ headerShown: false }} />
              <Stack.Screen name="aesLanguageSelect" component={LanguageSelectionScreen} options={{ headerShown: false }} />
              <Stack.Screen name="aesWelcomeCarousel" component={WelcomeCarouselScreen} options={{ headerShown: false }} />
              <Stack.Screen name="aesDisclaimer" component={PrototypeDisclaimerScreen} options={{ headerShown: false }} />
              <Stack.Screen name="aesDemoPicker" component={DemoAccountPickerScreen} options={{ headerShown: false }} />
              <Stack.Screen name="aesGuardianWorkspace" component={AesGuardianWorkspaceScreen} options={{ headerShown: true, title: 'Espace AES Guardian' }} />
              <Stack.Screen name="declarations" component={DeclarationListScreen} options={{ headerShown: true, title: 'Déclarations AES' }} />
              <Stack.Screen name="newDeclaration" component={DeclarationFormScreen} options={{ headerShown: true, title: 'Nouvelle déclaration' }} />
              <Stack.Screen name="declarationDetails" component={DeclarationDetailsScreen} options={{ headerShown: true, title: 'Détails de la déclaration' }} />
              <Stack.Screen name="submissionConfirmation" component={SubmissionConfirmationScreen} options={{ headerShown: false }} />
              <Stack.Screen name="adminReviewQueue" component={AdminReviewQueueScreen} options={{ headerShown: true, title: 'Revue administrative' }} />
              <Stack.Screen name="adminReviewAction" component={AdminReviewActionScreen} options={{ headerShown: true, title: 'Traitement de la revue' }} />
              <Stack.Screen name="correctionResponse" component={CorrectionResponseScreen} options={{ headerShown: true, title: 'Réponse à la correction' }} />
              <Stack.Screen name="ohCoordinationQueue" component={OhCoordinationQueueScreen} options={{ headerShown: true, title: 'Coordination Santé au Travail' }} />
              <Stack.Screen name="ohCoordinationDetail" component={OhCoordinationDetailScreen} options={{ headerShown: true, title: 'Détail de la coordination' }} />
              <Stack.Screen name="createCoordination" component={CreateCoordinationScreen} options={{ headerShown: true, title: 'Créer une coordination' }} />
              <Stack.Screen name="recordFollowUpEvent" component={OhFollowUpEventScreen} options={{ headerShown: true, title: 'Événement de suivi' }} />
              <Stack.Screen name="declarationCoordinationStatus" component={DeclarationCoordinationStatusScreen} options={{ headerShown: true, title: 'Statut de coordination' }} />
              <Stack.Screen name="surveillanceDashboard" component={SurveillanceDashboardScreen} options={{ headerShown: true, title: 'Surveillance AES' }} />
              <Stack.Screen name="preventionOverview" component={PreventionOverviewScreen} options={{ headerShown: true, title: 'Prévention & CAPA' }} />
              <Stack.Screen name="preventionRegister" component={PreventionActionRegisterScreen} options={{ headerShown: true, title: 'Registre des Actions' }} />
              <Stack.Screen name="preventionCreate" component={PreventionActionCreateScreen} options={{ headerShown: true, title: 'Nouvelle Action CAPA' }} />
              <Stack.Screen name="preventionActionDetail" component={PreventionActionDetailScreen} options={{ headerShown: true, title: "Détail de l'Action" }} />
              <Stack.Screen name="helpGlossary" component={HelpGlossaryScreen} options={{ headerShown: true, title: 'Aide & Glossaire AES' }} />
              <Stack.Screen name="aesGuardianProfile" component={AesGuardianProfileScreen} options={{ headerShown: true, title: 'Profil & Réglages' }} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      <SessionExpiryModal visible={showSessionExpiry} onDismiss={handleSessionExpiryDismiss} />
    </>
  );
}
