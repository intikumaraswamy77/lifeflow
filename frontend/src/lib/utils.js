import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

export const getCurrentLocation = (options = {}) => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      const error = new Error('Geolocation is not supported by this browser.');
      error.code = 'UNSUPPORTED';
      reject(error);
      return;
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 15000, // Increased timeout to 15 seconds
      maximumAge: 0, // Always get a fresh position
      ...options
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!position || !position.coords) {
          const error = new Error('Invalid position data received');
          error.code = 'POSITION_UNAVAILABLE';
          reject(error);
          return;
        }

        const { latitude, longitude, accuracy } = position.coords;
        
        // Validate coordinates
        if (typeof latitude !== 'number' || typeof longitude !== 'number' || 
            isNaN(latitude) || isNaN(longitude)) {
          const error = new Error('Invalid coordinates received');
          error.code = 'POSITION_UNAVAILABLE';
          reject(error);
          return;
        }

        // Check if accuracy is within acceptable range (in meters)
        if (accuracy > 5000) { // 5km accuracy is too low
          console.warn(`Location accuracy is low: ${Math.round(accuracy)} meters`);
        }

        resolve({
          latitude,
          longitude,
          accuracy: Math.round(accuracy)
        });
      },
      (error) => {
        // Map error codes to more descriptive messages
        const errorMap = {
          1: 'PERMISSION_DENIED',
          2: 'POSITION_UNAVAILABLE',
          3: 'TIMEOUT'
        };
        
        const errorType = errorMap[error.code] || 'UNKNOWN_ERROR';
        const errorMessage = error.message || 'Failed to get location';
        
        const enhancedError = new Error(errorMessage);
        enhancedError.code = errorType;
        enhancedError.originalError = error;
        
        reject(enhancedError);
      },
      defaultOptions
    );
  });
};

export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return errors;
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const formatPhone = (phone) => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX for US numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone;
};

export const getBloodGroupColor = (bloodGroup) => {
  const colors = {
    'A+': 'bg-red-100 text-red-800',
    'A-': 'bg-red-200 text-red-900',
    'B+': 'bg-blue-100 text-blue-800',
    'B-': 'bg-blue-200 text-blue-900',
    'AB+': 'bg-purple-100 text-purple-800',
    'AB-': 'bg-purple-200 text-purple-900',
    'O+': 'bg-green-100 text-green-800',
    'O-': 'bg-green-200 text-green-900',
  };
  
  return colors[bloodGroup] || 'bg-gray-100 text-gray-800';
};

export const getUrgencyColor = (urgency) => {
  const colors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };
  
  return colors[urgency] || 'bg-gray-100 text-gray-800';
};

export const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800',
  };
  
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// Get available blood groups for blood request based on partner type
export const getAvailableBloodGroups = (partnerType, partnerBloodGroup) => {
  // For blood banks, show all blood groups
  if (partnerType === 'bloodbank') {
    return bloodGroups;
  }

  // For donors, show only their blood group
  if (partnerType === 'donor' && partnerBloodGroup) {
    return [partnerBloodGroup];
  }

  // Default: show all blood groups
  return bloodGroups;
};

