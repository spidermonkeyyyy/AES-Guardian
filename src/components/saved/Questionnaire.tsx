import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { AppButton } from '../AppButton';
import { AppIcon } from '../AppIcon';
import { AppText } from '../AppText';
import { getLayoutRowDirection, getLayoutTextAlign, useLayoutDirection } from '../../localization';
import { useTheme } from '../../theme/ThemeContext';
import { aesRadii, aesSpacing } from '../../theme/tokens';

export type QuestionnaireItemConfig = {
  name: string;
  required?: boolean;
  multiple?: boolean;
  disabled?: boolean;
};

export type QuestionnaireState = {
  current: number;
  total: number;
};

export type QuestionnaireValues = Record<string, string | string[]>;

export type QuestionnaireProgressA11yProps = {
  accessible: true;
  accessibilityRole: 'progressbar';
  accessibilityValue: {
    min: number;
    max: number;
    now: number;
    text: string;
  };
};

type QuestionnaireContextValue = {
  items: QuestionnaireItemConfig[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  values: QuestionnaireValues;
  setValue: (name: string, value: string, multiple: boolean) => void;
  attemptedAdvance: boolean;
  setAttemptedAdvance: (value: boolean) => void;
  disabled: boolean;
  submit: () => void;
};

const QuestionnaireContext = React.createContext<QuestionnaireContextValue | null>(null);
const ActiveItemContext = React.createContext<{ name: string; multiple: boolean; disabled: boolean } | null>(null);

function useQuestionnaireContext(component: string) {
  const context = React.useContext(QuestionnaireContext);
  if (!context) throw new Error(`${component} must be used within <Questionnaire>`);
  return context;
}

function isItemSatisfied(item: QuestionnaireItemConfig | undefined, values: QuestionnaireValues) {
  if (!item?.required) return true;
  const value = item ? values[item.name] : undefined;
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === 'string' && value.length > 0;
}

export interface QuestionnaireProps {
  items: QuestionnaireItemConfig[];
  values?: QuestionnaireValues;
  defaultValues?: QuestionnaireValues;
  currentIndex?: number;
  defaultCurrentIndex?: number;
  onValuesChange?: (values: QuestionnaireValues) => void;
  onCurrentIndexChange?: (index: number) => void;
  onSubmit?: (values: QuestionnaireValues) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  testID?: string;
}

export function Questionnaire({
  items,
  values,
  defaultValues = {},
  currentIndex,
  defaultCurrentIndex = 0,
  onValuesChange,
  onCurrentIndexChange,
  onSubmit,
  disabled = false,
  style,
  children,
  testID,
}: QuestionnaireProps) {
  const [internalValues, setInternalValues] = React.useState<QuestionnaireValues>(defaultValues);
  const [internalIndex, setInternalIndex] = React.useState(
    Math.max(0, Math.min(defaultCurrentIndex, Math.max(items.length - 1, 0))),
  );
  const [attemptedAdvance, setAttemptedAdvance] = React.useState(false);
  const controlledValues = values !== undefined;
  const controlledIndex = currentIndex !== undefined;
  const actualValues = controlledValues ? values : internalValues;
  const actualIndex = controlledIndex
    ? Math.max(0, Math.min(currentIndex, Math.max(items.length - 1, 0)))
    : internalIndex;

  const updateValues = React.useCallback((next: QuestionnaireValues) => {
    if (!controlledValues) setInternalValues(next);
    onValuesChange?.(next);
  }, [controlledValues, onValuesChange]);

  const setCurrentIndex = React.useCallback((index: number) => {
    const safeIndex = Math.max(0, Math.min(index, Math.max(items.length - 1, 0)));
    if (!controlledIndex) setInternalIndex(safeIndex);
    onCurrentIndexChange?.(safeIndex);
  }, [controlledIndex, items.length, onCurrentIndexChange]);

  const setValue = React.useCallback((name: string, value: string, multiple: boolean) => {
    if (disabled) return;
    const next = { ...actualValues };
    if (!multiple) {
      next[name] = value;
    } else {
      const existing = Array.isArray(actualValues[name]) ? actualValues[name] as string[] : [];
      next[name] = existing.includes(value)
        ? existing.filter((entry) => entry !== value)
        : [...existing, value];
    }
    updateValues(next);
  }, [actualValues, disabled, updateValues]);

  const submit = React.useCallback(() => {
    if (disabled) return;
    const firstInvalidIndex = items.findIndex((item) => !isItemSatisfied(item, actualValues));
    if (firstInvalidIndex !== -1) {
      setCurrentIndex(firstInvalidIndex);
      setAttemptedAdvance(true);
      return;
    }
    onSubmit?.(actualValues);
  }, [actualValues, disabled, items, onSubmit, setCurrentIndex]);

  return (
    <QuestionnaireContext.Provider
      value={{
        items,
        currentIndex: actualIndex,
        setCurrentIndex,
        values: actualValues,
        setValue,
        attemptedAdvance,
        setAttemptedAdvance,
        disabled,
        submit,
      }}
    >
      <View style={[styles.formContainer, style]} testID={testID}>{children}</View>
    </QuestionnaireContext.Provider>
  );
}

export function QuestionnaireProgress({
  label,
  style,
  render,
}: {
  label?: (current: number, total: number) => string;
  style?: StyleProp<ViewStyle>;
  render?: (a11yProps: QuestionnaireProgressA11yProps, state: QuestionnaireState) => React.ReactNode;
}) {
  const { items, currentIndex } = useQuestionnaireContext('QuestionnaireProgress');
  const state = { current: currentIndex + 1, total: items.length };
  const text = label ? label(state.current, state.total) : undefined;
  const a11yProps: QuestionnaireProgressA11yProps = {
    accessible: true,
    accessibilityRole: 'progressbar',
    accessibilityValue: {
      min: 1,
      max: state.total,
      now: state.current,
      text: text ?? `${state.current} / ${state.total}`,
    },
  };
  if (render) return <View {...a11yProps} style={[styles.fullWidth, style]}>{render(a11yProps, state)}</View>;
  return (
    <View {...a11yProps} style={style}>
      {text ? <AppText variant="body" tone="muted">{text}</AppText> : null}
    </View>
  );
}

export function QuestionnaireItem({
  name,
  multiple = false,
  disabled,
  style,
  children,
}: {
  name: string;
  multiple?: boolean;
  required?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const context = useQuestionnaireContext('QuestionnaireItem');
  const index = context.items.findIndex((item) => item.name === name);
  if (index !== context.currentIndex) return null;
  const itemDisabled = context.disabled || Boolean(disabled);
  return (
    <ActiveItemContext.Provider value={{ name, multiple, disabled: itemDisabled }}>
      <View style={[styles.itemGroup, style]}>{children}</View>
    </ActiveItemContext.Provider>
  );
}

export function QuestionnaireTitle({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  const direction = useLayoutDirection();
  return (
    <AppText
      variant="subheading"
      accessibilityRole="header"
      style={[{ textAlign: getLayoutTextAlign(direction) }, style]}
    >
      {children}
    </AppText>
  );
}

export function QuestionnaireChoices({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const active = React.useContext(ActiveItemContext);
  return (
    <View
      accessible
      accessibilityRole={active?.multiple ? undefined : 'radiogroup'}
      style={[styles.choicesList, style]}
    >
      {children}
    </View>
  );
}

export function QuestionnaireChoice({
  value,
  disabled,
  onChange,
  style,
  children,
}: {
  value: string;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  const direction = useLayoutDirection();
  const active = React.useContext(ActiveItemContext);
  const context = useQuestionnaireContext('QuestionnaireChoice');
  if (!active) return null;
  const choiceDisabled = context.disabled || active.disabled || Boolean(disabled);
  const currentValue = context.values[active.name];
  const checked = active.multiple
    ? Array.isArray(currentValue) && currentValue.includes(value)
    : currentValue === value;
  const rowDirection = getLayoutRowDirection(direction);
  const textAlign = getLayoutTextAlign(direction);

  const handlePress = () => {
    if (choiceDisabled) return;
    const nextChecked = active.multiple ? !checked : true;
    context.setValue(active.name, value, active.multiple);
    onChange?.(nextChecked);
  };

  const childArray = React.Children.toArray(children);
  const descriptionNodes: React.ReactNode[] = [];
  const labelNodes: React.ReactNode[] = [];
  childArray.forEach((child) => {
    if (
      React.isValidElement(child) &&
      (child.type as { displayName?: string }).displayName === 'QuestionnaireChoiceDescription'
    ) {
      descriptionNodes.push(child);
    } else {
      labelNodes.push(child);
    }
  });

  return (
    <Pressable
      accessibilityRole={active.multiple ? 'checkbox' : 'radio'}
      accessibilityState={{ checked, selected: checked, disabled: choiceDisabled }}
      accessibilityLabel={typeof labelNodes[0] === 'string' ? labelNodes[0] : undefined}
      disabled={choiceDisabled}
      onPress={handlePress}
      style={[
        styles.choiceRow,
        {
          backgroundColor: checked ? colors.secondary : colors.card,
          borderColor: checked ? colors.primary : colors.border,
          flexDirection: rowDirection,
          minHeight: 48,
          opacity: choiceDisabled ? 0.55 : 1,
        },
        style,
      ]}
    >
      <View style={styles.indicatorSlot}>
        {active.multiple ? (
          <View style={[styles.checkboxIndicator, { backgroundColor: checked ? colors.primary : colors.card, borderColor: checked ? colors.primary : colors.border }]}>
            {checked ? <AppIcon name="check" size={12} color={colors.primaryForeground} decorative /> : null}
          </View>
        ) : (
          <View style={[styles.radioOuter, { borderColor: checked ? colors.primary : colors.border }]}>
            {checked ? <View style={[styles.radioInner, { backgroundColor: colors.primary }]} /> : null}
          </View>
        )}
      </View>
      <View style={styles.choiceTextCol}>
        <AppText variant="label" style={[styles.choiceTitle, { textAlign }]}>{labelNodes}</AppText>
        {descriptionNodes}
      </View>
    </Pressable>
  );
}

export function QuestionnaireChoiceDescription({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  const direction = useLayoutDirection();
  if (!children) return null;
  return (
    <AppText
      variant="caption"
      tone="muted"
      style={[styles.choiceHint, { textAlign: getLayoutTextAlign(direction) }, style]}
    >
      {children}
    </AppText>
  );
}
QuestionnaireChoiceDescription.displayName = 'QuestionnaireChoiceDescription';

export function QuestionnaireError({
  message,
  style,
}: {
  message: string;
  style?: StyleProp<TextStyle>;
}) {
  const active = React.useContext(ActiveItemContext);
  const context = useQuestionnaireContext('QuestionnaireError');
  const direction = useLayoutDirection();
  if (!active) return null;
  const item = context.items.find((candidate) => candidate.name === active.name);
  if (isItemSatisfied(item, context.values) || !context.attemptedAdvance) return null;
  return (
    <AppText
      variant="body"
      tone="danger"
      accessibilityRole="alert"
      style={[{ textAlign: getLayoutTextAlign(direction) }, style]}
    >
      {message}
    </AppText>
  );
}

export function QuestionnaireActions({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const direction = useLayoutDirection();
  return (
    <View style={[styles.actionsRow, { flexDirection: getLayoutRowDirection(direction) }, style]}>
      {children}
    </View>
  );
}

export function QuestionnairePrevious({
  title,
  style,
}: {
  title: string;
  style?: StyleProp<ViewStyle>;
}) {
  const context = useQuestionnaireContext('QuestionnairePrevious');
  if (context.currentIndex === 0) return null;
  return (
    <AppButton
      title={title}
      variant="outline"
      disabled={context.disabled}
      style={StyleSheet.flatten(style)}
      onPress={() => {
        context.setAttemptedAdvance(false);
        context.setCurrentIndex(context.currentIndex - 1);
      }}
    />
  );
}

export function QuestionnaireNext({
  title,
  accessibilityHint,
  style,
}: {
  title: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const context = useQuestionnaireContext('QuestionnaireNext');
  if (context.currentIndex === context.items.length - 1) return null;
  const handlePress = () => {
    if (context.disabled) return;
    const currentItem = context.items[context.currentIndex];
    if (!isItemSatisfied(currentItem, context.values)) {
      context.setAttemptedAdvance(true);
      return;
    }
    context.setAttemptedAdvance(false);
    context.setCurrentIndex(context.currentIndex + 1);
  };
  return (
    <AppButton
      title={title}
      variant="primary"
      disabled={context.disabled}
      style={StyleSheet.flatten(style)}
      onPress={handlePress}
      accessibilityHint={accessibilityHint}
    />
  );
}

export function QuestionnaireSubmit({
  title,
  style,
}: {
  title: string;
  style?: StyleProp<ViewStyle>;
}) {
  const context = useQuestionnaireContext('QuestionnaireSubmit');
  if (context.currentIndex !== context.items.length - 1) return null;
  return (
    <AppButton
      title={title}
      variant="primary"
      disabled={context.disabled}
      style={StyleSheet.flatten(style)}
      onPress={context.submit}
    />
  );
}

const styles = StyleSheet.create({
  fullWidth: { width: '100%' },
  formContainer: { gap: aesSpacing['2xl'], width: '100%' },
  itemGroup: { gap: aesSpacing.lg },
  choicesList: { gap: aesSpacing.sm },
  choiceRow: {
    alignItems: 'center',
    borderRadius: aesRadii.input,
    borderWidth: 1,
    gap: aesSpacing.md,
    paddingHorizontal: aesSpacing.md,
    paddingVertical: aesSpacing.md,
  },
  indicatorSlot: { alignItems: 'center', justifyContent: 'center' },
  radioOuter: { alignItems: 'center', borderRadius: 9, borderWidth: 1.5, height: 18, justifyContent: 'center', width: 18 },
  radioInner: { borderRadius: 4.5, height: 9, width: 9 },
  checkboxIndicator: { alignItems: 'center', borderRadius: 4, borderWidth: 1.5, height: 18, justifyContent: 'center', width: 18 },
  choiceTextCol: { flex: 1, gap: 2 },
  choiceTitle: { fontSize: 14, fontWeight: '500' },
  choiceHint: { fontSize: 12, lineHeight: 16 },
  actionsRow: { alignItems: 'center', gap: aesSpacing.sm, justifyContent: 'space-between' },
});
