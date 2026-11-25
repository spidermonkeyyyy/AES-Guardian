/**
 * AES Guardian — Status Badge Component
 *
 * Renders a styled status chip for declaration, OH coordination,
 * or CAPA domain statuses using the approved AES color tokens.
 *
 * Phase 2E.1.4.3 — Batch 4
 */

import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { aesTypography } from '../../../theme/tokens';
import { t, type TranslationKey } from '../../../localization';
import { useTheme } from '../../../theme/ThemeContext';
import { getThemeColors } from '../../../theme/tokens/colors';

import AppText from '../../../components/AppText';
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
    label = t(`status.${status}` as TranslationKey);
  } else if (domain === 'ohCoordination') {
    label = t(`oh.status.${status}` as TranslationKey);
  } else {
    label = t(`prevention.detail.status.${status}` as TranslationKey);
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
      <AppText
        style={[styles.text, { color: statusColors.text }]}
        testID={`${testID ?? 'aes-status-badge'}-text`}
      >
        {label}
      </AppText>
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
  const domainStatuses: Record<BadgeDomain, readonly string[]> = {
    declaration: ['draft', 'submitted', 'under_review', 'correction_requested', 'resubmitted', 'closed'],
    ohCoordination: ['pending_acknowledgement', 'acknowledged', 'completed', 'cancelled'],
    capa: ['proposed', 'in_progress', 'completed', 'cancelled'],
  };
  if (!domainStatuses[domain].includes(status)) {
    return {
      bg: colors.muted,
      text: colors.mutedForeground,
      border: colors.border,
    };
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
      bg: colors.dangerBackground,
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
      text: colors.foreground,
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
