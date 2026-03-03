const express = require('express');
const mongoose = require('mongoose');
const { auth, checkUserType } = require('../middleware/auth');
const Donation = require('../models/Donation');
const BloodStock = require('../models/BloodStock');

const router = express.Router();

// GET /api/donations - list donations for current user (blood bank or donor)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.userType === 'bloodbank') {
      // Blood banks see donations at their facility
      query = { bloodBankId: req.user._id };
    } else if (req.user.userType === 'donor') {
      // Donors see their own donations
      query = { donorId: req.user._id };
    } else {
      return res.status(403).send('Only blood banks and donors can view donations');
    }
    
    const list = await Donation.find(query)
      .populate('bloodBankId', 'bloodBankName name address phone')
      .populate('donorId', 'name bloodGroup')
      .sort({ donationDate: -1, createdAt: -1 })
      .lean();
    res.json(list);
  } catch (err) {
    console.error('Fetch donations error:', err);
    res.status(500).send('Failed to fetch donations');
  }
});

// POST /api/donations - record or schedule a donation
router.post('/', auth, async (req, res) => {
  try {
    const { 
      donorId, 
      donorExternalId = '', 
      donorName = '', 
      age,
      mobileNumber = '',
      bloodGroup, 
      quantity, 
      unit = 'packets', 
      notes = '', 
      donationDate,
      bloodBankId,
      status = 'completed'
    } = req.body || {};
    
    const validBloodGroups = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
    if (!bloodGroup || !validBloodGroups.includes(bloodGroup)) {
      return res.status(400).send('Valid blood group is required');
    }
    
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).send('Invalid quantity');
    }

    // Validate age if provided
    if (age !== undefined && age !== null && age !== '') {
      const ageNum = Number(age);
      if (!Number.isFinite(ageNum) || ageNum < 16 || ageNum > 65) {
        return res.status(400).send('Age must be between 16 and 65 years');
      }
    }

    // Validate mobile number if provided
    if (mobileNumber && mobileNumber.trim() !== '') {
      if (!/^[6-9]\d{9}$/.test(mobileNumber.trim())) {
        return res.status(400).send('Mobile number must be 10 digits and start with 6, 7, 8, or 9');
      }
    }

    let donationData = {
      bloodGroup,
      quantity: qty,
      unit,
      notes,
      status
    };

    // Handle different user types
    if (req.user.userType === 'bloodbank') {
      // Blood bank recording a completed donation
      if (!donorName && !donorId) {
        return res.status(400).send('Provide donorId or donorName');
      }
      
      // Check for duplicate donation (same donor name + mobile number on same day)
      if (donorName && mobileNumber) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const existingDonation = await Donation.findOne({
          bloodBankId: req.user._id,
          donorName: { $regex: new RegExp(`^${donorName.trim()}$`, 'i') },
          mobileNumber: mobileNumber.trim(),
          donationDate: { $gte: today, $lt: tomorrow }
        });
        
        if (existingDonation) {
          return res.status(400).send('Duplicate donation: This donor with same name and mobile number has already donated today');
        }
      }
      
      donationData.bloodBankId = req.user._id;
      donationData.donorExternalId = donorExternalId || '';
      donationData.donorName = donorName || '';
      if (age) donationData.age = age;
      if (mobileNumber) donationData.mobileNumber = mobileNumber;
      if (donorId && mongoose.Types.ObjectId.isValid(donorId)) {
        donationData.donorId = donorId;
      }
      donationData.donationDate = donationDate ? new Date(donationDate) : new Date();
      donationData.status = status || 'completed';
      
    } else if (req.user.userType === 'donor') {
      // Donor scheduling a donation
      if (!bloodBankId || !mongoose.Types.ObjectId.isValid(bloodBankId)) {
        return res.status(400).send('Valid bloodBankId is required');
      }
      if (!donationDate) {
        return res.status(400).send('Donation date is required for scheduling');
      }
      donationData.bloodBankId = bloodBankId;
      donationData.donorId = req.user._id;
      donationData.donationDate = new Date(donationDate);
      donationData.status = 'scheduled';
      
    } else {
      return res.status(403).send('Only blood banks and donors can create donations');
    }

    // Create donation record
    const donation = await Donation.create(donationData);

    // Only increment inventory for completed donations by blood banks
    if (req.user.userType === 'bloodbank' && donationData.status === 'completed') {
      await BloodStock.findOneAndUpdate(
        { bloodBankId: req.user._id, bloodGroup },
        { $inc: { quantity: qty }, $setOnInsert: { unit } },
        { new: true, upsert: true }
      );
    }

    // Populate the response
    const populatedDonation = await Donation.findById(donation._id)
      .populate('bloodBankId', 'bloodBankName name address phone')
      .populate('donorId', 'name bloodGroup');

    res.status(201).json({
      message: donationData.status === 'scheduled' ? 'Donation scheduled successfully' : 'Donation recorded successfully',
      donation: populatedDonation,
    });
  } catch (err) {
    console.error('Record/schedule donation error:', err);
    res.status(500).send('Failed to record/schedule donation');
  }
});

// GET /api/donations/stats - get donation statistics for current donor
router.get('/stats', auth, checkUserType(['donor']), async (req, res) => {
  try {
    const donorId = req.user._id;
    
    // Get all donations for this donor
    const donations = await Donation.find({ donorId });
    
    // Calculate stats
    const totalDonations = donations.filter(d => d.status === 'completed').length;
    const scheduledCount = donations.filter(d => d.status === 'scheduled').length;
    
    // Find next scheduled donation
    const upcomingScheduled = donations
      .filter(d => d.status === 'scheduled' && new Date(d.donationDate) > new Date())
      .sort((a, b) => new Date(a.donationDate) - new Date(b.donationDate));
    
    const nextScheduled = upcomingScheduled.length > 0 ? upcomingScheduled[0].donationDate : null;
    
    // Calculate next eligible date (56 days after last completed donation)
    const completedDonations = donations
      .filter(d => d.status === 'completed')
      .sort((a, b) => new Date(b.donationDate) - new Date(a.donationDate));
    
    let nextEligibleDate = null;
    if (completedDonations.length > 0) {
      const lastDonation = new Date(completedDonations[0].donationDate);
      nextEligibleDate = new Date(lastDonation);
      nextEligibleDate.setDate(nextEligibleDate.getDate() + 56); // 56 days eligibility period
    }
    
    res.json({
      totalDonations,
      scheduledCount,
      nextScheduled,
      nextEligibleDate,
      livesImpacted: totalDonations * 3 // Estimate: 1 donation can save 3 lives
    });
  } catch (err) {
    console.error('Fetch donation stats error:', err);
    res.status(500).send('Failed to fetch donation statistics');
  }
});

// POST /api/donations/bulk - bulk create donations from CSV import
router.post('/bulk', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'bloodbank') {
      return res.status(403).send('Only blood banks can bulk import donations');
    }

    const { donations, bloodBankId } = req.body;
    
    if (!Array.isArray(donations) || donations.length === 0) {
      return res.status(400).send('Donations array is required');
    }

    if (donations.length > 1000) {
      return res.status(400).send('Maximum 1000 donations per import');
    }

    const bloodBankIdToUse = bloodBankId || req.user._id;
    const results = {
      successCount: 0,
      failedCount: 0,
      errors: []
    };

    // Get today's date range for duplicate checking
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Track duplicates within the CSV file itself
    const csvDonors = new Set();

    // Process each donation
    for (let i = 0; i < donations.length; i++) {
      try {
        const { donorName, age, mobileNumber, bloodGroup, quantity } = donations[i];
        
        // Validate
        if (!donorName || !bloodGroup || !quantity) {
          results.failedCount++;
          results.errors.push(`Row ${i + 1}: Missing required fields`);
          continue;
        }

        const validBloodGroups = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
        if (!validBloodGroups.includes(bloodGroup)) {
          results.failedCount++;
          results.errors.push(`Row ${i + 1}: Invalid blood group`);
          continue;
        }

        const qty = Number(quantity);
        if (!Number.isFinite(qty) || qty <= 0) {
          results.failedCount++;
          results.errors.push(`Row ${i + 1}: Invalid quantity`);
          continue;
        }

        if (age !== undefined && age !== null && age !== '') {
          const ageNum = Number(age);
          if (!Number.isFinite(ageNum) || ageNum < 16 || ageNum > 65) {
            results.failedCount++;
            results.errors.push(`Row ${i + 1}: Age must be between 16 and 65`);
            continue;
          }
        }

        if (mobileNumber && mobileNumber.trim() !== '') {
          if (!/^[6-9]\d{9}$/.test(mobileNumber.trim())) {
            results.failedCount++;
            results.errors.push(`Row ${i + 1}: Invalid mobile number`);
            continue;
          }
        }

        // Check for duplicates within CSV file
        if (mobileNumber) {
          const donorKey = `${donorName.trim().toLowerCase()}_${mobileNumber.trim()}`;
          if (csvDonors.has(donorKey)) {
            results.failedCount++;
            results.errors.push(`Row ${i + 1}: Duplicate in CSV - ${donorName} with mobile ${mobileNumber} appears multiple times`);
            continue;
          }
          csvDonors.add(donorKey);

          // Check for duplicate in database (same day)
          const existingDonation = await Donation.findOne({
            bloodBankId: bloodBankIdToUse,
            donorName: { $regex: new RegExp(`^${donorName.trim()}$`, 'i') },
            mobileNumber: mobileNumber.trim(),
            donationDate: { $gte: today, $lt: tomorrow }
          });

          if (existingDonation) {
            results.failedCount++;
            results.errors.push(`Row ${i + 1}: ${donorName} with mobile ${mobileNumber} has already donated today`);
            continue;
          }
        }

        // Create donation
        const donationData = {
          bloodBankId: bloodBankIdToUse,
          donorName: donorName.trim(),
          bloodGroup,
          quantity: qty,
          unit: 'packets',
          donationDate: new Date(),
          status: 'completed',
          notes: ''
        };

        if (age) donationData.age = Number(age);
        if (mobileNumber) donationData.mobileNumber = mobileNumber.trim();

        const donation = new Donation(donationData);
        await donation.save();

        // Update blood stock
        await BloodStock.findOneAndUpdate(
          { bloodBankId: bloodBankIdToUse, bloodGroup },
          { $inc: { quantity: qty }, $setOnInsert: { unit: 'packets' } },
          { new: true, upsert: true }
        );

        results.successCount++;
      } catch (error) {
        results.failedCount++;
        results.errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    res.status(201).json(results);
  } catch (err) {
    console.error('Bulk donation error:', err);
    res.status(500).send('Failed to process bulk donations');
  }
});

module.exports = router;
