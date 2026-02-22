const express = require('express')
const AuditLog = require('../models/AuditLog')
const Document = require('../models/Document')
const authMiddleware = require('../middleware/auth')
const router = express.Router()

// ── GET AUDIT LOGS FOR A DOCUMENT ─────────
// GET /api/audit/:documentId
router.get('/:documentId', authMiddleware, async (req, res) => {
  try {
    console.log('📋 Fetching audit logs for document:', req.params.documentId)

    // Verify document ownership
    const doc = await Document.findOne({
      _id: req.params.documentId,
      uploadedBy: req.user._id
    })

    if (!doc) {
      return res.status(404).json({ message: 'Document not found or unauthorized' })
    }

    // Get all audit logs for this document
    const logs = await AuditLog.find({ documentId: req.params.documentId })
      .sort({ timestamp: -1 }) // Newest first
      .limit(100)

    console.log(`✅ Found ${logs.length} audit logs`)

    res.json({
      success: true,
      document: {
        id: doc._id,
        name: doc.originalName,
        status: doc.status
      },
      logs: logs,
      count: logs.length
    })

  } catch (error) {
    console.error('❌ Audit fetch error:', error)
    res.status(500).json({ message: error.message })
  }
})

// ── GET ALL AUDIT LOGS (Admin) ────────────
// GET /api/audit
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Get all documents by this user
    const docs = await Document.find({ uploadedBy: req.user._id }).select('_id')
    const docIds = docs.map(d => d._id)

    // Get audit logs for all user's documents
    const logs = await AuditLog.find({ documentId: { $in: docIds } })
      .sort({ timestamp: -1 })
      .limit(100)

    res.json({
      success: true,
      logs: logs,
      count: logs.length
    })

  } catch (error) {
    console.error('❌ Audit fetch error:', error)
    res.status(500).json({ message: error.message })
  }
})

module.exports = router