import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { colors, typography, shapes, spacing } from '../../../theme/tokens';

import AppText from '../../../components/AppText';
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
      <AppText style={styles.heading}>Sanad Design System</AppText>
      <AppText style={styles.subheading}>Phase 2A.1 — Tokens only. No behavior claims.</AppText>

      <AppText style={styles.section}>Colors</AppText>
      <View style={styles.swatchRow}>
        {TOKENS.map((t) => (
          <View key={t.label} style={styles.swatchBlock}>
            <View style={[styles.swatch, { backgroundColor: t.value }]} />
            <AppText style={styles.swatchLabel}>{t.label}</AppText>
            <AppText style={styles.swatchValue}>{t.value}</AppText>
          </View>
        ))}
      </View>

      <AppText style={styles.section}>Typography</AppText>
      <AppText style={[styles.sample, { fontFamily: typography.fontFamily.heading, fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold }]}>
        Readex Pro 3XL Semibold
      </AppText>
      <AppText style={[styles.sample, { fontFamily: typography.fontFamily.body, fontSize: typography.fontSize.lg, color: colors.mutedForeground }]}>
        IBM Plex Sans LG — muted foreground
      </AppText>

      <AppText style={styles.section}>Shapes</AppText>
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
  heading: { fontFamily: typography.fontFamily.heading, fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: themeColors.foreground },
  subheading: { fontFamily: typography.fontFamily.body, fontSize: typography.fontSize.md, color: themeColors.mutedForeground },
  section: { fontFamily: typography.fontFamily.heading, fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.semibold, color: themeColors.foreground },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[4] },
  swatchBlock: { alignItems: 'center', gap: spacing[1] },
  swatch: { width: 60, height: 60, borderRadius: shapes.md },
  swatchLabel: { color: themeColors.foreground, fontFamily: typography.fontFamily.body, fontSize: typography.fontSize.xs },
  swatchValue: { color: themeColors.mutedForeground, fontFamily: typography.fontFamily.body, fontSize: typography.fontSize.xs },
  sample: { padding: spacing[3], backgroundColor: themeColors.card, borderRadius: shapes.md },
  shapeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing[3] },
  shapeBlock: { backgroundColor: themeColors.primary },
});
}
