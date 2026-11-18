/**
 * AES Guardian — Reusable Card Component
 *
 * Implements 16px surface radius, subtle light border (#EEEEEE),
 * soft elevation, and optional interactive press states per UI Blueprint Section 5.1.
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { aesColors, aesRadii, aesShadows, aesSpacing } from '../../../theme/tokens';

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
  const cardStyles = [
    styles.card,
    elevated ? styles.elevated : styles.flat,
    selected && styles.selected,
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
    backgroundColor: aesColors.surface,
    borderRadius: aesRadii.card,
    borderWidth: 1,
    borderColor: aesColors.borderSubdued,
    padding: aesSpacing.cardPadding,
    marginVertical: aesSpacing.xs,
  },
  elevated: {
    ...aesShadows.card,
  },
  flat: {
    ...aesShadows.none,
  },
  selected: {
    borderColor: aesColors.accentGreen,
    borderWidth: 1.5,
  },
});
