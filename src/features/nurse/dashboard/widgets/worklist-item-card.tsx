import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../../theme/ThemeContext';
import { NurseWorklistItem } from '../../../../types/dashboard';

const TYPE_LABEL: Record<NurseWorklistItem['type'], string> = {
  alert: 'Alerte',
  monitoring: 'Suivi',
  task: 'Tâche',
};

const PRIORITY_COLOR: Record<string, string> = {
  high: colors.destructive,
  reviewRequired: colors.warning,
  informational: colors.mutedForeground,
};

export function WorklistItemCard({ item, onPress }: { item: NurseWorklistItem; onPress?: (item: NurseWorklistItem) => void }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const color = PRIORITY_COLOR[item.priorityRank != null ? String(item.priorityRank) : 'informational'] ?? colors.mutedForeground;

  return (
    <TouchableOpacity
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`${item.patientName} · ${TYPE_LABEL[item.type]} · ${item.title}. ${item.statusLabel}`}
      onPress={onPress ? () => onPress(item) : undefined}
      disabled={!onPress}
    >
      <View style={styles.topRow}>
        <View style={[styles.badge, { backgroundColor: color + '22' }]}>
          <Text style={[styles.badgeText, { color }]}>{TYPE_LABEL[item.type]}</Text>
        </View>
        <Text style={styles.time}>{formatTime(item.timestamp)}</Text>
      </View>
      <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
      {item.description ? <Text style={styles.desc} numberOfLines={2}>{item.description}</Text> : null}
      <Text style={styles.patient}>{item.patientName}</Text>
      <Text style={styles.status}>{item.statusLabel}{item.isActionable ? ' · Action requise' : ''}</Text>
    </TouchableOpacity>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function createStyles(colors: any) {
  return {
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    fontFamily: 'Urbanist',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  time: {
    fontFamily: 'Urbanist',
    fontSize: 11,
    color: colors.mutedForeground,
  },
  title: {
    fontFamily: 'Urbanist',
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 4,
  },
  desc: {
    fontFamily: 'Urbanist',
    fontSize: 13,
    color: colors.mutedForeground,
    marginBottom: 6,
  },
  patient: {
    fontFamily: 'Urbanist',
    fontSize: 12,
    color: colors.mutedForeground,
    marginBottom: 4,
  },
  status: {
    fontFamily: 'Urbanist',
    fontSize: 12,
    color: colors.mutedForeground,
  },
}

}
