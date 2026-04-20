import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  TextInput,
  Keyboard,
  Pressable,
} from 'react-native';


import { SafeAreaView } from 'react-native-safe-area-context';

import LottieView from 'lottie-react-native';
import OtpVerify from 'react-native-otp-verify';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme/AppTheme';
import apiClient from '../../services/api';

const { width } = Dimensions.get('window');

const OtpScreen = ({ navigation, route }) => {
  const { phone, isNewUser } = route.params;
  const [status, setStatus] = useState('Waiting for OTP...');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30); // Standard resend timer
  const [showManual, setShowManual] = useState(false);
  const [otpArray, setOtpArray] = useState(['', '', '', '', '', '']);
  const inputs = React.useRef([]);

  useEffect(() => {
    // 1. Get and Log Hash
    OtpVerify.getHash()
      .then(hash => {
        const h = hash && hash.length > 0 ? hash[0] : 'No Hash Found';
        console.log('App Hash:', h);
      })
      .catch(err => console.log('Hash Error:', err));

    // 2. Start SMS Listener
    OtpVerify.getOtp()
      .then(p => {
        OtpVerify.addListener(otpHandler);
      })
      .catch(p => console.log('OTP Listener Error:', p));

    // 3. Auto-show Manual after 10 seconds
    const manualTimer = setTimeout(() => {
      setShowManual(true);
    }, 10000);

    // 4. Countdown for Resend
    const resendInterval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      OtpVerify.removeListener();
      clearTimeout(manualTimer);
      clearInterval(resendInterval);
    };
  }, []);


  const otpHandler = (message) => {
    console.log('OTP Message Received:', message);
    if (!message) return;

    if (message === 'Timeout Error') {
      setStatus('Timer expired. Please resend.');
      return;
    }

    // Extract 6-digit OTP from message
    const otp = message.match(/(\d{6})/)?.[1];
    if (otp) {
      setStatus(`Detected: ${otp}`);
      verifyOtp(otp);
    } else {
      setStatus('SMS received but code not found.');
    }
  };

  const handleOtpInput = (value, index) => {
    const newOtp = [...otpArray];
    newOtp[index] = value;
    setOtpArray(newOtp);

    // Auto-focus next
    if (value && index < 5) {
      inputs.current[index + 1].focus();
    }

    // Auto-verify if full
    if (newOtp.join('').length === 6) {
      Keyboard.dismiss();
      verifyOtp(newOtp.join(''));
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otpArray[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const verifyOtp = async (otp) => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a 6-digit code.');
      return;
    }
    setLoading(true);
    setStatus('Verifying...');

    try {
      const response = await apiClient.verifyOtp(phone, otp);
      if (response.success) {
        // Save session
        await AsyncStorage.setItem('vendor_session', JSON.stringify({ phone }));
        await AsyncStorage.setItem('is_logged_in', 'true');

        if (isNewUser) {
          navigation.replace('Register', { verifiedPhone: phone });
        } else {
          navigation.replace('Main');
        }
      } else {
        setStatus('Invalid OTP. Please resend.');
      }
    } catch (err) {
      setStatus('Verification failed. Try again.');
      console.error(err);
      Alert.alert('Verification Failed', 'The OTP entered is incorrect or has expired.');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (timer > 0) return;
    setLoading(true);
    setStatus('Resending OTP...');
    try {
      await apiClient.sendOtp(phone);
      setTimer(30);
      setStatus('Waiting for new OTP...');
    } catch (err) {
      Alert.alert('Error', 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <View style={styles.content}>
        <LottieView
          source={require('../../assets/radar.json')}
          autoPlay
          loop
          style={styles.lottie}
        />
        <Text style={styles.title}>Verifying Your Number</Text>
        <Text style={styles.subtitle}>
          We sent a code to <Text style={styles.highlight}>+91 {phone}</Text>. 
          {showManual ? 'Please enter the code manually below.' : 'Stay on this screen for automatic verification.'}
        </Text>

        {!showManual ? (
          <TouchableOpacity 
            style={styles.statusBox}
            onPress={() => setShowManual(true)}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.primary} size="small" />
            ) : (
              <Icon name="shield-check-outline" size={20} color={COLORS.primary} />
            )}
            <Text style={styles.statusText}>{status}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.manualContainer}>
            <View style={styles.otpInputContainer}>
              {otpArray.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputs.current[index] = ref)}
                  style={styles.otpInput}
                  maxLength={1}
                  keyboardType="number-pad"
                  value={digit}
                  onChangeText={(value) => handleOtpInput(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  autoFocus={index === 0}
                />
              ))}
            </View>
            <TouchableOpacity 
              style={[styles.verifyBtn, loading && styles.disabledBtn]} 
              onPress={() => verifyOtp(otpArray.join(''))}
              disabled={loading}
            >
              <Text style={styles.verifyBtnText}>
                {loading ? 'Verifying...' : 'Verify Code'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.infoText}>
          {showManual 
            ? 'The SMS contains a 6-digit code. Check your notification bar.'
            : 'Ensure your SIM card is in this phone to continue. Manual entry is available if auto-fetch fails.'}
        </Text>

        <TouchableOpacity 
          style={styles.resendBtn} 
          onPress={resendOtp}
          disabled={timer > 0}
        >
          <Text style={styles.resendText}>
            Didn't receive code? {timer > 0 ? `Resend in ${timer}s` : <Text style={styles.resendLink}>Resend Now</Text>}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Icon name="arrow-left" size={20} color={COLORS.textLight} />
        <Text style={styles.backText}>Change Number</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: 250,
    height: 250,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  highlight: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    marginTop: 30,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 10,
  },
  manualContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 30,
  },
  otpInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    backgroundColor: '#F9F9F9',
  },
  verifyBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 30,
    width: '100%',
    alignItems: 'center',
    ...SHADOW.medium,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  verifyBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  infoText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 25,
    fontStyle: 'italic',
    paddingHorizontal: 30,
  },
  resendBtn: {
    marginTop: 30,
  },
  resendText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  resendLink: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textLight,
    marginLeft: 5,
  },
});


export default OtpScreen;
