const express = require('express')
const { upload } = require('../config/cloudinary')  // ✅ Import from cloudinary
const Document = require('../models/Document')
const authMiddleware = require('../middleware/auth')
const router = express.Router()

// NO multer setup here - it's in cloudinary.js now!

// ── UPLOAD PDF ─────────────────────────────
// POST /api/docs/upload
router.post('/upload', authMiddleware, upload.single('document'), async (req, res) => {
  console.log('🔥 UPLOAD ROUTE HIT!')
  console.log('File received:', req.file)
  
  try {
    if (!req.file) {
      console.log('❌ No file in request')
      return res.status(400).json({ message: 'No file uploaded' })
    }

    // Cloudinary URL is in req.file.path
    const cloudinaryUrl = req.file.path
    console.log('📤 File uploaded to Cloudinary:', cloudinaryUrl)

    const doc = await Document.create({
      originalName: req.file.originalname,
      filePath: cloudinaryUrl,  // ✅ Save Cloudinary URL
      fileSize: req.file.size,
      uploadedBy: req.user._id,
      status: 'pending'
    })

    console.log('✅ Document saved:', doc)

    res.status(201).json({ message: 'Document uploaded successfully', doc })

  } catch (error) {
    console.error('❌ Upload error:', error)
    res.status(500).json({ message: error.message })
  }
})

// ── LIST MY DOCUMENTS ──────────────────────
// GET /api/docs
router.get('/', authMiddleware, async (req, res) => {
  try {
    const docs = await Document.find({ uploadedBy: req.user._id })
      .sort({ createdAt: -1 })  // newest first

    res.json(docs)

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// ── GET ONE DOCUMENT ───────────────────────
// GET /api/docs/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const doc = await Document.findOne({
      _id:        req.params.id,
      uploadedBy: req.user._id   // must be owner
    })

    if (!doc) return res.status(404).json({ message: 'Document not found' })

    res.json(doc)

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// ── DELETE DOCUMENT ────────────────────────
// DELETE /api/docs/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      uploadedBy: req.user._id
    })
    
    if (!doc) return res.status(404).json({ message: 'Document not found' })

    // Delete from Cloudinary
    const { cloudinary } = require('../config/cloudinary')
    
    try {
      // Extract public_id from Cloudinary URL
      if (doc.filePath && doc.filePath.includes('cloudinary')) {
        const publicId = doc.filePath.split('/').slice(-2).join('/').split('.')[0]
        await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' })
        console.log('🗑️ Deleted from Cloudinary:', publicId)
      }
      
      if (doc.signedFilePath && doc.signedFilePath.includes('cloudinary')) {
        const signedPublicId = doc.signedFilePath.split('/').slice(-2).join('/').split('.')[0]
        await cloudinary.uploader.destroy(signedPublicId, { resource_type: 'raw' })
        console.log('🗑️ Deleted signed from Cloudinary:', signedPublicId)
      }
    } catch (cloudErr) {
      console.error('⚠️ Cloudinary delete warning:', cloudErr.message)
    }

    // Delete from database
    await Document.findByIdAndDelete(req.params.id)

    // Clean up related signatures and signers
    const Signature = require('../models/Signature')
    const Signer = require('../models/Signer')
    await Signature.deleteMany({ documentId: req.params.id })
    await Signer.deleteMany({ documentId: req.params.id })

    console.log('✅ Document deleted:', doc.originalName)

    res.json({ message: 'Document deleted successfully' })
  } catch (error) {
    console.error('Delete error:', error)
    res.status(500).json({ message: error.message })
  }
})

module.exports = router