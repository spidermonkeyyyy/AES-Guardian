/**
 * AES Guardian — Reusable Screen Container
 *
 * Implements standard canvas background (#F8F9FA), safe area padding,
 * and optional scrollable container behavior per UI Blueprint Section 5.1.
 */

import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { aesColors, aesSpacing } from '../../../theme/tokens';

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
  backgroundColor = aesColors.canvas,
  style,
  contentContainerStyle,
  testID,
  statusBarStyle = 'dark-content',
}) => {
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]} testID={testID}>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={backgroundColor}
        animated
      />
      {scrollable ? (
        <ScrollView
          style={[styles.container, { backgroundColor }, style]}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.container, { backgroundColor }, style]}>
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
