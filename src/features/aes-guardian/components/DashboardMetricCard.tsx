import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useLayoutDirection, useLocale } from '../../../localization';
import AppIcon, { AppIconName } from '../../../components/AppIcon';
import AppText from '../../../components/AppText';
import { useTheme } from '../../../theme/ThemeContext';
import { aesRadii, aesSpacing } from '../../../theme/tokens';
import { AesCard } from './AesCard';

export interface DashboardMetricCardProps {
  label: string;
  value: string | number;
  icon: AppIconName;
  detail?: string;
  testID: string;
}

export const DashboardMetricCard: React.FC<DashboardMetricCardProps> = ({
  label,
  value,
  icon,
  detail,
  testID,
}) => {
  const { colors } = useTheme();
  const direction = useLayoutDirection();
  const locale = useLocale();
  const alignment = direction === 'rtl' ? 'right' : 'left';
  const displayValue = typeof value === 'number'
    ? new Intl.NumberFormat(locale).format(value)
    : value;
  const accessibleSummary = [label, displayValue, detail].filter(Boolean).join('. ');

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibleSummary}
      style={styles.container}
      testID={testID}
    >
      <AesCard elevated style={styles.card} testID={`${testID}-surface`}>
        <View
          style={[
            styles.iconSurface,
            {
              alignSelf: direction === 'rtl' ? 'flex-end' : 'flex-start',
              backgroundColor: colors.secondary,
            },
          ]}
        >
          <AppIcon name={icon} size={20} color={colors.primary} decorative />
        </View>
        <AppText variant="label" style={[styles.label, { textAlign: alignment }]}>
          {label}
        </AppText>
        <AppText
          variant="section"
          style={[styles.value, { color: colors.foreground, textAlign: alignment }]}
        >
          {displayValue}
        </AppText>
        {detail ? (
          <AppText
            variant="caption"
            tone="muted"
            style={[styles.detail, { textAlign: alignment }]}
          >
            {detail}
          </AppText>
        ) : null}
      </AesCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexBasis: 148,
    flexGrow: 1,
    maxWidth: 280,
    minWidth: 136,
  },
  card: {
    flex: 1,
    marginVertical: 0,
    minHeight: 148,
  },
  iconSurface: {
    alignItems: 'center',
    borderRadius: aesRadii.badge,
    height: 40,
    justifyContent: 'center',
    marginBottom: aesSpacing.md,
    width: 40,
  },
  label: {
    marginBottom: aesSpacing.xs,
  },
  value: {
    flexWrap: 'wrap',
  },
  detail: {
    marginTop: aesSpacing.xs,
  },
});

export default DashboardMetricCard;
