import React, { useState, useEffect } from 'react';
import { StatusBar, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { restoreSession } from './src/features/authentication/hooks/use-auth';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { initializeDatabase, logAuditEvent, SYNTHETIC_DEMO_CONTEXT } from './src/core';
import { t } from './src/localization';

function MainApp() {
  const { isDark, colors } = useTheme();
  const [dbReady, setDbReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await initializeDatabase();
        await logAuditEvent({
          eventType: 'APP_STARTED',
          userId: SYNTHETIC_DEMO_CONTEXT.userId,
          description: 'AES Guardian application initialized with local SQLite',
        });
        setDbReady(true);
      } catch (err: any) {
        console.error('Failed to initialize database:', err);
        setInitError(err?.message || 'Database initialization error');
      }
    })();

    restoreSession();
  }, []);

  if (!dbReady && !initError) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          {t('db.initializing')}
        </Text>
      </View>
    );
  }

  if (initError) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorTitle, { color: colors.destructive }]}>
          {t('db.error')}
        </Text>
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          {initError}
        </Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <AppNavigator />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
});

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}
