import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, FlatList, TouchableOpacity,
  Animated, Dimensions, ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, RADIUS, SHADOW, SPACING } from '../../theme/AppTheme';
import apiService from '../../services/api';

const { width } = Dimensions.get('window');

const WalletScreen = ({ navigation }) => {
  const [activeType, setActiveType] = useState('receivable'); // receivable or payable
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const userDataStr = await AsyncStorage.getItem('vendor_data');
      const userData = JSON.parse(userDataStr);
      const vId = userData?.phone || userData?.vendorId;
      
      // Get all trips that are in a state where commission/ledger matters
      const res = await apiService.getTrips(vId, ''); 
      // Filter for commissionPending or completed trips with specific payment modes
      const filtered = (res.data || res).filter(t => 
        ['commissionPending', 'completed', 'dropped'].includes(t.status)
      );
      setTrips(filtered);
    } catch (err) {
      console.error('[Wallet] Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  // Logic: 
  // - Customer Pays Driver -> Driver owes Vendor (Receivable)
  // - Customer Pays Vendor -> Vendor owes Driver (Payable)
  const filteredTrips = trips.filter(t => {
    if (activeType === 'receivable') return t.paymentMode === 'customer_pays_driver';
    return t.paymentMode === 'customer_pays_vendor';
  });

  const handleMarkAsPaid = async (tripId) => {
    Alert.alert(
      'Confirm Settlement',
      'Are you sure you want to mark this trip as settled?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            try {
              await apiService.markCommissionPaid(tripId);
              fetchData();
            } catch (e) {
              Alert.alert('Error', 'Failed to update settlement status.');
            }
          }
        }
      ]
    );
  };

  const renderTripItem = ({ item }) => {
    const isReceivable = activeType === 'receivable';
    const amount = isReceivable ? item.vendorCommission : item.driverPayout;
    const isSettled = item.status === 'completed';

    return (
      <View style={styles.txCard}>
        <View style={[styles.txIcon, { backgroundColor: isReceivable ? COLORS.success + '15' : COLORS.error + '15' }]}>
          <Icon 
            name={isReceivable ? 'arrow-bottom-left' : 'arrow-top-right'} 
            size={20} 
            color={isReceivable ? COLORS.success : COLORS.error} 
          />
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txTitle}>Trip #{item.tripId?.slice(-8)}</Text>
          <Text style={styles.txDate}>{item.customerName} • {new Date(item.createdAt).toLocaleDateString()}</Text>
          <View style={[styles.statusBadge, isSettled && styles.statusBadgeSettled]}>
            <Text style={styles.statusText}>{isSettled ? 'SETTLED' : 'PENDING'}</Text>
          </View>
        </View>
        <View style={styles.txRight}>
          <Text style={[styles.txAmount, { color: isReceivable ? COLORS.success : COLORS.error }]}>
            ₹{amount}
          </Text>
          {!isSettled && (
            <TouchableOpacity style={styles.payBtn} onPress={() => handleMarkAsPaid(item.tripId)}>
              <Text style={styles.payBtnText}>MARK PAID</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const totalReceivable = trips.filter(t => t.paymentMode === 'customer_pays_driver' && t.status !== 'completed')
    .reduce((acc, curr) => acc + (curr.vendorCommission || 0), 0);

  const totalPayable = trips.filter(t => t.paymentMode === 'customer_pays_vendor' && t.status !== 'completed')
    .reduce((acc, curr) => acc + (curr.driverPayout || 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={32} color={COLORS.primaryDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Enterprise Ledger</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Icon name="refresh" size={24} color={COLORS.primaryDark} />
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <LinearGradient
          colors={activeType === 'receivable' ? ['#1B5E20', '#4CAF50'] : ['#B71C1C', '#F44336']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceLabel}>
            {activeType === 'receivable' ? 'PENDING RECEIVABLES' : 'PENDING PAYABLES'}
          </Text>
          <Text style={styles.balanceValue}>₹ {activeType === 'receivable' ? totalReceivable : totalPayable}</Text>
          <View style={styles.balanceActions}>
            <View style={styles.statMini}>
              <Text style={styles.statMiniLabel}>Other Side</Text>
              <Text style={styles.statMiniVal}>₹ {activeType === 'receivable' ? totalPayable : totalReceivable}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeType === 'receivable' && styles.tabActive]} 
            onPress={() => setActiveType('receivable')}
          >
            <Text style={[styles.tabText, activeType === 'receivable' && styles.tabTextActive]}>RECEIVABLES</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeType === 'payable' && styles.tabActive]} 
            onPress={() => setActiveType('payable')}
          >
            <Text style={[styles.tabText, activeType === 'payable' && styles.tabTextActive]}>PAYABLES</Text>
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filteredTrips}
            renderItem={renderTripItem}
            keyExtractor={item => item.tripId}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="cash-multiple" size={60} color="#DDD" />
                <Text style={styles.emptyText}>No {activeType} found</Text>
              </View>
            }
          />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FD' },
  header: {
    height: 100, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: SPACING.lg,
    paddingTop: 40, backgroundColor: '#FFF',
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: COLORS.primaryDark },
  content: { flex: 1, padding: SPACING.lg },
  balanceCard: { padding: 25, borderRadius: 25, ...SHADOW.premium, marginBottom: 20 },
  balanceLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5 },
  balanceValue: { fontSize: 36, fontWeight: '900', color: '#FFF', marginVertical: 10 },
  balanceActions: { flexDirection: 'row', marginTop: 5 },
  statMini: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statMiniLabel: { fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: '700' },
  statMiniVal: { fontSize: 12, color: '#FFF', fontWeight: '800' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#EEE', borderRadius: 15, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  tabActive: { backgroundColor: '#FFF', ...SHADOW.light },
  tabText: { fontSize: 11, fontWeight: '800', color: '#999' },
  tabTextActive: { color: COLORS.primaryDark },
  list: { paddingBottom: 40 },
  txCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    padding: 15, borderRadius: 20, marginBottom: 12, ...SHADOW.light,
  },
  txIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  txInfo: { flex: 1, marginLeft: 15 },
  txTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  txDate: { fontSize: 11, color: COLORS.textMuted, fontWeight: '700', marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 15, fontWeight: '900', marginBottom: 5 },
  statusBadge: { backgroundColor: '#FFF3E0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginTop: 5 },
  statusBadgeSettled: { backgroundColor: '#E8F5E9' },
  statusText: { fontSize: 8, fontWeight: '900', color: '#FF9800' },
  payBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  payBtnText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#AAA', fontWeight: '700', marginTop: 10 }
});

export default WalletScreen;
