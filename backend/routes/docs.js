const express  = require('express')
const multer   = require('multer')
const path     = require('path')
const fs       = require('fs')
const Document = require('../models/Document')
const authMiddleware = require('../middleware/auth')
const router   = express.Router()

// ── Multer Storage Config ──────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')  // save to uploads folder
  },
  filename: (req, file, cb) => {
    // unique filename: timestamp + random number + original extension
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, unique + path.extname(file.originalname))
  }
})

// Only allow PDF files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true)
  } else {
    cb(new Error('Only PDF files allowed!'), false)
  }
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } })
// 10MB max file size

// ── UPLOAD PDF ─────────────────────────────
// POST /api/docs/upload
router.post('/upload', authMiddleware, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const doc = await Document.create({
      originalName: req.file.originalname,
      filePath:     req.file.filename,
      fileSize:     req.file.size,
      uploadedBy:   req.user._id
    })

    res.status(201).json({ message: 'Document uploaded successfully', doc })

  } catch (error) {
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

    // Delete files from disk
    try {
      if (doc.filePath && fs.existsSync(`uploads/${doc.filePath}`)) {
        fs.unlinkSync(`uploads/${doc.filePath}`)
        console.log('🗑️ Deleted original:', doc.filePath)
      }
      if (doc.signedFilePath && fs.existsSync(`uploads/${doc.signedFilePath}`)) {
        fs.unlinkSync(`uploads/${doc.signedFilePath}`)
        console.log('🗑️ Deleted signed:', doc.signedFilePath)
      }
    } catch (fileErr) {
      console.error('⚠️ File delete warning:', fileErr.message)
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