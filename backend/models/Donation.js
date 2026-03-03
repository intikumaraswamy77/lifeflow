const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema(
  {
    bloodBankId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // For registered donors
    donorExternalId: { type: String, default: '' }, // For walk-in donors
    donorName: { type: String, default: '' },
    age: { type: Number, min: 16, max: 65 }, // Donor age entered by blood bank (eligible donation age)
    mobileNumber: { type: String, default: '', match: /^[6-9]\d{9}$|^$/ }, // Donor mobile (10 digits starting with 6-9 or empty)
    bloodGroup: { type: String, required: true, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'] },
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, default: 'packets' },
    donationDate: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: ['scheduled', 'completed', 'cancelled'], 
      default: 'completed' 
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Donation', DonationSchema);
