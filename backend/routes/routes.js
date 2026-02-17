const express = require('express')
const router  = express.Router()

// Placeholder — will be built on Day 5
router.get('/', (req, res) => {
  res.json({ message: 'Signatures route working' })
})

module.exports = router