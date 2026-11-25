import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  AuthContext,
  canDeclare,
  canFollowUp,
  canReview,
  canViewPreventionActions,
  canViewSurveillanceDashboard,
  useDemoRoleStore,
} from '../core';
import {
  AdminReviewQueueScreen,
  AesGuardianProfileScreen,
  AesGuardianWorkspaceScreen,
  DeclarationFormScreen,
  DeclarationListScreen,
  OhCoordinationQueueScreen,
  PreventionActionRegisterScreen,
  PreventionOverviewScreen,
  SurveillanceDashboardScreen,
} from '../features/aes-guardian';
import { t, TranslationKey, useLocale } from '../localization';
import { AppIconName } from '../components/AppIcon';
import { useTheme } from '../theme/ThemeContext';
import LiquidGlassNavigation from './LiquidGlassNavigation';

export type AesGuardianTabParamList = {
  home: undefined;
  declare: undefined;
  followup: undefined;
  prevention: undefined;
  profile: undefined;
};

type PrimaryDestinationKey = keyof AesGuardianTabParamList;
type DestinationScreen = React.ComponentType;

export interface PrimaryDestination {
  key: PrimaryDestinationKey;
  labelKey: TranslationKey;
  icon: AppIconName;
  component: DestinationScreen;
}

const Tab = createBottomTabNavigator<AesGuardianTabParamList>();

export function getPrimaryDestinations(context: AuthContext): PrimaryDestination[] {
  const destinations: PrimaryDestination[] = [
    {
      key: 'home',
      labelKey: 'navigation.tab.home',
      icon: 'home',
      component: AesGuardianWorkspaceScreen,
    },
  ];

  if (canDeclare(context)) {
    destinations.push({
      key: 'declare',
      labelKey: 'navigation.tab.declare',
      icon: 'document-add',
      component: DeclarationFormScreen,
    });
  }

  if (canReview(context)) {
    destinations.push({
      key: 'followup',
      labelKey: 'navigation.tab.followup',
      icon: 'clipboard-list',
      component: AdminReviewQueueScreen,
    });
  } else if (canFollowUp(context)) {
    destinations.push({
      key: 'followup',
      labelKey: 'navigation.tab.followup',
      icon: 'activity',
      component: OhCoordinationQueueScreen,
    });
  } else if (canViewSurveillanceDashboard(context)) {
    destinations.push({
      key: 'followup',
      labelKey: 'navigation.tab.followup',
      icon: 'activity',
      component: SurveillanceDashboardScreen,
    });
  } else if (context.role === 'exposed_professional') {
    destinations.push({
      key: 'followup',
      labelKey: 'navigation.tab.followup',
      icon: 'clipboard-list',
      component: DeclarationListScreen,
    });
  }

  if (canViewPreventionActions(context)) {
    destinations.push({
      key: 'prevention',
      labelKey: 'navigation.tab.prevention',
      icon: 'target',
      component: context.role === 'quality_staff'
        ? PreventionOverviewScreen
        : PreventionActionRegisterScreen,
    });
  }

  destinations.push({
    key: 'profile',
    labelKey: 'navigation.tab.profile',
    icon: 'user',
    component: AesGuardianProfileScreen,
  });

  return destinations;
}

export const AesGuardianTabNavigator: React.FC = () => {
  const { activeContext } = useDemoRoleStore();
  const { colors } = useTheme();
  const locale = useLocale();
  const destinations = getPrimaryDestinations(activeContext);

  return (
    <Tab.Navigator
      key={activeContext.role}
      initialRouteName="home"
      sceneContainerStyle={{ backgroundColor: colors.background }}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
      tabBar={({ state, navigation }) => {
        const activeKey = state.routes[state.index]?.name ?? 'home';
        return (
          <LiquidGlassNavigation
            items={destinations.map((destination) => ({
              key: destination.key,
              label: t(destination.labelKey, locale),
              icon: destination.icon,
              accessibilityLabel: t(destination.labelKey, locale),
            }))}
            activeKey={activeKey}
            accessibilityLabel={t('navigation.tab.accessibility', locale)}
            onSelect={(key) => {
              if (state.routes.some((route) => route.name === key)) {
                navigation.navigate(key);
              }
            }}
          />
        );
      }}
    >
      {destinations.map((destination) => {
        const ScreenComponent = destination.component;
        return (
          <Tab.Screen
            key={destination.key}
            name={destination.key}
            component={ScreenComponent}
            options={{ title: t(destination.labelKey, locale) }}
          />
        );
      })}
    </Tab.Navigator>
  );
};

export default AesGuardianTabNavigator;
