import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../../../theme/ThemeContext';
import { NurseWorklistFilter } from '../../../../types/dashboard';
import { spacing, typography, shapes } from '../../../../theme/tokens';

const FILTER_LABEL: Record<NurseWorklistFilter, string> = {
  all: 'Tout',
  alerts: 'Alertes',
  tasks: 'Tâches',
  monitoring: 'Suivis',
  needsAttention: 'À traiter',
};

export function WorklistFilterBar({
  selected,
  counts,
  onSelected,
}: {
  selected: NurseWorklistFilter;
  counts: Partial<Record<NurseWorklistFilter, number>>;
  onSelected: (filter: NurseWorklistFilter) => void;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const filters: NurseWorklistFilter[] = ['all', 'alerts', 'tasks', 'monitoring', 'needsAttention'];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {filters.map((f) => {
        const active = f === selected;
        return (
          <TouchableOpacity
            key={f}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${FILTER_LABEL[f]}${counts[f] != null ? `, ${counts[f]}` : ''}`}
            onPress={() => onSelected(f)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {FILTER_LABEL[f]}{counts[f] != null ? ` · ${counts[f]}` : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.muted,
  },
  chipActive: {
    backgroundColor: colors.info,
    borderColor: colors.info,
  },
  chipText: {
    fontFamily: 'Urbanist',
    fontSize: 13,
    color: colors.mutedForeground,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.primaryForeground,
  },
});

}
