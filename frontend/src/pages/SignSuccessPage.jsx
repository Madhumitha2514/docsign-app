import { useNavigate } from 'react-router-dom'

export default function SignSuccessPage() {
  const navigate = useNavigate()

  const handleClose = () => {
    // Try multiple methods to close
    if (window.opener) {
      // Opened from another window
      window.close()
    } else {
      // Regular navigation
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        
        {/* Success Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full mb-6 shadow-lg shadow-emerald-500/30">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-slate-100 mb-3">
          ✅ Document Signed Successfully!
        </h1>

        {/* Message */}
        <p className="text-slate-400 mb-8">
          Thank you for signing the document. The document owner has been notified and will receive the signed copy.
        </p>

        {/* Info Box */}
        <div className="bg-[#1E293B] border border-slate-700 rounded-xl p-6 mb-6 text-left">
          <h3 className="text-slate-100 font-semibold mb-3">What happens next?</h3>
          <ul className="space-y-2 text-slate-400 text-sm">
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Your signature has been securely recorded</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>The document owner will receive the final signed PDF</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>An audit trail has been created with timestamp and IP address</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleClose}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-500/30"
          >
            Close Window
          </button>
          
          {/* <button
            onClick={() => navigate('/')}
            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium py-3 rounded-xl transition"
          >
            Go to Home
          </button> */}
        </div>

        {/* Footer */}
        <p className="text-slate-500 text-xs mt-6">
          Powered by DocSign - Digital Signature Platform
        </p>
      </div>
    </div>
  )
}