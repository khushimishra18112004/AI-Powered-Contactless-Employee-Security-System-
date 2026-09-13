import React, { useState } from 'react';
import { Play, ShieldAlert, CheckCircle2, ChevronRight, HelpCircle, X, Sparkles } from 'lucide-react';
import { TabType } from './Navbar';

interface QuickDemoBannerProps {
  setActiveTab: (tab: TabType) => void;
}

export const QuickDemoBanner: React.FC<QuickDemoBannerProps> = ({ setActiveTab }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return (
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setDismissed(false)}
          className="inline-flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Show Quick Start Guide</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-cyan-950/40 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
      <div className="absolute top-3 right-3">
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-800/50 transition-colors"
          title="Dismiss quick guide"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="inline-flex items-center space-x-2 text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
            <Sparkles className="w-3 h-3" />
            <span>Quick 10-Second Overview</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            How this app identifies people from phone motion
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Every person has a unique walking rhythm (gait, cadence, bounce). This app tests AI models on 30 people carrying smartphones to recognize who is walking.
          </p>
        </div>

        {/* 3 Simple Action Buttons */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => setActiveTab('sensor_test')}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl shadow-sm transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>1. Test a Walk</span>
          </button>

          <button
            onClick={() => setActiveTab('scaling')}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>2. Test Impostor</span>
          </button>

          <button
            onClick={() => setActiveTab('evaluation')}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>3. View Accuracy (86%)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
