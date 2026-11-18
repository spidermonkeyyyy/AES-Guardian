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

export type BadgeDomain = 'declaration' | 'ohCoordination' | 'capa';

export interface AesStatusBadgeProps {
  status: string;
  domain: BadgeDomain;
  accessibilityLabel?: string;
  testID?: string;
}

const FALLBACK_COLORS = { bg: '#EEEEEE', text: '#616161', border: '#E0E0E0' };

export const AesStatusBadge: React.FC<AesStatusBadgeProps> = ({
  status,
  domain,
  accessibilityLabel,
  testID,
}) => {
  const colorMap =
    domain === 'declaration'
      ? aesDeclarationStatusColors
      : domain === 'ohCoordination'
      ? aesOhCoordinationStatusColors
      : aesCapaStatusColors;

  const colors =
    (colorMap as Record<string, { bg: string; text: string; border: string }>)[status] ??
    FALLBACK_COLORS;

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
          backgroundColor: colors.bg,
          borderColor: colors.border,
        },
      ]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? label}
      testID={testID ?? 'aes-status-badge'}
    >
      <Text
        style={[styles.text, { color: colors.text }]}
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
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: {
    fontSize: aesTypography.labelSmall?.fontSize ?? 11,
    fontWeight: '600',
  },
});
