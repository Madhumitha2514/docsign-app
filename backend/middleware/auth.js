const jwt  = require('jsonwebtoken')
const User = require('../models/User')

const authMiddleware = async (req, res, next) => {
  console.log('🔐 Auth middleware hit')
  console.log('Headers:', req.headers.authorization)
  try {
    // Get token from header
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, access denied' })
    }

    // Extract token (remove "Bearer " prefix)
    const token = authHeader.split(' ')[1]

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Attach user to request
    req.user = await User.findById(decoded.userId).select('-password')

    next() // move to the actual route handler

  } catch (error) {
    res.status(401).json({ message: 'Token invalid or expired' })
  }
}

module.exports = authMiddleware