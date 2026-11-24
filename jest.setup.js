jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@hugeicons/react-native', () => {
  const ReactRuntime = require('react');
  const { View } = require('react-native');

  return {
    HugeiconsIcon: jest.fn((props) =>
      ReactRuntime.createElement(View, {
        testID: props.testID,
        accessible: props.accessible,
        accessibilityLabel: props.accessibilityLabel,
        accessibilityRole: props.accessibilityRole,
        importantForAccessibility: props.importantForAccessibility,
      }),
    ),
  };
});
