import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { LanguageProvider, useLanguage } from '../src/context/LanguageContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const COLORS = {
  primary: '#2E7D32',
  background: '#FFFFFF',
};

// This component handles the navigation based on auth and language state
function RootLayoutNav() {
  const { user, loading: authLoading } = useAuth();
  const { isFirstLaunch, loading: langLoading } = useLanguage();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    if (authLoading || langLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const onLanguageSelect = segments[0] === 'language-select';

    // First launch - show language selection
    if (isFirstLaunch && !onLanguageSelect) {
      router.replace('/language-select');
      return;
    }

    // Not first launch anymore
    if (!isFirstLaunch) {
      if (!user && !inAuthGroup) {
        // User is not signed in and not on auth screen, redirect to login
        router.replace('/auth/login');
      } else if (user && (inAuthGroup || onLanguageSelect)) {
        // User is signed in but on auth/language screen, redirect to main app
        router.replace('/(tabs)');
      }
    }
  }, [user, authLoading, langLoading, isFirstLaunch, segments]);

  // Show loading screen while checking auth and language
  if (authLoading || langLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="language-select" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="history" />
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <RootLayoutNav />
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
