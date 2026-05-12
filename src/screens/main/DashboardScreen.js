import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
  FlatList,
  Easing,
  TouchableWithoutFeedback,
  Modal,
  Alert,
} from 'react-native';
import LottieView from 'lottie-react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../../services/api';
import { COLORS, RADIUS, SHADOW, SPACING } from '../../theme/AppTheme';

const { width } = Dimensions.get('window');

const BANNERS = [
  // { id: '1', image: require('../../assets/banner1.jpg') },
  { id: '2', image: require('../../assets/banner2.jpg') },
  { id: '3', image: require('../../assets/banner3.jpg') },
  { id: '4', image: require('../../assets/banner4.jpg') },
  { id: '5', image: require('../../assets/banner5.jpg') },
];

const SERVICES = [
  { id: '1', label: 'Jobs', image: require('../../assets/job.png'), color: '#4CAF50' },
  { id: '2', label: 'Buy / Sell', image: require('../../assets/Vehicle.png'), color: '#2196F3' },
  { id: '3', label: 'Expenses', image: require('../../assets/money.png'), color: '#FF5722' },
  { id: '4', label: 'Loan', image: require('../../assets/loan.png'), color: '#9C27B0' },
  { id: '5', label: 'Insurance', image: require('../../assets/insurance.png'), color: '#00BCD4' },
  { id: '6', label: 'Referrals', image: require('../../assets/referral.png'), color: '#FF9800' },
  { id: '7', label: 'Profit Analysis', image: require('../../assets/earning.png'), color: '#8BC34A' },
  { id: '8', label: 'Game', image: require('../../assets/game.png'), color: '#E91E63' },
];

const CATEGORIES = [
  { id: '1', name: 'Facebook', icon: require('../../assets/Facebook.json') },
  { id: '2', name: 'Instagram', icon: require('../../assets/instagram.json') },
  { id: '3', name: 'Twitter', icon: require('../../assets/Twitter.json') },
  { id: '4', name: 'Youtube', icon: require('../../assets/Youtube.json') },
  { id: '5', name: 'Fastag', icon: require('../../assets/Fastag.json') },
  { id: '6', name: 'Parking', icon: require('../../assets/Parking.json') },
  { id: '7', name: 'Hotel', icon: require('../../assets/Hotel.json') },
  { id: '8', name: 'Shopping', icon: require('../../assets/Shopping.json') },
];

const DashboardScreen = ({ navigation }) => {
  const [activeBanner, setActiveBanner] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const tickerAnim = useRef(new Animated.Value(0)).current;
  const bannerRef = useRef(null);
  const walletScale = useRef(new Animated.Value(1)).current;
  const subScale = useRef(new Animated.Value(1)).current;
  const arrowScale = useRef(new Animated.Value(1)).current;

  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const categoryMenuAnim = useRef(new Animated.Value(width)).current;

  const openCategoryMenu = () => {
    setShowCategoryMenu(true);
    Animated.timing(categoryMenuAnim, {
      toValue: 0,
      duration: 1200,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();
  };

  const closeCategoryMenu = () => {
    Animated.timing(categoryMenuAnim, {
      toValue: width,
      duration: 600,
      easing: Easing.in(Easing.exp),
      useNativeDriver: true,
    }).start(() => setShowCategoryMenu(false));
  };

  const animateScale = (scale, toValue) => {
    Animated.spring(scale, {
      toValue,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  // Announcement Animation (Scrolling Ticker)
  useEffect(() => {
    Animated.loop(
      Animated.timing(tickerAnim, {
        toValue: 1,
        duration: 25000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();
  }, []);

  // Auto-scroll logic
  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = activeBanner + 1;
      if (nextIndex >= BANNERS.length) nextIndex = 0;
      bannerRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setActiveBanner(nextIndex);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeBanner]);

  const [vendorName, setVendorName] = useState('U-Turn Vendor');
  const [vendorStatus, setVendorStatus] = useState('approved'); // Default to approved to avoid flicker

  useEffect(() => {
    const fetchProfile = async () => {
      const data = await AsyncStorage.getItem('vendor_data');
      if (data) {
        const parsed = JSON.parse(data);
        setVendorName(parsed.businessName || parsed.name || 'U-Turn Vendor');
        setVendorStatus(parsed.status || 'pending');

        if (parsed.phone) {
          try {
            const res = await apiService.getProfile(parsed.phone);
            if (res.success && res.vendor) {
              setVendorName(res.vendor.businessName || res.vendor.name || 'U-Turn Vendor');
              setVendorStatus(res.vendor.status || 'pending');
              await AsyncStorage.setItem('vendor_data', JSON.stringify({ ...res.vendor, phone: parsed.phone }));
            }
          } catch (e) {
            console.log('Dashboard profile fetch error:', e);
          }
        }
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleServicePress = (item) => {
    if (item.label === 'Jobs') {
      navigation.navigate('Trips');
    } else if (item.label === 'Profit Analysis') {
      navigation.navigate('Wallet');
    } else {
      Alert.alert('Coming Soon', `${item.label} feature is under development.`);
    }
  };

  const renderServiceCard = (item) => (
    <TouchableOpacity
      key={item.id}
      activeOpacity={0.8}
      style={[styles.serviceCard, { borderColor: item.color + '20' }]}
      onPress={() => handleServicePress(item)}
    >
      <View style={styles.iconContainer}>
        <Image source={item.image} style={styles.serviceIconImage} resizeMode="contain" />
      </View>
      <Text style={styles.serviceLabel}>{item.label}</Text>
    </TouchableOpacity>
  );



  const renderBanner = ({ item }) => (
    <View style={styles.bannerContainer}>
      <Image source={item.image} style={styles.bannerImage} resizeMode="cover" />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Elite Corporate Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#E53935', '#B71C1C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerBackground}
        />
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
            <View style={styles.avatarWrapper}>
              <Icon name="account-circle" size={40} color="#FFF" />
            </View>
          </TouchableOpacity>
          <View style={styles.headerMiddle}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.vendorName} numberOfLines={1}>{vendorName}</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <View style={styles.notifBadge}>
               <Icon name="bell-outline" size={24} color="#FFF" />
               <View style={styles.notifDot} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* News Ticker / Announcement Bar */}
      <View style={styles.announcementContainer}>
        <View style={styles.newsBadge}>
          <Icon name="bullhorn-outline" size={12} color="#FFF" />
          <Text style={styles.newsBadgeText}>LATEST</Text>
        </View>
        <View style={styles.tickerWrapper}>
          <Animated.Text
            style={[
              styles.tickerText,
              {
                transform: [{
                  translateX: tickerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [width, -width * 2]
                  })
                }]
              }
            ]}
          >
            🎉 Happy Birthday to our Partners! • 🚀 New Express Hub opening in Coimbatore soon! • 📊 Review your Weekly Settlement report in Wallet. • ⚠️ Maintenance scheduled for Sunday 2 AM.
          </Animated.Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          <View style={{ height: 10 }} />

          {/* Scrolling Banner (Centered, Square) */}
          <View style={styles.carouselWrapper}>
            <FlatList
              ref={bannerRef}
              data={BANNERS}
              renderItem={renderBanner}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              getItemLayout={(data, index) => ({ length: width, offset: width * index, index })}
              onScroll={(e) => {
                const x = e.nativeEvent.contentOffset.x;
                setActiveBanner(Math.round(x / width));
              }}
            />
            <View style={styles.dotsContainer}>
              {BANNERS.map((_, i) => (
                <View key={i} style={[styles.dot, activeBanner === i && styles.dotActive]} />
              ))}
            </View>
          </View>

          {/* Core Business Services */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Other Services</Text>
          </View>

          <View style={styles.servicesGrid}>
            {SERVICES.map((item) => renderServiceCard(item))}
          </View>

          <View style={{ height: 120 }} />
        </Animated.View>
      </ScrollView>

      {/* Floating Animated Actions */}
      <View style={styles.floatingContainer}>
        <TouchableWithoutFeedback
          onPressIn={() => animateScale(arrowScale, 1.2)}
          onPressOut={() => animateScale(arrowScale, 1)}
          onPress={openCategoryMenu}
        >
          <Animated.View style={[styles.floatingCircle, { transform: [{ scale: arrowScale }] }]}>
            <LottieView
              source={require('../../assets/left arrow.json')}
              autoPlay
              loop
              style={styles.lottieIcon}
            />
          </Animated.View>
        </TouchableWithoutFeedback>

        <TouchableWithoutFeedback
          onPressIn={() => animateScale(subScale, 1.2)}
          onPressOut={() => animateScale(subScale, 1)}
          onPress={() => navigation.navigate('Subscription')}
        >
          <Animated.View style={[styles.floatingCircle, { transform: [{ scale: subScale }] }]}>
            <LottieView
              source={require('../../assets/subscription.json')}
              autoPlay
              loop
              style={styles.lottieIcon}
            />
          </Animated.View>
        </TouchableWithoutFeedback>

        <TouchableWithoutFeedback
          onPressIn={() => animateScale(walletScale, 1.2)}
          onPressOut={() => animateScale(walletScale, 1)}
          onPress={() => navigation.navigate('Wallet')}
        >
          <Animated.View style={[styles.floatingCircle, { transform: [{ scale: walletScale }] }]}>
            <LottieView
              source={require('../../assets/wallet.json')}
              autoPlay
              loop
              style={styles.lottieIcon}
            />
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>

      {/* Side-Sliding Category Menu */}
      {showCategoryMenu && (
        <Animated.View style={[styles.sideMenuOverlay, { transform: [{ translateX: categoryMenuAnim }] }]}>
          <View style={styles.sideMenuHeader}>
            <LinearGradient
              colors={['#2196F3', '#673AB7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
            <TouchableOpacity onPress={closeCategoryMenu} style={styles.backBtn}>
              <Icon name="arrow-left" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.sideMenuTitle}>Features</Text>
          </View>

          <View style={styles.sideMenuContent}>
            {/* Sidebar */}
            <View style={styles.sidebar}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {CATEGORIES.map((cat) => {
                  const isCatActive = selectedCategory.id === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.sidebarItem, isCatActive && styles.sidebarItemActive]}
                      onPress={() => setSelectedCategory(cat)}
                    >
                      <View style={styles.sidebarIconBox}>
                        <LottieView source={cat.icon} autoPlay loop style={{ width: 40, height: 40 }} />
                      </View>
                      <Text style={[styles.sidebarLabel, isCatActive && styles.sidebarLabelActive]}>{cat.name}</Text>
                      {isCatActive && <View style={styles.activeIndicator} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Main Content Area */}
            <View style={styles.mainArea}>
              <View style={styles.mainAreaHeader}>
                <Text style={styles.mainAreaTitle}>{selectedCategory.name}</Text>
                <View style={styles.mainAreaDivider} />
              </View>

              <View style={styles.comingSoonContainer}>
                <LottieView
                  source={require('../../assets/comming soon.json')}
                  autoPlay
                  loop
                  style={styles.comingSoonLottie}
                />
                {/* <Text style={styles.comingSoonText}>Coming Soon...</Text> */}
              </View>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Verification Guard Modal */}
      <Modal
        visible={
          vendorStatus?.toUpperCase() !== 'APPROVED' && 
          vendorStatus?.toUpperCase() !== 'ACTIVE' && 
          vendorStatus?.toUpperCase() !== 'VERIFIED'
        }
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.statusModal}>
            <LottieView
              source={require('../../assets/radar.json')}
              autoPlay
              loop
              style={{ width: 140, height: 140 }}
            />
            <Text style={styles.modalTitle}>Verification in Progress</Text>
            <Text style={styles.modalText}>
              Your account is currently being reviewed. 
              You will have full access once our team verifies your documents.
            </Text>
            
            <View style={styles.pendingBadge}>
              <Icon name="clock-outline" size={16} color="#FF9800" />
              <Text style={styles.pendingText}>STATUS: {vendorStatus?.toUpperCase() || 'PENDING'}</Text>
            </View>

            <TouchableOpacity 
              style={styles.profileRedirectBtn}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.profileRedirectText}>VIEW MY PROFILE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const SERVICE_CARD_SIZE = (width - 40 - 15) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: COLORS.primaryDark,
    paddingBottom: 20,
    ...SHADOW.medium,
  },
  headerBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  profileBtn: {
    padding: 2,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  avatarWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerMiddle: {
    flex: 1,
    marginLeft: 15,
  },
  greeting: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  vendorName: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  notifBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadge: {
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFEB3B',
    borderWidth: 1.5,
    borderColor: '#B71C1C',
  },
  menuBtn: {
    marginRight: 15,
  },
  announcementContainer: {
    height: 35,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    ...SHADOW.light,
  },
  newsBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    zIndex: 10,
  },
  newsBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    marginLeft: 5,
  },
  tickerWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  tickerText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    width: width * 3,
  },
  scroll: {
    paddingBottom: 40,
  },
  carouselWrapper: {
    height: 200,
    marginBottom: 20,
  },
  bannerContainer: {
    width: width,
    height: 200,
    overflow: 'hidden',
    backgroundColor: '#EEE',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 15,
    width: '100%',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 3,
  },
  dotActive: {
    backgroundColor: '#FFF',
    width: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
    letterSpacing: -0.5,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingTop: 5,
  },
  serviceCard: {
    width: SERVICE_CARD_SIZE,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.light,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  iconContainer: {
    width: 60,
    height: 60,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceIconImage: {
    width: '100%',
    height: '100%',
  },
  serviceLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  floatingContainer: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    alignItems: 'center',
    zIndex: 1000,
  },
  floatingCircle: {
    width: 75,
    height: 75,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieIcon: {
    width: 75,
    height: 75,
  },
  sideMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFF',
    zIndex: 2000,
  },
  sideMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    height: 100,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    padding: 10,
    marginRight: 10,
  },
  sideMenuTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
  },
  sideMenuContent: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: width * 0.3,
    backgroundColor: '#F8F9FD',
    borderRightWidth: 1,
    borderRightColor: '#F0F0F0',
  },
  sidebarItem: {
    paddingVertical: 20,
    alignItems: 'center',
    position: 'relative',
  },
  sidebarItemActive: {
    backgroundColor: '#FFF',
  },
  sidebarIconBox: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  sidebarLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  sidebarLabelActive: {
    color: COLORS.primary,
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '20%',
    bottom: '20%',
    width: 4,
    backgroundColor: COLORS.primary,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  mainArea: {
    flex: 1,
    padding: 20,
  },
  mainAreaHeader: {
    marginBottom: 30,
  },
  mainAreaTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000',
    marginBottom: 5,
  },
  mainAreaDivider: {
    width: 40,
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -50,
  },
  comingSoonLottie: {
    width: 250,
    height: 250,
  },
  comingSoonText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textMuted,
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  statusModal: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    ...SHADOW.large,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A237E',
    marginTop: 10,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 25,
  },
  pendingText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FF9800',
    marginLeft: 8,
    letterSpacing: 1,
  },
  profileRedirectBtn: {
    marginTop: 30,
    paddingVertical: 18,
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#1A237E',
    borderRadius: 18,
    ...SHADOW.large,
  },
  profileRedirectText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
});

export default DashboardScreen;
