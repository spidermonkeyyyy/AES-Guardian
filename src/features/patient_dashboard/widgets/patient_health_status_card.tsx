import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

/**
 * PatientHealthStatusCard — minimal integration card.
 * 
 * Source-backed: derived from Flutter `patient_health_status_card.dart` (real widget).
 * Classification: MIGRATE AS-IS — no placeholder behavior claimed.
 * 
 * RN difference from Flutter: uses plain text instead of themed card.
 * No interactive behavior beyond display.
 */
export const PatientHealthStatusCard: React.FC<{ title?: string; subtitle?: string }> = ({
  title = 'État de santé',
  subtitle = 'Indicateurs respiratoires en temps réel',
}) => {
  const { colors } = useTheme();
  return (
    <View style={{ padding: 12, backgroundColor: colors.card, borderRadius: 8, marginBottom: 12 }}>
      <Text style={{ fontWeight: '500', marginBottom: 4, color: colors.foreground }}>{title}</Text>
      <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>{subtitle}</Text>
    </View>
  );
};