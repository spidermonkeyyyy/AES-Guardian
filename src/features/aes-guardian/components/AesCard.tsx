/**
 * AES Guardian — Reusable Card Component
 *
 * Theme-aware surface card with subtle elevation and optional press states.
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { aesRadii, aesShadows, aesSpacing } from '../../../theme/tokens';
import { useTheme } from '../../../theme/ThemeContext';

export interface AesCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  elevated?: boolean;
  selected?: boolean;
  accentBorderColor?: string;
  testID?: string;
  disabled?: boolean;
  accessibilityRole?: 'button' | 'radio' | 'checkbox';
  accessibilityLabel?: string;
}

export const AesCard: React.FC<AesCardProps> = ({
  children,
  style,
  onPress,
  elevated = true,
  selected = false,
  accentBorderColor,
  testID,
  disabled = false,
  accessibilityRole,
  accessibilityLabel,
}) => {
  const { colors } = useTheme();
  const cardStyles = [
    styles.card,
    { backgroundColor: colors.card, borderColor: colors.border },
    elevated ? styles.elevated : styles.flat,
    selected && { borderColor: colors.primary, borderWidth: 1.5 },
    accentBorderColor ? { borderColor: accentBorderColor } : null,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyles}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.85}
        testID={testID}
        accessibilityRole={accessibilityRole ?? 'button'}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled, selected }}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyles} testID={testID}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: aesRadii.card,
    borderWidth: 1,
    padding: aesSpacing.cardPadding,
    marginVertical: aesSpacing.xs,
  },
  elevated: {
    ...aesShadows.card,
  },
  flat: {
    ...aesShadows.none,
  },
});
