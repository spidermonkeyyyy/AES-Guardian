import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { spacing } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';
import { AppIcon } from './AppIcon';
import { AppText } from './AppText';
import { isRTL, useLocale, t } from '../localization';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBackPress,
  rightAction,
  style,
}) => {
  const { colors } = useTheme();
  const locale = useLocale();
  const rtl = isRTL(locale);

  return (
    <View style={[styles.headerContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }, style]}>
      <View style={styles.leftRow}>
        {showBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackPress}
            accessibilityRole="button"
            accessibilityLabel={t('app.back', locale)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <AppIcon name={rtl ? 'arrow-right' : 'arrow-left'} size={22} />
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <AppText variant="title" numberOfLines={1} style={styles.title}>
            {title}
          </AppText>
          {subtitle && (
            <AppText variant="caption" tone="muted" numberOfLines={1} style={styles.subtitle}>
              {subtitle}
            </AppText>
          )}
        </View>
      </View>
      {rightAction && <View style={styles.rightContainer}>{rightAction}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginEnd: spacing.sm,
    padding: spacing.xxs,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    flexShrink: 1,
  },
  subtitle: {
    marginTop: 2,
  },
  rightContainer: {
    marginStart: spacing.sm,
  },
});
