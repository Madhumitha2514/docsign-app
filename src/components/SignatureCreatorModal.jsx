import { useState, useRef } from 'react'

export default function SignatureCreatorModal({ isOpen, onClose, onSave, fullName, initials }) {
  const [activeTab, setActiveTab] = useState('type')
  const [selectedFont, setSelectedFont] = useState(0)
  const [drawnSignature, setDrawnSignature] = useState(null)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [name, setName] = useState(fullName)
  const [userInitials, setUserInitials] = useState(initials)
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)

  if (!isOpen) return null

  const fonts = [
    { name: 'Brush Script', style: 'font-brush', preview: name },
    { name: 'Elegant Script', style: 'font-elegant', preview: name },
    { name: 'Modern Sans', style: 'font-modern', preview: name },
    { name: 'Handwritten', style: 'font-hand', preview: name }
  ]

  const startDrawing = (e) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }


  const draw = (e) => {
    if (!isDrawing) return
  
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
  
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.strokeStyle = "#000"
  
    ctx.lineTo(
      e.clientX - rect.left,
      e.clientY - rect.top
    )
  
    ctx.stroke()
  }
  const stopDrawing = () => {
    setIsDrawing(false)
    if (canvasRef.current) {
      setDrawnSignature(canvasRef.current.toDataURL())
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setDrawnSignature(null)
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
  
    const reader = new FileReader()
  
    reader.onload = () => {
      setUploadedImage(reader.result)   // ✅ correct state setter
    }
  
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter your name')
      return
    }

    let signatureData = null
    
    if (activeTab === 'type') {


        // Convert typed name to image (VERY IMPORTANT)
  const canvas = document.createElement("canvas")
  canvas.width = 600
  canvas.height = 200

  const ctx = canvas.getContext("2d")
  ctx.fillStyle = "#000"

  const fontMap = {
    'font-brush': '40px "Brush Script MT", cursive',
    'font-elegant': '40px "Lucida Handwriting", cursive',
    'font-modern': '40px Arial',
    'font-hand': '40px "Comic Sans MS", cursive'
  }

  ctx.font = fontMap[fonts[selectedFont].style] || '40px cursive'
  ctx.fillText(name, 50, 120)

  const base64Image = canvas.toDataURL("image/png")

      signatureData = { 
        type: 'text', 
        text: name, 
        font: fonts[selectedFont].style,
        actualSignature: base64Image,
        signerName: name
      }
    } else if (activeTab === 'draw') {
      if (!drawnSignature) {
        alert('Please draw your signature')
        return
      }
      signatureData = { 
        type: 'draw', 
        image: drawnSignature,
        actualSignature: drawnSignature,
        signerName: name
      }
    } else if (activeTab === 'upload') {
      if (!uploadedImage) {
        alert('Please upload signature image')
        return
      }
      signatureData = { 
        type: 'upload', 
        image: uploadedImage,
        actualSignature: uploadedImage,
        signerName: name
      }
    }

    onSave(signatureData)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E293B] rounded-2xl max-w-3xl w-full border border-slate-700/50 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        <div className="sticky top-0 bg-[#1E293B] border-b border-slate-700/50 p-6 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Create Your Signature</h2>
              <p className="text-slate-400 text-sm mt-1">Choose how you want to sign</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-slate-300 text-sm mb-2 block">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full bg-slate-800 text-slate-100 px-4 py-3 rounded-xl border border-slate-700 focus:border-indigo-500 focus:outline-none transition"
              />
            </div>
            <div>
              <label className="text-slate-300 text-sm mb-2 block">Initials</label>
              <input
                type="text"
                value={userInitials}
                onChange={(e) => setUserInitials(e.target.value)}
                placeholder="e.g., MG"
                className="w-full bg-slate-800 text-slate-100 px-4 py-3 rounded-xl border border-slate-700 focus:border-indigo-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="flex gap-2 mb-6 border-b border-slate-700">
            <button
              onClick={() => setActiveTab('type')}
              className={`px-6 py-3 font-medium transition relative ${
                activeTab === 'type' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Type
              </span>
              {activeTab === 'type' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"></div>}
            </button>

            <button
              onClick={() => setActiveTab('draw')}
              className={`px-6 py-3 font-medium transition relative ${
                activeTab === 'draw' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Draw
              </span>
              {activeTab === 'draw' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"></div>}
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-3 font-medium transition relative ${
                activeTab === 'upload' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Upload
              </span>
              {activeTab === 'upload' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"></div>}
            </button>
          </div>

          <div className="min-h-[300px]">
            
            {activeTab === 'type' && (
              <div className="space-y-4">
                <p className="text-slate-400 text-sm mb-4">Select a style for your signature</p>
                {fonts.map((font, idx) => (
                  <label
                    key={idx}
                    className={`block bg-[#0F172A] border-2 rounded-xl p-4 cursor-pointer transition hover:border-indigo-500 ${
                      selectedFont === idx ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="font"
                      checked={selectedFont === idx}
                      onChange={() => setSelectedFont(idx)}
                      className="hidden"
                    />
                    <div className="flex items-center gap-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedFont === idx ? 'border-indigo-500 bg-indigo-500' : 'border-slate-600'
                      }`}>
                        {selectedFont === idx && <div className="w-3 h-3 bg-white rounded-full"></div>}
                      </div>
                      <div className="flex-1">
                        <div className={`text-2xl ${font.style}`} style={getFontStyle(font.style)}>
                          {name || 'Your Name'}
                        </div>
                        <p className="text-slate-500 text-xs mt-1">{font.name}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {activeTab === 'draw' && (
              <div>
                <p className="text-slate-400 text-sm mb-4">Draw your signature below</p>
                <div className="bg-white rounded-xl p-4 border-2 border-dashed border-slate-600">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={200}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={(e) => startDrawing(e.touches[0])}
                    onTouchMove={(e) => draw(e.touches[0])}
                    onTouchEnd={stopDrawing}
                    className="w-full cursor-crosshair touch-none"
                  />
                </div>
                <button
                  onClick={clearCanvas}
                  className="mt-4 text-sm text-slate-400 hover:text-white transition flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Clear
                </button>
              </div>
            )}

            {activeTab === 'upload' && (
              <div>
                <p className="text-slate-400 text-sm mb-4">Upload an image of your signature</p>
                <label className="block bg-[#0F172A] border-2 border-dashed border-slate-600 hover:border-indigo-500 rounded-xl p-12 text-center cursor-pointer transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {uploadedImage ? (
                    <div>
                      <img src={uploadedImage} alt="Signature" className="max-h-40 mx-auto mb-4" />
                      <p className="text-slate-400 text-sm">Click to change image</p>
                    </div>
                  ) : (
                    <div>
                      <svg className="w-12 h-12 mx-auto text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-slate-300 font-medium mb-1">Click to upload signature</p>
                      <p className="text-slate-500 text-sm">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                </label>
              </div>
            )}

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
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-500/30"
          >
            Apply Signature
          </button>
        </div>

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