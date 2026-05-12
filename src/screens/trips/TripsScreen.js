import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Animated,
  Dimensions,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import apiService from '../../services/api';
import { COLORS, RADIUS, SHADOW, SPACING } from '../../theme/AppTheme';
import Loader from '../../components/Loader';

const { width } = Dimensions.get('window');

const STATUS_FILTERS = [
  'All', 'Draft', 'Pending', 'Verification', 'Approved',
  'Way to Pickup', 'Arrived', 'Way to Drop', 'Reached', 'Completed',
];

const STATUS_DISPLAY_NAMES = {
  'draft': 'Draft', 'pending': 'Published', 'driverAccepted': 'Verification',
  'vendorApproved': 'Approved', 'confirmed': 'Way to Pickup', 'arrived': 'Arrived',
  'inProgress': 'Way to Drop', 'dropped': 'Reached', 'completed': 'Completed',
  'commissionPending': 'Payment Pending', 'commissionRejected': 'Payment Rejected',
};

const STATUS_COLORS = {
  'Draft': '#90A4AE', 'Published': '#FF9800', 'Verification': '#9C27B0',
  'Approved': '#4CAF50', 'Way to Pickup': '#2196F3', 'Arrived': '#00BCD4',
  'Way to Drop': '#3F51B5', 'Reached': '#E91E63', 'Completed': '#4CAF50',
  'Payment Pending': '#1565C0', 'Payment Rejected': '#D32F2F', 'Default': '#757575',
};

const TripsScreen = ({ navigation }) => {
  const [activeTab, setActiveTab]           = useState('Active');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [showFilters, setShowFilters]       = useState(false);
  const [trips, setTrips]                   = useState([]);
  const [loading, setLoading]               = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const stored = await AsyncStorage.getItem('vendor_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        const vendorId = parsed.vendorId || parsed.phone;
        const [tripsData, approvalsRes] = await Promise.all([
          apiService.getTrips(vendorId),
          apiService.getPendingApprovals(vendorId).catch(() => ({ data: [] })),
        ]);
        setTrips(tripsData);
        setPendingApprovals(approvalsRes?.data || []);
      }
    } catch (err) {
      console.error('Fetch Trips Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async (tripId) => {
    Alert.alert('Delete Draft', 'Are you sure you want to permanently delete this draft trip?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            const res = await apiService.deleteTrip(tripId);
            if (res.success) fetchTrips();
          } catch { Alert.alert('Error', 'Failed to delete trip.'); }
        },
      },
    ]);
  };

  useFocusEffect(
    useCallback(() => {
      fetchTrips();
      const interval = setInterval(() => {
        fetchTrips();
      }, 5000);
      return () => clearInterval(interval);
    }, [])
  );

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [activeTab]);


  const renderTripCard = ({ item }) => {
    const statusKey = item.status || 'pending';
    const displayName = STATUS_DISPLAY_NAMES[statusKey] || (statusKey.charAt(0).toUpperCase() + statusKey.slice(1));
    const statusColor = STATUS_COLORS[displayName] || STATUS_COLORS.Default;
    // Route driverAccepted trips to the approval screen
    const handleCardPress = () => {
      if (item.status === 'driverAccepted') {
        navigation.navigate('DriverApproval', { trip: item });
      } else if (['vendorApproved', 'inProgress', 'dropped', 'completed', 'commissionPending', 'commissionRejected'].includes(item.status)) {
        navigation.navigate('TripTracking', { trip: item });
      } else {
        navigation.navigate('AddTrip', { trip: item });
      }
    };

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.card, item.status === 'driverAccepted' && styles.cardHighlight]}
        onPress={handleCardPress}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {displayName.toUpperCase()}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.amount}>₹{item.totalTripAmount || item.totalFare || item.amount || '0'}</Text>
            {item.status?.toLowerCase() === 'draft' && (
              <TouchableOpacity 
                style={styles.deleteBtn} 
                onPress={() => handleDelete(item.tripId)}
              >
                <Icon name="trash-can-outline" size={20} color={COLORS.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>

      <View style={styles.routeContainer}>
        <View style={styles.locationBlock}>
          <Icon name="record-circle-outline" size={18} color={COLORS.primary} />
          <Text style={styles.address} numberOfLines={1}>{item.pickup || item.pickupAddress || 'No Pickup'}</Text>
        </View>
        <View style={styles.verticalLine} />
        <View style={styles.locationBlock}>
          <Icon name="map-marker-outline" size={18} color={COLORS.accentRose} />
          <Text style={styles.address} numberOfLines={1}>{item.drop || item.dropAddress || 'No Drop'}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.driverInfo}>
          <View style={styles.driverAvatar}>
            <Icon name="account" size={16} color={COLORS.primary} />
          </View>
          <Text style={styles.driverName}>{item.driverName || item.driver || 'No Driver Assigned'}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {item.status?.toLowerCase() === 'draft' && (
            <TouchableOpacity 
              onPress={() => handleDeleteTrip(item.tripId)}
              style={{ marginRight: 15 }}
            >
              <Icon name="delete-outline" size={20} color={COLORS.error} />
            </TouchableOpacity>
          )}
          <Text style={styles.dateText}>{item.scheduleDate || item.date}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Pending Approvals Banner */}
      {pendingApprovals.length > 0 && (
        <TouchableOpacity
          style={styles.approvalBanner}
          onPress={() => navigation.navigate('DriverApproval', { trip: pendingApprovals[0] })}
          activeOpacity={0.85}
        >
          <View style={styles.approvalBannerLeft}>
            <Icon name="bell-ring" size={20} color="#FFF" />
            <Text style={styles.approvalBannerText}>
              {pendingApprovals.length} driver{pendingApprovals.length > 1 ? 's' : ''} waiting for approval
            </Text>
          </View>
          <Icon name="chevron-right" size={20} color="#FFF" />
        </TouchableOpacity>
      )}
      <View style={styles.header}>
        <Text style={styles.title}>Trip Records</Text>
        <View style={styles.searchBox}>
          <Icon name="magnify" size={20} color={COLORS.textMuted} />
          <TextInput 
            placeholder="Search by location or driver..." 
            style={styles.searchInput}
            placeholderTextColor={COLORS.textMuted}
          />
          <TouchableOpacity 
            onPress={() => setShowFilters(!showFilters)}
            style={[styles.filterToggle, showFilters && styles.filterToggleActive]}
          >
            <Icon name="filter-variant" size={22} color={showFilters ? COLORS.accentRose : COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContainer}>
        {['Active', 'History'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => {
              setActiveTab(tab);
              fadeAnim.setValue(0);
            }}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            {activeTab === tab && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>
      {showFilters && (
        <View style={styles.filterSection}>
          <View style={styles.filterGrid}>
            {STATUS_FILTERS.map((status) => {
              const isActive = selectedStatus === status;
              const statusColor = STATUS_COLORS[status] || STATUS_COLORS.Default;
              return (
                <TouchableOpacity
                  key={status}
                  onPress={() => setSelectedStatus(status)}
                  activeOpacity={0.7}
                  style={[
                    styles.filterChip, 
                    isActive && { backgroundColor: statusColor, borderColor: statusColor }
                  ]}
                >
                  <Text style={[styles.filterChipText, isActive && styles.activeFilterChipText]}>
                    {status}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <FlatList
        data={trips.filter(trip => {
          const status = trip.status?.toLowerCase() || '';
          const type = (status === 'completed' || status === 'cancelled') ? 'History' : 'Active';
          return type === activeTab && 
          (selectedStatus === 'All' || status === selectedStatus.toLowerCase());
        }).sort((a, b) => {
          // Priority: driverAccepted (Verification) status first
          if (a.status === 'driverAccepted' && b.status !== 'driverAccepted') return -1;
          if (a.status !== 'driverAccepted' && b.status === 'driverAccepted') return 1;
          return 0;
        })}
        renderItem={renderTripCard}
        keyExtractor={item => item.id || item.tripId}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={fetchTrips}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="car-off" size={48} color="#CCC" />
            <Text style={styles.emptyText}>No {activeTab} trips found</Text>
          </View>
        }
      />
      <Loader visible={loading && trips.length === 0} message="Syncing records..." />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingTop: Platform.OS === 'android' ? 0 : 0, // Fallback
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.primaryDark,
    marginBottom: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  filterToggle: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFF',
    marginLeft: 10,
    ...SHADOW.light,
  },
  filterToggleActive: {
    backgroundColor: COLORS.accentRose + '15',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    backgroundColor: '#FFF',
  },
  tab: {
    paddingVertical: 15,
    marginRight: 30,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  activeTabText: {
    color: COLORS.primary,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 3,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  filterSection: {
    backgroundColor: '#FFF',
    paddingVertical: 15,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#ECEFF1',
    marginBottom: 5,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  activeFilterChipText: {
    color: '#FFF',
  },
  list: {
    padding: SPACING.lg,
    paddingBottom: 120, // Tab spacer
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    ...SHADOW.light,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  cardHighlight: {
    borderColor: '#9C27B0',
    borderWidth: 2,
    backgroundColor: '#FAFAFA',
  },
  approvalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#9C27B0',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
  },
  approvalBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  approvalBannerText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  amount: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },
  deleteBtn: {
    marginLeft: 15,
    padding: 5,
  },
  routeContainer: {
    marginBottom: 20,
  },
  locationBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  address: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 10,
    flex: 1,
  },
  verticalLine: {
    width: 2,
    height: 20,
    backgroundColor: '#EEE',
    marginLeft: 8,
    marginVertical: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 15,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(26, 35, 126, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  driverName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});

export default TripsScreen;
