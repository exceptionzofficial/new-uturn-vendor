import React, { useState } from 'react';
import {
  StyleSheet, View, Text, SafeAreaView, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, TextInput, Modal, Image
} from 'react-native';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme/AppTheme';
import apiService from '../../services/api';
import { API_BASE_URL } from '../../config/Config';

const DriverApprovalScreen = ({ navigation, route }) => {
  const { trip } = route.params || {};
  const [isApproving, setIsApproving]   = useState(false);
  const [isRejecting, setIsRejecting]   = useState(false);
  const [showReject,  setShowReject]    = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showPhoto, setShowPhoto]       = useState(false);
  const [videoPaused, setVideoPaused]   = useState(false);

  const tripId = trip?.tripId || trip?.id;

  const handleApprove = async () => {
    Alert.alert('Approve Driver', `Approve this driver for the trip?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          setIsApproving(true);
          try {
            const res = await apiService.approveDriver(tripId);
            if (res?.success) {
              Alert.alert('✅ Approved!', 'Driver notified. Customer details are now revealed to the driver.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } else {
              Alert.alert('Error', res?.message || 'Could not approve driver.');
            }
          } catch {
            Alert.alert('Error', 'Network error. Please try again.');
          } finally {
            setIsApproving(false);
          }
        },
      },
    ]);
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Required', 'Please enter a reason for rejection.');
      return;
    }
    setIsRejecting(true);
    try {
      const res = await apiService.rejectDriver(tripId, rejectReason.trim(), trip.driverId);
      if (res?.success) {
        setShowReject(false);
        Alert.alert('Driver Rejected', 'Trip returned to pending. A new driver can now accept it.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', res?.message || 'Could not reject driver.');
      }
    } catch {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsRejecting(false);
    }
  };

  const InfoRow = ({ icon, label, value, color }) => (
    <View style={styles.infoRow}>
      <Icon name={icon} size={18} color={color || COLORS.textMuted} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Driver Verification</Text>
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingBadgeText}>PENDING</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Trip Summary */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          <Text style={styles.tripId}>#{tripId?.slice(-10)}</Text>
          <InfoRow icon="map-marker"       label="Pickup"   value={trip?.pickupAddress || trip?.pickup} />
          <InfoRow icon="map-marker-check" label="Drop"     value={trip?.dropAddress   || trip?.drop} />
          <InfoRow icon="car-side"         label="Vehicle"  value={trip?.vehicleType   || trip?.vehicle} />
          <InfoRow icon="cash"             label="Fare"     value={`₹${trip?.totalFare || trip?.totalTripAmount || 0}`} color="#4CAF50" />
        </View>

        {/* Driver Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Driver Details</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md }}>
            {trip?.driverPhoto ? (
              <TouchableOpacity onPress={() => setShowPhoto(true)}>
                <Image source={{ uri: trip.driverPhoto.startsWith('http') ? trip.driverPhoto : `${API_BASE_URL.replace('/api/', '')}${trip.driverPhoto}` }} style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10 }} />
              </TouchableOpacity>
            ) : (
              <Icon name="account-circle" size={50} color={COLORS.textMuted} style={{ marginRight: 10 }} />
            )}
            <View>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.text }}>{trip?.driverName || 'Unknown Driver'}</Text>
              <Text style={{ fontSize: 12, color: COLORS.textMuted }}>ID: {trip?.driverId}</Text>
            </View>
          </View>
          <InfoRow icon="calendar"     label="Accepted"   value={trip?.acceptedAt ? new Date(trip.acceptedAt).toLocaleString('en-IN') : '—'} />
        </View>

        {/* Verification Video */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Verification Video</Text>
          {trip?.videoUrl ? (
            <View style={styles.videoContainer}>
              <Video
                source={{ uri: trip.videoUrl.startsWith('http') ? trip.videoUrl : `${API_BASE_URL.replace('/api/', '')}${trip.videoUrl}` }}
                style={styles.videoPlayer}
                controls={true}
                resizeMode="cover"
                paused={videoPaused}
                onError={(e) => console.log('Video Error:', e)}
              />
              <Text style={styles.videoNote}>Ensure driver and vehicle match the profile photos.</Text>
            </View>
          ) : (
            <View style={styles.noVideoBox}>
              <Icon name="video-off" size={32} color={COLORS.textMuted} />
              <Text style={styles.noVideoText}>No verification video uploaded</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.rejectBtn, isRejecting && { opacity: 0.6 }]}
            onPress={() => setShowReject(true)}
            disabled={isRejecting || isApproving}
          >
            <Icon name="close-circle" size={22} color="#F44336" />
            <Text style={styles.rejectBtnText}>Reject</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.approveBtn, (isApproving || isRejecting) && { opacity: 0.6 }]}
            onPress={handleApprove}
            disabled={isApproving || isRejecting}
          >
            <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.approveBtnGrad}>
              {isApproving
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                    <Icon name="check-circle" size={22} color="#fff" />
                    <Text style={styles.approveBtnText}>Approve Driver</Text>
                  </>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Reject Modal */}
      <Modal visible={showReject} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Reject Driver</Text>
            <Text style={styles.modalSubtitle}>Provide a reason (this helps the driver improve):</Text>
            <TextInput
              style={styles.reasonInput}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="e.g. Video unclear, vehicle mismatch, low rating..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowReject(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, isRejecting && { opacity: 0.6 }]}
                onPress={handleRejectConfirm}
                disabled={isRejecting}
              >
                <LinearGradient colors={['#F44336', '#B71C1C']} style={styles.modalConfirmGrad}>
                  {isRejecting
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.modalConfirmText}>Confirm Rejection</Text>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Driver Photo Fullscreen Modal */}
      <Modal visible={showPhoto} transparent animationType="fade">
        <View style={styles.photoModalOverlay}>
          <TouchableOpacity style={styles.photoModalClose} onPress={() => setShowPhoto(false)}>
            <Icon name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          {trip?.driverPhoto && (
            <Image 
              source={{ uri: trip.driverPhoto.startsWith('http') ? trip.driverPhoto : `${API_BASE_URL.replace('/api/', '')}${trip.driverPhoto}` }} 
              style={styles.fullScreenPhoto} 
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: 14,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: COLORS.text },
  pendingBadge: { backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  pendingBadgeText: { fontSize: 11, fontWeight: '900', color: '#FF9800' },
  scroll: { padding: SPACING.lg, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 16,
    ...SHADOW.light, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 14, textTransform: 'uppercase' },
  tripId: { fontSize: 15, fontWeight: '800', color: COLORS.primary, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  infoLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted, width: 68 },
  infoValue: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.text },
  videoContainer: { width: '100%', borderRadius: 16, overflow: 'hidden', backgroundColor: '#000', marginTop: 10 },
  videoPlayer: { width: '100%', height: 220 },
  videoNote: { fontSize: 11, color: '#FFF', textAlign: 'center', paddingVertical: 10, fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.6)' },
  noVideoBox: { alignItems: 'center', padding: 24, backgroundColor: '#F5F7FA', borderRadius: 14 },
  noVideoText: { fontSize: 14, color: COLORS.textMuted, marginTop: 8, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 16, borderWidth: 2, borderColor: '#F44336', height: 56, gap: 8,
    backgroundColor: '#FFF5F5',
  },
  rejectBtnText: { fontSize: 16, fontWeight: '800', color: '#F44336' },
  approveBtn: { flex: 2, borderRadius: 16, overflow: 'hidden' },
  approveBtnGrad: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, gap: 8 },
  approveBtnText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text, marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: COLORS.textMuted, marginBottom: 16 },
  reasonInput: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12,
    padding: 14, fontSize: 14, color: COLORS.text, textAlignVertical: 'top', minHeight: 90, marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 14, backgroundColor: '#F1F5F9', height: 50 },
  modalCancelText: { fontSize: 15, fontWeight: '800', color: '#64748B' },
  modalConfirmBtn: { flex: 2, borderRadius: 14, overflow: 'hidden' },
  modalConfirmGrad: { flex: 1, justifyContent: 'center', alignItems: 'center', height: 50 },
  modalConfirmText: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  photoModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  photoModalClose: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 },
  fullScreenPhoto: { width: '100%', height: '80%' },
});

export default DriverApprovalScreen;
