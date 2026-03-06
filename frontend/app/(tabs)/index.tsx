import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#2E7D32',
  primaryLight: '#4CAF50',
  primaryDark: '#1B5E20',
  background: '#FFFFFF',
  cardBg: '#F8FAF8',
  text: '#1A1A1A',
  textSecondary: '#666666',
  border: '#E8E8E8',
};

interface Service {
  id: string;
  name: string;
  description: string;
  price?: string;
  image?: string;
}

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  image?: string;
}

export default function HomeScreen() {
  const { user, token } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      fetchData();
      if (token) {
        fetchUnreadCount();
      }
    }, [token])
  );

  const fetchData = async () => {
    try {
      const [servicesRes, doctorsRes] = await Promise.all([
        api.get('/services'),
        api.get('/doctors'),
      ]);
      setServices(servicesRes.data);
      setDoctors(doctorsRes.data);
    } catch (error) {
      console.log('Error fetching data:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.log('Error fetching unread count');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    if (token) {
      await fetchUnreadCount();
    }
    setRefreshing(false);
  };

  // If not logged in, redirect to login
  if (!token) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.authContainer}>
          <View style={styles.authLogo}>
            <Ionicons name="medical" size={60} color={COLORS.primary} />
          </View>
          <Text style={styles.authTitle}>Clinica Dentară CIC</Text>
          <Text style={styles.authSubtitle}>Chișinău, Moldova</Text>
          <Text style={styles.authText}>
            Bine ai venit! Pentru a accesa toate funcționalitățile aplicației, te rugăm să te autentifici.
          </Text>
          <TouchableOpacity
            style={styles.authButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.authButtonText}>Autentificare</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.authSecondaryButton}
            onPress={() => router.push('/auth/register')}
          >
            <Text style={styles.authSecondaryButtonText}>Creează cont nou</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Header with user name and notifications */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bună ziua,</Text>
            <Text style={styles.userName}>{user?.name || 'Utilizator'}</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push('/(tabs)/notifications')}
          >
            <Ionicons name="notifications" size={24} color={COLORS.text} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroOverlay}>
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>Zâmbetul tău,{'\n'}prioritatea noastră</Text>
              <Text style={styles.heroSubtitle}>
                Servicii stomatologice de calitate în Chișinău
              </Text>
              <TouchableOpacity
                style={styles.heroButton}
                onPress={() => router.push('/(tabs)/consultation')}
              >
                <Ionicons name="calendar" size={18} color={COLORS.primary} />
                <Text style={styles.heroButtonText}>Solicită Consultație</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/services')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="medical" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.actionText}>Servicii</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/assistant')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="chatbubbles" size={24} color="#1976D2" />
            </View>
            <Text style={styles.actionText}>Asistent AI</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/consultation')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="document-text" size={24} color="#F57C00" />
            </View>
            <Text style={styles.actionText}>Consultație</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/history')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="time" size={24} color="#7B1FA2" />
            </View>
            <Text style={styles.actionText}>Istoric</Text>
          </TouchableOpacity>
        </View>

        {/* Services Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Serviciile Noastre</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/services')}>
              <Text style={styles.seeAll}>Vezi toate</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.servicesScroll}>
            {services.slice(0, 4).map((service) => (
              <View key={service.id} style={styles.serviceCard}>
                <View style={styles.serviceIconBg}>
                  <Ionicons name="checkmark-circle" size={28} color={COLORS.primary} />
                </View>
                <Text style={styles.serviceName} numberOfLines={2}>{service.name}</Text>
                {service.price && (
                  <Text style={styles.servicePrice}>{service.price}</Text>
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Doctors/Team Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Echipa Medicală</Text>
          </View>
          <View style={styles.doctorsGrid}>
            {doctors.map((doctor) => (
              <View key={doctor.id} style={styles.doctorCard}>
                <View style={styles.doctorImage}>
                  {doctor.image ? (
                    <Image source={{ uri: doctor.image }} style={styles.doctorPhoto} />
                  ) : (
                    <Ionicons name="person" size={40} color={COLORS.primary} />
                  )}
                </View>
                <Text style={styles.doctorName}>{doctor.name}</Text>
                <Text style={styles.doctorSpec}>{doctor.specialization}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Contactează-ne</Text>
          <View style={styles.contactItem}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
            <Text style={styles.contactText}>Str. Exemplu nr. 123, Chișinău</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="call" size={20} color={COLORS.primary} />
            <Text style={styles.contactText}>+373 60 000 000</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="time" size={20} color={COLORS.primary} />
            <Text style={styles.contactText}>Luni - Vineri: 09:00 - 18:00</Text>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Auth styles
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  authLogo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  authTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  authSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  authText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  authButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  authSecondaryButton: {
    paddingVertical: 14,
  },
  authSecondaryButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FF5252',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Hero Banner
  heroBanner: {
    marginHorizontal: 20,
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.primary,
    marginBottom: 24,
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(46, 125, 50, 0.95)',
    padding: 24,
    justifyContent: 'center',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 34,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 20,
  },
  heroButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 8,
  },
  heroButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  actionCard: {
    alignItems: 'center',
    width: (width - 60) / 4,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Section styles
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  seeAll: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  // Services scroll
  servicesScroll: {
    paddingLeft: 20,
  },
  serviceCard: {
    width: 140,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  serviceIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
    minHeight: 36,
  },
  servicePrice: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  // Doctors grid
  doctorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  doctorCard: {
    width: (width - 48) / 2,
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  doctorImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  doctorPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  doctorSpec: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  // Contact section
  contactSection: {
    marginHorizontal: 20,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  contactText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
