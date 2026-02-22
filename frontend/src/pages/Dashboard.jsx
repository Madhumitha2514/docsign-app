import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import UploadModal from '../components/UploadModal'
import SignatureCreatorModal from '../components/SignatureCreatorModal'
import InviteSignersModal from '../components/InviteSignersModal'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [filter, setFilter] = useState('all')
  const [sidebarView, setSidebarView] = useState('recent')
  
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchDocs()
  }, [])

  const fetchDocs = async () => {
    try {
      const res = await api.get('/api/docs')
      setDocs(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file)
      setShowUploadModal(true)
    } else {
      alert('Please select a PDF file')
    }
  }

  const handleFlowSelection = (flow) => {
    setShowUploadModal(false)
    
    if (flow === 'only-me') {
      setShowSignatureModal(true)
    } else {
      setShowInviteModal(true)
    }
  }

  const handleSignatureSave = async (sigData) => {
    console.log('📝 Signature created in modal:', {
      type: sigData.type,
      hasActualSignature: !!sigData.actualSignature,
      signerName: sigData.signerName
    })
    
    setShowSignatureModal(false)
    setUploading(true)
    
    const formData = new FormData()
    formData.append('document', uploadedFile)
    
    try {
      const res = await api.post('/api/docs/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      setDocs([res.data.doc, ...docs])
      
      // 🔥 DOUBLE SAVE: localStorage + navigation state
      localStorage.setItem('pendingSignature', JSON.stringify(sigData))
      
      console.log('🚀 Navigating to editor with signature:', {
        type: sigData.type,
        hasImage: !!sigData.actualSignature
      })
      
      // Navigate with state
      navigate(`/editor/${res.data.doc._id}`, { 
        state: { signatureData: sigData },
        replace: false
      })
      
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleInviteSubmit = async (inviteData) => {
    console.log('📧 ===== INVITE SUBMIT START =====')
    console.log('Invite data received:', inviteData)
    console.log('Has signature:', !!inviteData.signatureData)
    console.log('Signers count:', inviteData.signers?.length)
    
    setShowInviteModal(false)
    setUploading(true)
    
    const formData = new FormData()
    formData.append('document', uploadedFile)
    
    try {
      // STEP 1: Upload document
      console.log('📤 Uploading document...')
      const res = await api.post('/api/docs/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      console.log('✅ Document uploaded:', res.data.doc._id)
      
      setDocs([res.data.doc, ...docs])
      const docId = res.data.doc._id
      
      // STEP 2: Pass signature to editor if created
      if (inviteData.signatureData) {
        localStorage.setItem('pendingSignature', JSON.stringify(inviteData.signatureData))
        console.log('💾 Signature saved to localStorage')
      }
      
      // STEP 3: Send emails (CRITICAL - Check if this runs)
      if (inviteData.signers && inviteData.signers.length > 0) {
        console.log('📧 ===== SENDING EMAIL REQUEST =====')
        console.log('Document ID:', docId)
        console.log('Signers:', inviteData.signers)
        
        try {
          const emailRes = await api.post('/api/signatures/send-for-signing', {
            documentId: docId,
            signers: inviteData.signers,
            expiryDays: inviteData.expiryDays || 15,
            signInOrder: inviteData.signInOrder || false
          })
          
          console.log('✅ EMAIL REQUEST SUCCESS:', emailRes.data)
        } catch (emailErr) {
          console.error('❌ EMAIL REQUEST FAILED:', emailErr)
          console.error('Error response:', emailErr.response?.data)
          console.error('Error status:', emailErr.response?.status)
        }
      } else {
        console.log('⚠️ No signers to send emails to')
      }
      
      // STEP 4: Navigate to editor
      console.log('🚀 Navigating to editor...')
      if (inviteData.signatureData) {
        navigate(`/editor/${docId}`, { 
          state: { signatureData: inviteData.signatureData }
        })
      } else {
        navigate(`/editor/${docId}`)
      }
      
      console.log('✅ ===== INVITE SUBMIT COMPLETE =====')
      
    } catch (err) {
      console.error('❌ Upload error:', err)
      alert(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  // 🔥 DELETE HANDLER
  const handleDelete = async (docId) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    
    try {
      await api.delete(`/api/docs/${docId}`)
      setDocs(docs.filter(d => d._id !== docId))
      alert('✅ Document deleted')
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.message || 'Unknown error'))
    }
  }

  const filtered = filter === 'all' ? docs : docs.filter(d => d.status === filter)
  const filteredRecent = filter === 'all' ? docs.slice(0, 5) : filtered.slice(0, 5) 

  const statusColor = (status) => {
    if (status === 'signed')   return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    if (status === 'rejected') return 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
    return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
  }

  return (
    <div className="min-h-screen bg-[#0F172A]">

      {/* HEADER WITH USER INFO */}
      <header className="bg-[#1E293B] border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                <span className="text-white font-bold">DS</span>
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">DocSign</h1>
                <p className="text-slate-500 text-xs">Digital Signatures</p>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{user?.name?.charAt(0)}</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-slate-300 text-sm font-medium">{user?.name}</p>
                  <p className="text-slate-500 text-xs">{user?.email}</p>
                </div>
              </div>
              <button 
                onClick={logout} 
                className="text-slate-400 hover:text-red-400 transition p-2 rounded-lg hover:bg-slate-800" 
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Header with Upload Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">
              My Documents
            </h2>
            <p className="text-slate-400 text-sm mt-1">{docs.length} total documents</p>
          </div>
          
          <label className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold px-6 py-3 rounded-xl cursor-pointer transition shadow-lg shadow-indigo-500/30 flex items-center gap-2">
            {uploading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Upload PDF</span>
              </>
            )}
            <input 
              ref={fileInputRef} 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              onChange={handleFileSelect} 
              disabled={uploading} 
            />
          </label>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'pending', 'signed', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition whitespace-nowrap ${
                filter === f 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Documents List */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            <p className="text-slate-400 mt-4">Loading...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-block p-6 bg-slate-800 rounded-full mb-4">
              <svg className="w-12 h-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-slate-300 text-lg font-medium">No documents yet</p>
            <p className="text-slate-500 text-sm mt-2">Upload a PDF to get started</p>
          </div>
        ) : (
          <div className="grid gap-4">
             {(sidebarView === 'recent' ? filteredRecent : filtered).map(doc => (
              <div 
                key={doc._id} 
                className="bg-[#1E293B] border border-slate-700/50 rounded-xl p-5 hover:border-indigo-500/30 transition group"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  
                  {/* Document Info */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 rounded-lg flex items-center justify-center border border-indigo-500/20">
                      <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-100 font-medium text-base truncate group-hover:text-indigo-400 transition">
                        {doc.originalName}
                      </p>
                      <p className="text-slate-500 text-xs mt-1 flex flex-wrap gap-2">
                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                        {doc.fileSize && (
                          <>
                            <span>·</span>
                            <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 justify-between sm:justify-end">
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize ${statusColor(doc.status)}`}>
                      {doc.status}
                    </span>
                    
                    {doc.status === 'signed' && (
                      <>
                        {/* Download Button */}
                        <a
                          href={`http://localhost:5000/uploads/${doc.signedFilePath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white text-sm px-4 py-2 rounded-lg font-medium transition shadow-lg shadow-blue-500/20 whitespace-nowrap flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download
                        </a>
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(doc._id)}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 p-2 rounded-lg transition border border-red-500/20"
                          title="Delete document"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* MODALS */}
      <UploadModal 
        isOpen={showUploadModal} 
        onClose={() => setShowUploadModal(false)} 
        onSelectFlow={handleFlowSelection} 
      />
      <SignatureCreatorModal 
        isOpen={showSignatureModal} 
        onClose={() => setShowSignatureModal(false)} 
        onSave={handleSignatureSave} 
        fullName={user?.name || ''} 
        initials={user?.name?.split(' ').map(n => n[0]).join('') || ''} 
      />
      <InviteSignersModal 
        isOpen={showInviteModal} 
        onClose={() => setShowInviteModal(false)} 
        onSubmit={handleInviteSubmit} 
      />

    </div>
  )
}