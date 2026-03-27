import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, RADIUS, SHADOW, SPACING } from '../../theme/AppTheme';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 5,
        tension: 30,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#FFFFFF', '#F5F7FA']} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Animated.View style={[styles.header, {
            opacity: fadeAnim,
            transform: [{ scale: logoScale }]
          }]}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          <Animated.View style={[styles.body, {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }]}>
            <Text style={styles.title}>Secure Sign In</Text>
            <Text style={styles.subtitle}>Enter your business phone number to access your vendor dashboard.</Text>

            <View style={styles.inputCard}>
              <View style={styles.inputHeader}>
                <Text style={styles.inputLabel}>PHONE NUMBER</Text>
                <Icon name="shield-lock-outline" size={16} color={COLORS.success} />
              </View>

              <View style={styles.phoneInputWrapper}>
                <View style={styles.countryPicker}>
                  <Text style={styles.flag}>🇮🇳</Text>
                  <Text style={styles.countryCode}>+91</Text>
                  <Icon name="chevron-down" size={16} color={COLORS.textLight} />
                </View>
                <View style={styles.divider} />
                <TextInput
                  placeholder="000 000 0000"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="phone-pad"
                  maxLength={10}
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Register')} // Skipping OTP simulation for direct flow
              style={[styles.loginBtn, phone.length === 10 ? styles.loginBtnActive : null]}
              disabled={phone.length !== 10}
            >
              <LinearGradient
                colors={phone.length === 10 ? ['#1A237E', '#3D5AFE'] : ['#BDBDBD', '#E0E0E0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
              >
                <Text style={styles.btnText}>GET VERIFICATION CODE</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.options}>
              <TouchableOpacity>
                <Text style={styles.helpText}>Need help with login?</Text>
              </TouchableOpacity>
              <View style={styles.dot} />
              <TouchableOpacity>
                <Text style={styles.helpText}>Contact Support</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
            <Text style={styles.termsText}>
              By proceeding, you agree to our{' '}
              <Text style={styles.link}>Terms of Service</Text> and{' '}
              <Text style={styles.link}>Privacy Policy</Text>.
            </Text>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF',
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW.medium,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A237E',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '600',
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 40,
  },
  inputCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    ...SHADOW.light,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 30,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 15,
  },
  flag: {
    fontSize: 20,
    marginRight: 6,
  },
  countryCode: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: 4,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
    marginRight: 20,
  },
  input: {
    flex: 1,
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 1,
    paddingVertical: 10,
  },
  loginBtn: {
    height: 64,
    borderRadius: 20,
    overflow: 'hidden',
    ...SHADOW.light,
  },
  loginBtnActive: {
    ...SHADOW.medium,
  },
  btnGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },
  helpText: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: '700',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textMuted,
    marginHorizontal: 12,
  },
  footer: {
    paddingVertical: 30,
  },
  termsText: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
    fontWeight: '600',
  },
  link: {
    color: COLORS.primary,
    fontWeight: '800',
  },
});

export default LoginScreen;
