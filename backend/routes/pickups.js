const express = require('express');
const { auth, checkUserType } = require('../middleware/auth');
const Pickup = require('../models/Pickup');

const router = express.Router();

// GET /api/pickups - list pickups for the current blood bank
router.get('/', auth, checkUserType(['bloodbank']), async (req, res) => {
  try {
    const list = await Pickup.find({ bloodBankId: req.user._id })
      .sort({ pickupTime: 1, createdAt: -1 })
      .lean();
    res.json(list);
  } catch (err) {
    console.error('Fetch pickups error:', err);
    res.status(500).send('Failed to fetch pickups');
  }
});

// POST /api/pickups - create a new pickup
router.post('/', auth, checkUserType(['bloodbank']), async (req, res) => {
  try {
    const { address, pickupTime, contactName, contactPhone, notes } = req.body || {};

    if (!address || !pickupTime || !contactName || !contactPhone) {
      return res.status(400).send('Missing required fields');
    }

    const when = new Date(pickupTime);
    if (Number.isNaN(when.getTime())) {
      return res.status(400).send('Invalid pickup time');
    }
    const now = new Date();
    if (when.getTime() < now.getTime() - 60_000) {
      return res.status(400).send('Pickup time must be in the future');
    }

    const created = await Pickup.create({
      bloodBankId: req.user._id,
      address,
      pickupTime: when,
      contactName,
      contactPhone,
      notes: notes || '',
      status: 'scheduled',
    });

    res.status(201).json(created);
  } catch (err) {
    console.error('Create pickup error:', err);
    res.status(500).send('Failed to create pickup');
  }
});

// PUT /api/pickups/:id/status - update pickup status
router.put('/:id/status', auth, checkUserType(['bloodbank']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body || {};
    const allowed = ['scheduled', 'in_transit', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).send('Invalid status');
    }

    const update = { status };
    if (typeof reason === 'string') update.statusReason = reason;

    const updated = await Pickup.findOneAndUpdate(
      { _id: id, bloodBankId: req.user._id },
      update,
      { new: true }
    );

    if (!updated) return res.status(404).send('Pickup not found');
    res.json(updated);
  } catch (err) {
    console.error('Update pickup status error:', err);
    res.status(500).send('Failed to update pickup status');
  }
});

module.exports = router;
