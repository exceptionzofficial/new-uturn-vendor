import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, RADIUS, SHADOW, SPACING } from '../../theme/AppTheme';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={32} color={COLORS.primaryDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Enterprise Profile</Text>
        <TouchableOpacity>
          <Icon name="cog-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={['#1A237E', '#3D5AFE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileGradient}
          />
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop' }}
              style={styles.avatar}
            />
            <View style={styles.verifiedBadge}>
              <Icon name="check-decagram" size={20} color="#FFF" />
            </View>
          </View>
          <Text style={styles.vendorName}>Global Logistics Pvt Ltd</Text>
          <Text style={styles.vendorId}>VENDOR ID: UT-89420</Text>
          <View style={styles.statusChip}>
            <Text style={styles.statusText}>VERIFIED ENTERPRISE</Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Business Credentials</Text>
        </View>
        <View style={styles.infoSection}>
          {renderInfoItem('Primary Contact', 'Hariprasath G', 'account-outline')}
          {renderInfoItem('Company Email', 'info@globallogistics.com', 'email-outline')}
          {renderInfoItem('GST Identification', '22AAAAA0000A1Z5', 'file-document-outline')}
          {renderInfoItem('Office Address', '124, Textile Market, Tiruppur, TN', 'map-marker-outline')}
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
  container: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  header: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  scroll: {
    padding: SPACING.lg,
  },
  profileCard: {
    height: 280,
    backgroundColor: '#FFF',
    borderRadius: 30,
    ...SHADOW.medium,
    alignItems: 'center',
    overflow: 'hidden',
    paddingTop: 80,
    marginBottom: 30,
  },
  profileGradient: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 140,
  },
  avatarWrapper: {
    position: 'absolute',
    top: 70,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 5,
    borderColor: '#FFF',
    ...SHADOW.medium,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 55,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.info,
    borderWidth: 3,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorName: {
    marginTop: 120,
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primaryDark,
    letterSpacing: -0.5,
  },
  vendorId: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    marginTop: 4,
    letterSpacing: 1.5,
  },
  statusChip: {
    marginTop: 15,
    backgroundColor: COLORS.info + '15',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.info,
    letterSpacing: 1,
  },
  sectionHeader: {
    marginBottom: 15,
    paddingLeft: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  infoSection: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 10,
    marginBottom: 30,
    ...SHADOW.light,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  infoIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8F9FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextWrapper: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2,
  },
  menuSection: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 10,
    marginBottom: 30,
    ...SHADOW.light,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FD',
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    marginLeft: 15,
  },
  versionContainer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    opacity: 0.8,
  },
});

export default ProfileScreen;
