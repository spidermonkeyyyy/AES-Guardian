import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon, { AppIconName } from '../components/AppIcon';
import AppText from '../components/AppText';
import { LayoutDirection, useLayoutDirection } from '../localization';
import { useTheme } from '../theme/ThemeContext';

export interface LiquidNavigationItem {
  key: string;
  label: string;
  icon: AppIconName;
  accessibilityLabel: string;
  accessibilityHint?: string;
}

export interface LiquidGlassNavigationProps {
  items: LiquidNavigationItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  accessibilityLabel: string;
}

function getPhysicalItems(
  items: LiquidNavigationItem[],
  direction: LayoutDirection,
): LiquidNavigationItem[] {
  return direction === 'rtl' ? [...items].reverse() : items;
}

export function LiquidGlassNavigation({
  items,
  activeKey,
  onSelect,
  accessibilityLabel,
}: LiquidGlassNavigationProps) {
  const { colors, isDark } = useTheme();
  const direction = useLayoutDirection();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const [surfaceWidth, setSurfaceWidth] = useState(screenWidth - 24);
  const physicalItems = useMemo(
    () => getPhysicalItems(items, direction),
    [direction, items],
  );
  const activeIndex = physicalItems.findIndex((item) => item.key === activeKey);
  const itemWidth = Math.max(0, (surfaceWidth - 10) / Math.max(physicalItems.length, 1));
  const indicatorIndex = useSharedValue(Math.max(activeIndex, 0));

  useEffect(() => {
    if (activeIndex < 0 || indicatorIndex.value === activeIndex) return;
    indicatorIndex.value = reduceMotion
      ? activeIndex
      : withSpring(activeIndex, { damping: 20, stiffness: 190, mass: 0.7 });
  }, [activeIndex, indicatorIndex, reduceMotion]);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    const distance = Math.abs(indicatorIndex.value - activeIndex);
    const stretch = reduceMotion || activeIndex < 0
      ? 1
      : 1 + Math.min(distance * 0.14, 0.28);
    return {
      transform: [
        { translateX: indicatorIndex.value * itemWidth },
        { scaleX: stretch },
      ],
    };
  }, [activeIndex, itemWidth, reduceMotion]);

  if (items.length === 0) return null;

  const selectedColor = colors.primary;
  const surfaceBackground = isDark
    ? 'rgba(45, 58, 46, 0.96)'
    : 'rgba(248, 245, 240, 0.96)';
  const indicatorBackground = isDark
    ? 'rgba(76, 175, 80, 0.20)'
    : 'rgba(46, 125, 50, 0.12)';

  return (
    <View
      style={[
        styles.dock,
        { paddingBottom: Math.max(insets.bottom, 8) },
      ]}
      pointerEvents="box-none"
    >
      <View
        accessibilityRole="tablist"
        accessibilityLabel={accessibilityLabel}
        onLayout={(event) => {
          const nextWidth = event.nativeEvent.layout.width;
          setSurfaceWidth((current) => Math.abs(current - nextWidth) > 0.5 ? nextWidth : current);
        }}
        style={[
          styles.surface,
          {
            backgroundColor: surfaceBackground,
            borderColor: colors.border,
          },
        ]}
        testID="liquid-glass-navigation"
      >
        <View
          pointerEvents="none"
          style={[styles.topReflection, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.72)' }]}
        />
        {activeIndex >= 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.activeIndicator,
              {
                width: itemWidth,
                backgroundColor: indicatorBackground,
                borderColor: isDark ? 'rgba(129,199,132,0.26)' : 'rgba(46,125,50,0.18)',
              },
              animatedIndicatorStyle,
            ]}
            testID="liquid-glass-active-indicator"
          >
            <View
              pointerEvents="none"
              style={[
                styles.indicatorReflection,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.64)' },
              ]}
            />
          </Animated.View>
        ) : null}
        <View style={styles.itemsRow}>
          {physicalItems.map((item) => {
            const selected = item.key === activeKey;
            return (
              <Pressable
                key={item.key}
                accessibilityRole="tab"
                accessibilityLabel={item.accessibilityLabel}
                accessibilityHint={item.accessibilityHint}
                accessibilityState={{ selected }}
                onPress={() => onSelect(item.key)}
                style={styles.item}
                testID={`liquid-nav-item-${item.key}`}
              >
                <AppIcon
                  name={item.icon}
                  size={20}
                  color={selected ? selectedColor : colors.mutedForeground}
                  decorative
                />
                <AppText
                  allowFontScaling
                  maxFontSizeMultiplier={1.5}
                  numberOfLines={2}
                  style={[
                    styles.label,
                    { color: selected ? colors.foreground : colors.mutedForeground },
                  ]}
                  testID={`liquid-nav-label-${item.key}`}
                >
                  {item.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    paddingTop: 8,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
  },
  surface: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: 68,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 5,
    shadowColor: '#07120A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 10,
  },
  topReflection: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 1,
  },
  itemsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  activeIndicator: {
    position: 'absolute',
    top: 5,
    bottom: 5,
    left: 5,
    borderRadius: 23,
    borderWidth: StyleSheet.hairlineWidth,
  },
  indicatorReflection: {
    position: 'absolute',
    top: 1,
    left: 12,
    right: 12,
    height: StyleSheet.hairlineWidth,
    borderRadius: 2,
  },
  item: {
    flex: 1,
    minWidth: 48,
    minHeight: 56,
    paddingHorizontal: 2,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: 22,
  },
  label: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default LiquidGlassNavigation;
