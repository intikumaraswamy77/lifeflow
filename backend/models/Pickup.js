const mongoose = require('mongoose');

const PickupSchema = new mongoose.Schema(
  {
    bloodBankId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    address: { type: String, required: true, trim: true },
    pickupTime: { type: Date, required: true },
    contactName: { type: String, required: true, trim: true },
    contactPhone: { type: String, required: true, trim: true },
    notes: { type: String, default: '' },
    status: { type: String, enum: ['scheduled', 'in_transit', 'completed', 'cancelled'], default: 'scheduled', index: true },
    statusReason: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Pickup', PickupSchema);
