import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../../theme/ThemeContext';
import { setLocale, t } from '../../localization';
import LiquidGlassNavigation, { LiquidNavigationItem } from '../LiquidGlassNavigation';

declare global {
  var __sanadReduceMotion: boolean | undefined;
}

jest.mock('react-native-reanimated', () => {
  const ReactRuntime = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View },
    useAnimatedStyle: (factory: () => object) => factory(),
    useReducedMotion: () => Boolean(globalThis.__sanadReduceMotion),
    useSharedValue: (value: number) => {
      const state = ReactRuntime.useRef({ value });
      return state.current;
    },
    withSpring: jest.fn((value: number) => value),
  };
});

const items: LiquidNavigationItem[] = [
  {
    key: 'home',
    label: 'Accueil',
    icon: 'home',
    accessibilityLabel: 'Accueil',
  },
  {
    key: 'declare',
    label: 'Déclarer',
    icon: 'document-add',
    accessibilityLabel: 'Déclarer',
  },
];

function renderNavigation(
  props: Partial<React.ComponentProps<typeof LiquidGlassNavigation>> = {},
) {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      }}
    >
      <ThemeProvider>
        <LiquidGlassNavigation
          items={items}
          activeKey="home"
          onSelect={jest.fn()}
          accessibilityLabel="Navigation principale"
          {...props}
        />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('LiquidGlassNavigation', () => {
  beforeEach(() => {
    setLocale('fr');
    globalThis.__sanadReduceMotion = false;
  });

  it('renders visible labels with accessible tab semantics and the selected state', () => {
    const { getByRole, getByTestId, getByText } = renderNavigation();

    expect(getByText('Accueil')).toBeTruthy();
    expect(getByText('Déclarer')).toBeTruthy();
    expect(getByRole('tab', { name: 'Accueil' }).props.accessibilityState)
      .toEqual({ selected: true });
    expect(getByRole('tab', { name: 'Déclarer' }).props.accessibilityState)
      .toEqual({ selected: false });
    expect(getByTestId('liquid-glass-active-indicator')).toBeTruthy();
  });

  it('invokes the real selection callback and synchronizes the selected item', () => {
    const onSelect = jest.fn();
    const { getByTestId, rerender, getByRole } = renderNavigation({ onSelect });

    fireEvent.press(getByTestId('liquid-nav-item-declare'));
    expect(onSelect).toHaveBeenCalledWith('declare');

    rerender(
      <SafeAreaProvider>
        <ThemeProvider>
          <LiquidGlassNavigation
            items={items}
            activeKey="declare"
            onSelect={onSelect}
            accessibilityLabel="Navigation principale"
          />
        </ThemeProvider>
      </SafeAreaProvider>,
    );
    expect(getByRole('tab', { name: 'Déclarer' }).props.accessibilityState)
      .toEqual({ selected: true });
  });

  it('uses a settling spring for movement and skips it when motion is reduced', () => {
    const { withSpring } = require('react-native-reanimated');
    const { rerender } = renderNavigation();

    rerender(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 0, right: 0, bottom: 0, left: 0 },
        }}
      >
        <ThemeProvider>
          <LiquidGlassNavigation
            items={items}
            activeKey="declare"
            onSelect={jest.fn()}
            accessibilityLabel="Navigation principale"
          />
        </ThemeProvider>
      </SafeAreaProvider>,
    );
    expect(withSpring).toHaveBeenCalledWith(1, {
      damping: 20,
      stiffness: 190,
      mass: 0.7,
    });

    globalThis.__sanadReduceMotion = true;
    withSpring.mockClear();
    rerender(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 0, right: 0, bottom: 0, left: 0 },
        }}
      >
        <ThemeProvider>
          <LiquidGlassNavigation
            items={items}
            activeKey="home"
            onSelect={jest.fn()}
            accessibilityLabel="Navigation principale"
          />
        </ThemeProvider>
      </SafeAreaProvider>,
    );
    expect(withSpring).not.toHaveBeenCalled();
  });

  it('translates its navigation landmark and mirrors visual order in Arabic', () => {
    setLocale('ar');
    const { getAllByRole } = renderNavigation({
      accessibilityLabel: t('navigation.tab.accessibility', 'ar'),
    });

    expect(getAllByRole('tab').map((tab) => tab.props.accessibilityLabel))
      .toEqual(['Déclarer', 'Accueil']);
  });

  it('keeps an accessible static selected state when reduced motion is enabled', () => {
    globalThis.__sanadReduceMotion = true;
    const { getByRole, getByTestId } = renderNavigation();
    const selectedTab = getByRole('tab', { name: 'Accueil' });

    expect(selectedTab.props.accessibilityState.selected).toBe(true);
    expect(getByTestId('liquid-glass-active-indicator')).toBeTruthy();
  });

  it('renders no tab bar for an empty or restricted destination list', () => {
    const { queryByTestId } = renderNavigation({ items: [] });
    expect(queryByTestId('liquid-glass-navigation')).toBeNull();
  });

  it('does not show a stale indicator when the active destination is unavailable', () => {
    const { getByRole, queryByTestId } = renderNavigation({
      items: [items[1]],
      activeKey: 'home',
    });

    expect(queryByTestId('liquid-glass-active-indicator')).toBeNull();
    expect(getByRole('tab', { name: 'Déclarer' }).props.accessibilityState)
      .toEqual({ selected: false });
  });
});
