const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [/^[6-9]\d{9}$/, 'Phone number must be 10 digits and start with 6, 7, 8, or 9']
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  userType: {
    type: String,
    required: true,
    enum: ['patient', 'donor', 'bloodbank']
  },
  // Patient specific fields
  // No additional fields for patients
  
  // Donor specific fields
  dateOfBirth: {
    type: Date,
    required: function() { return this.userType === 'donor'; }
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: function() { return this.userType === 'donor'; }
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: function() { return this.userType === 'donor'; }
  },
  // Donor self-report fields (optional)
  lastDonationDate: {
    type: Date,
    required: false
  },
  totalDonations: {
    type: Number,
    default: 0,
    min: 0
  },
  address: {
    type: String,
    required: function() { return this.userType === 'donor' || this.userType === 'bloodbank'; }
  },
  // Donor eligibility data (stored from eligibility check)
  eligibilityData: {
    type: {
      weight: Number,
      hemoglobin: Number,
      lastDonationDate: Date,
      hadFever: Boolean,
      recentSurgery: Boolean,
      onMedications: Boolean,
      alcoholLast24h: Boolean,
      pregnantOrBreastfeeding: Boolean,
      checkedAt: Date
    },
    required: false
  },
  
  // Blood bank specific fields
  bloodBankName: {
    type: String,
    required: function() { return this.userType === 'bloodbank'; }
  },
  landlineNumber: {
    type: String,
    required: function() { return this.userType === 'bloodbank'; },
    trim: true,
    validate: {
      validator: function(v) {
        // Only validate if user is a blood bank
        if (this.userType !== 'bloodbank') return true;
        // Must have value for blood banks and contain valid characters
        if (!v) return false;
        // Allow digits, spaces, hyphens, parentheses, and plus sign
        return /^[\d\s\-\(\)\+]+$/.test(v) && v.length >= 6;
      },
      message: 'Landline number is required and must contain at least 6 digits with valid formatting'
    }
  },
  
  // Location fields for donors and blood banks
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: function() { return this.userType === 'donor' || this.userType === 'bloodbank'; }
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: function() { return this.userType === 'donor' || this.userType === 'bloodbank'; },
      validate: {
        validator: function(v) {
          if (!Array.isArray(v) || v.length !== 2) return false;
          const [lng, lat] = v;
          // Must be finite numbers in valid ranges
          if (!Number.isFinite(lng) || !Number.isFinite(lat)) return false;
          return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
        },
        message: 'location.coordinates must be [lng, lat] within valid ranges'
      }
    }
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create geospatial index for location-based queries
userSchema.index({ location: '2dsphere' });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Calculate age for donors
userSchema.virtual('age').get(function() {
  if (this.dateOfBirth && this.userType === 'donor') {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
  return null;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);

