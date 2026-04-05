import React, { useState } from 'react'
import { Bot, Save, Play, Power, AlertCircle } from 'lucide-react'

const AIControl = () => {
  const [isEnabled, setIsEnabled] = useState(true)
  const [prompt, setPrompt] = useState(`You are "AI Jothidar", a wise and compassionate astrology expert.
Provide guidance based on the user's Rasi: {{user_rasi}} and today's date: {{current_date}}.
Keep responses insightful, mystical yet practical. Use Tamil-influenced English or pure English as appropriate.`)

  return (
    <div className="font-['Inter']">
      <header className="flex justify-between items-center mb-8 font-['Outfit']">
        <div>
          <h2 className="text-3xl font-bold text-astrology-gold">AI Jothidar Control</h2>
          <p className="text-gray-400 font-['Inter']">Manage the AI agent's behavior and system prompt templates.</p>
        </div>
        <div className="flex items-center gap-4 bg-astrology-card p-1 rounded-full border border-white/10">
          <button 
            onClick={() => setIsEnabled(true)}
            className={`px-4 py-2 rounded-full flex items-center gap-2 transition-all ${isEnabled ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'text-gray-500'}`}
          >
            <Power size={16} /> Active
          </button>
          <button 
            onClick={() => setIsEnabled(false)}
            className={`px-4 py-2 rounded-full flex items-center gap-2 transition-all ${!isEnabled ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'text-gray-500'}`}
          >
            <Power size={16} /> Disabled
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Editor Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-astrology-card p-8 rounded-xl border border-astrology-gold/10 shadow-2xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-astrology-gold font-['Outfit']">
              <Bot size={22} />
              System Prompt Template
            </h3>
            
            <div className="relative">
              <textarea 
                rows={12}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-4 outline-none focus:border-astrology-gold text-white font-mono text-sm resize-none leading-relaxed"
              ></textarea>
              <div className="mt-4 p-4 bg-astrology-gold/5 border border-astrology-gold/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="text-astrology-gold shrink-0" size={18} />
                <p className="text-xs text-gray-400">
                  Use placeholders like <code className="text-astrology-gold">{"{{user_rasi}}"}</code> and <code className="text-astrology-gold">{"{{current_date}}"}</code>. These will be automatically replaced by the backend before sending the request to OpenAI.
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-6 gap-4">
              <button className="px-6 py-2 border border-white/10 rounded-lg text-gray-400 hover:bg-white/5 transition-all flex items-center gap-2">
                <Play size={18} />
                Test Prompt
              </button>
              <button className="btn-gold px-8 py-2 flex items-center gap-2">
                <Save size={18} />
                Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* Info Area */}
        <div className="space-y-6">
          <div className="bg-astrology-card p-6 rounded-xl border border-astrology-gold/10">
            <h3 className="text-lg font-bold mb-4 text-white font-['Outfit']">Usage Analytics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-white/5 pb-2">
                <span className="text-gray-500 text-sm">OpenAI Model</span>
                <span className="text-astrology-gold font-bold">gpt-4o-mini</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/5 pb-2">
                <span className="text-gray-500 text-sm">Requests Today</span>
                <span className="text-white font-bold">142</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/5 pb-2">
                <span className="text-gray-500 text-sm">Tokens Used</span>
                <span className="text-white font-bold">28.4k</span>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-white/5">
               <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                 <div className="h-full bg-astrology-gold w-3/4 shadow-[0_0_10px_#d4af37]"></div>
               </div>
               <div className="flex justify-between mt-2 text-[10px] text-gray-600">
                 <span>DAILY QUOTA</span>
                 <span>75% USED</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIControl
