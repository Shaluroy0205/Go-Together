import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
};

export const rides = {
  // Get all rides
  getAllRides: (params = {}) => api.get('/api/rides/getRides', { params }),
  
  // Get best matching rides
  getBestMatches: (params) => api.get('/api/rides/bestRides', { 
    params: {
      pickupLat: params.pickupLat,
      pickupLng: params.pickupLng,
      dropoffLat: params.dropoffLat,
      dropoffLng: params.dropoffLng,
      maxDistance: params.maxDistance
    } 
  }),
  
  // Get ride by ID
  getRideById: (rideId) => api.get(`/api/rides/${rideId}`),
  
  // Get user ride requests
  getUserRequests: () => api.get('/api/rides/myRequests'),
  
  // Request a ride
  requestRide: (rideId) => api.put(`/api/rides/${rideId}/request`),
  
  // Cancel a request
  cancelRequest: (requestId) => api.delete(`/api/rides/request/${requestId}`),
  
  // Approve/reject ride request
  approveRequest: (rideId, passengerId, status) => 
    api.put(`/api/rides/${rideId}/approval`, { 
      passengerId, 
      status // "confirmed" or "rejected"
    }),
  
  // Get user created rides
  getUserRides: () => api.get('/api/rides/created/list'),
  
  // Create a ride
  create: (data) => api.post('/api/rides/createRide', data),
  
  // Update a ride
  updateRide: (rideId, data) => api.put(`/api/rides/${rideId}`, data),
  
  // Cancel a ride
  cancelRide: (rideId) => api.delete(`/api/rides/${rideId}`),
  
  // Complete a ride
  completeRide: (rideId) => api.put(`/api/rides/${rideId}/complete`),
  
  // Get ride history
  getRideHistory: () => api.get('/api/rides/history')
};

export const users = {
  // Get user profile
  getProfile: () => api.get('/api/users/profile'),
  
  // Update user profile
  updateProfile: (data) => api.put('/api/users/profile', data),
  
  // Update vehicle information
  updateVehicle: (data) => api.put('/api/users/vehicle', data),
  
  // Search users by name
  searchUsers: (query, limit) => api.get('/api/users/search', { 
    params: { query, limit } 
  }),
  
  // Get user by ID
  getUserById: (userId) => api.get(`/api/users/${userId}`)
};

export const ratings = {
  // Create a rating
  rateUser: (data) => api.post('/api/ratings', data),
  
  // Get user ratings
  getUserRatings: (userId) => api.get(`/api/ratings/${userId}`)
};

export const reports = {
  // Report a user
  reportUser: (data) => api.post('/api/reports', data),
  
  // View my reports
  getMyReports: () => api.get('/api/reports/my-reports')
};

export const notifications = {
  // Get user notifications
  getNotifications: (params = {}) => api.get('/api/notifications', { params }),
  
  // Mark a notification as read
  markAsRead: (notificationId) => api.put(`/api/notifications/${notificationId}/read`),
  
  // Mark all notifications as read
  markAllAsRead: () => api.put('/api/notifications/mark-all-read')
};

export default api; 