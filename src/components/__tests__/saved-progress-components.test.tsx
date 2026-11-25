import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '../../theme/ThemeContext';
import { setLocale } from '../../localization';
import { AppIcon } from '../AppIcon';
import { CircleProgress } from '../saved/CircleProgress';
import { AnimatedProgressCard } from '../saved/AnimatedProgressCard';
import { ProgressIndicator } from '../saved/ProgressIndicator';

jest.mock('react-native-reanimated', () => {
  const ReactRuntime = require('react');
  const { View } = require('react-native');
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.createAnimatedComponent = (component: unknown) => {
    if (typeof component === 'string') return component;
    return (props: Record<string, unknown>) => ReactRuntime.createElement(component as React.ComponentType, props);
  };
  Reanimated.default.View = (props: Record<string, unknown>) => ReactRuntime.createElement(View, props);
  Reanimated.useReducedMotion = () => true;
  return Reanimated;
});

describe('Saved progress components', () => {
  beforeEach(() => setLocale('fr'));

  test('CircleProgress clamps valid and positive ratios', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <CircleProgress
          value={15}
          maxValue={10}
          showValue
          accessibilityLabel="Achèvement"
          accessibilityValueText="15 / 10"
          testID="circle-valid"
        />
      </ThemeProvider>,
    );
    expect(getByTestId('circle-valid').props.accessibilityRole).toBe('progressbar');
  });

  test.each([
    [0, 0],
    [-3, 10],
    [Number.NaN, 10],
    [3, 0],
    [3, Number.POSITIVE_INFINITY],
  ])('CircleProgress safely handles value=%p max=%p', (value, maxValue) => {
    const { getByTestId } = render(
      <ThemeProvider>
        <CircleProgress value={value} maxValue={maxValue} testID="circle-invalid" disableAnimation />
      </ThemeProvider>,
    );
    expect(getByTestId('circle-invalid')).toBeTruthy();
  });

  test('AnimatedProgressCard shows actual completed and total values', () => {
    const { getByText, getByTestId } = render(
      <ThemeProvider>
        <AnimatedProgressCard
          icon={<AppIcon name="check-circle" size={18} decorative />}
          title="Achèvement des actions CAPA enregistrées"
          progressLabel="Actions enregistrées achevées"
          progressSubLabel="Ne mesure pas l'efficacité institutionnelle"
          currentValue={3}
          maxValue={5}
          testID="capa-progress"
        />
      </ThemeProvider>,
    );
    expect(getByTestId('capa-progress').props.accessibilityValue).toEqual({
      min: 0,
      max: 5,
      now: 3,
      text: '3 / 5',
    });
    expect(getByText('3')).toBeTruthy();
    expect(getByText(' / 5')).toBeTruthy();
  });

  test('AnimatedProgressCard uses static safe values for zero and invalid totals', () => {
    const { getByTestId, getByText } = render(
      <ThemeProvider>
        <AnimatedProgressCard
          icon={<AppIcon name="check-circle" size={18} decorative />}
          title="Progression"
          progressLabel="Terminé"
          progressSubLabel="Détail"
          currentValue={-4}
          maxValue={0}
          testID="progress-zero"
        />
      </ThemeProvider>,
    );
    expect(getByTestId('progress-zero').props.accessibilityValue.now).toBe(0);
    expect(getByText('0')).toBeTruthy();
  });

  test('ProgressIndicator is controlled and exposes callbacks', () => {
    const onBack = jest.fn();
    const onContinue = jest.fn();
    const onFinish = jest.fn();
    const { rerender, getByRole, getByLabelText } = render(
      <ThemeProvider>
        <ProgressIndicator
          step={1}
          totalSteps={5}
          backLabel="Retour"
          continueLabel="Continuer"
          finishLabel="Soumettre"
          accessibilityLabel="Étape 1 sur 5"
          onBack={onBack}
          onContinue={onContinue}
          onFinish={onFinish}
          testID="declaration-progress"
        />
      </ThemeProvider>,
    );
    fireEvent.press(getByLabelText('Continuer'));
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(onFinish).not.toHaveBeenCalled();

    rerender(
      <ThemeProvider>
        <ProgressIndicator
          step={5}
          totalSteps={5}
          backLabel="Retour"
          continueLabel="Continuer"
          finishLabel="Soumettre"
          accessibilityLabel="Étape 5 sur 5"
          onBack={onBack}
          onContinue={onContinue}
          onFinish={onFinish}
          testID="declaration-progress"
        />
      </ThemeProvider>,
    );
    fireEvent.press(getByLabelText('Soumettre'));
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(getByRole('progressbar').props.accessibilityValue.now).toBe(5);
  });

  test('ProgressIndicator can render presentation-only in Arabic RTL', () => {
    setLocale('ar');
    const { getByRole } = render(
      <ThemeProvider>
        <ProgressIndicator
          step={3}
          totalSteps={5}
          showActions={false}
          accessibilityLabel="الخطوة 3 من 5"
          testID="declaration-progress-ar"
        />
      </ThemeProvider>,
    );
    expect(getByRole('progressbar').props.accessibilityValue).toEqual({
      min: 1,
      max: 5,
      now: 3,
      text: '3 / 5',
    });
  });
});
