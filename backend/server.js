const express   = require('express')
const cors      = require('cors')
const dotenv    = require('dotenv')
const connectDB = require('./config/db')

// Load .env file first — before anything else
dotenv.config()

// Connect to MongoDB
connectDB()

const app = express()

// Middlewares — runs on every request
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use('/uploads', express.static('uploads'))

// Test route — just to confirm server works
app.get('/', (req, res) => {
  res.json({ message: '✅ DocSign API is running!' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
})