const mongoose = require('mongoose')

const signatureSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },

  placedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Position (Drag & Drop)
  xPercent: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },

  yPercent: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },

  page: {
    type: Number,
    default: 1
  },

  // 🔥 NEW FIELDS (IMPORTANT)
  signatureType: {
    type: String,
    enum: ['text', 'draw', 'upload'],
    required: true
  },

  signatureImage: {
    type: String,   // base64 image string
    required: true
  },
  signatureText: {
    type: String,
    default: null
  },

  signerName: {
    type: String,
    default: null
  },

  status: {
    type: String,
    enum: ['placed', 'signed'],
    default: 'placed'
  }

}, { timestamps: true })

module.exports = mongoose.model('Signature', signatureSchema)