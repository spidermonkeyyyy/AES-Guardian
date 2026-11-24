/**
 * AES Guardian — Reusable Round Arrow Button
 *
 * Implements circular 48x48px navigation arrow button per UI Blueprint
 * Shared directional action button for guided workflows.
 */

import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { AppIcon } from '../../../components/AppIcon';
import { aesColors, aesRadii } from '../../../theme/tokens';
import { useLayoutDirection } from '../../../localization';

export type AesRoundArrowButtonVariant = 'black' | 'green';

export interface AesRoundArrowButtonProps {
  onPress: () => void;
  direction?: 'forward' | 'back';
  variant?: AesRoundArrowButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

export const AesRoundArrowButton: React.FC<AesRoundArrowButtonProps> = ({
  onPress,
  direction = 'forward',
  variant = 'black',
  disabled = false,
  style,
  testID,
  accessibilityLabel = 'Étape suivante',
}) => {
  const layoutDirection = useLayoutDirection();
  const rtl = layoutDirection === 'rtl';

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
      <AppIcon
        name={direction === 'back' ? 'back' : 'forward'}
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
