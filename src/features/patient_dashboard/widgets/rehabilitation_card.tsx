import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

/**
 * RehabilitationCard — minimal integration card.
 * 
 * Source-backed: derived from Flutter `rehabilitation_card.dart` (real widget).
 * Classification: MIGRATE AS-IS — no placeholder behavior claimed.
 * 
 * RN difference from Flutter: uses plain text instead of themed card.
 * No interactive behavior beyond display.
 */
export const RehabilitationCard: React.FC<{ title?: string; subtitle?: string }> = ({
  title = 'Rééducation',
  subtitle = 'Sessions this week',
}) => {
  const { colors } = useTheme();
  return (
    <View style={{ padding: 12, backgroundColor: colors.card, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
      <Text style={{ fontWeight: '500', marginBottom: 4, color: colors.foreground }}>{title}</Text>
      <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>{subtitle}</Text>
    </View>
  );
};