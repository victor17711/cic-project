import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#2E7D32',
  primaryLight: '#4CAF50',
  background: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#666666',
  inactive: '#9E9E9E',
};

// Custom component for the center tab button
const CenterTabButton = ({ focused }: { focused: boolean }) => (
  <View style={styles.centerButtonContainer}>
    <View style={[styles.centerButton, focused && styles.centerButtonActive]}>
      <Ionicons 
        name="chatbubbles" 
        size={28} 
        color="#FFFFFF" 
      />
    </View>
  </View>
);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          paddingBottom: Platform.OS === 'ios' ? 24 : 16,
          paddingTop: 10,
          height: Platform.OS === 'ios' ? 88 : 75,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Acasă',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Servicii',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="medical" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: 'Asistent',
          tabBarIcon: ({ focused }) => (
            <CenterTabButton focused={focused} />
          ),
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            color: COLORS.primary,
            // marginTop: -8,
          },
        }}
      />
      <Tabs.Screen
        name="consultation"
        options={{
          title: 'Consultație',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cont',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
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
  centerButtonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    top: -15,
  },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  centerButtonActive: {
    backgroundColor: COLORS.primaryLight,
    transform: [{ scale: 1.05 }],
  },
});
