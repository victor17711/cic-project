import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { router, useFocusEffect } from 'expo-router';
import api from '../../src/services/api';

const COLORS = {
  primary: '#2E7D32',
  primaryLight: '#4CAF50',
  background: '#FFFFFF',
  cardBg: '#F8FAF8',
  text: '#1A1A1A',
  textSecondary: '#666666',
  border: '#E8E8E8',
  unread: '#E8F5E9',
};

interface AttachedFile {
  name: string;
  data: string;
  type: string;
}

interface Notification {
  id: string;
  consultation_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  attached_files?: AttachedFile[];
}

interface ConsultationDetails {
  id: string;
  response?: string;
  diagnosis?: string;
  recommended_treatment?: string;
  estimated_cost?: string;
  next_steps?: string;
  attached_files?: AttachedFile[];
  response_at?: string;
}

export default function NotificationsScreen() {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [consultationDetails, setConsultationDetails] = useState<ConsultationDetails | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchNotifications();
      } else {
        setLoading(false);
      }
    }, [token])
  );

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.log('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const openNotificationDetails = async (notification: Notification) => {
    setSelectedNotification(notification);
    setModalVisible(true);
    setLoadingDetails(true);
    
    // Mark as read
    if (!notification.is_read) {
      try {
        await api.put(`/notifications/${notification.id}/read`);
        setNotifications(
          notifications.map((n) =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
      } catch (error) {
        console.log('Error marking notification as read:', error);
      }
    }

    // Fetch consultation details
    try {
      const myConsultations = await api.get('/my-consultations');
      const consultation = myConsultations.data.find(
        (c: any) => c.id === notification.consultation_id
      );
      if (consultation) {
        setConsultationDetails(consultation);
      }
    } catch (error) {
      console.log('Error fetching consultation details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const openAttachedFile = (file: AttachedFile) => {
    // For base64 data, we can show it in a modal or open in browser
    if (file.data.startsWith('data:')) {
      Linking.openURL(file.data);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return 'Astăzi';
    } else if (days === 1) {
      return 'Ieri';
    } else if (days < 7) {
      return `Acum ${days} zile`;
    } else {
      return date.toLocaleDateString('ro-RO');
    }
  };

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!token) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notificări</Text>
        </View>
        <View style={styles.authPrompt}>
          <Ionicons name="notifications-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.authTitle}>Autentificare necesară</Text>
          <Text style={styles.authText}>
            Pentru a vedea notificările, trebuie să te autentifici.
          </Text>
          <TouchableOpacity
            style={styles.authButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.authButtonText}>Autentificare</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.is_read && styles.unreadCard]}
      onPress={() => openNotificationDetails(item)}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={item.is_read ? 'mail-open' : 'mail'}
            size={24}
            color={item.is_read ? COLORS.textSecondary : COLORS.primary}
          />
        </View>
        <View style={styles.notificationInfo}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationDate}>{formatDate(item.created_at)}</Text>
        </View>
        {!item.is_read && <View style={styles.unreadDot} />}
      </View>
      <Text style={styles.notificationMessage} numberOfLines={2}>{item.message}</Text>
      <View style={styles.viewDetailsRow}>
        <Text style={styles.viewDetailsText}>Vezi răspunsul complet</Text>
        <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notificări</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificări</Text>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>Nicio notificare</Text>
            <Text style={styles.emptyText}>
              Nu ai primit încă nicio notificare. Trimite o cerere de consultație pentru a primi un răspuns.
            </Text>
          </View>
        }
      />

      {/* Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Răspuns Consultație</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {loadingDetails ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : (
              <ScrollView style={styles.modalBody}>
                {selectedNotification && (
                  <View style={styles.dateRow}>
                    <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.dateText}>
                      Primit la: {formatFullDate(selectedNotification.created_at)}
                    </Text>
                  </View>
                )}

                {/* Main Response */}
                <View style={styles.responseSection}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="chatbubble" size={18} color={COLORS.primary} />
                    <Text style={styles.sectionTitle}>Mesajul medicului</Text>
                  </View>
                  <Text style={styles.responseText}>
                    {selectedNotification?.message || consultationDetails?.response}
                  </Text>
                </View>

                {/* Diagnosis */}
                {consultationDetails?.diagnosis && (
                  <View style={styles.detailSection}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="medkit" size={18} color="#1976D2" />
                      <Text style={styles.sectionTitle}>Diagnostic Preliminar</Text>
                    </View>
                    <Text style={styles.detailText}>{consultationDetails.diagnosis}</Text>
                  </View>
                )}

                {/* Treatment */}
                {consultationDetails?.recommended_treatment && (
                  <View style={styles.detailSection}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="fitness" size={18} color="#7B1FA2" />
                      <Text style={styles.sectionTitle}>Tratament Recomandat</Text>
                    </View>
                    <Text style={styles.detailText}>{consultationDetails.recommended_treatment}</Text>
                  </View>
                )}

                {/* Cost */}
                {consultationDetails?.estimated_cost && (
                  <View style={styles.costSection}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="card" size={18} color="#F57C00" />
                      <Text style={styles.sectionTitle}>Cost Estimat</Text>
                    </View>
                    <Text style={styles.costText}>{consultationDetails.estimated_cost}</Text>
                  </View>
                )}

                {/* Next Steps */}
                {consultationDetails?.next_steps && (
                  <View style={styles.detailSection}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="arrow-forward-circle" size={18} color={COLORS.primary} />
                      <Text style={styles.sectionTitle}>Pași Următori</Text>
                    </View>
                    <Text style={styles.detailText}>{consultationDetails.next_steps}</Text>
                  </View>
                )}

                {/* Attached Files */}
                {consultationDetails?.attached_files && consultationDetails.attached_files.length > 0 && (
                  <View style={styles.filesSection}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="attach" size={18} color={COLORS.text} />
                      <Text style={styles.sectionTitle}>Fișiere Atașate</Text>
                    </View>
                    {consultationDetails.attached_files.map((file, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.fileItem}
                        onPress={() => openAttachedFile(file)}
                      >
                        <Ionicons 
                          name={file.type?.includes('pdf') ? 'document' : 'image'} 
                          size={24} 
                          color={COLORS.primary} 
                        />
                        <Text style={styles.fileName}>{file.name}</Text>
                        <Ionicons name="download-outline" size={20} color={COLORS.textSecondary} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* CTA */}
                <TouchableOpacity
                  style={styles.ctaButton}
                  onPress={() => {
                    setModalVisible(false);
                    router.push('/(tabs)/consultation');
                  }}
                >
                  <Ionicons name="calendar" size={20} color="#FFFFFF" />
                  <Text style={styles.ctaButtonText}>Programează o Consultație</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  listContainer: {
    padding: 20,
    flexGrow: 1,
  },
  notificationCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unreadCard: {
    backgroundColor: COLORS.unread,
    borderColor: COLORS.primary,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  notificationDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  notificationMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 10,
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 8,
  },
  authText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  authButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalBody: {
    padding: 20,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  responseSection: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  responseText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 24,
  },
  detailSection: {
    backgroundColor: COLORS.cardBg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
  },
  costSection: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  costText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F57C00',
  },
  filesSection: {
    marginBottom: 16,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.cardBg,
    padding: 14,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
