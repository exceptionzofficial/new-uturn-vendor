import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Modal, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Share from 'react-native-share';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme/AppTheme';
import apiService from '../../services/api';

const STAGES = [
  { id: 'vendorApproved', label: 'Way to Pick Up', icon: 'map-marker-distance' },
  { id: 'inProgress', label: 'Way to Drop', icon: 'car-side' },
  { id: 'dropped', label: 'Trip Completed', icon: 'check-circle-outline' },
  { id: 'completed', label: 'Transaction Completed', icon: 'cash-check' },
];

const TripTrackingScreen = ({ navigation, route }) => {
  const [trip, setTrip] = useState(route.params?.trip || {});
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const insets = useSafeAreaInsets();
  const tripId = trip.tripId || trip.id;

  const handleApprove = async () => {
    try {
      const id = trip.tripId || trip.id;
      const res = await apiService.approveCommission(id);
      Alert.alert('Success', 'Payment verified successfully.');
      setTrip({...trip, status: 'commissionApproved'}); // optimism
    } catch (e) {
      Alert.alert('Error', 'Failed to verify payment.');
    }
  };

  const handleReject = async () => {
    if (!rejectReason) return Alert.alert('Error', 'Please provide a reason');
    try {
      const id = trip.tripId || trip.id;
      const res = await apiService.rejectCommission(id, rejectReason);
      setShowRejectModal(false);
      setRejectReason('');
      Alert.alert('Rejected', 'Message sent to driver.');
      setTrip({...trip, status: 'commissionRejected'}); // optimism
    } catch (e) {
      Alert.alert('Error', 'Failed to reject payment.');
    }
  };

  const handleShareDetails = async () => {
    const trackingLink = `https://uturn-nl7u.onrender.com/api/bookings/track/${tripId}`;
    const message = `🚖 Ride Confirmed!\n\n👤 Driver: ${trip.driverName || 'N/A'}\n📍 From: ${trip.pickup || trip.pickupAddress}\n🏁 To: ${trip.drop || trip.dropAddress}\n\nTrack your ride and get your OTP here:\n${trackingLink}`;
    
    try {
      await Share.open({
        title: 'Share Ride Details',
        message: message,
      });
    } catch (e) {
      console.log('Share error:', e.message);
    }
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        if (trip?.id || trip?.tripId) {
          const id = trip.tripId || trip.id;
          const res = await apiService.getTripDetail(id);
          // getTripDetail returns { success, data: {...} }
          const updated = res?.data || res;
          if (updated && (updated.id || updated.tripId)) setTrip(updated);
        }
      } catch (e) {
        console.log('[TripTracking] poll error:', e.message);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [trip?.id, trip?.tripId]);

  const currentStatusIndex = STAGES.findIndex(s => s.id === trip.status);
  
  // If status is not in STAGES (e.g., pending or driverAccepted), index will be -1
  const activeIndex = currentStatusIndex >= 0 ? currentStatusIndex : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride Tracking</Text>
        <TouchableOpacity onPress={handleShareDetails} style={{ padding: 5 }}>
          <Icon name="share-variant" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ride ID: #{trip.tripId?.slice(-6) || trip.id?.slice(-6)}</Text>
          <View style={styles.row}>
            <Icon name="account" size={20} color={COLORS.primary} />
            <Text style={styles.rowText}>{trip.driverName || 'Unknown Driver'}</Text>
          </View>
          <View style={styles.row}>
            <Icon name="car" size={20} color={COLORS.primary} />
            <Text style={styles.rowText}>{trip.vehicle || trip.vehicleType}</Text>
          </View>
          <TouchableOpacity style={styles.shareInlineBtn} onPress={handleShareDetails}>
            <Icon name="share-outline" size={18} color={COLORS.primary} />
            <Text style={styles.shareInlineText}>Share Link to Customer</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.trackingCard}>
          <Text style={styles.sectionTitle}>Live Status Flow</Text>
          <View style={styles.stepper}>
            {STAGES.map((stage, index) => {
              const isCompleted = index <= activeIndex;
              const isCurrent = index === activeIndex;
              
              return (
                <View key={stage.id} style={styles.stepContainer}>
                  <View style={styles.stepIndicator}>
                    <View style={[styles.circle, isCompleted && styles.circleCompleted, isCurrent && styles.circleCurrent]}>
                      <Icon name={stage.icon} size={20} color={isCompleted ? COLORS.white : COLORS.textMuted} />
                    </View>
                    {index < STAGES.length - 1 && (
                      <View style={[styles.line, isCompleted && index < activeIndex && styles.lineCompleted]} />
                    )}
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepLabel, isCompleted && styles.stepLabelCompleted, isCurrent && styles.stepLabelCurrent]}>
                      {stage.label}
                    </Text>
                    {isCurrent && <Text style={styles.currentSubText}>Current Stage</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Location Details</Text>
          <View style={styles.locRow}>
            <Icon name="record-circle-outline" size={20} color={COLORS.primary} />
            <Text style={styles.locText}>{trip.pickup || trip.pickupAddress}</Text>
          </View>
          <View style={styles.locRow}>
            <Icon name="map-marker-outline" size={20} color={COLORS.accentRose} />
            <Text style={styles.locText}>{trip.drop || trip.dropAddress}</Text>
          </View>
        </View>

        {/* Payment Verification — show for commissionPending AND commissionRejected */}
        {(trip.status === 'completed' || trip.status === 'commissionPending' || trip.status === 'commissionRejected') && (
          <View style={[styles.card, { marginTop: 10, borderColor: trip.status === 'commissionRejected' ? '#D32F2F' : COLORS.primary, borderWidth: 1.5 }]}>
            <Text style={styles.sectionTitle}>Payment Verification</Text>

            {trip.status === 'commissionRejected' && (
              <View style={{ backgroundColor: '#FFEBEE', padding: 10, borderRadius: 8, marginBottom: 12 }}>
                <Text style={{ color: '#B71C1C', fontWeight: 'bold', marginBottom: 4 }}>⚠️ You previously rejected this payment</Text>
                <Text style={{ color: '#C62828', fontSize: 13 }}>Your reason: {trip.commissionRejectReason || 'No reason saved'}</Text>
              </View>
            )}

            <Text style={{ marginBottom: 15, color: COLORS.textMuted }}>
              {trip.status === 'commissionRejected'
                ? 'The driver has re-submitted. Confirm if payment is now received.'
                : 'The driver has completed the trip. Please confirm if you have received the payment/commission.'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={styles.approveBtn} onPress={handleApprove}>
                <Icon name="check-circle" size={20} color="#fff" />
                <Text style={styles.btnTextWhite}>Yes, Received</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => setShowRejectModal(true)}>
                <Icon name="close-circle" size={20} color="#fff" />
                <Text style={styles.btnTextWhite}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Reject Modal */}
      <Modal visible={showRejectModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Payment</Text>
            <Text style={{marginBottom: 10, color: COLORS.textMuted}}>Send a message to the driver explaining why.</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="e.g. Haven't received the GPay transfer yet"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
            />
            <View style={{flexDirection: 'row', gap: 10, marginTop: 15}}>
              <TouchableOpacity style={styles.cancelBtnModal} onPress={() => setShowRejectModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectSubmitBtn} onPress={handleReject}>
                <Text style={styles.btnTextWhite}>Submit Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.lg, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  scroll: { padding: SPACING.md },
  card: { backgroundColor: COLORS.white, padding: SPACING.lg, borderRadius: RADIUS.md, marginBottom: SPACING.md, ...SHADOW.small },
  trackingCard: { backgroundColor: COLORS.white, padding: SPACING.lg, borderRadius: RADIUS.md, marginBottom: SPACING.md, ...SHADOW.small },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 15 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  rowText: { fontSize: 14, color: COLORS.text, marginLeft: 10 },
  locRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  locText: { fontSize: 14, color: COLORS.text, marginLeft: 10, flex: 1 },
  stepper: { marginTop: 10 },
  stepContainer: { flexDirection: 'row', marginBottom: 20 },
  stepIndicator: { alignItems: 'center', marginRight: 15 },
  circle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  circleCompleted: { backgroundColor: COLORS.primary },
  circleCurrent: { backgroundColor: COLORS.accent, borderWidth: 3, borderColor: 'rgba(76, 175, 80, 0.3)' },
  line: { width: 2, height: 40, backgroundColor: '#F0F0F0', position: 'absolute', top: 40, zIndex: 1 },
  lineCompleted: { backgroundColor: COLORS.primary },
  stepContent: { flex: 1, justifyContent: 'center', paddingTop: 10 },
  stepLabel: { fontSize: 16, color: COLORS.textMuted, fontWeight: '500' },
  stepLabelCompleted: { color: COLORS.text },
  stepLabelCurrent: { color: COLORS.accent, fontWeight: 'bold' },
  currentSubText: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  approveBtn: { flex: 1, backgroundColor: COLORS.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 12, borderRadius: 8, gap: 5 },
  rejectBtn: { flex: 1, backgroundColor: COLORS.accentRed, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 12, borderRadius: 8, gap: 5 },
  btnTextWhite: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 12 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  reasonInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, height: 80, textAlignVertical: 'top' },
  cancelBtnModal: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  cancelBtnText: { fontWeight: 'bold', color: COLORS.textMuted },
  rejectSubmitBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: COLORS.accentRed, alignItems: 'center' },
  shareInlineBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 15, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0', gap: 8 },
  shareInlineText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
});

export default TripTrackingScreen;
