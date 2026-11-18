/**
 * AES Guardian — Reusable Round Arrow Button
 *
 * Implements circular 48x48px navigation arrow button per UI Blueprint
 * Section 5.1 & Section 5.2 (used prominently in WelcomeCarouselScreen).
 */

import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { aesColors, aesRadii } from '../../../theme/tokens';
import { useLocale, isRTL } from '../../../localization';

export type AesRoundArrowButtonVariant = 'black' | 'green';

export interface AesRoundArrowButtonProps {
  onPress: () => void;
  variant?: AesRoundArrowButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

export const AesRoundArrowButton: React.FC<AesRoundArrowButtonProps> = ({
  onPress,
  variant = 'black',
  disabled = false,
  style,
  testID,
  accessibilityLabel = 'Étape suivante',
}) => {
  const locale = useLocale();
  const rtl = isRTL(locale);

  const backgroundColor =
    variant === 'green' ? aesColors.accentGreen : aesColors.primaryAction;

  return (
    <TouchableOpacity
      style={[
        styles.circle,
        { backgroundColor },
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
    >
      <Icon
        name={rtl ? 'arrow-left' : 'arrow-right'}
        size={22}
        color={aesColors.textInverse}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  circle: {
    width: 48,
    height: 48,
    borderRadius: aesRadii.roundButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.3,
  },
});
