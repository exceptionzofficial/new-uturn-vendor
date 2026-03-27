import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, RADIUS, SHADOW, SPACING } from '../../theme/AppTheme';

const TRANSACTIONS = [
  { id: '1', title: 'Trip #TR-8942', date: '18 Mar, 10:30 AM', amount: '+ ₹450', type: 'credit' },
  { id: '2', title: 'Withdrawal to Bank', date: '17 Mar, 04:15 PM', amount: '- ₹2,000', type: 'debit' },
  { id: '3', title: 'Trip #TR-8721', date: '17 Mar, 11:20 AM', amount: '+ ₹180', type: 'credit' },
  { id: '4', title: 'Wallet Top-up', date: '16 Mar, 09:00 AM', amount: '+ ₹5,000', type: 'credit' },
];

const WalletScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const renderTransaction = ({ item }) => (
    <View style={styles.txCard}>
      <View style={[styles.txIcon, { backgroundColor: item.type === 'credit' ? COLORS.success + '15' : COLORS.error + '15' }]}>
        <Icon 
          name={item.type === 'credit' ? 'arrow-bottom-left' : 'arrow-top-right'} 
          size={20} 
          color={item.type === 'credit' ? COLORS.success : COLORS.error} 
        />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txTitle}>{item.title}</Text>
        <Text style={styles.txDate}>{item.date}</Text>
      </View>
      <Text style={[styles.txAmount, { color: item.type === 'credit' ? COLORS.success : COLORS.text }]}>
        {item.amount}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={32} color={COLORS.primaryDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Enterprise Wallet</Text>
        <View style={{ width: 32 }} />
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <LinearGradient
          colors={['#1A237E', '#3D5AFE']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceLabel}>TOTAL AVAILABLE BALANCE</Text>
          <Text style={styles.balanceValue}>₹ 45,280.50</Text>
          <View style={styles.balanceActions}>
            <TouchableOpacity style={styles.balanceBtn}>
              <Icon name="plus-circle-outline" size={18} color="#FFF" />
              <Text style={styles.balanceBtnText}>ADD FUNDS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.balanceBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Icon name="bank-transfer" size={18} color="#FFF" />
              <Text style={styles.balanceBtnText}>WITHDRAW</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Recent Activity</Text>
          <Icon name="filter-variant" size={20} color={COLORS.textMuted} />
        </View>

        <FlatList
          data={TRANSACTIONS}
          renderItem={renderTransaction}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  header: {
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: 40,
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  balanceCard: {
    padding: 30,
    borderRadius: 30,
    ...SHADOW.premium,
    marginBottom: 30,
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.5,
  },
  balanceValue: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFF',
    marginVertical: 15,
  },
  balanceActions: {
    flexDirection: 'row',
    marginTop: 10,
  },
  balanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 10,
  },
  balanceBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFF',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 20,
    marginBottom: 12,
    ...SHADOW.light,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txInfo: {
    flex: 1,
    marginLeft: 15,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  txDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '700',
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '900',
  },
});

export default WalletScreen;
