/**
 * AES Guardian — Status Badge Component
 *
 * Renders a styled status chip for declaration, OH coordination,
 * or CAPA domain statuses using the approved AES color tokens.
 *
 * Phase 2E.1.4.3 — Batch 4
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  aesDeclarationStatusColors,
  aesOhCoordinationStatusColors,
  aesCapaStatusColors,
} from '../../../theme/tokens/aesColors';
import { aesTypography } from '../../../theme/tokens';
import { t } from '../../../localization';
import { useTheme } from '../../../theme/ThemeContext';
import { getThemeColors } from '../../../theme/tokens/colors';

export type BadgeDomain = 'declaration' | 'ohCoordination' | 'capa';

export interface AesStatusBadgeProps {
  status: string;
  domain: BadgeDomain;
  accessibilityLabel?: string;
  testID?: string;
}

export const AesStatusBadge: React.FC<AesStatusBadgeProps> = ({
  status,
  domain,
  accessibilityLabel,
  testID,
}) => {
  const { colors, isDark } = useTheme();
  const statusColors = getStatusColors(status, domain, colors, isDark);

  let label: string;
  if (domain === 'declaration') {
    label = (t as any)(`status.${status}`) ?? status;
  } else if (domain === 'ohCoordination') {
    label = (t as any)(`oh.status.${status}`) ?? status;
  } else {
    label = (t as any)(`prevention.detail.status.${status}`) ?? (t as any)(`capa.status.${status}`) ?? status;
  }

  if (
    !label ||
    label === `status.${status}` ||
    label === `oh.status.${status}` ||
    label === `prevention.detail.status.${status}` ||
    label === `capa.status.${status}`
  ) {
    label = status;
  }

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: statusColors.bg,
          borderColor: statusColors.border,
        },
      ]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? label}
      testID={testID ?? 'aes-status-badge'}
    >
      <Text
        style={[styles.text, { color: statusColors.text }]}
        testID={`${testID ?? 'aes-status-badge'}-text`}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  text: {
    fontSize: aesTypography.labelSmall?.fontSize ?? 11,
    fontWeight: '600',
  },
});

function getStatusColors(
  status: string,
  domain: BadgeDomain,
  colors: ReturnType<typeof getThemeColors>,
  isDark: boolean,
) {
  if (!isDark) {
    const colorMap =
      domain === 'declaration'
        ? aesDeclarationStatusColors
        : domain === 'ohCoordination'
          ? aesOhCoordinationStatusColors
          : aesCapaStatusColors;
    return (
      (colorMap as Record<string, { bg: string; text: string; border: string }>)[status] ?? {
        bg: '#EEEEEE',
        text: '#616161',
        border: '#E0E0E0',
      }
    );
  }

  if (status === 'closed' || status === 'completed') {
    return {
      bg: colors.secondary,
      text: colors.secondaryForeground,
      border: colors.success,
    };
  }
  if (status === 'cancelled' || status === 'correction_requested') {
    return {
      bg: isDark ? colors.destructive : colors.dangerBackground,
      text: isDark ? colors.destructiveForeground : colors.danger,
      border: colors.destructive,
    };
  }
  if (
    status === 'under_review' ||
    status === 'pending_acknowledgement' ||
    status === 'in_progress' ||
    status === 'proposed'
  ) {
    return {
      bg: colors.warningBackground,
      text: colors.warning,
      border: colors.warning,
    };
  }
  if (status === 'submitted' || status === 'resubmitted' || status === 'acknowledged') {
    return {
      bg: colors.infoBackground,
      text: colors.info,
      border: colors.info,
    };
  }
  return {
    bg: colors.muted,
    text: colors.mutedForeground,
    border: colors.border,
  };
}
