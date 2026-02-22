const mongoose = require('mongoose')

const signerSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Signer', 'Validator', 'Witness'],
    default: 'Signer'
  },
  status: {
    type: String,
    enum: ['pending', 'signed', 'rejected'],
    default: 'pending'
  },
  signingToken: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  signedAt: Date,
  rejectionReason: String,
  ipAddress: String,
  order: {
    type: Number,
    default: 0
  }
}, { timestamps: true })

module.exports = mongoose.model('Signer', signerSchema)