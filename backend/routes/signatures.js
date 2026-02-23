const express = require('express')
const crypto = require('crypto')
const Signature = require('../models/Signature')
const Signer = require('../models/Signer')
const AuditLog = require('../models/AuditLog')
const Document = require('../models/Document')
const authMiddleware = require('../middleware/auth')
const { sendSigningInvitation, sendCompletionNotification } = require('../utils/emailService')
const router = express.Router()

// Helper: Create audit log
async function logAction(documentId, action, user, req, metadata = {}) {
  try {
    await AuditLog.create({
      documentId,
      action,
      performedBy: {
        userId: user?._id,
        email: user?.email,
        name: user?.name,
        role: metadata.role
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      metadata,
      timestamp: new Date()
    })
  } catch (err) {
    console.error('Audit log failed:', err.message)
  }
}

// ── SAVE SIGNATURE POSITION ────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      documentId,
      xPercent,
      yPercent,
      page,
      signatureType,
      signatureImage,
      signatureText,
      signerName
    } = req.body

    if (!documentId) {
      return res.status(400).json({ message: 'Document ID required' })
    }

    if (!signatureImage) {
      return res.status(400).json({ message: 'Signature image required' })
    }

    // Delete old signature
    await Signature.deleteMany({ documentId })

    const signature = await Signature.create({
      documentId,
      placedBy: req.user._id,
      xPercent,
      yPercent,
      page: page || 1,
      signatureType,
      signatureImage,
      signatureText,
      signerName
    })

    // Audit log
    await logAction(documentId, 'signature_placed', req.user, req)

    res.status(201).json({
      message: 'Signature saved successfully',
      signature
    })

  } catch (error) {
    console.error("Signature Save Error:", error)
    res.status(500).json({ message: error.message })
  }
})

// ── GET SIGNATURE FOR A DOCUMENT ───────────
router.get('/:docId', authMiddleware, async (req, res) => {
  try {
    const signature = await Signature.findOne({ documentId: req.params.docId })
    res.json(signature)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// ── SEND DOCUMENT FOR SIGNING (Day 9) ──────
router.post('/send-for-signing', authMiddleware, async (req, res) => {
  try {
    const { documentId, signers, expiryDays, signInOrder } = req.body

    const doc = await Document.findOne({ _id: documentId, uploadedBy: req.user._id })
    if (!doc) return res.status(404).json({ message: 'Document not found' })

    console.log('📧 Sending document for signing...')
    console.log('  Signers:', signers.length)

    const createdSigners = []
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + (expiryDays || 15))

    for (let i = 0; i < signers.length; i++) {
      const signer = signers[i]
      const token = crypto.randomBytes(32).toString('hex')

      const createdSigner = await Signer.create({
        documentId,
        name: signer.name,
        email: signer.email,
        role: signer.role,
        signingToken: token,
        expiresAt: expiryDate,
        order: signInOrder ? i : 0
      })

      createdSigners.push(createdSigner)

      // Generate signing link
      const signingLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/sign-public/${token}`

      // Send email
      await sendSigningInvitation(
        signer.email,
        signer.name,
        signingLink,
        req.user.name,
        doc.originalName
      )

      console.log(`  ✅ Sent to: ${signer.name} (${signer.email})`)
    }

    // Audit log
    await logAction(documentId, 'sent_for_signing', req.user, req, { 
      signersCount: signers.length 
    })

    res.json({
      message: `Sent to ${signers.length} signer(s)`,
      signers: createdSigners
    })

  } catch (error) {
    console.error('Send for signing error:', error)
    res.status(500).json({ message: error.message })
  }
})

// ── PUBLIC: GET DOCUMENT BY TOKEN (Day 9) ──
router.get('/public/:token', async (req, res) => {
  try {
    const signer = await Signer.findOne({ signingToken: req.params.token })
      .populate('documentId')

    if (!signer) {
      return res.status(404).json({ message: 'Invalid or expired signing link' })
    }

    if (signer.expiresAt < new Date()) {
      return res.status(410).json({ message: 'Signing link has expired' })
    }

    if (signer.status !== 'pending') {
      return res.status(400).json({ message: `Document already ${signer.status}` })
    }

    // Audit log
    await logAction(signer.documentId._id, 'viewed', null, req, {
      role: signer.role,
      signerEmail: signer.email
    })

    res.json({
      signer: {
        name: signer.name,
        email: signer.email,
        role: signer.role
      },
      document: {
        _id: signer.documentId._id,
        originalName: signer.documentId.originalName,
        filePath: signer.documentId.filePath
      }
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// ── PUBLIC: SIGN DOCUMENT (Day 9) ──────────
// ── PUBLIC: SIGN DOCUMENT (Day 9) ──────────
router.post('/public/sign/:token', async (req, res) => {
  try {
    const { signatureData } = req.body
    const token = req.params.token

    console.log('🔥 PUBLIC SIGN REQUEST')
    console.log('Signature data:', signatureData ? 'Received' : 'Missing')

    const signer = await Signer.findOne({ signingToken: token })
      .populate('documentId')

    if (!signer) {
      return res.status(404).json({ message: 'Invalid signing link' })
    }

    if (signer.status !== 'pending') {
      return res.status(400).json({ message: 'Document already signed' })
    }

    // ✅ SAVE SIGNER'S SIGNATURE TO DATABASE
    const signature = await Signature.findOne({ documentId: signer.documentId._id })
    if (signature && signatureData) {
      // Update signature with signer's signature image
      signature.signatureImage = signatureData.actualSignature || signature.signatureImage
      signature.signatureText = signatureData.text || signature.signatureText
      signature.signerName = signer.name
      await signature.save()
      console.log('✅ Signature updated with signer data')
    }

    // Update signer status
    signer.status = 'signed'
    signer.signedAt = new Date()
    signer.ipAddress = req.ip || req.connection.remoteAddress
    await signer.save()

    // Check if all signers are done
    const allSigners = await Signer.find({ documentId: signer.documentId._id })
    const allSigned = allSigners.every(s => s.status === 'signed')
    console.log('📊 Signer status:')
    console.log('  Total signers:', allSigners.length)
    console.log('  Signed:', allSigners.filter(s => s.status === 'signed').length)
    console.log('  All signed?', allSigned)
    if (allSigned) {
      console.log('✅ All signers completed! Generating final PDF...')
      
      // ✅ REGENERATE PDF WITH ALL SIGNATURES
      const doc = signer.documentId
      const { embedSignature } = require('../utils/pdfSigner')
      
      try {
        const signedFileUrl = await embedSignature(
          doc.filePath,
          {
            xPercent: signature.xPercent,
            yPercent: signature.yPercent,
            page: signature.page,
            signerName: signer.name,
            signatureImage: signature.signatureImage,
            signatureText: signature.signatureText
          },
          [] // No optional fields for now
        )

       // ✅ CHECK: Are there external signers waiting?
const externalSigners = await Signer.find({ documentId: doc._id })
const hasPendingSigners = externalSigners.some(s => s.status === 'pending')

if (hasPendingSigners) {
  console.log('⏳ Owner signed, but waiting for external signers')
  doc.status = 'pending'  // ✅ Keep as pending
  doc.signedFilePath = signedFileUrl
} else {
  console.log('✅ Owner signed, no external signers - marking as complete')
  doc.status = 'signed'  // ✅ Mark as signed only if no external signers
  doc.signedFilePath = signedFileUrl
}
await doc.save()

        console.log('✅ Final PDF generated:', signedFileUrl)
      } catch (pdfError) {
        console.error('❌ PDF generation error:', pdfError)
      }
    }

    // Audit log
    await logAction(signer.documentId._id, 'signed', null, req, {
      role: signer.role,
      signerEmail: signer.email,
      signerName: signer.name
    })

    res.json({ message: 'Document signed successfully!' })

  } catch (error) {
    console.error('Public sign error:', error)
    res.status(500).json({ message: error.message })
  }
})
// ── PUBLIC: REJECT DOCUMENT (Day 11) ───────
router.post('/public/reject/:token', async (req, res) => {
  try {
    const { reason } = req.body
    const signer = await Signer.findOne({ signingToken: req.params.token })

    if (!signer) {
      return res.status(404).json({ message: 'Invalid link' })
    }

    signer.status = 'rejected'
    signer.rejectionReason = reason
    await signer.save()

    // Audit log
    await logAction(signer.documentId, 'rejected', null, req, {
      role: signer.role,
      signerEmail: signer.email,
      reason
    })

    res.json({ message: 'Document rejected' })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.post('/finalize', authMiddleware, async (req, res) => {
  console.log('🔥 FINALIZE ROUTE HIT!')
  console.log('Body:', req.body)
  
  try {
    const { documentId, signerName, placedFields, signatureImage, signatureText } = req.body

    const doc = await Document.findOne({ _id: documentId, uploadedBy: req.user._id })
    if (!doc) return res.status(404).json({ message: 'Document not found' })

    if (doc.status === 'signed') {
      return res.status(400).json({ message: 'Document already signed' })
    }

    const signature = await Signature.findOne({ documentId })
    if (!signature) {
      return res.status(400).json({ message: 'No signature position found' })
    }

    // Prepare optional fields
    const optionalFields = (placedFields || [])
      .filter(f => f.id !== 'signature' && f.value && f.value.trim())
      .map(f => ({
        label: f.label,
        value: f.value,
        x: f.x,
        y: f.y,
        page: f.page
      }))

    console.log('📋 Optional fields:', optionalFields.length)

    // ✅ FIXED: Pass Cloudinary URL directly (pdfSigner will download it)
    const { embedSignature } = require('../utils/pdfSigner')
    const signedFileUrl = await embedSignature(
      doc.filePath,  // ✅ This is now the full Cloudinary URL
      {
        xPercent: signature.xPercent,
        yPercent: signature.yPercent,
        page: signature.page,
        signerName: signerName,
        signatureImage: signatureImage || signature.signatureImage,  // ✅ Use from request or DB
        signatureText: signatureText || signature.signatureText
      },
      optionalFields
    )

    doc.status = 'signed'
    doc.signedFilePath = signedFileUrl  // ✅ This is now a Cloudinary URL
    await doc.save()

    signature.status = 'signed'
    signature.signerName = signerName
    await signature.save()

    // Audit log
    await logAction(documentId, 'signed', req.user, req, {
      role: 'Owner',
      fieldsCount: optionalFields.length
    })

    res.json({
      message: 'Document signed successfully!',
      signedUrl: signedFileUrl  // ✅ Return Cloudinary URL
    })

  } catch (error) {
    console.error('Finalize error:', error)
    res.status(500).json({ message: error.message })
  }
})

// ── GET AUDIT TRAIL (Day 10) ───────────────
router.get('/audit/:documentId', authMiddleware, async (req, res) => {
  try {
    const doc = await Document.findOne({
      _id: req.params.documentId,
      uploadedBy: req.user._id
    })

    if (!doc) {
      return res.status(404).json({ message: 'Document not found' })
    }

    const logs = await AuditLog.find({ documentId: req.params.documentId })
      .sort({ timestamp: -1 })
      .limit(100)

    res.json({ logs, count: logs.length })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})
// TEST: Check if signature exists
router.get('/check/:docId', authMiddleware, async (req, res) => {
  try {
    const signature = await Signature.findOne({ documentId: req.params.docId })
    const doc = await Document.findOne({ _id: req.params.docId, uploadedBy: req.user._id })
    
    res.json({
      hasSignature: !!signature,
      hasDocument: !!doc,
      signature: signature,
      document: doc
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router