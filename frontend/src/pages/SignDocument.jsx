import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function SignDocument() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [doc, setDoc] = useState(null)
  const [name, setName] = useState('')
  const [signing, setSigning] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDocument()
  }, [id])

  const fetchDocument = async () => {
    try {
      const res = await api.get(`/api/docs/${id}`)
      setDoc(res.data)
    } catch (err) {
      alert('Document not found')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleSign = async (e) => {
    e.preventDefault()
    if (!name.trim()) return alert('Please enter your name')

    setSigning(true)
    try {
      const res = await api.post('/api/signatures/finalize', {
        documentId: id,
        signerName: name
      })
      alert('✅ Document signed successfully!')
      navigate('/dashboard')
    } catch (err) {
      alert(err.response?.data?.message || 'Signing failed')
    } finally {
      setSigning(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-white">Loading...</div>

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4">
      <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl p-8 w-full max-w-md">
        
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Sign Document</h1>
          <p className="text-slate-400 text-sm">{doc?.originalName}</p>
        </div>

        <form onSubmit={handleSign} className="space-y-4">
          <div>
            <label className="text-slate-300 text-sm mb-2 block">Your Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full bg-slate-800 text-slate-100 px-4 py-3 rounded-xl border border-slate-700 focus:border-indigo-500 focus:outline-none transition"
              required
            />
            <p className="text-slate-500 text-xs mt-2">This will appear as your signature on the document</p>
          </div>

          <button
            type="submit"
            disabled={signing || !name.trim()}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {signing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing...
              </span>
            ) : (
              '✍️ Sign Document'
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 rounded-xl transition border border-slate-700"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  )
}