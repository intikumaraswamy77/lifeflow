const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  getAuthToken() {
    return localStorage.getItem('token');
  }

  setAuthToken(token) {
    localStorage.setItem('token', token);
  }

  removeAuthToken() {
    localStorage.removeItem('token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'An error occurred');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: userData,
    });
  }

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: credentials,
    });
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async updateProfile(updates) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: updates,
    });
  }

  async changePassword(passwordData) {
    return this.request('/auth/change-password', {
      method: 'PUT',
      body: passwordData,
    });
  }

  async checkEligibility(eligibilityData) {
    return this.request('/auth/check-eligibility', {
      method: 'POST',
      body: eligibilityData,
    });
  }

  // Search endpoints
  async searchNearby(searchData) {
    // Ensure coordinates are properly formatted
    const formattedData = {
      ...searchData,
      // Ensure coordinates are numbers
      latitude: parseFloat(searchData.latitude),
      longitude: parseFloat(searchData.longitude),
      // Add debug info
      _debug: {
        rawLatitude: searchData.latitude,
        rawLongitude: searchData.longitude,
        parsedLatitude: parseFloat(searchData.latitude),
        parsedLongitude: parseFloat(searchData.longitude)
      }
    };
    
    console.log('Sending search request with data:', formattedData);
    
    return this.request('/search/nearby', {
      method: 'POST',
      body: formattedData,
    });
  }

  async getUserById(userId) {
    return this.request(`/search/user/${userId}`);
  }

  // Blood stock endpoints
  async getBloodStock() {
    return this.request('/bloodstock');
  }

  async updateBloodStock(bloodGroup, stockData) {
    return this.request(`/bloodstock/${bloodGroup}`, {
      method: 'PUT',
      body: stockData,
    });
  }

  async bulkUpdateBloodStock(stockData) {
    return this.request('/bloodstock', {
      method: 'PUT',
      body: stockData,
    });
  }

  // Message endpoints
  async getConversations() {
    return this.request('/messages/conversations');
  }

  async getMessages(userId, page = 1) {
    return this.request(`/messages/${userId}?page=${page}`);
  }

  async sendMessage(messageData) {
    return this.request('/messages', {
      method: 'POST',
      body: messageData,
    });
  }

  async updateMessageStatus(messageId, status) {
    return this.request(`/messages/${messageId}/status`, {
      method: 'PUT',
      body: { status },
    });
  }

  async getUnreadCount() {
    return this.request('/messages/unread/count');
  }

  // Blood request endpoints (messages with messageType = 'request')
  async getIncomingRequests(status) {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.request(`/messages/requests${q}`);
  }

  // Donor scheduling helpers
  async searchNearbyBanks({ latitude, longitude, maxDistance, bloodGroup }) {
    const body = { latitude, longitude, ...(maxDistance && { maxDistance }), ...(bloodGroup && { bloodGroup }) };
    return this.request('/search/nearby-banks', {
      method: 'POST',
      body
    });
  }

  async scheduleDonationRequest({ bloodBankId, donationDate, quantity = 1, unit = 'packets', notes = '', donorName, donorPhone, donorBloodGroup }) {
    return this.request('/messages', {
      method: 'POST',
      body: {
        receiverId: bloodBankId,
        message: `Donation schedule request for ${new Date(donationDate).toLocaleString()}`,
        messageType: 'request',
        requestDetails: {
          type: 'donation',
          donationDate,
          quantity,
          unit,
          notes,
          donorName,
          donorPhone,
          donorBloodGroup,
          status: 'pending'
        }
      }
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

export const apiClient = new ApiClient();
export default apiClient;

