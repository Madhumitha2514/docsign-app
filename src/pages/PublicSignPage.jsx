import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Document, Page, pdfjs } from 'react-pdf'
import SignatureCreatorModal from '../components/SignatureCreatorModal'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export default function PublicSignPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [signer, setSigner] = useState(null)
  const [document, setDocument] = useState(null)
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [signatureData, setSignatureData] = useState(null)
  const [signing, setSigning] = useState(false)
  const [numPages, setNumPages] = useState(null)

  useEffect(() => {
    fetchDocument()
  }, [token])

  const fetchDocument = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/signatures/public/${token}`)
      const data = await res.json()

      if (res.ok) {
        setSigner(data.signer)
        setDocument(data.document)
      } else {
        alert(data.message)
      }
    } catch (err) {
      alert('Failed to load document')
    } finally {
      setLoading(false)
    }
  }

  const handleSignatureSave = (sigData) => {
    setSignatureData(sigData)
    setShowSignatureModal(false)
  }

  const handleSign = async () => {
    if (!signatureData) {
      alert('Please create your signature first')
      return
    }

    setSigning(true)
    try {
      const res = await fetch(`http://localhost:5000/api/signatures/public/sign/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureData })
      })

      const data = await res.json()

      if (res.ok) {
        alert('✅ Document signed successfully!')
        navigate('/sign-success')
      } else {
        alert(data.message)
      }
    } catch (err) {
      alert('Signing failed')
    } finally {
      setSigning(false)
    }
  }

  const handleReject = async () => {
    const reason = prompt('Reason for rejection (optional):')
    
    try {
      const res = await fetch(`http://localhost:5000/api/signatures/public/reject/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })

      if (res.ok) {
        alert('Document rejected')
        navigate('/sign-success')
      }
    } catch (err) {
      alert('Rejection failed')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-slate-400">Loading document...</p>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg">⚠️ Invalid or expired link</p>
        </div>
      </div>
    )
  }

  const pdfUrl = document.filePath?.startsWith('http')
  ? document.filePath
  : `http://localhost:5000/uploads/${document.filePath}`

console.log('📄 Public PDF URL:', pdfUrl)

  return (
    <div className="min-h-screen bg-[#0F172A]">
      
      {/* Header */}
      <div className="bg-[#1E293B] border-b border-slate-700 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-100">📝 Signature Request</h1>
          <p className="text-slate-400 text-sm mt-1">
            {signer.name}, you have been invited to {signer.role === 'Validator' ? 'validate' : 'sign'} this document
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        
        {/* Document Info */}
        <div className="bg-[#1E293B] border border-slate-700 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-100 mb-2">{document.originalName}</h2>
              <p className="text-slate-400 text-sm">
                Role: <span className="text-indigo-400 font-semibold">{signer.role}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full text-xs font-semibold border border-amber-500/20">
                Pending
              </span>
            </div>
          </div>
        </div>

        {/* Signature Status */}
        {!signatureData ? (
          <div className="bg-[#1E293B] border border-slate-700 rounded-xl p-6 mb-6">
            <p className="text-slate-400 mb-4">You need to create your signature before proceeding</p>
            <button
              onClick={() => setShowSignatureModal(true)}
              className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition shadow-lg shadow-indigo-500/30"
            >
              Create Signature
            </button>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 mb-6">
            <p className="text-emerald-400 font-semibold mb-2">✓ Signature ready</p>
            <div className="bg-white/5 rounded-lg p-4 inline-block">
              {signatureData.type === 'text' ? (
                <div className="text-2xl">{signatureData.text}</div>
              ) : (
                <img src={signatureData.actualSignature} alt="Signature" className="max-h-16" />
              )}
            </div>
          </div>
        )}

        {/* PDF Preview */}
        <div className="bg-white rounded-xl shadow-2xl mb-6">
          <Document file={pdfUrl} onLoadSuccess={(pdf) => setNumPages(pdf.numPages)}>
            <Page pageNumber={1} width={700} />
          </Document>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleReject}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium py-3 rounded-xl transition"
          >
            Reject
          </button>
          <button
            onClick={handleSign}
            disabled={!signatureData || signing}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-emerald-500/30 disabled:opacity-50"
          >
            {signing ? 'Signing...' : signer.role === 'Validator' ? 'Validate & Sign' : 'Sign Document'}
          </button>
        </div>
      </div>

      {/* Signature Modal */}
      <SignatureCreatorModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onSave={handleSignatureSave}
        fullName={signer.name}
        initials={signer.name.split(' ').map(n => n[0]).join('')}
      />
    </div>
  )
}