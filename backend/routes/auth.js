const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const BloodStock = require('../models/BloodStock');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Normalize location from various payload shapes into GeoJSON Point
function buildGeoLocationFromPayload(payload) {
  // Accept either explicit latitude/longitude or a location object with coordinates
  let lat = payload.latitude;
  let lng = payload.longitude;

  if ((lat == null || lng == null) && payload.location && Array.isArray(payload.location.coordinates)) {
    // If location.coordinates is provided, assume it's already in correct GeoJSON format [lng, lat]
    // ONLY use this as fallback - prefer explicit latitude/longitude fields to avoid ambiguity
    const c = payload.location.coordinates.map(Number);
    if (c.length === 2) {
      const [a, b] = c;
      // Validate that values are within valid ranges
      // If first value is clearly out of longitude range, it might be [lat, lng] by mistake
      if (Math.abs(a) > 180 || Math.abs(b) > 90) {
        // Invalid coordinates, return undefined
        return undefined;
      }
      // Assume GeoJSON format: [lng, lat]
      lng = a;
      lat = b;
    }
  }

  if (lat == null || lng == null) return undefined;

  // Cast to numbers
  lat = Number(lat);
  lng = Number(lng);

  // Validate ranges
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return undefined;

  return { type: 'Point', coordinates: [lng, lat] };
}

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Generate eligibility token (temporary, short-lived)
const generateEligibilityToken = (eligibilityData) => {
  return jwt.sign({ eligibilityData, type: 'eligibility' }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Validate eligibility criteria
const validateEligibility = (form) => {
  const reasons = [];
  let eligible = true;

  // Calculate age
  const computeAge = (dobStr) => {
    if (!dobStr) return null;
    const today = new Date();
    const dob = new Date(dobStr);
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  };

  const age = computeAge(form.dateOfBirth);
  if (age === null) {
    eligible = false;
    reasons.push('Please provide your date of birth to calculate age');
  } else if (age < 18 || age > 65) {
    eligible = false;
    reasons.push('Age must be between 18 and 65 years');
  }

  const weight = Number(form.weight);
  if (!weight) {
    eligible = false;
    reasons.push('Please enter your weight');
  } else if (weight < 50) {
    eligible = false;
    reasons.push('Minimum weight for donation is 50 kg');
  }

  const hb = Number(form.hemoglobin);
  if (!hb) {
    eligible = false;
    reasons.push('Please enter your hemoglobin');
  } else if (hb < 12.5) {
    eligible = false;
    reasons.push('Hemoglobin must be at least 12.5 g/dL');
  }

  if (form.lastDonationDate) {
    const last = new Date(form.lastDonationDate);
    const now = new Date();
    const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
    if (diffDays < 90) {
      eligible = false;
      reasons.push('At least 90 days must have passed since your last whole blood donation');
    }
  }

  if (form.hadFever) { eligible = false; reasons.push('You currently report fever/active infection'); }
  if (form.recentSurgery) { eligible = false; reasons.push('Recent major surgery requires deferral'); }
  if (form.onMedications) { reasons.push('Some medications may defer donation—confirm with staff'); }
  if (form.alcoholLast24h) { eligible = false; reasons.push('Avoid alcohol 24 hours prior to donation'); }
  if (form.gender === 'female' && form.pregnantOrBreastfeeding) { 
    eligible = false; 
    reasons.push('Cannot donate while pregnant or breastfeeding'); 
  }

  return { eligible, reasons };
};

// Check donor eligibility
router.post('/check-eligibility', async (req, res) => {
  try {
    const eligibilityForm = req.body;
    
    // Validate required fields
    if (!eligibilityForm.dateOfBirth || !eligibilityForm.gender || !eligibilityForm.weight || !eligibilityForm.hemoglobin) {
      return res.status(400).json({ 
        message: 'Please fill in all required fields',
        eligible: false 
      });
    }

    // Validate eligibility
    const assessment = validateEligibility(eligibilityForm);
    
    if (!assessment.eligible) {
      return res.status(200).json({
        eligible: false,
        reasons: assessment.reasons,
        message: 'You are not eligible to donate at this time'
      });
    }

    // Generate eligibility token with form data
    const eligibilityData = {
      dateOfBirth: eligibilityForm.dateOfBirth,
      gender: eligibilityForm.gender,
      weight: Number(eligibilityForm.weight),
      hemoglobin: Number(eligibilityForm.hemoglobin),
      lastDonationDate: eligibilityForm.lastDonationDate || null,
      hadFever: eligibilityForm.hadFever || false,
      recentSurgery: eligibilityForm.recentSurgery || false,
      onMedications: eligibilityForm.onMedications || false,
      alcoholLast24h: eligibilityForm.alcoholLast24h || false,
      pregnantOrBreastfeeding: eligibilityForm.pregnantOrBreastfeeding || false,
      checkedAt: new Date()
    };

    const eligibilityToken = generateEligibilityToken(eligibilityData);

    res.json({
      eligible: true,
      eligibilityToken,
      eligibilityData,
      message: 'You are eligible to donate! Please proceed with registration.'
    });
  } catch (error) {
    console.error('Eligibility check error:', error);
    res.status(500).json({ message: 'Server error during eligibility check' });
  }
});

// Register user
router.post('/register', async (req, res) => {
  try {
    const { userType, eligibilityToken, ...userData } = req.body;
    
    // Validate phone number (must be 10 digits starting with 6-9)
    if (!userData.phone || !/^[6-9]\d{9}$/.test(userData.phone.trim())) {
      return res.status(400).json({ message: 'Phone number must be 10 digits and start with 6, 7, 8, or 9' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ phone: userData.phone });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this phone number already exists' });
    }

    // For donors, verify eligibility token
    let eligibilityData = null;
    if (userType === 'donor') {
      if (!eligibilityToken) {
        return res.status(400).json({ 
          message: 'Donors must complete eligibility check before registration',
          requiresEligibility: true 
        });
      }

      try {
        const decoded = jwt.verify(eligibilityToken, process.env.JWT_SECRET);
        
        if (decoded.type !== 'eligibility') {
          return res.status(400).json({ 
            message: 'Invalid eligibility token',
            requiresEligibility: true 
          });
        }

        eligibilityData = decoded.eligibilityData;

        // Re-validate eligibility to ensure it's still valid
        const recheck = validateEligibility({
          ...eligibilityData,
          gender: eligibilityData.gender
        });

        if (!recheck.eligible) {
          return res.status(400).json({ 
            message: 'Eligibility validation failed. Please retake the eligibility check.',
            reasons: recheck.reasons,
            requiresEligibility: true 
          });
        }

        // Store eligibility data in user record
        userData.eligibilityData = eligibilityData;

      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          return res.status(400).json({ 
            message: 'Eligibility check has expired. Please complete it again.',
            requiresEligibility: true 
          });
        }
        return res.status(400).json({ 
          message: 'Invalid eligibility token. Please complete the eligibility check.',
          requiresEligibility: true 
        });
      }
    }

    // Normalize and attach GeoJSON location if provided
    const normalizedLocation = buildGeoLocationFromPayload(userData);
    if (normalizedLocation) {
      userData.location = normalizedLocation;
    }
    delete userData.latitude;
    delete userData.longitude;

    // Create user based on type
    const user = new User({
      ...userData,
      userType
    });

    await user.save();

    // If blood bank, initialize blood stock
    if (userType === 'bloodbank') {
      const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      const stockPromises = bloodGroups.map(bloodGroup => {
        const stock = new BloodStock({
          bloodBankId: user._id,
          bloodGroup,
          quantity: 0
        });
        return stock.save();
      });
      await Promise.all(stockPromises);
    }

    const token = generateToken(user._id);
    
    // Return full user profile (without password) so client has consistent shape
    const fullUser = await User.findById(user._id).select('-password');
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: fullUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Validate phone number (must be 10 digits starting with 6-9)
    if (!phone || !/^[6-9]\d{9}$/.test(phone.trim())) {
      return res.status(400).json({ message: 'Phone number must be 10 digits and start with 6, 7, 8, or 9' });
    }

    // Find user by phone
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    
    // Return full user profile (without password) so client has consistent shape
    const fullUser = await User.findById(user._id).select('-password');
    res.json({
      message: 'Login successful',
      token,
      user: fullUser
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.password; // Don't allow password updates through this route
    delete updates.phone; // Don't allow phone updates
    delete updates.userType; // Don't allow user type changes

    // Normalize location on updates too
    const normalizedUpdateLoc = buildGeoLocationFromPayload(updates);
    if (normalizedUpdateLoc) {
      updates.location = normalizedUpdateLoc;
    }
    delete updates.latitude;
    delete updates.longitude;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

// Change password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Server error during password change' });
  }
});

module.exports = router;

