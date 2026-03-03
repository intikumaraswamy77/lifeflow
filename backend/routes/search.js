const express = require('express');
const User = require('../models/User');
const BloodStock = require('../models/BloodStock');
const { auth, checkUserType } = require('../middleware/auth');

const router = express.Router();
// Search nearby donors and blood banks
router.post('/nearby', auth, checkUserType(['patient']), async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 10000, bloodGroup } = req.body; // maxDistance in meters

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    // Ensure maxDistance is a valid number
    const maxDistanceMeters = Number(maxDistance);
    if (isNaN(maxDistanceMeters) || maxDistanceMeters <= 0) {
      return res.status(400).json({ message: 'Invalid maximum distance value' });
    }

    // Debug mode - set to false in production
    const DEBUG_MODE = false;
    
    if (DEBUG_MODE) {
      console.log('Search parameters:', {
        latitude,
        longitude,
        maxDistanceKm: maxDistanceMeters / 1000,
        maxDistanceMeters,
        bloodGroup
      });
    }

    // Search for nearby donors
    const donorQuery = {
      userType: 'donor',
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: maxDistanceMeters
        }
      }
    };

    if (bloodGroup) {
      donorQuery.bloodGroup = bloodGroup;
    }

    const DONOR_LIMIT = 100;
    const donors = await User.find(donorQuery)
      .select('-password')
      .limit(DONOR_LIMIT);

    if (DEBUG_MODE) {
      console.log('Donor Query:', JSON.stringify(donorQuery, null, 2));
      console.log(`Found ${donors.length} donors`);
      if (donors.length > 0) {
        console.log('First donor location:', donors[0].location);
      }
      
      // Additional debug: Check ALL active donors manually
      const allActiveDonors = await User.find({ 
        userType: 'donor', 
        isActive: true,
        location: { $exists: true, $ne: null }
      }).select('name location bloodGroup').limit(50);
      
      console.log(`\nTotal active donors in DB: ${allActiveDonors.length}`);
      
      // Calculate distance for each
      const haversine = (lat1, lon1, lat2, lon2) => {
        const R = 6371000;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };
      
      allActiveDonors.forEach(d => {
        if (d.location?.coordinates?.length === 2) {
          const dist = haversine(latitude, longitude, d.location.coordinates[1], d.location.coordinates[0]);
          const withinRange = dist <= maxDistanceMeters;
          console.log(`  - ${d.name} [${d.bloodGroup}]: ${(dist/1000).toFixed(2)} km ${withinRange ? '✓ WITHIN RANGE' : '✗ OUT OF RANGE'}`);
        }
      });
    }

    // Search for nearby blood banks
    const bloodBankQuery = {
      userType: 'bloodbank',
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: maxDistanceMeters
        }
      }
    };

    const BLOODBANK_LIMIT = 100;
    const bloodBanks = await User.find(bloodBankQuery)
      .select('-password')
      .limit(BLOODBANK_LIMIT);

    // Get blood stock for blood banks
    const bloodBankIds = bloodBanks.map(bank => bank._id);
    const bloodStocks = await BloodStock.find({ bloodBankId: { $in: bloodBankIds } });

    // Group blood stocks by blood bank
    const stockByBank = {};
    bloodStocks.forEach(stock => {
      if (!stockByBank[stock.bloodBankId]) {
        stockByBank[stock.bloodBankId] = {};
      }
      stockByBank[stock.bloodBankId][stock.bloodGroup] = stock.quantity;
    });

    // Add stock information to blood banks
    const bloodBanksWithStock = bloodBanks.map(bank => ({
      ...bank.toObject(),
      bloodStock: stockByBank[bank._id] || {}
    }));

    res.json({
      donors,
      bloodBanks: bloodBanksWithStock,
      searchLocation: { latitude, longitude },
      maxDistance: maxDistanceMeters,
      meta: {
        donorCount: donors.length,
        bloodBankCount: bloodBanksWithStock.length,
        possiblyMoreDonors: donors.length === DONOR_LIMIT,
        possiblyMoreBloodBanks: bloodBanksWithStock.length === BLOODBANK_LIMIT
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error during search' });
  }
});

// Donor: search nearby blood banks (for scheduling donations)
router.post('/nearby-banks', auth, checkUserType(['donor']), async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 10000 } = req.body; // meters

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    // Ensure maxDistance is a valid number
    const maxDistanceMeters = Number(maxDistance);
    if (isNaN(maxDistanceMeters) || maxDistanceMeters <= 0) {
      return res.status(400).json({ message: 'Invalid maximum distance value' });
    }

    const bloodBankQuery = {
      userType: 'bloodbank',
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: maxDistanceMeters
        }
      }
    };

    const BLOODBANK_LIMIT = 100;
    const bloodBanks = await User.find(bloodBankQuery)
      .select('-password')
      .limit(BLOODBANK_LIMIT);

    const bloodBankIds = bloodBanks.map(bank => bank._id);
    const bloodStocks = await BloodStock.find({ bloodBankId: { $in: bloodBankIds } });

    const stockByBank = {};
    bloodStocks.forEach(stock => {
      if (!stockByBank[stock.bloodBankId]) {
        stockByBank[stock.bloodBankId] = {};
      }
      stockByBank[stock.bloodBankId][stock.bloodGroup] = stock.quantity;
    });

    const bloodBanksWithStock = bloodBanks.map(bank => ({
      ...bank.toObject(),
      bloodStock: stockByBank[bank._id] || {}
    }));

    res.json({
      bloodBanks: bloodBanksWithStock,
      searchLocation: { latitude, longitude },
      maxDistance: maxDistanceMeters,
      meta: {
        bloodBankCount: bloodBanksWithStock.length,
        possiblyMore: bloodBanksWithStock.length === BLOODBANK_LIMIT
      }
    });
  } catch (error) {
    console.error('Nearby banks search error:', error);
    res.status(500).json({ message: 'Server error during nearby banks search' });
  }
});

// Debug endpoint: Verify distance calculations
router.post('/debug/verify-distances', auth, async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 10000 } = req.body;
    
    // Get all active donors with location
    const allDonors = await User.find({ 
      userType: 'donor', 
      isActive: true,
      location: { $exists: true, $ne: null }
    })
    .select('name bloodGroup location address')
    .limit(200);
    
    // Calculate distance manually for each donor
    const haversineDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371000; // Earth's radius in meters
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };
    
    const donorsWithDistance = allDonors.map(d => {
      const coords = d.location?.coordinates;
      if (!coords || coords.length !== 2) {
        return { ...d.toObject(), distance: null, withinRange: false };
      }
      const distance = haversineDistance(
        latitude, longitude,
        coords[1], coords[0] // [lng, lat] format
      );
      return {
        name: d.name,
        bloodGroup: d.bloodGroup,
        address: d.address,
        coordinates: coords,
        distance: Math.round(distance),
        distanceKm: (distance / 1000).toFixed(2),
        withinRange: distance <= maxDistance
      };
    });
    
    const withinRange = donorsWithDistance.filter(d => d.withinRange);
    const outOfRange = donorsWithDistance.filter(d => !d.withinRange && d.distance !== null);
    
    res.json({
      searchCenter: { latitude, longitude },
      maxDistanceMeters: maxDistance,
      maxDistanceKm: maxDistance / 1000,
      totalDonorsChecked: donorsWithDistance.length,
      withinRange: withinRange.length,
      outOfRange: outOfRange.length,
      donorsWithinRange: withinRange.sort((a, b) => a.distance - b.distance),
      donorsJustOutsideRange: outOfRange
        .filter(d => d.distance < maxDistance * 1.2)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 10)
    });
  } catch (error) {
    console.error('Debug verify distances error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Debug endpoint: List all active donors and blood banks with locations
router.get('/debug/all-locations', auth, async (req, res) => {
  try {
    const donors = await User.find({ userType: 'donor', isActive: true })
      .select('name bloodGroup location address')
      .limit(100);
    
    const bloodBanks = await User.find({ userType: 'bloodbank', isActive: true })
      .select('name bloodBankName location address')
      .limit(100);
    
    res.json({
      donors: donors.map(d => ({
        name: d.name,
        bloodGroup: d.bloodGroup,
        address: d.address,
        location: d.location,
        hasLocation: !!d.location,
        coordinates: d.location?.coordinates
      })),
      bloodBanks: bloodBanks.map(b => ({
        name: b.bloodBankName || b.name,
        address: b.address,
        location: b.location,
        hasLocation: !!b.location,
        coordinates: b.location?.coordinates
      })),
      totalDonors: donors.length,
      totalBloodBanks: bloodBanks.length
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user details by ID
router.get('/user/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let responseData = user.toObject();

    // If it's a blood bank, include stock information
    if (user.userType === 'bloodbank') {
      const bloodStock = await BloodStock.find({ bloodBankId: user._id });
      const stockByGroup = {};
      bloodStock.forEach(stock => {
        stockByGroup[stock.bloodGroup] = stock.quantity;
      });
      responseData.bloodStock = stockByGroup;
    }

    res.json(responseData);
  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

