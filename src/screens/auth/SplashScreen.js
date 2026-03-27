import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Animated,
  Dimensions,
  Image,
  StatusBar,
  Text,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, RADIUS, SHADOW, SPACING } from '../../theme/AppTheme';

const { height, width } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Core Entrance Animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Subtle Float Animation for the background orbs
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Navigation Delay
    const timer = setTimeout(() => {
      navigation.replace('Language');
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* High-End Brand Gradient (Midnight Business) */}
      <LinearGradient
        colors={['#000428', '#004e92', '#000428']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Floating Elements (Similar to Language Screen but Darker) */}
      <Animated.View style={[
        styles.decorOrb, 
        styles.orb1,
        { transform: [{ translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) }] }
      ]} />
      <Animated.View style={[
        styles.decorOrb, 
        styles.orb2,
        { transform: [{ translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 30] }) }] }
      ]} />
      <Animated.View style={[
        styles.decorOrb, 
        styles.orb3,
        { transform: [{ scale: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }] }
      ]} />

      <View style={styles.content}>
        {/* Profile/Identity Section with Glow and Scale */}
        <Animated.View style={[
          styles.identityContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }
            ]
          }
        ]}>
          <View style={styles.glassLogoBorder}>
            <View style={styles.logoWrapper}>
              <Image 
                source={require('../../assets/logo.png')} 
                style={styles.logo} 
                resizeMode="contain"
              />
            </View>
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.brandTitle}>UTURN</Text>
            <View style={styles.accentLine} />
            <Text style={styles.vendorSubtitle}> VENDOR</Text>
            <Text style={styles.tagline}>STRATEGIC BUSINESS INFRASTRUCTURE</Text>
          </View>
        </Animated.View>

        {/* Loading & Status */}
        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
          <View style={styles.loadingPulseContainer}>
             <View style={styles.loadingPulse} />
             <Text style={styles.statusText}>ENCRYPTED CHANNEL SECURE...</Text>
          </View>
          <Text style={styles.versionText}>VER 2.0.1 • ENTERPRISE EDITION</Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  identityContainer: {
    alignItems: 'center',
  },
  glassLogoBorder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(0, 210, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  logoWrapper: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: RADIUS.xxl,
    padding: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW.premium,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 12,
    textAlign: 'center',
  },
  vendorSubtitle: {
    fontSize: 18,
    color: COLORS.accent,
    fontWeight: '800',
    letterSpacing: 14,
    marginTop: -5,
  },
  accentLine: {
    width: 80,
    height: 3,
    backgroundColor: COLORS.accent,
    marginVertical: 12,
    borderRadius: 1.5,
  },
  tagline: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '700',
    letterSpacing: 4,
    marginTop: 20,
    textTransform: 'uppercase',
  },
  decorOrb: {
    position: 'absolute',
    borderRadius: 200,
    backgroundColor: 'rgba(0, 210, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  orb1: {
    width: 300,
    height: 300,
    top: -50,
    right: -100,
    backgroundColor: 'rgba(0, 210, 255, 0.06)',
  },
  orb2: {
    width: 200,
    height: 200,
    bottom: 50,
    left: -50,
    backgroundColor: 'rgba(61, 90, 254, 0.08)',
  },
  orb3: {
    width: 150,
    height: 150,
    top: height * 0.4,
    left: width * 0.7,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  loadingPulseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  loadingPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 10,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  statusText: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '900',
    letterSpacing: 2,
  },
  versionText: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.25)',
    fontWeight: '800',
    letterSpacing: 1,
  },
});

export default SplashScreen;
