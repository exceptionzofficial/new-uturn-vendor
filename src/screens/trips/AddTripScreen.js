import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  Dimensions,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Share from 'react-native-share';
import { COLORS, RADIUS, SHADOW, SPACING, TYPOGRAPHY } from '../../theme/AppTheme';
import { GOOGLE_MAPS_API_KEY } from '../../config/Config';
import apiService from '../../services/api';

const { width, height } = Dimensions.get('window');

const VEHICLE_TYPES = [
  { id: '1', name: 'Bike', icon: 'motorbike', category: 'Passenger' },
  { id: '2', name: 'Auto', icon: 'van-passenger', category: 'Passenger' },
  { id: '3', name: 'Sedan', icon: 'car', category: 'Passenger' },
  { id: '4', name: 'SUV', icon: 'car-estate', category: 'Passenger' },
  { id: '5', name: 'Van', icon: 'van-passenger', category: 'Passenger' },
  { id: '6', name: 'Bus', icon: 'bus', category: 'Passenger' },
  { id: '7', name: 'Mini Truck', icon: 'truck-delivery', category: 'Load' },
  { id: '8', name: 'Truck', icon: 'truck', category: 'Load' },
  { id: '9', name: 'Lorry', icon: 'truck-cargo-container', category: 'Load' },
];

const TRIP_TYPE_OPTIONS = [
  { id: '1', name: 'One Way', key: 'One Way', icon: 'arrow-right-bold-circle' },
  { id: '2', name: 'Round Trip', key: 'Round Trip', icon: 'swap-horizontal-bold' },
  { id: '3', name: 'Local', key: 'Local', icon: 'map-marker-radius' },
  { id: '4', name: 'Rental', key: 'Rental', icon: 'clock-fast' },
  { id: '5', name: 'Tour Package', key: 'Tour Package', icon: 'island' },
  { id: '6', name: 'Out Station', key: 'Out Station', icon: 'map-marker-distance' },
];

const RENTAL_TYPES = [
  { id: 'hourly', name: 'Hourly', icon: 'timer-outline' },
  { id: 'day', name: 'Day', icon: 'calendar-today' },
];

const LANGUAGES = ['Tamil', 'English', 'Hindi', 'Telugu', 'Malayalam', 'Kannada', 'Others'];

const AddTripScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerLanguage: 'Tamil',
    category: 'Passenger',
    numberOfPeople: 1,
    loadCapacity: '',
    pickup: '',
    drop: '',
    pickupCoords: null,
    dropCoords: null,
    tripType: 'One Way',
    rentalType: 'Hourly',
    vehicle: 'Sedan',
    scheduledDate: new Date().toLocaleDateString(),
    scheduledTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    returnDate: '',
    returnTime: '',
    stops: [],

    // Initializing all pricing to 0 as requested
    baseFare: '0',
    perKmRate: '0',
    waitingCharge: '0',
    driverBata: '0',
    nightAllowance: '0',
    hillsAllowance: '0',
    commission: '0',
    totalTripAmount: '0',
    driverPayout: '0',
    
    paymentMode: 'pay_driver', // default to Customer Pays Driver
  });

  const [isLangModalVisible, setLangModalVisible] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeField, setActiveField] = useState(null); // 'pickup' or 'drop'
  const [searchQuery, setSearchQuery] = useState('');

  // Picker States
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showReturnDatePicker, setShowReturnDatePicker] = useState(false);
  const [showReturnTimePicker, setShowReturnTimePicker] = useState(false);

  const mapRef = useRef(null);

  // Auto-switch vehicle and trip type logic
  useEffect(() => {
    const { numberOfPeople, category, vehicle, tripType } = formData;
    let updates = {};

    if (category === 'Passenger') {
      let newVehicle = vehicle;
      // Precision Capacity Switching
      if (numberOfPeople > 7 && (vehicle === 'Bike' || vehicle === 'Auto' || vehicle === 'Sedan' || vehicle === 'SUV')) {
        newVehicle = 'Van';
      } else if (numberOfPeople > 4 && (vehicle === 'Bike' || vehicle === 'Auto' || vehicle === 'Sedan')) {
        newVehicle = 'SUV';
      } else if (numberOfPeople > 3 && (vehicle === 'Bike' || vehicle === 'Auto')) {
        newVehicle = 'Sedan';
      } else if (numberOfPeople > 1 && vehicle === 'Bike') {
        newVehicle = 'Auto';
      }

      if (newVehicle !== vehicle) updates.vehicle = newVehicle;
    }

    // Constraint: Bike/Auto only Local and Rental
    const finalVeh = updates.vehicle || vehicle;
    if (finalVeh === 'Bike' || finalVeh === 'Auto') {
      if (tripType !== 'Local' && tripType !== 'Rental') {
        updates.tripType = 'Local';
      }
    }

    if (Object.keys(updates).length > 0) {
      setFormData(prev => ({ ...prev, ...updates }));
    }
    // Auto-reset trip type if invalid for category
    if (formData.category !== 'Passenger' && (formData.tripType === 'Tour Package' || formData.tripType === 'Out Station')) {
      setFormData(prev => ({ ...prev, tripType: 'Local' }));
    }
  }, [formData.numberOfPeople, formData.category, formData.vehicle, formData.tripType]);

  // Pricing Calculation Effect
  useEffect(() => {
    const total = parseFloat(formData.totalTripAmount) || 0;
    const commPct = parseFloat(formData.commission) || 0;
    const myEarnings = (total * commPct) / 100;
    const payout = Math.max(0, total - myEarnings);
    
    if (formData.driverPayout !== payout.toString() || formData.myEarningsValue !== myEarnings.toString()) {
      setFormData(prev => ({ ...prev, driverPayout: payout.toString(), myEarningsValue: myEarnings.toString() }));
    }
  }, [formData.totalTripAmount, formData.commission]);

  // Suggestions Fetcher
  const fetchSuggestions = async (query) => {
    if (query.length < 3) return;
    setIsSearching(true);
    try {
      const resp = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${query}&key=${GOOGLE_MAPS_API_KEY}&components=country:in`);
      const data = await resp.json();
      setSuggestions(data.predictions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationSelect = async (place) => {
    const field = activeField;
    setFormData(p => ({ ...p, [field]: place.description }));
    setActiveField(null);
    setSuggestions([]);
    setSearchQuery('');

    // Fetch Coordinates
    try {
      const resp = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?place_id=${place.place_id}&key=${GOOGLE_MAPS_API_KEY}`);
      const data = await resp.json();
      if (data.results[0]) {
        const coords = data.results[0].geometry.location;
        const latlng = { latitude: coords.lat, longitude: coords.lng };
        setFormData(p => ({ ...p, [field + 'Coords']: latlng }));

        // Fit map to markers
        if (formData.pickupCoords && latlng || (field === 'pickup' && formData.dropCoords)) {
          setTimeout(() => {
            const points = [];
            if (field === 'pickup') points.push(latlng); else if (formData.pickupCoords) points.push(formData.pickupCoords);
            if (field === 'drop') points.push(latlng); else if (formData.dropCoords) points.push(formData.dropCoords);
            mapRef.current?.fitToCoordinates(points, { edgePadding: { top: 50, right: 50, bottom: 50, left: 50 }, animated: true });
          }, 500);
        } else {
          mapRef.current?.animateToRegion({ ...latlng, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 1000);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Check Customer info when 10 digits are filled
  useEffect(() => {
    const checkCust = async () => {
      if (formData.customerPhone?.length === 10) {
        try {
          const res = await apiService.checkCustomer(formData.customerPhone);
          if (res.exists) {
            setFormData(prev => ({ 
              ...prev, 
              customerName: res.name || prev.customerName,
              customerLanguage: res.language || prev.customerLanguage 
            }));
            Alert.alert('Customer Found', `Welcome back, ${res.name || 'Customer'}`);
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    checkCust();
  }, [formData.customerPhone]);

  const handlePublish = async () => {
    if (!formData.customerName || !formData.customerPhone || !formData.pickup || !formData.drop) {
      Alert.alert('Required Fields', 'Please fill all mandatory details (Customer Info, Pickup, Drop).');
      return;
    }

    // Date Validation
    try {
      const parts = formData.scheduledDate.split('/');
      // Assuming DD/MM/YYYY or MM/DD/YYYY, let's use standard Date parse. Better to construct safely
      // For simplicity, just use new Date(scheduledDate + ' ' + scheduledTime)
      const scheduledDateTime = new Date(`${formData.scheduledDate} ${formData.scheduledTime}`);
      if (scheduledDateTime < new Date()) {
        Alert.alert('Cannot Publish', 'The scheduled date and time has already passed.');
        return;
      }
    } catch(e) {
      console.log('Date parse error', e);
    }

    try {
      const tripParams = {
        ...formData,
        status: 'pending',
        pickupAddress: formData.pickup,
        dropAddress: formData.drop,
        pickupLocation: formData.pickupCoords,
        dropLocation: formData.dropCoords,
        scheduleDate: formData.scheduledDate,
        scheduleTime: formData.scheduledTime,
        totalFare: formData.totalTripAmount,
        vendorCommissionPercentage: 0,
      };
      
      const res = await apiService.createTrip(tripParams);
      if (res.success) {
         Alert.alert('Trip Published', 'Successfully published trip to drivers.', [
           { text: 'OK', onPress: () => navigation.goBack() }
         ]);
      } else {
         Alert.alert('Error', res.message || 'Failed to publish trip');
      }
    } catch (err) {
      Alert.alert('Error', 'An error occurred while publishing.');
      console.error(err);
    }
  };

  const handleSave = async () => {
    try {
      const tripParams = {
        ...formData,
        status: 'draft',
        pickupAddress: formData.pickup,
        dropAddress: formData.drop,
        pickupLocation: formData.pickupCoords,
        dropLocation: formData.dropCoords,
        scheduleDate: formData.scheduledDate,
        scheduleTime: formData.scheduledTime,
        totalFare: formData.totalTripAmount,
      };
      const res = await apiService.createTrip(tripParams);
      if (res.success) {
        Alert.alert('Success', 'Trip details saved as draft.', [
           { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (err) {
      Alert.alert('Error', 'An error occurred while saving draft.');
    }
  };

  const handleShare = async () => {
    try {
      const shareMessage = `🚖 *UTurn Trip Details*
---------------------------------
👤 *Customer:* ${formData.customerName}
📞 *Phone:* ${formData.customerPhone}
📍 *Pickup:* ${formData.pickup}
📍 *Drop:* ${formData.drop}
📅 *Date:* ${formData.scheduledDate}
⏰ *Time:* ${formData.scheduledTime}
🚗 *Vehicle:* ${formData.vehicle}
🔄 *Type:* ${formData.tripType}
💳 *Payment:* ${formData.paymentMode === 'pay_driver' ? 'Pay to Driver' : 'Pay to Vendor'}
💰 *Total Amount:* ₹${formData.totalTripAmount}
---------------------------------
🔗 *Track Live:* https://uturnapp.com/track/coming-soon
*Note: Toll, Parking, Permit Extra...*
*Sent via UTurn Vendor App*`;

      const shareOptions = {
        title: 'Share Booking Details',
        message: shareMessage,
      };
      await Share.open(shareOptions);
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const renderPricingRow = (label, value, key) => (
    <View style={styles.pricingInputRow}>
      <Text style={styles.priceLabel}>{label}</Text>
      <View style={styles.priceInputWrapper}>
        <TextInput
          style={styles.priceInput}
          value={value}
          keyboardType="numeric"
          onChangeText={(t) => setFormData({ ...formData, [key]: t })}
        />
      </View>
    </View>
  );

  const filteredVehicles = VEHICLE_TYPES.filter(v => {
    if (v.category !== formData.category) return false;

    if (formData.category === 'Passenger') {
      const count = formData.numberOfPeople;
      if (v.name === 'Bike' && count > 1) return false;
      if (v.name === 'Auto' && count > 3) return false;
      if (v.name === 'Sedan' && count > 4) return false;
      if (v.name === 'SUV' && count > 7) return false;
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={COLORS.primaryDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Booking</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 1. Customer Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeaderTitle}>Customer Details</Text>
          <View style={styles.inputField}>
            <Icon name="phone" size={20} color={COLORS.primary} style={styles.fieldIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Mobile Number"
              keyboardType="phone-pad"
              maxLength={10}
              value={formData.customerPhone}
              onChangeText={(t) => setFormData({ ...formData, customerPhone: t })}
            />
          </View>
          <View style={styles.inputField}>
            <Icon name="account" size={20} color={COLORS.primary} style={styles.fieldIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Customer Name"
              value={formData.customerName}
              onChangeText={(t) => setFormData({ ...formData, customerName: t })}
            />
          </View>
          <TouchableOpacity style={styles.inputField} onPress={() => setLangModalVisible(true)}>
            <Icon name="translate" size={20} color={COLORS.primary} style={styles.fieldIcon} />
            <Text style={styles.textInput}>{formData.customerLanguage}</Text>
            <Icon name="chevron-down" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* 2. Trip Type & Config Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeaderTitle}>Trip Configuration</Text>

          {/* Category Selection */}
          <View style={styles.categoryContainer}>
            <TouchableOpacity
              style={[styles.categoryTab, formData.category === 'Passenger' && styles.categoryTabActive]}
              onPress={() => {
                const firstVeh = VEHICLE_TYPES.find(v => v.category === 'Passenger');
                setFormData({ ...formData, category: 'Passenger', vehicle: firstVeh.name });
              }}
            >
              <Icon name="account-group" size={20} color={formData.category === 'Passenger' ? '#FFF' : COLORS.textMuted} />
              <Text style={[styles.categoryTabText, formData.category === 'Passenger' && styles.categoryTabTextActive]}>Passenger</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.categoryTab, formData.category === 'Load' && styles.categoryTabActive]}
              onPress={() => {
                const firstVeh = VEHICLE_TYPES.find(v => v.category === 'Load');
                setFormData({ ...formData, category: 'Load', vehicle: firstVeh.name });
              }}
            >
              <Icon name="truck-delivery" size={20} color={formData.category === 'Load' ? '#FFF' : COLORS.textMuted} />
              <Text style={[styles.categoryTabText, formData.category === 'Load' && styles.categoryTabTextActive]}>Load</Text>
            </TouchableOpacity>
          </View>

          {/* Configuration based on Category */}
          {formData.category === 'Passenger' ? (
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Number of Passengers</Text>
              <View style={styles.counterContainer}>
                <TouchableOpacity onPress={() => setFormData({ ...formData, numberOfPeople: Math.max(1, formData.numberOfPeople - 1) })}>
                  <Icon name="minus-circle-outline" size={28} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.counterValue}>{formData.numberOfPeople}</Text>
                <TouchableOpacity onPress={() => setFormData({ ...formData, numberOfPeople: formData.numberOfPeople + 1 })}>
                  <Icon name="plus-circle-outline" size={28} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Load Capacity Needed</Text>
              <TextInput
                style={styles.capacityInput}
                placeholder="e.g. 500kg, 2 Tons"
                value={formData.loadCapacity}
                onChangeText={(t) => setFormData({ ...formData, loadCapacity: t })}
              />
            </View>
          )}

          {/* Vehicle Type Selection */}
          <Text style={styles.subHeaderStyle}>Vehicle Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vehicleList}>
            {filteredVehicles.map(v => {
              const isVehActive = formData.vehicle === v.name;
              return (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.vehicleCard, isVehActive && styles.vehicleCardActive]}
                  onPress={() => setFormData({ ...formData, vehicle: v.name })}
                >
                  <Icon name={v.icon} size={28} color={isVehActive ? '#FFF' : COLORS.textMuted} />
                  <Text style={[styles.vehicleLabel, isVehActive && styles.vehicleLabelActive]}>{v.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Trip Selection Cards */}
          <Text style={styles.subHeaderStyle}>Trip Type</Text>
          <View style={styles.tripTypeGrid}>
            {TRIP_TYPE_OPTIONS.map((item) => {
              // Constraint: Bike/Auto only Local and Rental
              if (formData.vehicle === 'Bike' || formData.vehicle === 'Auto') {
                if (item.key !== 'Local' && item.key !== 'Rental') return null;
              }
              // Constraint: Tour Package and Out Station only for Passenger
              if ((item.key === 'Tour Package' || item.key === 'Out Station') && formData.category !== 'Passenger') return null;

              const isActive = formData.tripType === item.key;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.tripTypeCard, isActive && styles.tripTypeCardActive]}
                  onPress={() => setFormData({ ...formData, tripType: item.key })}
                >
                  <Icon name={item.icon} size={26} color={isActive ? '#FFF' : COLORS.primary} />
                  <Text style={[styles.tripTypeLabel, isActive && styles.tripTypeLabelActive]}>{item.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {formData.tripType === 'Rental' && (
            <View style={styles.rentalTypeRow}>
              {RENTAL_TYPES.map((rt) => {
                const isRtActive = formData.rentalType === rt.name;
                return (
                  <TouchableOpacity
                    key={rt.id}
                    activeOpacity={0.7}
                    style={[styles.rentalTypeChip, isRtActive && styles.rentalTypeChipActive]}
                    onPress={() => setFormData({ ...formData, rentalType: rt.name })}
                  >
                    <Icon name={rt.icon} size={18} color={isRtActive ? '#FFF' : COLORS.textMuted} />
                    <Text style={[styles.rentalTypeText, isRtActive && styles.rentalTypeTextActive]}>{rt.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* 3. Map & Route Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeaderTitle}>Location & Route</Text>

          <View style={styles.locationContainer}>
            <TouchableOpacity style={styles.locationField} onPress={() => setActiveField('pickup')}>
              <Icon name="record-circle-outline" size={20} color={COLORS.success} />
              <Text style={[styles.locationText, !formData.pickup && { color: COLORS.textMuted }]}>
                {formData.pickup || 'Tap to set Pickup Location'}
              </Text>
            </TouchableOpacity>
            <View style={styles.hDots} />
            <TouchableOpacity style={styles.locationField} onPress={() => setActiveField('drop')}>
              <Icon name="map-marker-outline" size={20} color={COLORS.error} />
              <Text style={[styles.locationText, !formData.drop && { color: COLORS.textMuted }]}>
                {formData.drop || 'Tap to set Drop-off Destination'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                latitude: 13.0827,
                longitude: 80.2707, // Chennai
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
              }}
            >
              {formData.pickupCoords && (
                <Marker coordinate={formData.pickupCoords} pinColor="green" title="Pickup" />
              )}
              {formData.dropCoords && (
                <Marker coordinate={formData.dropCoords} pinColor="red" title="Drop" />
              )}
            </MapView>
          </View>

          {/* Moved Schedule UI here */}
          <View style={[styles.topScheduleRow, { marginTop: 20 }]}>
            <TouchableOpacity
              style={styles.topScheduleBox}
              activeOpacity={0.7}
              onPress={() => setShowDatePicker(true)}
            >
              <Icon name="calendar-check" size={18} color={COLORS.primary} />
              <Text style={styles.topScheduleText}>{formData.scheduledDate}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.topScheduleBox}
              activeOpacity={0.7}
              onPress={() => setShowTimePicker(true)}
            >
              <Icon name="clock-outline" size={18} color={COLORS.primary} />
              <Text style={styles.topScheduleText}>{formData.scheduledTime}</Text>
            </TouchableOpacity>
          </View>

          {(formData.tripType === 'Round Trip' || formData.tripType === 'Tour Package' || formData.tripType === 'Rental' || formData.tripType === 'Out Station') && (
            <View style={[styles.topScheduleRow, { marginTop: 10 }]}>
              <TouchableOpacity
                style={[styles.topScheduleBox, { borderColor: COLORS.accentGold + '40', borderWidth: 1 }]}
                activeOpacity={0.7}
                onPress={() => setShowReturnDatePicker(true)}
              >
                <Icon name="calendar-refresh" size={18} color={COLORS.accentGold} />
                <Text style={[styles.topScheduleText, !formData.returnDate && { color: COLORS.textMuted }]}>
                  {formData.returnDate || 'Return Date'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.topScheduleBox, { borderColor: COLORS.accentGold + '40', borderWidth: 1 }]}
                activeOpacity={0.7}
                onPress={() => setShowReturnTimePicker(true)}
              >
                <Icon name="clock-check-outline" size={18} color={COLORS.accentGold} />
                <Text style={[styles.topScheduleText, !formData.returnTime && { color: COLORS.textMuted }]}>
                  {formData.returnTime || 'Return Time'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Pickers moved here as well */}
          {showDatePicker && (
            <DateTimePicker
              value={new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setFormData({ ...formData, scheduledDate: selectedDate.toLocaleDateString() });
              }}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={new Date()}
              mode="time"
              display="default"
              onChange={(event, selectedTime) => {
                setShowTimePicker(false);
                if (selectedTime) setFormData({ ...formData, scheduledTime: selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
              }}
            />
          )}
          {showReturnDatePicker && (
            <DateTimePicker
              value={new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowReturnDatePicker(false);
                if (selectedDate) setFormData({ ...formData, returnDate: selectedDate.toLocaleDateString() });
              }}
            />
          )}
          {showReturnTimePicker && (
            <DateTimePicker
              value={new Date()}
              mode="time"
              display="default"
              onChange={(event, selectedTime) => {
                setShowReturnTimePicker(false);
                if (selectedTime) setFormData({ ...formData, returnTime: selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
              }}
            />
          )}
        </View>

        {/* 4. Settings Section (As in Screenshot) */}
        <View style={styles.card}>
          <View style={styles.settingsHeader}>
            <View style={styles.settingsTitleRow}>
              <Icon name="arrow-right" size={20} color={COLORS.accentGold} />
              <Text style={styles.settingsTitle}>
                {formData.tripType} {formData.tripType === 'Rental' ? `(${formData.rentalType})` : ''} Settings
              </Text>
            </View>
            <TouchableOpacity style={styles.templateBtn}>
              <Icon name="file-document-outline" size={18} color={COLORS.accentGold} />
              <Text style={styles.templateText}>Load Template</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />

          {renderPricingRow('Base Fare / 2.5km (₹)', formData.baseFare, 'baseFare')}
          {renderPricingRow('Per KM Rate (₹)', formData.perKmRate, 'perKmRate')}
          {renderPricingRow('Waiting Charge/min (₹)', formData.waitingCharge, 'waitingCharge')}
          {renderPricingRow('Driver Bata (₹) / per day', formData.driverBata, 'driverBata')}
          {renderPricingRow('Night Allowance (₹)', formData.nightAllowance, 'nightAllowance')}
          {renderPricingRow('Hills Allowance (₹)', formData.hillsAllowance, 'hillsAllowance')}
          {renderPricingRow('Commission (%)', formData.commission, 'commission')}
        </View>

        {/* 5. Pricing Summary Card */}
        <View style={styles.card}>
            <View style={styles.sectionHeaderTitleRow}>
                <Icon name="currency-rupee" size={20} color={COLORS.accentGold} />
                <Text style={styles.sectionTitleBlack}>Pricing Summary</Text>
            </View>
            <View style={styles.divider} />

            {/* Total Amount Input */}
            <View style={{ marginBottom: 20 }}>
                <Text style={styles.priceLabel}>Total Trip Amount (₹)</Text>
                <View style={[styles.totalInputWrapper, { borderColor: COLORS.primary + '30' }]}>
                    <Icon name="cash-multiple" size={22} color={COLORS.primary} />
                    <TextInput 
                        style={styles.totalInput}
                        value={formData.totalTripAmount}
                        keyboardType="numeric"
                        onChangeText={(t) => setFormData({...formData, totalTripAmount: t})}
                    />
                </View>
            </View>

            {/* Earnings and Payout Display */}
            {/* Earnings and Payout Display */}
            <View style={styles.pricingSplitRow}>
                <View style={styles.pricingSplitBox}>
                    <Text style={styles.splitLabel}>My Earnings (₹)</Text>
                    <Text style={styles.splitValue}>{parseFloat(formData.myEarningsValue || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.pricingSplitBox}>
                    <Text style={styles.splitLabel}>Driver Payout (₹)</Text>
                    <Text style={[styles.splitValue, { color: COLORS.success }]}>{parseFloat(formData.driverPayout || 0).toFixed(2)}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            {/* Payment Collection Selection */}
            <Text style={styles.priceLabel}>Payment Collection</Text>
            <View style={styles.paymentSelector}>
                <TouchableOpacity 
                    style={[styles.paymentOption, formData.paymentMode === 'pay_driver' && styles.paymentOptionActive]}
                    onPress={() => setFormData({ ...formData, paymentMode: 'pay_driver' })}
                >
                    <Icon name="account-cash" size={20} color={formData.paymentMode === 'pay_driver' ? '#FFF' : COLORS.textMuted} />
                    <Text style={[styles.paymentOptionText, formData.paymentMode === 'pay_driver' && styles.paymentOptionTextActive]}>Customer Pays Driver</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.paymentOption, formData.paymentMode === 'pay_vendor' && styles.paymentOptionActive]}
                    onPress={() => setFormData({ ...formData, paymentMode: 'pay_vendor' })}
                >
                    <Icon name="office-building-marker" size={20} color={formData.paymentMode === 'pay_vendor' ? '#FFF' : COLORS.textMuted} />
                    <Text style={[styles.paymentOptionText, formData.paymentMode === 'pay_vendor' && styles.paymentOptionTextActive]}>Customer Pays Vendor</Text>
                </TouchableOpacity>
            </View>
        </View>

        {/* Actions Row */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={[styles.actionBtn, styles.saveBtn]} onPress={handleSave}>
            <Icon name="content-save" size={22} color={COLORS.primary} />
            <Text style={styles.actionBtnText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.shareBtn]} onPress={handleShare}>
            <Icon name="share-variant" size={22} color={COLORS.accentGold} />
            <Text style={styles.actionBtnText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.publishMainBtn} onPress={handlePublish}>
            <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.publishGradientSmall}>
              <Text style={styles.publishTextSmall}>PUBLISH</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* SEARCH MODAL */}
      <Modal visible={!!activeField} animationType="slide">
        <View style={styles.searchModal}>
          <View style={styles.searchHeader}>
            <TouchableOpacity onPress={() => setActiveField(null)}>
              <Icon name="close" size={28} color="#000" />
            </TouchableOpacity>
            <TextInput
              autoFocus
              placeholder={`Search ${activeField === 'pickup' ? 'Pickup' : 'Drop'}...`}
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={(t) => {
                setSearchQuery(t);
                fetchSuggestions(t);
              }}
            />
            {isSearching && <ActivityIndicator size="small" color={COLORS.primary} />}
          </View>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.suggestionItem} onPress={() => handleLocationSelect(item)}>
                <Icon name="map-marker-outline" size={22} color={COLORS.textMuted} />
                <View style={{ marginLeft: 15, flex: 1 }}>
                  <Text style={styles.suggestionMain}>{item.structured_formatting.main_text}</Text>
                  <Text style={styles.suggestionSub}>{item.structured_formatting.secondary_text}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Language Modal */}
      <Modal visible={isLangModalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setLangModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Preferred Language</Text>
            {LANGUAGES.map(lang => (
              <TouchableOpacity key={lang} style={styles.langItem} onPress={() => { setFormData({ ...formData, customerLanguage: lang }); setLangModalVisible(false); }}>
                <Text style={[styles.langText, formData.customerLanguage === lang && styles.langTextActive]}>{lang}</Text>
                {formData.customerLanguage === lang && <Icon name="check" size={20} color={COLORS.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, height: 60, backgroundColor: COLORS.accentGold,
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: COLORS.primaryDark },
  scroll: { padding: SPACING.md, paddingBottom: 50 },
  topScheduleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  topScheduleBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10, ...SHADOW.light,
    width: '48%',
  },
  topScheduleText: { marginLeft: 10, fontWeight: '700', color: COLORS.text, fontSize: 13 },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOW.light },
  sectionHeaderTitle: { fontSize: 16, fontWeight: '800', color: COLORS.primaryDark, marginBottom: 15 },
  sectionHeaderTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionTitleBlack: { fontSize: 16, fontWeight: '900', color: '#000', marginLeft: 10 },
  subHeaderStyle: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginTop: 15, marginBottom: 10 },
  inputField: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background,
    borderRadius: 12, paddingHorizontal: 15, height: 50, marginBottom: 10,
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  fieldIcon: { marginRight: 10 },
  textInput: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text },

  // Configuration UI (Passenger/Load/Vehicle)
  categoryContainer: { flexDirection: 'row', marginBottom: 15, backgroundColor: '#F0F2F5', borderRadius: 12, padding: 4 },
  categoryTab: { flex: 1, height: 40, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  categoryTabActive: { backgroundColor: COLORS.primary, ...SHADOW.light },
  categoryTabText: { fontWeight: '700', color: COLORS.textMuted, marginLeft: 8, fontSize: 13 },
  categoryTabTextActive: { color: '#FFF' },
  configRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  configLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  counterContainer: { flexDirection: 'row', alignItems: 'center' },
  counterValue: { fontSize: 18, fontWeight: '900', marginHorizontal: 15, color: COLORS.primaryDark },
  capacityInput: { flex: 0.6, height: 40, borderBottomWidth: 1, borderBottomColor: '#DDD', textAlign: 'right', fontWeight: '700', color: COLORS.primary },
  vehicleList: { marginBottom: 10 },
  vehicleCard: {
    width: 65, height: 65, backgroundColor: '#F8F9FD', borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: 10, borderWidth: 1, borderColor: '#EEE'
  },
  vehicleCardActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  vehicleLabel: { fontSize: 9, fontWeight: '700', color: COLORS.textMuted, marginTop: 4 },
  vehicleLabelActive: { color: '#FFF' },

  // Location UI
  locationContainer: { paddingVertical: 5 },
  locationField: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FD',
    borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#EEE'
  },
  hDots: { width: 2, height: 10, backgroundColor: '#DDD', marginLeft: 21, marginVertical: 4 },
  locationText: { marginLeft: 12, fontSize: 14, fontWeight: '600', color: COLORS.text, flex: 1 },
  mapContainer: { height: 180, borderRadius: 15, overflow: 'hidden', marginTop: 15, borderWidth: 1, borderColor: '#EEE' },
  map: { flex: 1 },

  // Trip Type Grid
  tripTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tripTypeCard: {
    width: '31%', aspectRatio: 1.1, backgroundColor: '#F8F9FD', borderRadius: 15,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#EEE'
  },
  tripTypeCardActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tripTypeLabel: { fontSize: 10, fontWeight: '700', color: COLORS.text, marginTop: 8, textAlign: 'center' },
  tripTypeLabelActive: { color: '#FFF' },
  rentalTypeRow: { flexDirection: 'row', marginTop: 5, justifyContent: 'center' },
  rentalTypeChip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#F0F2F5', marginHorizontal: 5
  },
  rentalTypeChipActive: { backgroundColor: COLORS.accentGold },
  rentalTypeText: { marginLeft: 8, fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  rentalTypeTextActive: { color: '#FFF' },

  settingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  settingsTitleRow: { flexDirection: 'row', alignItems: 'center' },
  settingsTitle: { fontSize: 18, fontWeight: '900', color: '#000', marginLeft: 10 },
  templateBtn: { flexDirection: 'row', alignItems: 'center' },
  templateText: { marginLeft: 5, color: COLORS.accentGold, fontWeight: '800', fontSize: 12 },
  divider: { height: 1, backgroundColor: '#EEE', marginBottom: 15 },

  pricingInputRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  priceLabel: { fontSize: 14, fontWeight: '600', color: '#555' },
  priceInputWrapper: { width: 90, height: 42, borderWidth: 1, borderColor: '#DDD', borderRadius: 10, justifyContent: 'center', paddingHorizontal: 10, backgroundColor: '#F9F9F9' },
  priceInput: { textAlign: 'center', fontSize: 16, fontWeight: '900', color: '#333' },
  breakdownBox: { backgroundColor: '#F3E5F5', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#E1BEE7' },
  breakdownHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  breakdownTitle: { fontSize: 12, fontWeight: '900', color: '#9C27B0', marginLeft: 6, textTransform: 'uppercase' },
  breakdownText: { fontSize: 14, fontWeight: '600', color: '#555', lineHeight: 22 },

  totalInputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FD',
    borderWidth: 1.5, borderColor: '#EEE', borderRadius: 15, paddingHorizontal: 18, height: 60, marginTop: 10,
  },
  totalInput: { flex: 1, marginLeft: 12, fontSize: 22, fontWeight: '900', color: '#000' },
  
  pricingSplitRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  pricingSplitBox: { flex: 1, backgroundColor: '#F8F9FD', padding: 15, borderRadius: 15, alignItems: 'center', marginHorizontal: 5, borderWidth: 1, borderColor: '#EEE' },
  splitLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, marginBottom: 5, textTransform: 'uppercase' },
  splitValue: { fontSize: 18, fontWeight: '900', color: COLORS.primaryDark },
  
  paymentSelector: { flexDirection: 'row', marginTop: 10, backgroundColor: '#F0F2F5', borderRadius: 12, padding: 4 },
  paymentOption: { flex: 1, height: 45, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  paymentOptionActive: { backgroundColor: COLORS.primary, ...SHADOW.light },
  paymentOptionText: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, marginLeft: 8 },
  paymentOptionTextActive: { color: '#FFF' },

  actionButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  actionBtn: {
    flex: 1, height: 56, borderRadius: 15, backgroundColor: '#FFF',
    borderWidth: 1.5, borderColor: '#EEE', ...SHADOW.light,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 4
  },
  saveBtn: { borderColor: COLORS.primary + '30' },
  shareBtn: { borderColor: COLORS.accentGold + '30' },
  actionBtnText: { marginLeft: 8, fontSize: 14, fontWeight: '800', color: COLORS.text },
  publishMainBtn: { flex: 1.5, height: 56, borderRadius: 15, overflow: 'hidden', marginHorizontal: 4, ...SHADOW.medium },
  publishGradientSmall: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  publishTextSmall: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

  // Search Modal
  searchModal: { flex: 1, backgroundColor: '#FFF' },
  searchHeader: {
    flexDirection: 'row', alignItems: 'center', padding: 15,
    borderBottomWidth: 1, borderBottomColor: '#EEE', backgroundColor: '#F9F9F9'
  },
  searchInput: { flex: 1, marginLeft: 15, fontSize: 16, fontWeight: '700', color: '#000' },
  suggestionItem: {
    flexDirection: 'row', alignItems: 'center', padding: 15,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0'
  },
  suggestionMain: { fontSize: 15, fontWeight: '700', color: '#000' },
  suggestionSub: { fontSize: 12, color: '#666', marginTop: 2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', borderRadius: 20, padding: 25, width: '85%' },
  modalTitle: { fontSize: 18, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
  langItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  langText: { fontSize: 16, fontWeight: '700' },
  langTextActive: { color: COLORS.primary },
});

export default AddTripScreen;
