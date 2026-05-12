import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../../services/api';
import { COLORS, RADIUS, SHADOW, SPACING } from '../../theme/AppTheme';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const [vendor, setVendor] = React.useState({});
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchVendor = async () => {
    try {
      const stored = await AsyncStorage.getItem('vendor_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        const phone = parsed.phone || parsed.vendorId;
        
        if (phone) {
          // If we don't have business name yet, just show phone/loading
          if (!parsed.businessName) {
            setVendor({ phone });
          } else {
            setVendor(parsed);
          }

          const res = await apiService.getProfile(phone);
          if (res.success && res.vendor) {
            const fullVendor = { ...res.vendor, phone };
            setVendor(fullVendor);
            await AsyncStorage.setItem('vendor_data', JSON.stringify(fullVendor));
          }
        } else {
          setVendor(parsed);
        }
      }
    } catch (err) {
      if (err.response?.status === 404) {
        console.log("Vendor profile not found in DB (404). Keeping local data.");
      } else {
        console.error("Failed to load vendor profile:", err);
      }
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchVendor();
    setRefreshing(false);
  }, []);

  React.useEffect(() => {
    fetchVendor();
  }, []);
  const renderInfoItem = (label, value, icon) => (
    <View style={styles.infoBox}>
      <View style={styles.infoIconWrapper}>
        <Icon name={icon} size={20} color={COLORS.primary} />
      </View>
      <View style={styles.infoTextWrapper}>
        <Text style={styles.infoLabel}>{label.toUpperCase()}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
      {/* No Edit button here as per requirements */}
    </View>
  );

  const renderMenuOption = (title, icon, color, onPress) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.menuRow}>
      <View style={[styles.menuIcon, { backgroundColor: color + '15' }]}>
        <Icon name={icon} size={22} color={color} />
      </View>
      <Text style={styles.menuTitle}>{title}</Text>
      <Icon name="chevron-right" size={20} color={COLORS.textMuted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={['#F8F9FD', '#FFFFFF']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Icon name="chevron-left" size={32} color={COLORS.primaryDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>U-Turn Account</Text>
        <TouchableOpacity style={styles.headerBtn}>
          <Icon name="shield-check-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <LinearGradient 
            colors={[COLORS.primary, COLORS.primaryDark]} 
            style={styles.profileGradient}
            start={{x:0, y:0}} end={{x:1, y:1}}
          >
            <View style={styles.avatarContainer}>
              <View style={styles.avatarWrapper}>
                <Image 
                  source={vendor.profilePicture ? { uri: vendor.profilePicture } : require('../../assets/logo.png')} 
                  style={styles.avatar} 
                />
                <View style={styles.statusBadgeSmall}>
                  <Icon 
                    name={vendor.status === 'approved' ? "check-decagram" : "clock-fast"} 
                    size={16} 
                    color="#FFF" 
                  />
                </View>
              </View>
            </View>
            
            <Text style={styles.vendorName}>{vendor.businessName || vendor.name || 'U-Turn Vendor'}</Text>
            <View style={styles.statusTagContainer}>
              <View style={[
                styles.statusTag, 
                { backgroundColor: vendor.status === 'approved' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 152, 0, 0.2)' }
              ]}>
                <View style={[
                  styles.statusDot, 
                  { backgroundColor: vendor.status === 'approved' ? '#4CAF50' : '#FF9800' }
                ]} />
                <Text style={[
                  styles.statusTagText, 
                  { color: vendor.status === 'approved' ? '#4CAF50' : '#FF9800' }
                ]}>
                  {vendor.status === 'approved' ? 'VERIFIED PARTNER' : 'UNDER VERIFICATION'}
                </Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.idRow}>
            <Text style={styles.idLabel}>VENDOR ID</Text>
            <Text style={styles.idValue}>{vendor.phone || vendor.vendorId || '---'}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Registration Details</Text>
          <View style={styles.infoGrid}>
            {renderInfoItem('Owner Name', vendor.name || '---', 'account-outline')}
            {renderInfoItem('Business Name', vendor.businessName || '---', 'office-building')}
            {renderInfoItem('Registered Contact', vendor.phone || '---', 'phone-outline')}
            {renderInfoItem('GST Identification', vendor.gstNumber || 'Not Provided', 'file-document-outline')}
            {renderInfoItem('Operational State', vendor.state || '---', 'map-marker-outline')}
            {renderInfoItem('Business Address', vendor.address || '---', 'map-marker-radius-outline')}
          </View>

          <Text style={styles.sectionTitle}>Account Verification</Text>
          <View style={styles.docCard}>
            <View style={styles.docItem}>
              <Icon name="card-account-details-outline" size={24} color={COLORS.primary} />
              <View style={styles.docInfo}>
                <Text style={styles.docLabel}>Aadhar Identity Document</Text>
                <Text style={styles.docStatus}>
                  {vendor.aadharImage ? 'Document Uploaded' : 'Action Required'}
                </Text>
              </View>
              <Icon 
                name={vendor.aadharImage ? "check-circle" : "alert-circle"} 
                size={20} 
                color={vendor.aadharImage ? COLORS.success : COLORS.error} 
              />
            </View>
          </View>
        </View>

        {/* Account Options */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Settings & Support</Text>
        </View>
        <View style={styles.menuSection}>
          {renderMenuOption('Business Wallet', 'wallet-outline', '#1A237E', () => navigation.navigate('Wallet'))}
          {renderMenuOption('Security & Privacy', 'shield-lock-outline', '#4CAF50', () => {})}
          {renderMenuOption('Help & Documentation', 'help-circle-outline', '#FF9800', () => {})}
          {renderMenuOption('Sign Out Account', 'logout', '#F44336', () => navigation.replace('Splash'))}
        </View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>App Version v1.0.1 (101)</Text>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FD' },
  header: {
    height: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, backgroundColor: '#FFF',
  },
  headerBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: COLORS.primaryDark, letterSpacing: -0.5 },
  profileCard: {
    margin: SPACING.lg, backgroundColor: '#FFF', borderRadius: 30, 
    ...SHADOW.large, overflow: 'hidden', paddingBottom: 20
  },
  profileGradient: { padding: 30, alignItems: 'center' },
  avatarContainer: { marginBottom: 15 },
  avatarWrapper: {
    width: 100, height: 100, borderRadius: 50, borderWidth: 4, 
    borderColor: 'rgba(255,255,255,0.3)', padding: 3
  },
  avatar: { width: '100%', height: '100%', borderRadius: 45, backgroundColor: '#FFF' },
  statusBadgeSmall: {
    position: 'absolute', bottom: -2, right: -2, width: 28, height: 28,
    borderRadius: 14, backgroundColor: COLORS.success, borderWidth: 3, 
    borderColor: COLORS.primary, justifyContent: 'center', alignItems: 'center'
  },
  vendorName: { fontSize: 24, fontWeight: '900', color: '#FFF', textAlign: 'center', letterSpacing: -0.5 },
  statusTagContainer: { marginTop: 12 },
  statusTag: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, 
    paddingVertical: 8, borderRadius: 20
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusTagText: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  idRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 25, paddingVertical: 15, borderTopWidth: 1, 
    borderTopColor: '#F0F0F0', marginTop: 10
  },
  idLabel: { fontSize: 10, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 1.5 },
  idValue: { fontSize: 14, fontWeight: '900', color: COLORS.primaryDark },
  content: { paddingHorizontal: SPACING.lg },
  sectionTitle: { 
    fontSize: 16, fontWeight: '900', color: COLORS.primaryDark, 
    marginBottom: 15, marginTop: 10, letterSpacing: -0.2
  },
  infoGrid: { 
    backgroundColor: '#FFF', borderRadius: 25, padding: 10, 
    ...SHADOW.light, marginBottom: 25 
  },
  infoBox: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  infoIconWrapper: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#F8F9FD',
    justifyContent: 'center', alignItems: 'center'
  },
  infoTextWrapper: { marginLeft: 15, flex: 1 },
  infoLabel: { fontSize: 9, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 1 },
  infoValue: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginTop: 2 },
  docCard: { 
    backgroundColor: '#FFF', borderRadius: 20, padding: 20, 
    ...SHADOW.light, marginBottom: 30 
  },
  docItem: { flexDirection: 'row', alignItems: 'center' },
  docInfo: { flex: 1, marginLeft: 15 },
  docLabel: { fontSize: 13, fontWeight: '900', color: COLORS.text },
  docStatus: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, marginTop: 2 },
  menuSection: { 
    backgroundColor: '#FFF', borderRadius: 25, padding: 10, 
    ...SHADOW.light, marginBottom: 40, marginHorizontal: SPACING.lg
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', padding: 15,
    borderBottomWidth: 1, borderBottomColor: '#F8F9FD'
  },
  menuIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: COLORS.text, marginLeft: 15 },
  sectionHeader: { paddingHorizontal: 25, marginBottom: 5 },
  versionContainer: { alignItems: 'center', paddingBottom: 20 },
  versionText: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 1 },
});

export default ProfileScreen;
