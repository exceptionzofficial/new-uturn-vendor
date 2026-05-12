import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, RADIUS, SHADOW, SPACING } from '../../theme/AppTheme';

// Screen Imports
import DashboardScreen from './DashboardScreen';
import TripsScreen from '../trips/TripsScreen';
import WalletScreen from '../features/WalletScreen';
import ProfileScreen from '../features/ProfileScreen';

const { width } = Dimensions.get('window');
const TAB_WIDTH = width / 5;

const MainScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState(0);
  const tabSlide = useRef(new Animated.Value(0)).current;

  const handleTabChange = (index) => {
    setActiveTab(index);
    Animated.spring(tabSlide, {
      toValue: index,
      useNativeDriver: true,
      friction: 8,
      tension: 50,
    }).start();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 0: return <DashboardScreen navigation={navigation} />;
      case 1: return <TripsScreen navigation={navigation} />;
      case 2: return <WalletScreen navigation={navigation} />;
      case 3: return <ProfileScreen navigation={navigation} />;
      default: return <DashboardScreen navigation={navigation} />;
    }
  };

  const NavItem = ({ index, icon, activeIcon, label }) => {
    const isActive = activeTab === index;
    return (
      <TouchableOpacity
        onPress={() => handleTabChange(index)}
        style={styles.tabItem}
        activeOpacity={0.7}
      >
        <Icon 
          name={isActive ? activeIcon : icon} 
          size={24} 
          color={isActive ? COLORS.primary : 'rgba(0,0,0,0.5)'} 
        />
        <Text style={[styles.tabLabel, isActive && styles.activeLabel]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Luxury Floating Dock Bottom Navigation */}
      <View style={styles.tabBarWrapper}>
        <LinearGradient
          colors={['#FFD700', '#FEC107']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.tabBar}
        >
          <NavItem index={0} icon="home-variant-outline" activeIcon="home-variant" label="Home" />
          <NavItem index={1} icon="road-variant" activeIcon="road-variant" label="Trips" />

          {/* Elevated Central FAB */}
          <View style={styles.fabPlaceholder}>
            <TouchableOpacity 
              activeOpacity={0.9}
              style={styles.fab}
              onPress={() => navigation.navigate('AddTrip')}
            >
              <View style={styles.fabInner}>
                <Icon name="plus" size={30} color="#FFF" />
              </View>
            </TouchableOpacity>
          </View>

          <NavItem index={2} icon="wallet-outline" activeIcon="wallet" label="Wallet" />
          <NavItem index={3} icon="account-outline" activeIcon="account" label="Profile" />
        </LinearGradient>

        {/* Active Tab Glow Indicator */}
        <Animated.View style={[
          styles.indicator,
          {
            transform: [{
              translateX: tabSlide.interpolate({
                inputRange: [0, 1, 2, 3],
                outputRange: [
                  (width * 0.04), // Home position
                  (width * 0.22), // Trips position
                  (width * 0.58), // Wallet position
                  (width * 0.76), // Profile position
                ]
              })
            }]
          }
        ]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  content: {
    flex: 1,
  },
  tabBarWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 45,
    left: 20,
    right: 20,
    ...SHADOW.premium,
  },
  tabBar: {
    flexDirection: 'row',
    height: 70,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(0,0,0,0.6)',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  activeLabel: {
    color: COLORS.primary,
    fontWeight: '900',
  },
  fabPlaceholder: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#F8F9FD',
    marginTop: -45,
    padding: 5,
    ...SHADOW.premium,
  },
  fabInner: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  indicator: {
    position: 'absolute',
    top: -2,
    width: 40,
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
  }
});

export default MainScreen;
