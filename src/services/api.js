import axios from 'axios';
import { API_BASE_URL } from '../config/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add auth token if needed
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const apiService = {
  // Auth & Profile
  checkPhone: async (phone) => {
    const res = await apiClient.post('vendor/check-status', { phone });
    return res.data;
  },
  sendOtp: async (phone) => {
    const res = await apiClient.post('vendor/send-otp', { phone });
    return res.data;
  },
  verifyOtp: async (phone, otp) => {
    const res = await apiClient.post('vendor/verify-otp', { phone, otp });
    return res.data;
  },
  register: async (vendorData) => {
    const res = await apiClient.post('vendor/register', vendorData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  checkCustomer: async (phone) => {
    const res = await apiClient.post('vendor/check-customer', { phone });
    return res.data;
  },

  // Bookings / Trips
  createTrip: async (tripData) => {
    const res = await apiClient.post('bookings/create', tripData);
    return res.data;
  },
  updateTrip: async (id, tripData) => {
    const res = await apiClient.put(`vendor/trips/${id}`, tripData);
    return res.data;
  },
  getTrips: async (status = '') => {
    // Use the vendor trips endpoint, optionally filtering by status
    const url = status ? `vendor/trips?status=${status}` : 'vendor/trips';
    const res = await apiClient.get(url);
    return res.data;
  },
  getTripById: async (id) => {
    const res = await apiClient.get(`vendor/trip/${id}`);
    return res.data;
  },
  deleteTrip: async (id) => {
    const res = await apiClient.delete(`vendor/trips/${id}`);
    return res.data;
  },
  publishTrip: async (id) => {
    const res = await apiClient.post(`vendor/trips/${id}/publish`);
    return res.data;
  },
  unpublishTrip: async (id) => {
    const res = await apiClient.post(`vendor/trips/${id}/unpublish`);
    return res.data;
  },
  cancelTrip: async (id) => {
    const res = await apiClient.post(`vendor/trips/${id}/cancel`);
    return res.data;
  },
  
  // Approvals & Commission (Shared Booking Routes)
  approveDriver: async (id) => {
    const res = await apiClient.post(`bookings/${id}/approve-driver`);
    return res.data;
  },
  rejectDriver: async (id, reason) => {
    const res = await apiClient.post(`bookings/${id}/reject-driver`, { reason });
    return res.data;
  },
  verifyCashPayment: async (id) => {
    const res = await apiClient.post(`bookings/${id}/verify-payment`);
    return res.data;
  },
  approveCommission: async (id) => {
    const res = await apiClient.post(`bookings/${id}/approve-commission`);
    return res.data;
  },
  rejectCommission: async (id, reason) => {
    const res = await apiClient.post(`bookings/${id}/reject-commission`, { reason });
    return res.data;
  },
};

export default apiService;
