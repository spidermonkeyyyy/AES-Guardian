import AppText from './AppText';
import React from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';
import { typography, spacing } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';

interface SanadLogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const SanadLogo: React.FC<SanadLogoProps> = ({
  size = 'medium',
  showText = true,
  style,
  testID,
}) => {
  const { colors } = useTheme();
  const iconSize = size === 'small' ? 32 : size === 'medium' ? 48 : 72;
  const textSize = size === 'small' ? 18 : size === 'medium' ? 24 : 32;

  return (
    <View style={[styles.container, style]} testID={testID}>
      <Image
        source={require('../assets/images/logo/sanad_icon.png')}
        style={{ width: iconSize, height: iconSize, borderRadius: iconSize / 4 }}
        resizeMode="contain"
      />
      {showText && (
        <View style={styles.textContainer}>
          <AppText style={[styles.title, { fontSize: textSize, color: colors.primary }]}>SANAD</AppText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: spacing.sm,
  },
  title: {
    fontWeight: typography.fontWeight.bold,
  },
});
