import { useState } from 'react'

export default function UploadModal({ isOpen, onClose, onSelectFlow }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E293B] rounded-2xl max-w-2xl w-full p-8 border border-slate-700/50 shadow-2xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Who will sign this document?</h2>
          <p className="text-slate-400 text-sm">Choose how you want to proceed</p>
        </div>

        {/* Two Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          
          {/* Card 1: Only Me */}
          <button
            onClick={() => onSelectFlow('only-me')}
            className="group bg-[#0F172A] border-2 border-slate-700 hover:border-indigo-500 rounded-xl p-6 transition-all hover:scale-105 text-left"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:shadow-lg group-hover:shadow-indigo-500/30 transition">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2 group-hover:text-indigo-400 transition">Only Me</h3>
            <p className="text-slate-400 text-sm">Sign this document yourself right now</p>
          </button>

          {/* Card 2: Several People */}
          <button
            onClick={() => onSelectFlow('invite-others')}
            className="group bg-[#0F172A] border-2 border-slate-700 hover:border-cyan-500 rounded-xl p-6 transition-all hover:scale-105 text-left"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:shadow-lg group-hover:shadow-cyan-500/30 transition">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2 group-hover:text-cyan-400 transition">Several People</h3>
            <p className="text-slate-400 text-sm">Invite others to sign this document</p>
          </button>

        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="mt-6 w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium py-3 rounded-xl transition"
        >
          Cancel
        </button>

      </div>
    </div>
  )
}