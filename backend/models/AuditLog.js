const mongoose = require('mongoose')

const auditLogSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'created',
      'uploaded',
      'signature_placed',
      'signed',
      'rejected',
      'sent_for_signing',
      'viewed',
      'downloaded'
    ]
  },
  performedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    email: String,
    name: String,
    role: String
  },
  ipAddress: String,
  userAgent: String,
  metadata: mongoose.Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true })

// Index for faster queries
auditLogSchema.index({ documentId: 1, timestamp: -1 })

module.exports = mongoose.model('AuditLog', auditLogSchema)