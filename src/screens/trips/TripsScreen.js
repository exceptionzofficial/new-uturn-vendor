import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, RADIUS, SHADOW, SPACING } from '../../theme/AppTheme';

const { width } = Dimensions.get('window');

const STATUS_FILTERS = [
  'All',
  'Pending',
  'Accepted',
  'Pending Verification',
  'Waiting',
  'On the way',
  'Completed',
];

const STATUS_COLORS = {
  'Pending': '#FF9800',
  'Accepted': '#4CAF50',
  'Pending Verification': '#9C27B0',
  'Waiting': '#607D8B',
  'On the way': '#2196F3',
  'Completed': '#4CAF50',
  'Default': '#757575'
};

const MOCK_TRIPS = [
  {
    id: '1',
    type: 'Active',
    status: 'On the way',
    from: 'P.N. Road, Tiruppur',
    to: 'Avinashi Road, Coimbatore',
    amount: '₹450',
    date: '18 Mar, 10:30 AM',
    driver: 'Murugan G',
  },
  {
    id: '2',
    type: 'Active',
    status: 'Pending',
    from: 'Railway Station, Erode',
    to: 'Bus Stand, Bhavani',
    amount: '₹220',
    date: '18 Mar, 12:45 PM',
    driver: 'Senthil K',
  },
  {
    id: '3',
    type: 'History',
    status: 'Completed',
    from: 'New Bus Stand, Salem',
    to: 'Steel Plant Road, Salem',
    amount: '₹180',
    date: '17 Mar, 09:00 AM',
    driver: 'Ravi M',
  },
  {
    id: '4',
    type: 'Active',
    status: 'Accepted',
    from: 'Gandhipuram, Coimbatore',
    to: 'Saravanampatti, Coimbatore',
    amount: '₹350',
    date: '19 Mar, 02:00 PM',
    driver: 'Vijay S',
  },
];

const TripsScreen = () => {
  const [activeTab, setActiveTab] = useState('Active');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  const renderTripCard = ({ item }) => {
    const statusColor = STATUS_COLORS[item.status] || STATUS_COLORS.Default;
    return (
      <TouchableOpacity activeOpacity={0.9} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.amount}>{item.amount}</Text>
        </View>

      <View style={styles.routeContainer}>
        <View style={styles.locationBlock}>
          <Icon name="record-circle-outline" size={18} color={COLORS.primary} />
          <Text style={styles.address} numberOfLines={1}>{item.from}</Text>
        </View>
        <View style={styles.verticalLine} />
        <View style={styles.locationBlock}>
          <Icon name="map-marker-outline" size={18} color={COLORS.accentRose} />
          <Text style={styles.address} numberOfLines={1}>{item.to}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.driverInfo}>
          <View style={styles.driverAvatar}>
            <Icon name="account" size={16} color={COLORS.primary} />
          </View>
          <Text style={styles.driverName}>{item.driver}</Text>
        </View>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>
    </TouchableOpacity>
  );
};

  return (
    <View style={styles.container}>
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
        data={MOCK_TRIPS.filter(trip => 
          trip.type === activeTab && 
          (selectedStatus === 'All' || trip.status === selectedStatus)
        )}
        renderItem={renderTripCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
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
});

export default TripsScreen;
