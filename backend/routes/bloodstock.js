const express = require('express');
const BloodStock = require('../models/BloodStock');
const { auth, checkUserType } = require('../middleware/auth');

const router = express.Router();

// Get blood stock for current blood bank
router.get('/', auth, checkUserType(['bloodbank']), async (req, res) => {
  try {
    const bloodStock = await BloodStock.find({ bloodBankId: req.user._id });
    
    // Convert to object with blood group as key
    const stockByGroup = {};
    bloodStock.forEach(stock => {
      stockByGroup[stock.bloodGroup] = {
        quantity: stock.quantity,
        unit: stock.unit,
        lastUpdated: stock.lastUpdated
      };
    });

    res.json(stockByGroup);
  } catch (error) {
    console.error('Blood stock fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update blood stock
router.put('/:bloodGroup', auth, checkUserType(['bloodbank']), async (req, res) => {
  try {
    const { bloodGroup } = req.params;
    const { quantity, unit = 'packets' } = req.body;

    if (quantity < 0) {
      return res.status(400).json({ message: 'Quantity cannot be negative' });
    }

    const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validBloodGroups.includes(bloodGroup)) {
      return res.status(400).json({ message: 'Invalid blood group' });
    }

    const stock = await BloodStock.findOneAndUpdate(
      { bloodBankId: req.user._id, bloodGroup },
      { quantity, unit },
      { new: true, upsert: true }
    );

    res.json({
      message: 'Blood stock updated successfully',
      stock
    });
  } catch (error) {
    console.error('Blood stock update error:', error);
    res.status(500).json({ message: 'Server error during stock update' });
  }
});

// Bulk update blood stock
router.put('/', auth, checkUserType(['bloodbank']), async (req, res) => {
  try {
    const updates = req.body; // Expected format: { "A+": { quantity: 10, unit: "packets" }, ... }
    
    const updatePromises = Object.entries(updates).map(([bloodGroup, data]) => {
      return BloodStock.findOneAndUpdate(
        { bloodBankId: req.user._id, bloodGroup },
        { quantity: data.quantity, unit: data.unit || 'packets' },
        { new: true, upsert: true }
      );
    });

    await Promise.all(updatePromises);
    
    // Fetch updated stock
    const bloodStock = await BloodStock.find({ bloodBankId: req.user._id });
    const stockByGroup = {};
    bloodStock.forEach(stock => {
      stockByGroup[stock.bloodGroup] = {
        quantity: stock.quantity,
        unit: stock.unit,
        lastUpdated: stock.lastUpdated
      };
    });

    res.json({
      message: 'Blood stock updated successfully',
      stock: stockByGroup
    });
  } catch (error) {
    console.error('Bulk blood stock update error:', error);
    res.status(500).json({ message: 'Server error during bulk stock update' });
  }
});

module.exports = router;

