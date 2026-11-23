import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { colors, typography, shapes, spacing } from '../../../theme/tokens';

const TOKENS = [
  { label: 'Primary', value: colors.primary },
  { label: 'Secondary', value: colors.secondary },
  { label: 'Accent', value: colors.accent },
  { label: 'Surface', value: colors.surface },
  { label: 'Card', value: colors.card },
  { label: 'Foreground', value: colors.foreground },
  { label: 'Muted', value: colors.mutedForeground },
];

export default function DesignSystemScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Sanad Design System</Text>
      <Text style={styles.subheading}>Phase 2A.1 — Tokens only. No behavior claims.</Text>

      <Text style={styles.section}>Colors</Text>
      <View style={styles.swatchRow}>
        {TOKENS.map((t) => (
          <View key={t.label} style={styles.swatchBlock}>
            <View style={[styles.swatch, { backgroundColor: t.value }]} />
            <Text style={styles.swatchLabel}>{t.label}</Text>
            <Text style={styles.swatchValue}>{t.value}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.section}>Typography</Text>
      <Text style={[styles.sample, { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold }]}>
        Urbanist 3XL Bold
      </Text>
      <Text style={[styles.sample, { fontFamily: typography.fontFamily.openSans, fontSize: typography.fontSize.lg, color: colors.mutedForeground }]}>
        OpenSans LG — muted foreground
      </Text>

      <Text style={styles.section}>Shapes</Text>
      <View style={styles.shapeRow}>
        {Object.entries(shapes).map(([key, val]) => (
          <View key={key} style={[styles.shapeBlock, { width: Number(val) * 3, height: Number(val) * 3, borderRadius: Number(val) as any }]} />
        ))}
      </View>
    </ScrollView>
  );
}

function createStyles(themeColors: any) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: themeColors.surface },
  content: { padding: spacing[6], gap: spacing[6] },
  heading: { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: themeColors.foreground },
  subheading: { fontFamily: typography.fontFamily.openSans, fontSize: typography.fontSize.md, color: themeColors.mutedForeground },
  section: { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.semibold, color: themeColors.foreground },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[4] },
  swatchBlock: { alignItems: 'center', gap: spacing[1] },
  swatch: { width: 60, height: 60, borderRadius: shapes.md },
  swatchLabel: { color: themeColors.foreground, fontFamily: typography.fontFamily.openSans, fontSize: typography.fontSize.xs },
  swatchValue: { color: themeColors.mutedForeground, fontFamily: typography.fontFamily.openSans, fontSize: typography.fontSize.xs },
  sample: { padding: spacing[3], backgroundColor: themeColors.card, borderRadius: shapes.md },
  shapeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing[3] },
  shapeBlock: { backgroundColor: themeColors.primary },
});
}
