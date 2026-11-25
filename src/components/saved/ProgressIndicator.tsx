import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AppIcon } from '../AppIcon';
import { AppText } from '../AppText';
import { getLayoutRowDirection, useLayoutDirection } from '../../localization';
import { useTheme } from '../../theme/ThemeContext';
import { aesRadii, aesSpacing } from '../../theme/tokens';

const DOT_SIZE = 8;
const DOT_GAP = 24;
const PILL_PADDING = 8;

export interface ProgressIndicatorProps {
  step: number;
  totalSteps: number;
  onStepChange?: (step: number) => void;
  onBack?: () => void;
  onContinue?: () => void;
  onFinish?: () => void;
  backLabel?: string;
  continueLabel?: string;
  finishLabel?: string;
  accessibilityLabel?: string;
  showActions?: boolean;
  disableAnimation?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  step,
  totalSteps,
  onStepChange,
  onBack,
  onContinue,
  onFinish,
  backLabel = 'Back',
  continueLabel = 'Continue',
  finishLabel = 'Finish',
  accessibilityLabel,
  showActions = true,
  disableAnimation = false,
  style,
  testID,
}) => {
  const { colors } = useTheme();
  const direction = useLayoutDirection();
  const reducedMotion = useReducedMotion();
  const safeTotal = Math.max(1, Math.floor(Number.isFinite(totalSteps) ? totalSteps : 1));
  const safeStep = Math.max(1, Math.min(Math.floor(Number.isFinite(step) ? step : 1), safeTotal));
  const isExpanded = safeStep === 1;
  const targetOverlayWidth =
    safeStep * DOT_SIZE + Math.max(safeStep - 1, 0) * DOT_GAP + PILL_PADDING * 2;

  const overlayWidth = useSharedValue(targetOverlayWidth);
  const backProgress = useSharedValue(isExpanded ? 0 : 1);
  const checkProgress = useSharedValue(safeStep === safeTotal ? 1 : 0);

  React.useEffect(() => {
    if (reducedMotion || disableAnimation) {
      overlayWidth.value = targetOverlayWidth;
      backProgress.value = isExpanded ? 0 : 1;
      checkProgress.value = safeStep === safeTotal ? 1 : 0;
      return;
    }
    overlayWidth.value = withSpring(targetOverlayWidth, { stiffness: 300, damping: 20, mass: 0.8 });
    backProgress.value = withSpring(isExpanded ? 0 : 1, { stiffness: 400, damping: 18, mass: 0.8 });
    checkProgress.value =
      safeStep === safeTotal
        ? withSpring(1, { stiffness: 500, damping: 15, mass: 0.5 })
        : withTiming(0, { duration: 150 });
  }, [backProgress, checkProgress, disableAnimation, isExpanded, overlayWidth, reducedMotion, safeStep, safeTotal, targetOverlayWidth]);

  const handleContinue = () => {
    if (safeStep < safeTotal) {
      const next = safeStep + 1;
      onStepChange?.(next);
      onContinue?.();
      return;
    }
    onFinish?.();
  };

  const handleBack = () => {
    if (safeStep > 1) {
      const next = safeStep - 1;
      onStepChange?.(next);
      onBack?.();
    }
  };

  const overlayStyle = useAnimatedStyle(() => ({ width: overlayWidth.value }));
  const backButtonWrapStyle = useAnimatedStyle(() => ({
    opacity: backProgress.value,
    width: backProgress.value * 92,
    marginEnd: backProgress.value * 8,
    transform: [{ scale: 0.85 + backProgress.value * 0.15 }],
  }));
  const checkIconStyle = useAnimatedStyle(() => ({
    opacity: checkProgress.value,
    transform: [{ scale: checkProgress.value }],
  }));
  const rowDirection = getLayoutRowDirection(direction);

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ min: 1, max: safeTotal, now: safeStep, text: `${safeStep} / ${safeTotal}` }}
        style={[styles.dotsRow, { flexDirection: rowDirection }]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.progressOverlay,
            { backgroundColor: colors.success },
            direction === 'rtl' ? styles.overlayRtl : styles.overlayLtr,
            overlayStyle,
          ]}
        />
        {Array.from({ length: safeTotal }, (_, index) => index + 1).map((dot) => (
          <View
            key={dot}
            accessibilityElementsHidden
            importantForAccessibility="no"
            style={[
              styles.dot,
              { backgroundColor: dot <= safeStep ? colors.primaryForeground : colors.border },
            ]}
          />
        ))}
      </View>

      {showActions ? (
        <View style={[styles.actionsContainer, { flexDirection: rowDirection }]}>
          <Animated.View
            pointerEvents={isExpanded ? 'none' : 'auto'}
            style={[styles.backAnimatedWrap, backButtonWrapStyle]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={backLabel}
              disabled={isExpanded}
              onPress={handleBack}
              style={({ pressed }) => [
                styles.backButton,
                { backgroundColor: colors.muted, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <AppText variant="button" style={[styles.backText, { color: colors.foreground }]}>{backLabel}</AppText>
            </Pressable>
          </Animated.View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={safeStep === safeTotal ? finishLabel : continueLabel}
            onPress={handleContinue}
            style={({ pressed }) => [
              styles.continueButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 },
            ]}
          >
            <View style={[styles.continueContent, { flexDirection: rowDirection }]}>
              {safeStep === safeTotal ? (
                <Animated.View style={checkIconStyle}>
                  <AppIcon name="check-circle" size={16} color={colors.primaryForeground} decorative />
                </Animated.View>
              ) : null}
              <AppText variant="button" tone="inverse" style={styles.continueText}>
                {safeStep === safeTotal ? finishLabel : continueLabel}
              </AppText>
            </View>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
};

ProgressIndicator.displayName = 'ProgressIndicator';

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: aesSpacing['3xl'], justifyContent: 'center', width: '100%' },
  dotsRow: { alignItems: 'center', gap: DOT_GAP, justifyContent: 'center', minHeight: 24, paddingHorizontal: PILL_PADDING, position: 'relative' },
  dot: { borderRadius: DOT_SIZE / 2, height: DOT_SIZE, width: DOT_SIZE, zIndex: 1 },
  progressOverlay: { borderRadius: aesRadii.pill, height: 24, position: 'absolute', top: 0 },
  overlayLtr: { left: 0 },
  overlayRtl: { right: 0 },
  actionsContainer: { alignItems: 'center', maxWidth: 384, width: '100%' },
  backAnimatedWrap: { overflow: 'hidden' },
  backButton: { alignItems: 'center', borderRadius: aesRadii.pill, borderWidth: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: aesSpacing.lg, paddingVertical: aesSpacing.md, width: '100%' },
  backText: { fontSize: 14, fontWeight: '600' },
  continueButton: { alignItems: 'center', borderRadius: aesRadii.pill, flex: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: aesSpacing.lg, paddingVertical: aesSpacing.md },
  continueContent: { alignItems: 'center', gap: aesSpacing.sm, justifyContent: 'center' },
  continueText: { fontSize: 14, fontWeight: '600' },
});

export default ProgressIndicator;
