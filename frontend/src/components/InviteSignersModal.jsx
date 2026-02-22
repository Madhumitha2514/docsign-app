import { useState, useRef } from 'react'

export default function InviteSignersModal({ isOpen, onClose, onSubmit }) {
  const [signers, setSigners] = useState([
    { name: '', email: '', role: 'Signer' }
  ])
  const [expiryDays, setExpiryDays] = useState(15)
  const [emailNotification, setEmailNotification] = useState(true)
  const [signInOrder, setSignInOrder] = useState(false)

  // Signature creation state
  const [showSignatureSection, setShowSignatureSection] = useState(false)
  const [activeTab, setActiveTab] = useState('type')
  const [selectedFont, setSelectedFont] = useState(0)
  const [drawnSignature, setDrawnSignature] = useState(null)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [signatureName, setSignatureName] = useState('')
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)

  if (!isOpen) return null

  const fonts = [
    { name: 'Brush Script', style: 'font-brush' },
    { name: 'Elegant Script', style: 'font-elegant' },
    { name: 'Modern Sans', style: 'font-modern' },
    { name: 'Handwritten', style: 'font-hand' }
  ]

  const addSigner = () => {
    setSigners([...signers, { name: '', email: '', role: 'Signer' }])
  }

  const removeSigner = (index) => {
    setSigners(signers.filter((_, i) => i !== index))
  }

  const updateSigner = (index, field, value) => {
    const updated = [...signers]
    updated[index][field] = value
    setSigners(updated)
  }

  // Canvas drawing functions
  const startDrawing = (e) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX ? e.clientX - rect.left : e.touches[0].clientX - rect.left
    const y = e.clientY ? e.clientY - rect.top : e.touches[0].clientY - rect.top
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX ? e.clientX - rect.left : e.touches[0].clientX - rect.left
    const y = e.clientY ? e.clientY - rect.top : e.touches[0].clientY - rect.top
    ctx.lineTo(x, y)
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (isDrawing && canvasRef.current) {
      setDrawnSignature(canvasRef.current.toDataURL())
    }
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setDrawnSignature(null)
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadedImage(event.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = () => {
    const valid = signers.every(s => s.name && s.email)
    if (!valid) {
      alert('Please fill all signer details')
      return
    }

    // Prepare signature data
    let signatureData = null
    if (showSignatureSection) {
      if (activeTab === 'type') {
        signatureData = {
          type: 'text',
          text: signatureName,
          font: fonts[selectedFont].style,
          actualSignature: signatureName
        }
      } else if (activeTab === 'draw') {
        if (!drawnSignature) {
          alert('Please draw your signature')
          return
        }
        signatureData = {
          type: 'draw',
          actualSignature: drawnSignature,
          signerName: signatureName
        }
      } else if (activeTab === 'upload') {
        if (!uploadedImage) {
          alert('Please upload signature image')
          return
        }
        signatureData = {
          type: 'upload',
          actualSignature: uploadedImage,
          signerName: signatureName
        }
      }
    }

    onSubmit({ 
      signers, 
      expiryDays, 
      emailNotification, 
      signInOrder,
      signatureData 
    })
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E293B] rounded-2xl max-w-3xl w-full border border-slate-700/50 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        <div className="sticky top-0 bg-[#1E293B] border-b border-slate-700/50 p-6 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Invite Signers</h2>
              <p className="text-slate-400 text-sm mt-1">Fill in the information of each receiver</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          
          {/* Signers List */}
          <div className="space-y-4 mb-6">
            {signers.map((signer, idx) => (
              <div key={idx} className="bg-[#0F172A] border border-slate-700 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 rounded-full flex items-center justify-center border border-cyan-500/20">
                    <span className="text-cyan-400 font-bold text-sm">{idx + 1}</span>
                  </div>
                  <div className="flex-1 grid md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={signer.name}
                      onChange={(e) => updateSigner(idx, 'name', e.target.value)}
                      className="bg-slate-800 text-slate-100 px-4 py-2.5 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none text-sm"
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={signer.email}
                      onChange={(e) => updateSigner(idx, 'email', e.target.value)}
                      className="bg-slate-800 text-slate-100 px-4 py-2.5 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none text-sm"
                    />
                    <select
                      value={signer.role}
                      onChange={(e) => updateSigner(idx, 'role', e.target.value)}
                      className="bg-slate-800 text-slate-100 px-4 py-2.5 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none text-sm"
                    >
                      <option value="Signer">Signer</option>
                      <option value="Validator">Validator</option>
                      <option value="Witness">Witness</option>
                    </select>
                  </div>
                  {signers.length > 1 && (
                    <button
                      onClick={() => removeSigner(idx)}
                      className="flex-shrink-0 text-red-400 hover:text-red-300 transition"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addSigner}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 rounded-xl transition border border-slate-700 flex items-center justify-center gap-2 mb-6"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Another Receiver
          </button>

          {/* Signature Section Toggle */}
          <div className="mb-6">
            <button
              onClick={() => setShowSignatureSection(!showSignatureSection)}
              className="w-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 hover:border-indigo-500/50 rounded-xl p-4 transition flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-xl">✍️</span>
                </div>
                <div className="text-left">
                  <p className="text-slate-100 font-semibold">Your Signature</p>
                  <p className="text-slate-400 text-xs">Add your signature to the document</p>
                </div>
              </div>
              <svg 
                className={`w-5 h-5 text-slate-400 transition-transform ${showSignatureSection ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Signature Creation Section */}
          {showSignatureSection && (
            <div className="bg-[#0F172A] border border-slate-700 rounded-xl p-6 mb-6">
              <input
                type="text"
                placeholder="Your Name"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                className="w-full bg-slate-800 text-slate-100 px-4 py-3 rounded-xl border border-slate-700 focus:border-indigo-500 focus:outline-none mb-4"
              />

              {/* Tabs */}
              <div className="flex gap-2 mb-6 border-b border-slate-700">
                <button
                  onClick={() => setActiveTab('type')}
                  className={`px-6 py-3 font-medium transition relative ${
                    activeTab === 'type' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  Type
                  {activeTab === 'type' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"></div>}
                </button>
                <button
                  onClick={() => setActiveTab('draw')}
                  className={`px-6 py-3 font-medium transition relative ${
                    activeTab === 'draw' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  Draw
                  {activeTab === 'draw' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"></div>}
                </button>
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`px-6 py-3 font-medium transition relative ${
                    activeTab === 'upload' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  Upload
                  {activeTab === 'upload' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"></div>}
                </button>
              </div>

              {/* Type Tab */}
              {activeTab === 'type' && (
                <div className="space-y-3">
                  {fonts.map((font, idx) => (
                    <label
                      key={idx}
                      className={`block bg-slate-800 border-2 rounded-xl p-3 cursor-pointer transition ${
                        selectedFont === idx ? 'border-indigo-500' : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="font"
                        checked={selectedFont === idx}
                        onChange={() => setSelectedFont(idx)}
                        className="hidden"
                      />
                      <div className={`text-2xl ${font.style}`}>
                        {signatureName || 'Your Name'}
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* Draw Tab */}
              {activeTab === 'draw' && (
                <div>
                  <div className="bg-white rounded-xl p-4 border-2 border-dashed border-slate-600 mb-4">
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={200}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full cursor-crosshair touch-none"
                    />
                  </div>
                  <button
                    onClick={clearCanvas}
                    className="text-sm text-slate-400 hover:text-white transition"
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* Upload Tab */}
              {activeTab === 'upload' && (
                <label className="block bg-slate-800 border-2 border-dashed border-slate-600 hover:border-indigo-500 rounded-xl p-12 text-center cursor-pointer transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {uploadedImage ? (
                    <div>
                      <img src={uploadedImage} alt="Signature" className="max-h-40 mx-auto mb-4" />
                      <p className="text-slate-400 text-sm">Click to change</p>
                    </div>
                  ) : (
                    <div>
                      <svg className="w-12 h-12 mx-auto text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-slate-300 font-medium mb-1">Upload Signature</p>
                      <p className="text-slate-500 text-sm">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                </label>
              )}
            </div>
          )}

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Settings</h3>
            
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={signInOrder}
                onChange={(e) => setSignInOrder(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 bg-slate-800"
              />
              <div className="flex-1">
                <p className="text-slate-300 font-medium group-hover:text-indigo-400 transition">Set the order of receivers</p>
                <p className="text-slate-500 text-sm mt-1">A signer won't receive a request until the previous person has completed their document.</p>
              </div>
            </label>

            <div className="bg-[#0F172A] border border-slate-700 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={expiryDays !== null}
                  onChange={(e) => setExpiryDays(e.target.checked ? 15 : null)}
                  className="mt-1 w-5 h-5 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 bg-slate-800"
                />
                <div className="flex-1">
                  <p className="text-slate-300 font-medium group-hover:text-indigo-400 transition">Change expiration date</p>
                  <p className="text-slate-500 text-sm mt-1">The document will expire in {expiryDays || 15} days</p>
                  {expiryDays !== null && (
                    <input
                      type="number"
                      value={expiryDays}
                      onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                      min="1"
                      max="365"
                      className="mt-2 w-24 bg-slate-800 text-slate-100 px-3 py-2 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none text-sm"
                    />
                  )}
                </div>
              </label>
            </div>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={emailNotification}
                onChange={(e) => setEmailNotification(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 bg-slate-800"
              />
              <div className="flex-1">
                <p className="text-slate-300 font-medium group-hover:text-indigo-400 transition">Enable email notifications</p>
                <p className="text-slate-500 text-sm mt-1">Send email notifications to signers when the document is ready</p>
              </div>
            </label>
          </div>

        </div>

        <div className="sticky bottom-0 bg-[#1E293B] border-t border-slate-700/50 p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium py-3 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-cyan-500/30"
          >
            Continue to Editor
          </button>
        </div>

      </div>
    </div>
  )
}