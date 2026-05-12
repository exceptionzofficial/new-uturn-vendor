import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Platform,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  StatusBar,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import ImagePicker from 'react-native-image-crop-picker';
import { COLORS, RADIUS, SHADOW, SPACING } from '../../theme/AppTheme';
import apiClient from '../../services/api';


const { width, height } = Dimensions.get('window');

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'
];

const RegisterScreen = ({ navigation, route }) => {
  const verifiedPhone = route.params?.verifiedPhone || '';
  const [loading, setLoading] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [stateSearch, setStateSearch] = useState('');

  // Image states
  const [aadharImage, setAadharImage] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);


  // Consolidated Form State
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    businessName: '',
    gstNumber: '',
    state: '',
    address: '',
  });

  // Date Logic
  const [date, setDate] = useState(new Date(new Date().setFullYear(new Date().getFullYear() - 18)));

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
    
    // Formatting for UI
    const formatted = currentDate.toLocaleDateString('en-GB'); // DD/MM/YYYY
    setFormData({ ...formData, dob: formatted });
  };

  // Safe Filter Logic
  const filteredStates = useMemo(() => {
    if (!INDIAN_STATES || !Array.isArray(INDIAN_STATES)) return [];
    const search = (stateSearch || '').toLowerCase();
    return INDIAN_STATES.filter(s => {
      if (!s) return false;
      return s.toLowerCase().indexOf(search) !== -1;
    });
  }, [stateSearch]);

  const handleSubmit = async () => {
    const { name, businessName, state, address, dob, gstNumber } = formData;
    if (!name || !businessName || !state || !address || !dob) {
      Alert.alert('Required Fields', 'Please fill in name, DOB, business name, state and address.');
      return;
    }

    if (!aadharImage || !profilePicture) {
      Alert.alert('Documents Missing', 'Please capture both Aadhar ID Proof and Profile Picture.');
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      
      const appendFile = (field, file, name) => {
        if (file) {
          form.append(field, {
            uri: Platform.OS === 'android' ? file.path : file.path.replace('file://', ''),
            type: file.mime,
            name: `${name}_${verifiedPhone}.jpg`,
          });
        }
      };

      appendFile('aadharImage', aadharImage, 'aadhar');
      appendFile('profilePicture', profilePicture, 'profile');

      const payload = {
        ...formData,
        phone: verifiedPhone
      };

      form.append('vendorData', JSON.stringify(payload));

      const response = await apiClient.register(form);

      if (response.success) {
        // Save full details immediately to AsyncStorage
        const vendorDataToSave = response.vendor || payload;
        await AsyncStorage.setItem('vendor_data', JSON.stringify({
          ...vendorDataToSave,
          isLoggedIn: true
        }));

        Alert.alert('Success', 'Application Submitted. We will verify your documents soon.', [
          { text: 'OK', onPress: () => navigation.replace('Splash') }
        ]);
      }
    } catch (err) {
      console.error('Registration Error:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Unknown error';
      Alert.alert('Registration Failed [V1.2]', errorMsg);
    } finally {
      setLoading(false);
    }
  };


  const renderInputField = (label, icon, value, onChangeText, placeholder = '', keyboardType = 'default') => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label.toUpperCase()}</Text>
      <View style={styles.inputWrapper}>
        <Icon name={icon} size={20} color={COLORS.primary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );

  const renderSelector = (label, icon, value, onPress) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label.toUpperCase()}</Text>
      <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.inputWrapper}>
        <Icon name={icon} size={20} color={COLORS.primary} style={styles.inputIcon} />
        <Text style={[styles.input, { color: value ? COLORS.text : COLORS.textMuted, paddingTop: Platform.OS === 'ios' ? 0 : 14, textAlignVertical: 'center' }]}>
          {value || `Select ${label}`}
        </Text>
        <Icon name="chevron-down" size={20} color={COLORS.textMuted} />
      </TouchableOpacity>
    </View>
  );

  const pickImage = (type) => {
    const options = {
      width: type === 'profile' ? 400 : 800,
      height: type === 'profile' ? 400 : 500,
      cropping: true,
      includeBase64: false,
      useFrontCamera: type === 'profile',
      compressImageQuality: 0.7,
      compressImageMaxWidth: 1000,
      compressImageMaxHeight: 1000,
    };

    ImagePicker.openCamera(options)
      .then(image => {
        if (type === 'aadhar') setAadharImage(image);
        else setProfilePicture(image);
      })
      .catch(err => {
        if (err.message !== 'User cancelled image selection') {
          Alert.alert('Camera Error', 'Could not access camera.');
        }
      });
  };

  const renderUploadCard = (title, subtitle, icon, type, imageData) => (
    <View style={styles.docGroup}>
      <Text style={styles.inputLabel}>{title.toUpperCase()}</Text>
      <TouchableOpacity 
        activeOpacity={0.8} 
        style={[styles.uploadCard, imageData && styles.uploadCardSelected]}
        onPress={() => pickImage(type)}
      >
        <View style={styles.uploadInfo}>
          <View style={[styles.uploadIconCircle, imageData && styles.uploadIconCircleSelected]}>
            {imageData ? (
              <Image source={{ uri: imageData.path }} style={styles.previewImage} />
            ) : (
              <Icon name={icon} size={28} color={COLORS.primary} />
            )}
          </View>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={styles.uploadTitle}>{title}</Text>
            <Text style={styles.uploadSubtitle}>{imageData ? 'Document Captured' : subtitle}</Text>
          </View>
          <View style={[styles.addButton, imageData && styles.addButtonSelected]}>
            <Icon name={imageData ? "check" : "plus"} size={20} color="#FFF" />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={['#F8F9FD', '#FFFFFF']} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
            <Icon name="chevron-left" size={32} color={COLORS.primaryDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vendor Registration</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.intro}>
            <Text style={styles.mainTitle}>Join U-TURN</Text>
            <Text style={styles.mainSubtitle}>Register your business in one simple step</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionHeading}>PROFILE & PERSONAL</Text>
            {renderUploadCard('Profile Picture', 'Clear face photo', 'camera-outline', 'profile', profilePicture)}
            
            {renderInputField('Full Name', 'account-outline', formData.name, (t) => setFormData({ ...formData, name: t }), 'Full Legal Name')}
            {renderSelector('Date of Birth', 'calendar-outline', formData.dob, () => setShowDatePicker(true))}

            <View style={styles.divider} />

            <Text style={styles.sectionHeading}>BUSINESS DETAILS</Text>
            {renderInputField('Business Name', 'office-building', formData.businessName, (t) => setFormData({ ...formData, businessName: t }), 'Enterprise Name')}
            {renderSelector('State', 'map-marker-outline', formData.state, () => setShowStateModal(true))}
            {renderInputField('Address', 'map-marker-radius-outline', formData.address, (t) => setFormData({ ...formData, address: t }), 'Office/Shop Address')}
            {renderInputField('GST Number (Optional)', 'file-document-outline', formData.gstNumber, (t) => setFormData({ ...formData, gstNumber: t.toUpperCase() }), '22AAAAA0000A1Z5')}
            
            <View style={styles.divider} />

            <Text style={styles.sectionHeading}>IDENTITY DOCUMENTS</Text>
            {renderUploadCard('Aadhar ID Proof', 'Front & Back of Aadhar Card', 'card-account-details-outline', 'aadhar', aadharImage)}
          </View>


          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSubmit}
            style={styles.mainBtn}
            disabled={loading}
          >
            <LinearGradient colors={['#E53935', '#B71C1C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGradient}>
              <Text style={styles.btnText}>{loading ? 'SUBMITTING...' : 'FINALIZE REGISTRATION'}</Text>
              {!loading && <Icon name="check-decagram" size={22} color="#FFF" />}
            </LinearGradient>
          </TouchableOpacity>
          
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker Component */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
          maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 18))}
        />
      )}

      {/* State Modal */}
      <Modal visible={showStateModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select State</Text>
              <TouchableOpacity onPress={() => setShowStateModal(false)}>
                <Icon name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.searchBox}>
              <Icon name="magnify" size={20} color={COLORS.textMuted} />
              <TextInput
                placeholder="Search..."
                style={styles.searchInput}
                onChangeText={setStateSearch}
                value={stateSearch}
              />
            </View>
            <FlatList
              data={filteredStates}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.stateItem}
                  onPress={() => {
                    setFormData({ ...formData, state: item });
                    setShowStateModal(false);
                    setStateSearch('');
                  }}
                >
                  <Text style={styles.stateName}>{item}</Text>
                  <Icon name="chevron-right" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FD' },
  header: {
    height: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, backgroundColor: '#FFF', ...SHADOW.light,
  },
  headerBackBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#000' },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: 40 },
  intro: { marginVertical: 25 },
  mainTitle: { fontSize: 32, fontWeight: '900', color: COLORS.primaryDark, letterSpacing: -0.5 },
  mainSubtitle: { fontSize: 14, color: COLORS.textLight, fontWeight: '600', marginTop: 5 },
  formCard: { backgroundColor: '#FFF', borderRadius: 30, padding: 24, ...SHADOW.medium, marginBottom: 25 },
  sectionHeading: { fontSize: 12, fontWeight: '900', color: COLORS.primary, letterSpacing: 1.5, marginBottom: 15, marginTop: 5 },
  inputGroup: { marginBottom: 18 },
  inputLabel: { fontSize: 10, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 1.5, marginBottom: 8, marginLeft: 5 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FD', 
    borderRadius: 15, paddingHorizontal: 15, height: 54, borderWidth: 1, borderColor: '#F0F0F0',
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.text },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 20 },
  mainBtn: { height: 64, borderRadius: 20, overflow: 'hidden', ...SHADOW.medium },
  btnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 1, marginRight: 12 },
  uploadCard: {
    backgroundColor: '#F8F9FD', borderRadius: 18, padding: 18, borderWidth: 1.5, 
    borderColor: '#E0E0E0', borderStyle: 'dashed', marginBottom: 15,
  },
  uploadInfo: { flexDirection: 'row', alignItems: 'center' },
  uploadIconCircle: {
    width: 50, height: 50, borderRadius: 15, backgroundColor: 'rgba(229, 57, 53, 0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  uploadTitle: { fontSize: 15, fontWeight: '800', color: '#333' },
  uploadSubtitle: { fontSize: 11, color: COLORS.textMuted, marginTop: 2, fontWeight: '600' },
  addButton: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E53935', justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', height: height * 0.7, borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.primaryDark },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F7FA', borderRadius: 15, paddingHorizontal: 15, marginBottom: 15 },
  searchInput: { flex: 1, height: 48, marginLeft: 10, fontWeight: '600', color: COLORS.text },
  stateItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  stateName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  uploadCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(26, 35, 126, 0.02)',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  uploadIconCircleSelected: {
    padding: 0,
    overflow: 'hidden',
  },
  addButtonSelected: {
    backgroundColor: '#4CAF50',
  },
});

export default RegisterScreen;
