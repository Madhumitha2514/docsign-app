const express = require('express')
const router  = express.Router()

// Placeholder — will be built on Day 3
router.get('/', (req, res) => {
  res.json({ message: 'Docs route working' })
})

module.exports = router