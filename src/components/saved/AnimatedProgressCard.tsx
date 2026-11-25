import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from '../AppText';
import { getLayoutRowDirection, getLayoutTextAlign, useLayoutDirection } from '../../localization';
import { useTheme } from '../../theme/ThemeContext';
import { aesRadii, aesShadows, aesSpacing } from '../../theme/tokens';

export interface AnimatedProgressCardProps {
  icon: React.ReactNode;
  title: string;
  progressLabel: string;
  progressSubLabel: string;
  currentValue: number;
  maxValue: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

function safeNonNegative(value: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
}

export const AnimatedProgressCard = React.forwardRef<View, AnimatedProgressCardProps>(
  ({ icon, title, progressLabel, progressSubLabel, currentValue, maxValue, style, testID }, ref) => {
    const { colors } = useTheme();
    const direction = useLayoutDirection();
    const reducedMotion = useReducedMotion();
    const safeMax = safeNonNegative(maxValue);
    const safeCurrent = safeMax > 0 ? Math.min(safeNonNegative(currentValue), safeMax) : 0;
    const clampedPercentage = safeMax > 0 ? (safeCurrent / safeMax) * 100 : 0;
    const progressWidth = useSharedValue(reducedMotion ? clampedPercentage : 0);

    React.useEffect(() => {
      if (reducedMotion) {
        progressWidth.value = clampedPercentage;
        return;
      }
      progressWidth.value = withTiming(clampedPercentage, {
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
      });
    }, [clampedPercentage, progressWidth, reducedMotion]);

    const animatedBarStyle = useAnimatedStyle(() => ({ width: `${progressWidth.value}%` }));
    const rowDirection = getLayoutRowDirection(direction);
    const textAlign = getLayoutTextAlign(direction);
    const trackBackground = 'rgba(255, 255, 255, 0.22)';

    return (
      <View
        ref={ref}
        testID={testID}
        style={[styles.card, { backgroundColor: colors.primary, borderColor: colors.border }, style]}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={title}
        accessibilityValue={{ min: 0, max: safeMax, now: safeCurrent, text: `${safeCurrent} / ${safeMax}` }}
      >
        <View style={[styles.headerRow, { flexDirection: rowDirection }]}>
          <View style={[styles.iconBadge, { backgroundColor: trackBackground }]}>{icon}</View>
          <AppText variant="bodyEmphasis" tone="inverse" style={[styles.title, { textAlign }]}>{title}</AppText>
        </View>
        <View style={styles.progressSection}>
          <View style={[styles.progressTrack, { backgroundColor: trackBackground }]}>
            <Animated.View style={[styles.progressFill, { backgroundColor: colors.primaryForeground }, animatedBarStyle]} />
          </View>
        </View>
        <View style={[styles.footerRow, { flexDirection: rowDirection }]}>
          <View style={styles.footerLabels}>
            <AppText variant="caption" style={[styles.progressLabel, { color: colors.primaryForeground, textAlign }]}>{progressLabel}</AppText>
            <AppText variant="body" style={[styles.progressSubLabel, { color: colors.primaryForeground, textAlign }]}>{progressSubLabel}</AppText>
          </View>
          <View style={[styles.valueRow, { flexDirection: rowDirection }]}>
            <AppText variant="title" tone="inverse" style={styles.currentValue}>{safeCurrent}</AppText>
            <AppText variant="subheading" style={[styles.maxValue, { color: colors.primaryForeground }]}>{` / ${safeMax}`}</AppText>
          </View>
        </View>
      </View>
    );
  },
);

AnimatedProgressCard.displayName = 'AnimatedProgressCard';

const styles = StyleSheet.create({
  card: { borderRadius: aesRadii.card, borderWidth: 1, maxWidth: 384, padding: aesSpacing['2xl'], width: '100%', ...aesShadows.raised },
  headerRow: { alignItems: 'center', gap: aesSpacing.md },
  iconBadge: { alignItems: 'center', borderRadius: 16, height: 32, justifyContent: 'center', width: 32 },
  title: { flex: 1, fontWeight: '500' },
  progressSection: { marginVertical: aesSpacing.xl },
  progressTrack: { borderRadius: aesRadii.pill, height: 8, overflow: 'hidden', width: '100%' },
  progressFill: { borderRadius: aesRadii.pill, height: '100%' },
  footerRow: { alignItems: 'flex-end', gap: aesSpacing.md, justifyContent: 'space-between' },
  footerLabels: { flex: 1 },
  progressLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.7, opacity: 0.85, textTransform: 'uppercase' },
  progressSubLabel: { fontSize: 14, opacity: 0.7 },
  valueRow: { alignItems: 'baseline' },
  currentValue: { fontSize: 24, fontWeight: '700', lineHeight: 28 },
  maxValue: { fontSize: 18, fontWeight: '500', lineHeight: 22, opacity: 0.85 },
});

export default AnimatedProgressCard;
