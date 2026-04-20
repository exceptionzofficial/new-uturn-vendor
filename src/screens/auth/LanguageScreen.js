import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, RADIUS, SHADOW, SPACING, TYPOGRAPHY } from '../../theme/AppTheme';

const { width, height } = Dimensions.get('window');

const LANGUAGES = [
  { id: 'en', name: 'English', native: 'Global Standard', icon: 'web' },
  { id: 'ta', name: 'தமிழ்', native: 'Tamil', icon: 'alphabet-latin' },
  { id: 'hi', name: 'हिन्दी', native: 'Hindi', icon: 'translate' },
  { id: 'te', name: 'తెలుగు', native: 'Telugu', icon: 'message-text-outline' },
  { id: 'ka', name: 'ಕನ್ನಡ', native: 'Kannada', icon: 'script-text-outline' },
  { id: 'ml', name: 'മലയാളം', native: 'Malayalam', icon: 'book-open-variant' },
];

const LanguageScreen = ({ navigation }) => {
  const [selected, setSelected] = useState('en');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

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

  const handleSelect = (id) => {
    setSelected(id);
    // Taptic feedback (can't do code only but can simulate with scale)
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 1.05, duration: 100, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const renderItem = ({ item, index }) => (
    <Animated.View style={{
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim.interpolate({
        inputRange: [0, 50],
        outputRange: [0, 50 + (index * 20)], // Staggered effect
      }) }]
    }}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleSelect(item.id)}
        style={[
          styles.languageCard,
          selected === item.id && styles.selectedCard,
        ]}
      >
        <LinearGradient
          colors={selected === item.id ? ['#1A237E', '#3D5AFE'] : ['#FFF', '#F8F9FD']}
          style={styles.cardGradient}
        >
          <View style={[styles.iconContainer, selected === item.id && styles.selectedIconContainer]}>
            <Icon 
              name={item.icon} 
              size={24} 
              color={selected === item.id ? '#FFF' : COLORS.primary} 
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.languageName, selected === item.id && styles.selectedText]}>
              {item.name}
            </Text>
            <Text style={[styles.nativeName, selected === item.id && styles.selectedTextMuted]}>
              {item.native}
            </Text>
          </View>
          {selected === item.id && (
            <View style={styles.checkIcon}>
              <Icon name="check-circle" size={24} color={COLORS.accent} />
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F5F7FA', '#E4E9F2', '#D8E2F0']} style={StyleSheet.absoluteFill} />
      
      {/* Decorative Top Design */}
      <View style={styles.topHeader}>
        <View style={styles.decorativeCircle} />
        <View style={styles.decorativeRectangle} />
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.content}>
          <View style={styles.intro}>
            <Text style={styles.title}>Language Preferences</Text>
            <Text style={styles.subtitle}>Select your primary business operation language for a tailored experience.</Text>
          </View>

          <FlatList
            data={LANGUAGES}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            numColumns={2}
            showsVerticalScrollIndicator={false}
          />

          <Animated.View style={[styles.footer, { transform: [{ scale: btnScale }] }]}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Login')}
              style={styles.continueBtn}
            >
              <LinearGradient
                colors={['#1A237E', '#3D5AFE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
              >
                <Text style={styles.btnText}>CONFIRM & PROCEED</Text>
                <Icon name="arrow-right" size={20} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  topHeader: {
    position: 'absolute',
    top: -height * 0.1,
    right: -width * 0.2,
    zIndex: 0,
  },
  decorativeCircle: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(26, 35, 126, 0.04)',
  },
  decorativeRectangle: {
    position: 'absolute',
    top: height * 0.15,
    right: width * 0.3,
    width: 200,
    height: 400,
    borderRadius: 100,
    backgroundColor: 'rgba(26, 35, 126, 0.03)',
    transform: [{ rotate: '45deg' }],
  },
  content: {
    flex: 1,
  },
  intro: {
    marginTop: 60,
    marginBottom: 40,
    paddingHorizontal: SPACING.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0D1B3E',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textLight,
    lineHeight: 22,
    marginTop: 10,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 140, // Increased to ensure last row is fully visible above button
  },
  languageCard: {
    flex: 1,
    margin: 10,
    borderRadius: 24,
    overflow: 'hidden',
    ...SHADOW.light,
    backgroundColor: '#FFF',
  },
  selectedCard: {
    ...SHADOW.premium,
    transform: [{ scale: 1.02 }],
  },
  cardGradient: {
    paddingHorizontal: 15,
    paddingVertical: 25,
    alignItems: 'center',
    height: 160,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 35, 126, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  selectedIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  textContainer: {
    alignItems: 'center',
  },
  languageName: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  nativeName: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    fontWeight: '700',
    letterSpacing: 1,
  },
  selectedText: {
    color: '#FFF',
  },
  selectedTextMuted: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  checkIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: 'rgba(245, 247, 250, 0.9)', // Glassmorphism-like background
  },
  continueBtn: {
    height: 64,
    borderRadius: 22,
    overflow: 'hidden',
    ...SHADOW.medium,
  },
  btnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginRight: 10,
  },
});

export default LanguageScreen;
