import React from 'react';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#2E7D32',
  primaryLight: '#4CAF50',
  background: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#666666',
  inactive: '#9E9E9E',
};

export default function TabLayout() {
  const router = useRouter();

  // Custom tab bar button for the center (Asistent)
  const CustomCenterButton = ({ accessibilityState }: any) => {
    const focused = accessibilityState?.selected;
    
    return (
      <Pressable
        onPress={() => router.push('/(tabs)/assistant')}
        style={styles.centerTabButtonContainer}
      >
        <View style={styles.centerButtonWrapper}>
          <View style={styles.centerButtonOuter}>
            <View style={[styles.centerButton, focused && styles.centerButtonActive]}>
              <Ionicons 
                name="chatbubbles" 
                size={26} 
                color="#FFFFFF" 
              />
            </View>
          </View>
          {/* Small indicator dot below */}
          <View style={[styles.indicatorDot, focused && styles.indicatorDotActive]} />
        </View>
      </Pressable>
    );
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopWidth: 0,
          paddingBottom: Platform.OS === 'ios' ? 20 : 12,
          paddingTop: 12,
          height: Platform.OS === 'ios' ? 85 : 70,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 15,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingTop: 4,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Acasă',
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Servicii',
          tabBarIcon: ({ color }) => (
            <Ionicons name="medical-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: '',
          tabBarButton: (props) => <CustomCenterButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="consultation"
        options={{
          title: 'Consultație',
          tabBarIcon: ({ color }) => (
            <Ionicons name="bookmark-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cont',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={22} color={color} />
          ),
        }}
      />
      {/* Hidden screens */}
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerTabButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: -30,
  },
  centerButtonOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  centerButtonActive: {
    backgroundColor: COLORS.primaryLight,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'transparent',
    marginTop: 6,
  },
  indicatorDotActive: {
    backgroundColor: COLORS.primary,
  },
});
