import React from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
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

// Custom floating center button component
const CenterTabButton = ({ focused, onPress }: { focused: boolean; onPress: () => void }) => (
  <TouchableOpacity 
    style={styles.centerButtonWrapper} 
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.centerButtonOuter}>
      <View style={[styles.centerButton, focused && styles.centerButtonActive]}>
        <Ionicons 
          name="leaf" 
          size={28} 
          color="#FFFFFF" 
        />
      </View>
    </View>
    {/* Small indicator dot below */}
    <View style={[styles.indicatorDot, focused && styles.indicatorDotActive]} />
  </TouchableOpacity>
);

export default function TabLayout() {
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
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Servicii',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="medical-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <CenterTabButton focused={focused} onPress={() => {}} />
          ),
          tabBarButton: (props) => (
            <TouchableOpacity 
              {...props} 
              style={styles.centerTabButton}
              activeOpacity={1}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="consultation"
        options={{
          title: 'Consultație',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bookmark-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cont',
          tabBarIcon: ({ color, size }) => (
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
  centerTabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  centerButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: -35,
  },
  centerButtonOuter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  },
  centerButtonActive: {
    backgroundColor: COLORS.primaryLight,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'transparent',
    marginTop: 8,
  },
  indicatorDotActive: {
    backgroundColor: COLORS.primary,
  },
});
