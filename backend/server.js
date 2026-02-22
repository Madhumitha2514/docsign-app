const express   = require('express')
const cors      = require('cors')
const dotenv    = require('dotenv')
const connectDB = require('./config/db')

dotenv.config()
connectDB()

const app = express()

// Middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5175', 'http://localhost:3000'],  'https://docsign-app-mu.vercel.app', // ✅ Allow all
  credentials: true
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

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
})