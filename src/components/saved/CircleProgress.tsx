import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { AppText } from '../AppText';
import { useTheme } from '../../theme/ThemeContext';
import { aesSpacing } from '../../theme/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface CircleProgressProps {
  value: number;
  maxValue: number;
  size?: number;
  strokeWidth?: number;
  showValue?: boolean;
  description?: React.ReactNode;
  suffix?: string;
  counterClockwise?: boolean;
  onColorChange?: (color: string) => void;
  onValueChange?: (value: number, percentage: number) => void;
  getColor?: (fillPercentage: number) => string;
  style?: StyleProp<ViewStyle>;
  animationDuration?: number;
  disableAnimation?: boolean;
  useGradient?: boolean;
  gradientColors?: string[];
  gradientId?: string;
  accessibilityLabel?: string;
  accessibilityValueText?: string;
  testID?: string;
}

function safeFiniteNumber(value: number): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export const CircleProgress: React.FC<CircleProgressProps> = ({
  value,
  maxValue,
  size = 40,
  strokeWidth = 3,
  showValue = false,
  description,
  suffix = '',
  counterClockwise = false,
  onColorChange,
  onValueChange,
  getColor,
  style,
  animationDuration = 300,
  disableAnimation = false,
  useGradient = false,
  gradientColors,
  gradientId,
  accessibilityLabel,
  accessibilityValueText,
  testID,
}) => {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const safeValue = safeFiniteNumber(value);
  const safeMax = safeFiniteNumber(maxValue);
  const usableMax = safeMax !== null && safeMax > 0 ? safeMax : 0;
  const usableValue = safeValue !== null ? Math.max(0, Math.min(safeValue, usableMax)) : 0;
  const fillPercentage = usableMax > 0 ? Math.max(0, Math.min(usableValue / usableMax, 1)) : 0;
  const skipAnimation = disableAnimation || Boolean(reducedMotion);
  const uniqueGradientId = React.useRef(
    gradientId || `circle-progress-gradient-${Math.random().toString(36).substring(2, 9)}`,
  ).current;
  const radius = Math.max((size - strokeWidth) / 2, 1);
  const circumference = 2 * Math.PI * radius;
  const animatedFraction = useSharedValue(skipAnimation ? fillPercentage : 0);

  React.useEffect(() => {
    if (skipAnimation) {
      animatedFraction.value = fillPercentage;
      return;
    }
    animatedFraction.value = withTiming(fillPercentage, {
      duration: animationDuration,
      easing: Easing.out(Easing.quad),
    });
  }, [animatedFraction, animationDuration, fillPercentage, skipAnimation]);

  const currentColor = useGradient
    ? ''
    : getColor
      ? getColor(fillPercentage)
      : fillPercentage < 0.7
        ? colors.success
        : fillPercentage < 0.9
          ? colors.warning
          : colors.destructive;

  React.useEffect(() => {
    onColorChange?.(currentColor);
  }, [currentColor, onColorChange]);

  React.useEffect(() => {
    onValueChange?.(usableValue, fillPercentage);
  }, [fillPercentage, onValueChange, usableValue]);

  const animatedCircleProps = useAnimatedProps(() => {
    const dashOffset = circumference * (1 - animatedFraction.value);
    return { strokeDashoffset: counterClockwise ? -dashOffset : dashOffset };
  }, [circumference, counterClockwise]);

  const resolvedStops = gradientColors && gradientColors.length > 0
    ? gradientColors
    : [colors.primary];
  const valueText = accessibilityValueText ||
    `${usableValue}${suffix} out of ${usableMax}${suffix}, ${Math.round(fillPercentage * 100)}% complete`;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{
        min: 0,
        max: usableMax,
        now: usableValue,
        text: valueText,
      }}
      style={[styles.wrapper, style]}
      testID={testID}
    >
      <View style={[styles.ringContainer, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {useGradient ? (
            <Defs>
              <LinearGradient id={uniqueGradientId} gradientUnits="userSpaceOnUse" x1="0%" y1="0%" x2="100%" y2="100%">
                {resolvedStops.map((stopColor, index) => (
                  <Stop
                    key={`${stopColor}-${index}`}
                    offset={`${resolvedStops.length === 1 ? 0 : (index / (resolvedStops.length - 1)) * 100}%`}
                    stopColor={stopColor}
                  />
                ))}
              </LinearGradient>
            </Defs>
          ) : null}
          <Circle cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke={colors.border} strokeWidth={strokeWidth} />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={useGradient ? `url(#${uniqueGradientId})` : currentColor}
            strokeWidth={strokeWidth}
            strokeDasharray={[circumference, circumference]}
            animatedProps={animatedCircleProps}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap="round"
          />
        </Svg>
        {showValue ? (
          <View pointerEvents="none" style={styles.centerOverlay}>
            <AppText variant="caption" style={[styles.valueLabel, { color: colors.foreground, fontSize: Math.max(10, Math.round(size * 0.24)) }]}>
              {`${usableValue}${suffix}`}
            </AppText>
          </View>
        ) : null}
      </View>
      {description ? (
        <View style={styles.descriptionWrap}>
          {typeof description === 'string' || typeof description === 'number'
            ? <AppText variant="caption" tone="muted">{description}</AppText>
            : description}
        </View>
      ) : null}
    </View>
  );
};

CircleProgress.displayName = 'CircleProgress';

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  ringContainer: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  centerOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  valueLabel: { fontWeight: '600' },
  descriptionWrap: { marginTop: aesSpacing.xs },
});

export default CircleProgress;
