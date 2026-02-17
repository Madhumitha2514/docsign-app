const express = require('express')
const router  = express.Router()

router.get('/', (req, res) => {
  res.json({ message: 'Signatures route working' })
})

module.exports = router