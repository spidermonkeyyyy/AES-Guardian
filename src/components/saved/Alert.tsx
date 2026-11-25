import React from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { AppIcon } from '../AppIcon';
import { AppText } from '../AppText';
import { getLayoutRowDirection, getLayoutTextAlign, useLayoutDirection } from '../../localization';
import { useTheme } from '../../theme/ThemeContext';
import { aesRadii, aesSpacing } from '../../theme/tokens';

export type AlertVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'error'
  | 'success'
  | 'warning'
  | 'info';

export type AlertLayout = 'block' | 'inline';

interface AlertContextValue {
  variant: AlertVariant;
  accentColor: string;
  isInline: boolean;
}

const AlertContext = React.createContext<AlertContextValue>({
  variant: 'default',
  accentColor: '#3e2723',
  isInline: false,
});

const sessionDismissedKeys = new Set<string>();
const ALERT_PERSIST_PREFIX = '@sanad/alert-dismissed:';
const INLINE_BREAKPOINT = 460;

export interface AlertProps {
  variant?: AlertVariant;
  layout?: AlertLayout;
  dismissible?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  persistKey?: string;
  persistStorage?: 'local' | 'session';
  closeLabel?: string;
  accessibilityRole?: 'alert' | 'none' | 'summary';
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  testID?: string;
}

export function Alert({
  variant = 'default',
  layout = 'block',
  dismissible = false,
  open,
  onOpenChange,
  persistKey,
  persistStorage = 'local',
  closeLabel = 'Dismiss',
  accessibilityRole = 'alert',
  style,
  children,
  testID,
}: AlertProps) {
  const { colors } = useTheme();
  const direction = useLayoutDirection();
  const reducedMotion = useReducedMotion();

  const [internalOpen, setInternalOpen] = React.useState(true);
  const [persistedLoaded, setPersistedLoaded] = React.useState(!persistKey);
  const [persistedOpen, setPersistedOpen] = React.useState(true);
  const [isUnmounted, setIsUnmounted] = React.useState(false);
  const [containerWidth, setContainerWidth] = React.useState(0);

  const isControlled = open !== undefined;
  const usingPersisted = !isControlled && Boolean(persistKey);

  React.useEffect(() => {
    let active = true;
    if (!persistKey) {
      setPersistedLoaded(true);
      return () => {
        active = false;
      };
    }

    if (persistStorage === 'session') {
      setPersistedOpen(!sessionDismissedKeys.has(persistKey));
      setPersistedLoaded(true);
      return () => {
        active = false;
      };
    }

    AsyncStorage.getItem(`${ALERT_PERSIST_PREFIX}${persistKey}`)
      .then((stored) => {
        if (!active) return;
        setPersistedOpen(stored !== 'true');
        setPersistedLoaded(true);
      })
      .catch(() => {
        if (active) setPersistedLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [persistKey, persistStorage]);

  const actualOpen = isControlled
    ? open
    : usingPersisted
      ? persistedLoaded && persistedOpen
      : internalOpen;

  const opacity = useSharedValue(actualOpen ? 1 : 0);
  const scale = useSharedValue(actualOpen ? 1 : 0.88);
  const maxHeight = useSharedValue(actualOpen ? 1000 : 0);
  const measuredHeightRef = React.useRef<number>(0);

  React.useEffect(() => {
    if (actualOpen) {
      setIsUnmounted(false);
      if (reducedMotion) {
        opacity.value = 1;
        scale.value = 1;
        maxHeight.value = 1000;
      } else {
        opacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
        scale.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
        maxHeight.value = measuredHeightRef.current > 0 ? measuredHeightRef.current : 1000;
      }
      return;
    }

    if (reducedMotion) {
      opacity.value = 0;
      scale.value = 1;
      maxHeight.value = 0;
      setIsUnmounted(true);
      return;
    }

    const startHeight = measuredHeightRef.current > 0 ? measuredHeightRef.current : 300;
    maxHeight.value = startHeight;
    opacity.value = withTiming(0, { duration: 320, easing: Easing.bezier(0.4, 0, 0.2, 1) });
    scale.value = withTiming(0.88, { duration: 320, easing: Easing.bezier(0.4, 0, 0.2, 1) });
    maxHeight.value = withDelay(
      180,
      withTiming(0, { duration: 300, easing: Easing.bezier(0.4, 0, 0.2, 1) }, (finished) => {
        if (finished) runOnJS(setIsUnmounted)(true);
      }),
    );
  }, [actualOpen, maxHeight, opacity, reducedMotion, scale]);

  const handleDismiss = React.useCallback(() => {
    if (isControlled) {
      onOpenChange?.(false);
      return;
    }
    if (usingPersisted && persistKey) {
      setPersistedOpen(false);
      if (persistStorage === 'session') {
        sessionDismissedKeys.add(persistKey);
      } else {
        void AsyncStorage.setItem(`${ALERT_PERSIST_PREFIX}${persistKey}`, 'true').catch(() => {});
      }
    } else {
      setInternalOpen(false);
    }
    onOpenChange?.(false);
  }, [isControlled, onOpenChange, persistKey, persistStorage, usingPersisted]);

  const variantPalette = React.useMemo(() => {
    switch (variant) {
      case 'primary':
        return { bg: colors.secondary, border: colors.primary, accent: colors.primary };
      case 'secondary':
        return { bg: colors.muted, border: colors.border, accent: colors.secondaryForeground };
      case 'error':
        return { bg: colors.dangerBackground, border: colors.destructive, accent: colors.danger };
      case 'success':
        return { bg: colors.secondary, border: colors.success, accent: colors.success };
      case 'warning':
        return { bg: colors.warningBackground, border: colors.warning, accent: colors.warning };
      case 'info':
        return { bg: colors.infoBackground, border: colors.info, accent: colors.info };
      default:
        return { bg: colors.card, border: colors.border, accent: colors.foreground };
    }
  }, [colors, variant]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    maxHeight: maxHeight.value,
    transform: [{ scale: scale.value }],
  }));

  const isInline = layout === 'inline' && containerWidth >= INLINE_BREAKPOINT;
  const childNodes = React.Children.toArray(children);
  const iconNodes: React.ReactNode[] = [];
  const titleNodes: React.ReactNode[] = [];
  const descriptionNodes: React.ReactNode[] = [];
  const actionNodes: React.ReactNode[] = [];
  const otherNodes: React.ReactNode[] = [];

  childNodes.forEach((child) => {
    if (React.isValidElement(child)) {
      const slot = (child.type as { displayName?: string }).displayName;
      if (slot === 'AlertIcon') {
        iconNodes.push(child);
        return;
      }
      if (slot === 'AlertTitle') {
        titleNodes.push(child);
        return;
      }
      if (slot === 'AlertDescription') {
        descriptionNodes.push(child);
        return;
      }
      if (slot === 'AlertAction') {
        actionNodes.push(child);
        return;
      }
    }
    otherNodes.push(child);
  });

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width !== containerWidth) setContainerWidth(width);
    if (height > 0 && actualOpen) measuredHeightRef.current = height;
  };

  if (!persistedLoaded || (!actualOpen && isUnmounted)) return null;
  const rowDirection = getLayoutRowDirection(direction);

  return (
    <AlertContext.Provider value={{ variant, accentColor: variantPalette.accent, isInline }}>
      <Animated.View style={[styles.outerClip, animatedContainerStyle]} testID={testID}>
        <View
          accessibilityRole={accessibilityRole}
          onLayout={handleLayout}
          style={[
            styles.container,
            { backgroundColor: variantPalette.bg, borderColor: variantPalette.border },
            style,
          ]}
        >
          {isInline ? (
            <View style={[styles.inlineRow, { flexDirection: rowDirection }]}>
              {iconNodes}
              <View style={[styles.inlineContent, { flexDirection: rowDirection }]}>
                {titleNodes}
                <View style={styles.inlineDescriptionWrap}>{descriptionNodes}</View>
                {otherNodes}
              </View>
              {actionNodes}
              {dismissible ? <CloseButton closeLabel={closeLabel} onPress={handleDismiss} color={colors.mutedForeground} /> : null}
            </View>
          ) : (
            <View style={styles.blockColumn}>
              <View style={[styles.blockHeaderRow, { flexDirection: rowDirection }]}>
                {iconNodes}
                <View style={styles.blockBody}>
                  {titleNodes.length > 0 ? <View style={styles.titleWrap}>{titleNodes}</View> : null}
                  {descriptionNodes}
                  {otherNodes}
                </View>
                {dismissible ? (
                  <CloseButton closeLabel={closeLabel} onPress={handleDismiss} color={colors.mutedForeground} style={styles.blockCloseButton} />
                ) : null}
              </View>
              {actionNodes.length > 0 ? <View style={styles.blockActions}>{actionNodes}</View> : null}
            </View>
          )}
        </View>
      </Animated.View>
    </AlertContext.Provider>
  );
}

Alert.displayName = 'Alert';

function CloseButton({ closeLabel, onPress, color, style }: { closeLabel: string; onPress: () => void; color: string; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={closeLabel}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed, style]}
      testID="alert-close"
    >
      <AppIcon name="cancel" size={16} color={color} decorative />
    </Pressable>
  );
}

export interface AlertIconProps { children?: React.ReactNode; style?: StyleProp<ViewStyle> }

export function AlertIcon({ children, style }: AlertIconProps) {
  const { accentColor } = React.useContext(AlertContext);
  const coloredChild = React.useMemo(() => {
    if (!React.isValidElement<{ color?: string; size?: number | string }>(children)) return children;
    return React.cloneElement(children, {
      color: children.props.color ?? accentColor,
      size: children.props.size ?? 20,
    });
  }, [accentColor, children]);
  return <View style={[styles.iconSlot, style]}>{coloredChild}</View>;
}

AlertIcon.displayName = 'AlertIcon';

export interface AlertTitleProps { as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div'; children?: React.ReactNode; style?: StyleProp<TextStyle> }

export function AlertTitle({ children, style }: AlertTitleProps) {
  const { isInline } = React.useContext(AlertContext);
  const direction = useLayoutDirection();
  return (
    <AppText variant="card" accessibilityRole="header" style={[styles.title, isInline && styles.titleInline, { textAlign: getLayoutTextAlign(direction) }, style]}>
      {children}
    </AppText>
  );
}

AlertTitle.displayName = 'AlertTitle';

export interface AlertDescriptionProps { children?: React.ReactNode; style?: StyleProp<TextStyle> }

export function AlertDescription({ children, style }: AlertDescriptionProps) {
  const { isInline } = React.useContext(AlertContext);
  const direction = useLayoutDirection();
  return (
    <AppText variant="body" style={[styles.description, isInline && styles.descriptionInline, { textAlign: getLayoutTextAlign(direction) }, style]}>
      {children}
    </AppText>
  );
}

AlertDescription.displayName = 'AlertDescription';

export interface AlertActionProps { children?: React.ReactNode; style?: StyleProp<ViewStyle> }

export function AlertAction({ children, style }: AlertActionProps) {
  const direction = useLayoutDirection();
  const { isInline } = React.useContext(AlertContext);
  return (
    <View style={[styles.actionRow, { flexDirection: getLayoutRowDirection(direction) }, isInline ? styles.actionRowInline : styles.actionRowBlock, style]}>
      {children}
    </View>
  );
}

AlertAction.displayName = 'AlertAction';

const styles = StyleSheet.create({
  outerClip: { overflow: 'hidden', width: '100%' },
  container: { borderRadius: aesRadii.card, borderWidth: 1, padding: aesSpacing.xl, width: '100%' },
  blockColumn: { width: '100%' },
  blockHeaderRow: { alignItems: 'flex-start', width: '100%' },
  blockBody: { flex: 1, minWidth: 0 },
  titleWrap: { minHeight: 22, justifyContent: 'center' },
  blockActions: { marginTop: aesSpacing.sm },
  inlineRow: { alignItems: 'center', width: '100%' },
  inlineContent: { alignItems: 'center', flex: 1, gap: aesSpacing.md, minWidth: 0 },
  inlineDescriptionWrap: { flex: 1, minWidth: 0 },
  iconSlot: { justifyContent: 'center', marginEnd: aesSpacing.md, minHeight: 22 },
  title: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
  titleInline: { fontSize: 14, lineHeight: 20 },
  description: { fontSize: 14, lineHeight: 20, marginTop: aesSpacing.sm },
  descriptionInline: { marginTop: 0 },
  actionRow: { alignItems: 'center', gap: aesSpacing.sm, justifyContent: 'flex-end' },
  actionRowBlock: { paddingTop: aesSpacing.xs },
  actionRowInline: { marginStart: aesSpacing.md },
  closeButton: { alignItems: 'center', borderRadius: aesRadii.badge, justifyContent: 'center', marginStart: aesSpacing.md, minHeight: 28, minWidth: 28, padding: 4 },
  closeButtonPressed: { opacity: 0.65 },
  blockCloseButton: { marginEnd: -4, marginTop: -4 },
});

export default Alert;
