import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';

const COLORS = {
  primary: '#2E7D32',
  primaryLight: '#4CAF50',
  background: '#FFFFFF',
  cardBg: '#F8FAF8',
  text: '#1A1A1A',
  textSecondary: '#666666',
  border: '#E8E8E8',
  error: '#D32F2F',
  inputBg: '#F5F5F5',
};

const PROBLEM_TYPES = [
  { value: 'durere', label: 'Durere dentară' },
  { value: 'carie', label: 'Carie / Cavitate' },
  { value: 'gingie', label: 'Probleme gingivale' },
  { value: 'estetica', label: 'Estetică dentară' },
  { value: 'implant', label: 'Implant / Proteză' },
  { value: 'ortodontie', label: 'Ortodonție' },
  { value: 'urgenta', label: 'Urgență dentară' },
  { value: 'consultatie', label: 'Consultație generală' },
  { value: 'altele', label: 'Altele' },
];

const AFFECTED_AREAS = [
  { value: 'sus_stanga', label: 'Sus - Stânga' },
  { value: 'sus_dreapta', label: 'Sus - Dreapta' },
  { value: 'jos_stanga', label: 'Jos - Stânga' },
  { value: 'jos_dreapta', label: 'Jos - Dreapta' },
  { value: 'fata', label: 'Dinți din față' },
  { value: 'general', label: 'Mai multe zone / General' },
];

const SYMPTOM_DURATIONS = [
  { value: 'azi', label: 'De azi' },
  { value: 'cateva_zile', label: 'De câteva zile' },
  { value: 'o_saptamana', label: 'De o săptămână' },
  { value: 'o_luna', label: 'De o lună' },
  { value: 'mai_mult', label: 'Mai mult de o lună' },
];

export default function ConsultationScreen() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    problem_type: '',
    affected_area: '',
    symptom_duration: '',
    pain_level: 0,
    allergies: '',
    previous_treatments: '',
    description: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permisiune necesară', 'Trebuie să permiți accesul la galerie.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      if (images.length >= 5) {
        Alert.alert('Limită atinsă', 'Poți adăuga maximum 5 imagini.');
        return;
      }
      setImages([...images, `data:image/jpeg;base64,${result.assets[0].base64}`]);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permisiune necesară', 'Trebuie să permiți accesul la cameră.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      if (images.length >= 5) {
        Alert.alert('Limită atinsă', 'Poți adăuga maximum 5 imagini.');
        return;
      }
      setImages([...images, `data:image/jpeg;base64,${result.assets[0].base64}`]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const validateStep1 = () => {
    if (!form.name.trim()) {
      Alert.alert('Eroare', 'Te rugăm să introduci numele.');
      return false;
    }
    if (!form.email.trim() || !form.email.includes('@')) {
      Alert.alert('Eroare', 'Te rugăm să introduci un email valid.');
      return false;
    }
    if (!form.phone.trim()) {
      Alert.alert('Eroare', 'Te rugăm să introduci numărul de telefon.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!form.problem_type) {
      Alert.alert('Eroare', 'Te rugăm să selectezi tipul problemei.');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!form.description.trim()) {
      Alert.alert('Eroare', 'Te rugăm să descrii problema dentară.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setLoading(true);
    try {
      await api.post('/consultations', {
        ...form,
        images: images,
      });
      
      setSuccess(true);
      setForm({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        problem_type: '',
        affected_area: '',
        symptom_duration: '',
        pain_level: 0,
        allergies: '',
        previous_treatments: '',
        description: '',
      });
      setImages([]);
      setStep(1);
      
      setTimeout(() => setSuccess(false), 5000);
    } catch (error: any) {
      Alert.alert(
        'Eroare',
        error.response?.data?.detail || 'Nu am putut trimite cererea. Încearcă din nou.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color={COLORS.primary} />
          </View>
          <Text style={styles.successTitle}>Cerere Trimisă!</Text>
          <Text style={styles.successText}>
            Cererea ta de consultație a fost trimisă cu succes. Vei primi un răspuns în secțiunea Notificări.
          </Text>
          <TouchableOpacity
            style={styles.newRequestButton}
            onPress={() => setSuccess(false)}
          >
            <Text style={styles.newRequestButtonText}>Trimite altă cerere</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Ionicons name="person-outline" size={28} color={COLORS.primary} />
        <Text style={styles.stepTitle}>Datele tale de contact</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nume complet *</Text>
        <TextInput
          style={styles.input}
          placeholder="Introdu numele tău"
          placeholderTextColor={COLORS.textSecondary}
          value={form.name}
          onChangeText={(text) => setForm({ ...form, name: text })}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          placeholder="email@exemplu.ro"
          placeholderTextColor={COLORS.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          value={form.email}
          onChangeText={(text) => setForm({ ...form, email: text })}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Telefon *</Text>
        <TextInput
          style={styles.input}
          placeholder="+40 700 000 000"
          placeholderTextColor={COLORS.textSecondary}
          keyboardType="phone-pad"
          value={form.phone}
          onChangeText={(text) => setForm({ ...form, phone: text })}
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Ionicons name="medical-outline" size={28} color={COLORS.primary} />
        <Text style={styles.stepTitle}>Informații medicale</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Tipul problemei *</Text>
        <View style={styles.optionsGrid}>
          {PROBLEM_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.optionButton,
                form.problem_type === type.value && styles.optionButtonSelected,
              ]}
              onPress={() => setForm({ ...form, problem_type: type.value })}
            >
              <Text
                style={[
                  styles.optionText,
                  form.problem_type === type.value && styles.optionTextSelected,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Zona afectată</Text>
        <View style={styles.optionsRow}>
          {AFFECTED_AREAS.map((area) => (
            <TouchableOpacity
              key={area.value}
              style={[
                styles.optionChip,
                form.affected_area === area.value && styles.optionChipSelected,
              ]}
              onPress={() => setForm({ ...form, affected_area: area.value })}
            >
              <Text
                style={[
                  styles.chipText,
                  form.affected_area === area.value && styles.chipTextSelected,
                ]}
              >
                {area.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>De când ai simptomele?</Text>
        <View style={styles.optionsRow}>
          {SYMPTOM_DURATIONS.map((duration) => (
            <TouchableOpacity
              key={duration.value}
              style={[
                styles.optionChip,
                form.symptom_duration === duration.value && styles.optionChipSelected,
              ]}
              onPress={() => setForm({ ...form, symptom_duration: duration.value })}
            >
              <Text
                style={[
                  styles.chipText,
                  form.symptom_duration === duration.value && styles.chipTextSelected,
                ]}
              >
                {duration.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nivel durere: {form.pain_level}/10</Text>
        <View style={styles.painScale}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.painButton,
                form.pain_level === level && styles.painButtonSelected,
                level <= 3 && styles.painLow,
                level > 3 && level <= 6 && styles.painMedium,
                level > 6 && styles.painHigh,
              ]}
              onPress={() => setForm({ ...form, pain_level: level })}
            >
              <Text
                style={[
                  styles.painText,
                  form.pain_level === level && styles.painTextSelected,
                ]}
              >
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Alergii cunoscute</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: penicilină, anestezice locale..."
          placeholderTextColor={COLORS.textSecondary}
          value={form.allergies}
          onChangeText={(text) => setForm({ ...form, allergies: text })}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Tratamente dentare anterioare</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: extractii, implanturi, tratamente de canal..."
          placeholderTextColor={COLORS.textSecondary}
          value={form.previous_treatments}
          onChangeText={(text) => setForm({ ...form, previous_treatments: text })}
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Ionicons name="document-text-outline" size={28} color={COLORS.primary} />
        <Text style={styles.stepTitle}>Descriere și fotografii</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Descrierea detaliată a problemei *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Descrie în detaliu problema ta dentară: când a început, cum se manifestă, ce ai încercat până acum..."
          placeholderTextColor={COLORS.textSecondary}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          value={form.description}
          onChangeText={(text) => setForm({ ...form, description: text })}
        />
      </View>

      <View style={styles.imageSection}>
        <Text style={styles.label}>Fotografii (opțional)</Text>
        <Text style={styles.imageHint}>
          Adaugă fotografii ale zonei afectate pentru o evaluare mai precisă
        </Text>

        {/* Photo Guide Section */}
        <View style={styles.photoGuideContainer}>
          <View style={styles.photoGuideHeader}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary} />
            <Text style={styles.photoGuideTitle}>Ghid pentru fotografii</Text>
          </View>
          <Text style={styles.photoGuideSubtitle}>
            Pentru o evaluare cât mai precisă, vă recomandăm să faceți 3 tipuri de fotografii:
          </Text>
          
          <View style={styles.photoGuideGrid}>
            {/* Photo Guide 1 - Front View */}
            <View style={styles.photoGuideItem}>
              <View style={styles.photoGuideImageContainer}>
                <View style={styles.photoGuidePlaceholder}>
                  <Ionicons name="happy-outline" size={32} color={COLORS.primary} />
                  <View style={styles.photoGuideArrows}>
                    <Ionicons name="arrow-back" size={14} color={COLORS.textSecondary} />
                    <Ionicons name="arrow-forward" size={14} color={COLORS.textSecondary} />
                  </View>
                </View>
              </View>
              <Text style={styles.photoGuideLabel}>1. Vedere din față</Text>
              <Text style={styles.photoGuideDesc}>Deschide gura larg, arată toți dinții</Text>
            </View>

            {/* Photo Guide 2 - Side View */}
            <View style={styles.photoGuideItem}>
              <View style={styles.photoGuideImageContainer}>
                <View style={styles.photoGuidePlaceholder}>
                  <Ionicons name="person-outline" size={32} color={COLORS.primary} />
                  <View style={styles.photoGuideArrowSide}>
                    <Ionicons name="arrow-forward" size={14} color={COLORS.textSecondary} />
                  </View>
                </View>
              </View>
              <Text style={styles.photoGuideLabel}>2. Vedere laterală</Text>
              <Text style={styles.photoGuideDesc}>Profil stânga sau dreapta</Text>
            </View>

            {/* Photo Guide 3 - Close-up */}
            <View style={styles.photoGuideItem}>
              <View style={styles.photoGuideImageContainer}>
                <View style={styles.photoGuidePlaceholder}>
                  <Ionicons name="search" size={32} color={COLORS.primary} />
                  <View style={styles.photoGuideZoom}>
                    <Ionicons name="add-circle-outline" size={14} color={COLORS.textSecondary} />
                  </View>
                </View>
              </View>
              <Text style={styles.photoGuideLabel}>3. Zona afectată</Text>
              <Text style={styles.photoGuideDesc}>Apropie camera de problema</Text>
            </View>
          </View>

          <View style={styles.photoGuideTips}>
            <Text style={styles.photoGuideTipsTitle}>Sfaturi pentru fotografii mai bune:</Text>
            <View style={styles.tipRow}>
              <Ionicons name="sunny-outline" size={16} color={COLORS.primary} />
              <Text style={styles.tipText}>Folosește lumină naturală sau bună</Text>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="hand-left-outline" size={16} color={COLORS.primary} />
              <Text style={styles.tipText}>Ține camera stabilă, evită mișcarea</Text>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="water-outline" size={16} color={COLORS.primary} />
              <Text style={styles.tipText}>Spală dinții înainte de fotografiere</Text>
            </View>
          </View>
        </View>

        <View style={styles.imageButtons}>
          <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
            <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
            <Text style={styles.imageButtonText}>Fotografiază</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
            <Ionicons name="images-outline" size={24} color={COLORS.primary} />
            <Text style={styles.imageButtonText}>Din galerie</Text>
          </TouchableOpacity>
        </View>

        {images.length > 0 && (
          <View style={styles.imagePreview}>
            {images.map((img, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: img }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Solicită Consultație</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progress, { width: `${(step / 3) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>Pasul {step} din 3</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.footer}>
          {step > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
              <Text style={styles.backButtonText}>Înapoi</Text>
            </TouchableOpacity>
          )}
          {step < 3 ? (
            <TouchableOpacity
              style={[styles.nextButton, step === 1 && { flex: 1 }]}
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>Continuă</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Trimite Cererea</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    minHeight: 140,
    paddingTop: 14,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBg,
  },
  optionButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: 14,
    color: COLORS.text,
  },
  optionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBg,
  },
  optionChipSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  chipTextSelected: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  painScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  painButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  painButtonSelected: {
    borderWidth: 2,
  },
  painLow: {
    borderColor: '#4CAF50',
  },
  painMedium: {
    borderColor: '#FFC107',
  },
  painHigh: {
    borderColor: '#F44336',
  },
  painText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  painTextSelected: {
    fontWeight: 'bold',
    color: COLORS.text,
  },
  imageSection: {
    marginBottom: 24,
  },
  imageHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  photoGuideContainer: {
    backgroundColor: '#F0F7F0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  photoGuideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  photoGuideTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  photoGuideSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  photoGuideGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16,
  },
  photoGuideItem: {
    flex: 1,
    alignItems: 'center',
  },
  photoGuideImageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
  },
  photoGuidePlaceholder: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  photoGuideArrows: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 4,
  },
  photoGuideArrowSide: {
    position: 'absolute',
    right: 8,
    top: '50%',
  },
  photoGuideZoom: {
    position: 'absolute',
    right: 8,
    bottom: 8,
  },
  photoGuideLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  photoGuideDesc: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  photoGuideTips: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
  },
  photoGuideTipsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E8F5E9',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },
  imagePreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  imageContainer: {
    position: 'relative',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
  },
  successText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  newRequestButton: {
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
});
