const mongoose = require('mongoose')

const documentSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'signed', 'rejected'],
    default: 'pending'
  },
  signingToken: {
    type: String,
    default: null
  },
  signerEmail: {
    type: String,
    default: null
  },
  signedFilePath: {
    type: String,
    default: null
  }
}, { timestamps: true })

module.exports = mongoose.model('Document', documentSchema)