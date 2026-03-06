import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { router, useFocusEffect } from 'expo-router';
import api from '../src/services/api';

const COLORS = {
  primary: '#2E7D32',
  primaryLight: '#4CAF50',
  background: '#FFFFFF',
  cardBg: '#F8FAF8',
  text: '#1A1A1A',
  textSecondary: '#666666',
  border: '#E8E8E8',
  pending: '#FFA000',
  responded: '#4CAF50',
};

interface Consultation {
  id: string;
  name: string;
  email: string;
  phone: string;
  description: string;
  problem_type?: string;
  affected_area?: string;
  symptom_duration?: string;
  pain_level?: number;
  allergies?: string;
  previous_treatments?: string;
  images: string[];
  status: string;
  created_at: string;
  response?: string;
  response_at?: string;
}

const PROBLEM_TYPE_LABELS: { [key: string]: string } = {
  durere: 'Durere dentară',
  carie: 'Carie / Cavitate',
  gingie: 'Probleme gingivale',
  estetica: 'Estetică dentară',
  implant: 'Implant / Proteză',
  ortodontie: 'Ortodonție',
  urgenta: 'Urgență dentară',
  consultatie: 'Consultație generală',
  altele: 'Altele',
};

export default function HistoryScreen() {
  const { user, token } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchConsultations();
      } else {
        setLoading(false);
      }
    }, [token])
  );

  const fetchConsultations = async () => {
    try {
      const response = await api.get('/my-consultations');
      setConsultations(response.data);
    } catch (error) {
      console.log('Error fetching consultations:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConsultations();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openDetails = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    setModalVisible(true);
  };

  if (!token) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Istoricul Cererilor</Text>
        </View>
        <View style={styles.authPrompt}>
          <Ionicons name="document-text-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.authTitle}>Autentificare necesară</Text>
          <Text style={styles.authText}>
            Pentru a vedea istoricul cererilor, trebuie să te autentifici.
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

  const renderConsultation = ({ item }: { item: Consultation }) => (
    <TouchableOpacity style={styles.consultationCard} onPress={() => openDetails(item)}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <Ionicons name="document-text" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>
            {PROBLEM_TYPE_LABELS[item.problem_type || ''] || 'Consultație'}
          </Text>
          <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'pending' ? COLORS.pending : COLORS.responded }
        ]}>
          <Text style={styles.statusText}>
            {item.status === 'pending' ? 'În așteptare' : 'Răspuns'}
          </Text>
        </View>
      </View>
      <Text style={styles.cardDescription} numberOfLines={2}>
        {item.description}
      </Text>
      {item.response && (
        <View style={styles.responsePreview}>
          <Ionicons name="chatbubble" size={14} color={COLORS.primary} />
          <Text style={styles.responsePreviewText} numberOfLines={1}>
            {item.response}
          </Text>
        </View>
      )}
      <View style={styles.cardFooter}>
        <Text style={styles.viewDetails}>Vezi detalii</Text>
        <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
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
          <Text style={styles.headerTitle}>Istoricul Cererilor</Text>
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
        <Text style={styles.headerTitle}>Istoricul Cererilor</Text>
      </View>

      <FlatList
        data={consultations}
        renderItem={renderConsultation}
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
            <Ionicons name="document-text-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>Nicio cerere trimisă</Text>
            <Text style={styles.emptyText}>
              Nu ai trimis încă nicio cerere de consultație.
            </Text>
            <TouchableOpacity
              style={styles.newRequestButton}
              onPress={() => router.push('/(tabs)/consultation')}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.newRequestButtonText}>Trimite o cerere</Text>
            </TouchableOpacity>
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
              <Text style={styles.modalTitle}>Detalii cerere</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {selectedConsultation && (
              <ScrollView style={styles.modalBody}>
                <View style={[
                  styles.modalStatusBadge,
                  { backgroundColor: selectedConsultation.status === 'pending' ? '#FFF3E0' : '#E8F5E9' }
                ]}>
                  <Ionicons
                    name={selectedConsultation.status === 'pending' ? 'time' : 'checkmark-circle'}
                    size={20}
                    color={selectedConsultation.status === 'pending' ? COLORS.pending : COLORS.responded}
                  />
                  <Text style={[
                    styles.modalStatusText,
                    { color: selectedConsultation.status === 'pending' ? COLORS.pending : COLORS.responded }
                  ]}>
                    {selectedConsultation.status === 'pending' ? 'În așteptare răspuns' : 'Răspuns primit'}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Informații cerere</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Data:</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedConsultation.created_at)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Tip problemă:</Text>
                    <Text style={styles.detailValue}>
                      {PROBLEM_TYPE_LABELS[selectedConsultation.problem_type || ''] || 'Nespecificat'}
                    </Text>
                  </View>
                  {selectedConsultation.affected_area && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Zona:</Text>
                      <Text style={styles.detailValue}>{selectedConsultation.affected_area}</Text>
                    </View>
                  )}
                  {selectedConsultation.pain_level !== undefined && selectedConsultation.pain_level > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Nivel durere:</Text>
                      <Text style={styles.detailValue}>{selectedConsultation.pain_level}/10</Text>
                    </View>
                  )}
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Descriere</Text>
                  <Text style={styles.descriptionText}>{selectedConsultation.description}</Text>
                </View>

                {selectedConsultation.images && selectedConsultation.images.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Fotografii atașate</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {selectedConsultation.images.map((img, index) => (
                        <Image key={index} source={{ uri: img }} style={styles.consultationImage} />
                      ))}
                    </ScrollView>
                  </View>
                )}

                {selectedConsultation.response && (
                  <View style={styles.responseSection}>
                    <Text style={styles.sectionTitle}>
                      <Ionicons name="chatbubble" size={16} color={COLORS.primary} /> Răspuns clinic
                    </Text>
                    <Text style={styles.responseText}>{selectedConsultation.response}</Text>
                    {selectedConsultation.response_at && (
                      <Text style={styles.responseDate}>
                        Primit la: {formatDate(selectedConsultation.response_at)}
                      </Text>
                    )}
                  </View>
                )}

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
  consultationCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  cardDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  responsePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  responsePreviewText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.primary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  viewDetails: {
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
    marginBottom: 24,
  },
  newRequestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  newRequestButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
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
  modalStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  modalStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    width: 100,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
    backgroundColor: COLORS.cardBg,
    padding: 14,
    borderRadius: 10,
  },
  consultationImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
    marginRight: 10,
  },
  responseSection: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  responseText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
    marginTop: 8,
  },
  responseDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 10,
  },
});
