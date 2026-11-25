import React from 'react';
import { StyleProp, StyleSheet, TextStyle, View, ViewStyle } from 'react-native';
import { AppText } from '../AppText';
import { useTheme } from '../../theme/ThemeContext';
import { aesRadii, aesSpacing } from '../../theme/tokens';

export interface EmptyProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Empty({ children, style, testID }: EmptyProps) {
  return <View style={[styles.root, style]} testID={testID}>{children}</View>;
}

export function EmptyHeader({ children, style }: { children?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.header, style]}>{children}</View>;
}

export function EmptyMedia({ variant = 'icon', children, style }: { variant?: 'default' | 'icon'; children?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View style={[variant === 'icon' && [styles.iconMedia, { backgroundColor: colors.secondary }], style]}>
      {children}
    </View>
  );
}

export function EmptyTitle({ children, style }: { children?: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <AppText variant="section" accessibilityRole="header" style={[styles.title, style]}>{children}</AppText>;
}

export function EmptyDescription({ children, style }: { children?: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <AppText variant="body" tone="muted" style={[styles.description, style]}>{children}</AppText>;
}

export function EmptyContent({ children, style }: { children?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.content, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: aesSpacing.lg, justifyContent: 'center', padding: aesSpacing['2xl'], width: '100%' },
  header: { alignItems: 'center', gap: aesSpacing.sm, width: '100%' },
  iconMedia: { alignItems: 'center', borderRadius: aesRadii.input, height: 48, justifyContent: 'center', marginBottom: aesSpacing.xs, width: 48 },
  title: { textAlign: 'center' },
  description: { maxWidth: 340, textAlign: 'center' },
  content: { alignItems: 'center', gap: aesSpacing.sm },
});

export default Empty;
