/**
 * AES Guardian — Reusable Screen Container
 *
 * Uses the active application canvas theme with safe-area and optional scrolling.
 */

import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  StatusBar,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { aesSpacing } from '../../../theme/tokens';
import { useTheme } from '../../../theme/ThemeContext';

export interface AesScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  testID?: string;
  statusBarStyle?: 'dark-content' | 'light-content';
}

export const AesScreenContainer: React.FC<AesScreenContainerProps> = ({
  children,
  scrollable = false,
  backgroundColor,
  style,
  contentContainerStyle,
  testID,
  statusBarStyle,
}) => {
  const { colors, isDark } = useTheme();
  const surfaceColor = backgroundColor ?? colors.background;

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: surfaceColor }]}
      testID={testID}
    >
      <StatusBar
        barStyle={statusBarStyle ?? (isDark ? 'light-content' : 'dark-content')}
        backgroundColor={surfaceColor}
        animated
      />
      {scrollable ? (
        <ScrollView
          style={[styles.container, { backgroundColor: surfaceColor }, style]}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.container, { backgroundColor: surfaceColor }, style]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: aesSpacing.screenHorizontal,
    paddingVertical: aesSpacing.screenVertical,
    flexGrow: 1,
  },
});
