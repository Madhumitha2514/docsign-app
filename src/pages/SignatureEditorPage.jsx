import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Document, Page, pdfjs } from 'react-pdf'
import api from '../api/axios'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// ✅ FIXED: Correct worker for Cloudinary PDFs
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export default function SignatureEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [signatureData, setSignatureData] = useState(null)
  const [doc, setDoc] = useState(null)
  const [numPages, setNumPages] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [placedFields, setPlacedFields] = useState([])
  const [draggingField, setDraggingField] = useState(null)
  const [draggingPlacedField, setDraggingPlacedField] = useState(null)
  const [saving, setSaving] = useState(false)
  const [pdfError, setPdfError] = useState(false)
  
  const BASE_URL = import.meta.env.VITE_API_URL;

  // ✅ FIXED: Safe signature loading
  useEffect(() => {
    let sigData = location.state?.signatureData
    
    if (!sigData) {
      const stored = localStorage.getItem('pendingSignature')
      if (stored) {
        try {
          sigData = JSON.parse(stored)
          localStorage.removeItem('pendingSignature')
        } catch (e) {
          console.error('Failed to parse signature data:', e)
        }
      }
    }
    
    console.log('✅ Signature data loaded:', sigData)
    setSignatureData(sigData)
    fetchDocument()
  }, [id])

  const fetchDocument = async () => {
    try {
      const res = await api.get(`/api/docs/${id}`)
      console.log('📄 Document loaded:', res.data)
      setDoc(res.data)
      setPdfError(false)
    } catch (err) {
      console.error('❌ Document fetch error:', err)
      alert('Document not found')
      navigate('/dashboard')
    }
  }
  
  // ✅ FIXED: Safe PDF URL - Define AFTER doc is loaded
  const getPdfUrl = () => {
    if (!doc?.filePath) {
      console.log('⚠️ No filePath yet')
      return null
    }
    
    const url = doc.filePath.startsWith('http') 
      ? doc.filePath 
      : `http://localhost:5000/uploads/${doc.filePath}`
    
    console.log('📄 Using PDF URL:', url)
    return url
  }
  
  const pdfUrl = getPdfUrl()
  
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages)
    setPdfError(false)
    console.log('✅ PDF loaded successfully:', numPages, 'pages') 
  }
  
  const onDocumentLoadError = (error) => {
    console.error('❌ PDF load error:', error)
    setPdfError(true)
  }
  
  const renderSignaturePreview = () => {
    if (!signatureData) {
      return <span className="text-slate-400 text-xs">⚠️ No signature</span>
    }
  
    if (signatureData.type === 'text') {
      return (
        <div className={`text-xl ${signatureData.font}`} style={getFontStyle(signatureData.font)}>
          {signatureData.text}
        </div>
      )
    } else if (signatureData.type === 'draw' || signatureData.type === 'upload') {
      return (
        <img 
          src={signatureData.actualSignature} 
          alt="Signature" 
          className="max-h-14 max-w-full object-contain"
          onError={(e) => console.error('Signature image failed to load')}
        />
      )
    }
    
    return <span className="text-slate-400 text-xs">Signature</span>
  }

  const allFields = [
    { id: 'signature', label: 'Signature', icon: '✍️', color: 'indigo', required: true },
    { id: 'initials', label: 'Initials', icon: 'MG', color: 'purple', required: false, editable: true },
    { id: 'name', label: 'Name', icon: '👤', color: 'blue', required: false, editable: true },
    { id: 'date', label: 'Date', icon: '📅', color: 'green', required: false, editable: true },
    { id: 'text', label: 'Text', icon: 'T', color: 'yellow', required: false, editable: true },
    { id: 'company', label: 'Company Stamp', icon: '🏢', color: 'cyan', required: false, editable: true }
  ]

  // Drag handlers (unchanged)
  const handleDragStart = (field) => {
    setDraggingField(field)
  }

  const handlePlacedFieldDragStart = (e, field) => {
    e.stopPropagation()
    setDraggingPlacedField(field)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    
    const container = e.currentTarget
    const rect = container.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    if (draggingPlacedField) {
      setPlacedFields(placedFields.map(f => 
        f.fieldId === draggingPlacedField.fieldId
          ? { ...f, x, y, page: currentPage }
          : f
      ))
      setDraggingPlacedField(null)
    }
    else if (draggingField) {
      setPlacedFields([...placedFields, {
        ...draggingField,
        fieldId: Date.now(),
        x,
        y,
        page: currentPage,
        value: ''
      }])
      setDraggingField(null)
    }
  }

  const removeField = (fieldId) => {
    setPlacedFields(placedFields.filter(f => f.fieldId !== fieldId))
  }

  const updateFieldValue = (fieldId, value) => {
    setPlacedFields(placedFields.map(f => 
      f.fieldId === fieldId ? { ...f, value } : f
    ))
  }
  const saveSignaturePosition = async () => {
    const sigField = placedFields.find(f => f.id === 'signature')
    if (!sigField || !signatureData) return
  
    try {
      await api.post('/api/signatures', {
        documentId: id,
        xPercent: sigField.x,
        yPercent: sigField.y,
        page: sigField.page || 1,
        signatureType: signatureData.type,
        signatureImage: signatureData.actualSignature,
        signatureText: signatureData.text,
        signerName: signatureData.signerName || signatureData.text || 'Signed'  // ✅ Fixed
      })
      console.log('✅ Signature position saved')
    } catch (err) {
      console.error('❌ Failed to save signature position:', err)
    }
  }
  useEffect(() => {
    const sigField = placedFields.find(f => f.id === 'signature')
    if (sigField && signatureData) {
      saveSignaturePosition()
    }
  }, [placedFields])
  const handleSign = async () => {
    const signatureField = placedFields.find(f => f.id === 'signature')
    if (!signatureField) {
      alert('⚠️ Please place the signature field on the document')
      return
    }

    if (!signatureData) {
      alert('⚠️ Signature data is missing. Please go back and create your signature again.')
      return
    }

    setSaving(true)
    try {
      const finalizePayload = {
        documentId: id,
        signerName: signatureData.signerName || signatureData.text || 'Signed',
        placedFields: placedFields
      }

      if (signatureData.type === 'text') {
        finalizePayload.signatureText = signatureData.text
        finalizePayload.signatureFont = signatureData.font
      } else if (signatureData.type === 'draw' || signatureData.type === 'upload') {
        finalizePayload.signatureImage = signatureData.actualSignature
      }

      console.log('📤 Signing payload:', finalizePayload)
      const response = await api.post('/api/signatures/finalize', finalizePayload)
      
      console.log('✅ Signed successfully:', response.data)
      alert('✅ Document signed successfully!')
      navigate('/dashboard')
      
    } catch (err) {
      console.error('❌ Signing error:', err)
      alert(err.response?.data?.message || 'Signing failed')
    } finally {
      setSaving(false)
    }
  }

  // Loading state
  if (!doc) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-slate-400">Loading document...</p>
        </div>
      </div>
    )
  }


  if (!pdfUrl) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-slate-800 rounded-xl">
          <div className="text-red-400 mb-6">
            <svg className="w-20 h-20 mx-auto" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">No PDF Available</h2>
          <p className="text-slate-400 mb-6">Document file not found. Please check your upload.</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const requiredFields = allFields.filter(f => f.required)
  const optionalFields = allFields.filter(f => !f.required)

  return (
    <div className="min-h-screen bg-[#0F172A] flex">
      {/* LEFT: Page thumbnails */}
      <div className="w-36 bg-[#1E293B] border-r border-slate-700/50 p-3 overflow-y-auto">
        <div className="space-y-2">
          {Array.from({ length: numPages || 1 }, (_, i) => i + 1).map(pageNum => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`w-full aspect-[8.5/11] rounded-lg border-2 transition text-xs font-medium ${
                currentPage === pageNum
                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                  : 'border-slate-700 bg-slate-800/50 text-slate-500 hover:border-slate-600'
              }`}
            >
              {pageNum}
            </button>
          ))}
        </div>
      </div>

      {/* CENTER: PDF Canvas */}
      <div className="flex-1 flex flex-col bg-slate-900">
        {/* Top toolbar */}
        <div className="bg-[#1E293B] border-b border-slate-700/50 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-slate-400 hover:text-white transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div>
              <h2 className="text-slate-100 font-semibold text-sm">{doc.originalName}</h2>
              <p className="text-slate-500 text-xs">
                Page {currentPage} of {numPages || '?'} • {pdfError ? 'PDF Error' : 'Ready'}
              </p>
            </div>
          </div>
          <button
            onClick={handleSign}
            disabled={saving || placedFields.length === 0 || !signatureData}
            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold px-6 py-2 rounded-lg transition shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing...
              </>
            ) : (
              <>
                <span className="text-lg">✍️</span>
                Sign Document
              </>
            )}
          </button>
        </div>

        {/* PDF viewer */}
        <div className="flex-1 overflow-auto p-8 flex items-start justify-center min-h-0">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="relative inline-block bg-white shadow-2xl border-4 border-dashed border-gray-200 hover:border-indigo-300 transition-all duration-200 max-w-4xl w-full"
          >
            {/* ✅ FIXED PDF Viewer */}
            {pdfError ? (
              <div className="p-12 text-center border-2 border-red-200 bg-red-50 rounded-lg">
                <div className="text-red-500 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">PDF Load Failed</h3>
                <p className="text-red-600 mb-6">Check Cloudinary CORS settings</p>
                <a 
                  href={pdfUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open PDF Directly
                </a>
              </div>
            ) : (
              <Document 
                file={pdfUrl} 
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex flex-col items-center justify-center p-24 bg-gray-50 rounded-lg">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading PDF...</p>
                    <p className="text-sm text-gray-500 mt-1">{doc.originalName}</p>
                  </div>
                }
              >
                <Page 
                  pageNumber={currentPage} 
                  width={Math.min(700, window.innerWidth - 200)} 
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="shadow-2xl"
                />
              </Document>
            )}

            {/* Placed fields */}
            {placedFields.filter(f => f.page === currentPage).map(field => (
              <div
                key={field.fieldId}
                draggable
                onDragStart={(e) => handlePlacedFieldDragStart(e, field)}
                style={{
                  position: 'absolute',
                  left: `${field.x}%`,
                  top: `${field.y}%`,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'grab',
                  zIndex: 1000
                }}
                className="group active:cursor-grabbing select-none"
              >
                <div className="relative bg-indigo-500/15 border-2 border-indigo-400/50 rounded-lg px-3 py-2 backdrop-blur-sm shadow-lg min-w-[100px]">
                  
                  {/* SIGNATURE FIELD */}
                  {field.id === 'signature' && renderSignaturePreview()}
                  
                  {/* EDITABLE FIELDS */}
                  {field.editable && (
                    <input
                      type={field.id === 'date' ? 'date' : 'text'}
                      value={field.value || ''}
                      onChange={(e) => updateFieldValue(field.fieldId, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder={field.label}
                      className="bg-white/95 text-gray-900 text-sm px-2 py-1 rounded border border-indigo-300 min-w-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center font-medium"
                    />
                  )}
                  
                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeField(field.fieldId)
                    }}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-all z-20 border-2 border-white/50 hover:scale-110"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Field palette (unchanged) */}
      <div className="w-80 bg-[#1E293B] border-l border-slate-700/50 overflow-y-auto">
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex gap-2">
            <button className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium">
              Simple Signature
            </button>
            <button className="flex-1 bg-slate-800 text-slate-400 rounded-lg py-2 text-sm font-medium">
              Digital Signature
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-slate-300 text-sm font-bold">Required fields</h3>
            <span className="text-indigo-400 text-xs">Drag and drop</span>
          </div>
          
          {requiredFields.map(field => (
            <div
              key={field.id}
              draggable
              onDragStart={() => handleDragStart(field)}
              className="mb-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-indigo-500/50 transition shadow-md hover:shadow-lg"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                  {field.icon}
                </div>
                <span className="text-slate-300 text-sm font-medium">{field.label}</span>
              </div>
              <div className="bg-white/5 rounded-lg p-2 min-h-[60px] flex items-center justify-center">
                {renderSignaturePreview()}
              </div>
              {!signatureData && (
                <p className="text-amber-400 text-xs mt-2">⚠️ Signature missing</p>
              )}
            </div>
          ))}
        </div>

        <div className="p-4">
          <h3 className="text-slate-300 text-sm font-bold mb-3">Optional fields</h3>
          <div className="space-y-2">
            {optionalFields.map(field => (
              <div
                key={field.id}
                draggable
                onDragStart={() => handleDragStart(field)}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-slate-600 transition hover:bg-slate-800/70"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 bg-${field.color}-600 rounded-lg flex items-center justify-center text-white text-sm`}>
                    {field.icon}
                  </div>
                  <span className="text-slate-400 text-sm">{field.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {placedFields.length > 0 && (
          <div className="p-4 border-t border-slate-700/50">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
              <p className="text-emerald-400 text-sm font-medium">
                ✓ {placedFields.length} field{placedFields.length !== 1 ? 's' : ''} placed
              </p>
              <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                {placedFields.map(f => (
                  <div key={f.fieldId} className="text-xs text-emerald-300/90 flex items-center justify-between py-1">
                    <span>{f.label} <span className="text-emerald-200/70">(Pg {f.page})</span></span>
                    {f.value && <span className="text-emerald-200 font-mono bg-emerald-500/20 px-1 py-0.5 rounded text-xs">"{f.value}"</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function getFontStyle(fontClass) {
  const styles = {
    'font-brush': { fontFamily: 'Brush Script MT, cursive', fontStyle: 'italic' },
    'font-elegant': { fontFamily: 'Lucida Handwriting, cursive' },
    'font-modern': { fontFamily: 'Arial, sans-serif', fontWeight: '300', letterSpacing: '0.05em' },
    'font-hand': { fontFamily: 'Comic Sans MS, cursive' }
  }
  return styles[fontClass] || {}
}
