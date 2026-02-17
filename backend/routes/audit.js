const express = require('express')
const router  = express.Router()

// Placeholder — will be built on Day 10
router.get('/', (req, res) => {
  res.json({ message: 'Audit route working' })
})

module.exports = router;