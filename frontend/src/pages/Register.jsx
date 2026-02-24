import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [form, setForm]   = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login }    = useAuth()
  const navigate     = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    // ✅ DEBUG LOGS
    console.log('📝 Attempting registration...')
    console.log('API Base URL:', api.defaults.baseURL)
    console.log('Form data:', form)
    
    try {
      const res = await api.post('/api/auth/register', form)
      console.log('✅ Registration successful:', res.data)
      
      login(res.data.user, res.data.token)
      console.log('✅ Logged in, navigating to dashboard...')
      
      navigate('/dashboard')
    } catch (err) {
      console.error('❌ Registration error:', err)
      console.error('Error response:', err.response?.data)
      
      const errorMsg = err.response?.data?.message || 'Something went wrong'
      setError(errorMsg)
      alert('❌ ' + errorMsg)  // ✅ Show alert too
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-gray-800 p-8 rounded-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-gray-400 mb-6">Start signing documents today</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Full Name</label>
            <input
              type="text" name="name"
              value={form.name} onChange={handleChange}
              placeholder="Your name"
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Email</label>
            <input
              type="email" name="email"
              value={form.email} onChange={handleChange}
              placeholder="you@email.com"
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Password</label>
            <input
              type="password" name="password"
              value={form.password} onChange={handleChange}
              placeholder="Min 6 characters"
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-gray-400 text-sm text-center mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  )
}