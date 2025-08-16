import axios from "axios";

export const BASE_URL = "http://127.0.0.1:5000/api";

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Wholesalers
export const addWholesaler = (data) => api.post('/wholesalers/', data);
export const getWholesalers = () => api.get('/wholesalers/');

// Pan Shops
export const addPanshop = (data) => api.post('/panshops/', data);
export const getPanshops = () => api.get('/panshops/');

// Basket Entry 
export const addBasketEntry = (data) => api.post('/basket-entries/add', data);
export const getBasketEntries = (params) => api.get('/basket-entries', { params });

// Payments
export const addPayment = (data) => api.post('/payments/', data);
export const getPayments = (params) => api.get('/payments/', { params });
export const getBalanceSummary = (params) => api.get('/payments/balance-summary', { params });

// History and Dashboard
export const getTransactionHistory = (params) => api.get('/history/', { params });
export const getDashboardSummary = () => api.get('/dashboard-summary/');

// Auth APIs
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const getCurrentUser = () => api.get('/auth/me');
export const forgotPassword = (data) => api.post('/auth/forgot-password', data);
export const resetPassword = (token, data) => api.post(`/auth/reset-password/${token}`, data);

export default api;
