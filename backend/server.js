const dotenv = require('dotenv')
dotenv.config()

const express   = require('express')
const cors      = require('cors')
const connectDB = require('./config/db')
connectDB()

const app = express()

// Middlewares
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5175',
    'http://localhost:3000',
    'https://docsign-app-mu.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())
app.use('/uploads', express.static('uploads'))

// ─── Routes ───────────────────────────────
app.use('/api/auth',       require('./routes/auth'))
app.use('/api/docs',       require('./routes/docs'))
app.use('/api/signatures', require('./routes/signatures'))
app.use('/api/audit',      require('./routes/audit'))

// Test route
app.get('/', (req, res) => {
  res.json({ message: '✅ DocSign API is running!' })
})
// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ ERROR:', err.message)
  console.error('Stack:', err.stack)
  res.status(500).json({ message: err.message })
})
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
})