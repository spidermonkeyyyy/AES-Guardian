import React, { useState, useEffect } from 'react';
import { StatusBar, View } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { initializeDatabase, logAuditEvent, SYNTHETIC_DEMO_CONTEXT } from './src/core';
import { initializeLocale, useLayoutDirection } from './src/localization';
import { SanadUiKittenProvider } from './src/theme/SanadUiKittenProvider';

function MainApp() {
  const { isDark, colors } = useTheme();
  const layoutDirection = useLayoutDirection();
  const [dbReady, setDbReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    void initializeLocale();
    (async () => {
      try {
        await initializeDatabase();
        await logAuditEvent({
          eventType: 'APP_STARTED',
          userId: SYNTHETIC_DEMO_CONTEXT.userId,
          description: 'SANAD application initialized with local SQLite',
        });
        setDbReady(true);
      } catch (err: any) {
        console.error('Failed to initialize database:', err);
        setInitError(err instanceof Error ? err.message : 'Database initialization error');
      }
    })();
  }, []);

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <View style={{ flex: 1, direction: layoutDirection }}>
        <AppNavigator databaseReady={dbReady} databaseError={initError} />
      </View>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SanadUiKittenProvider>
        <MainApp />
      </SanadUiKittenProvider>
    </ThemeProvider>
  );
}
