/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar, TabType } from './components/Navbar';
import { ModelEvaluationTab } from './components/ModelEvaluationTab';
import { SensorTestingTab } from './components/SensorTestingTab';
import { DomainShiftTab } from './components/DomainShiftTab';
import { ScalingArchitectureTab } from './components/ScalingArchitectureTab';
import { MethodologyTab } from './components/MethodologyTab';
import { QuickDemoBanner } from './components/QuickDemoBanner';
import { 
  Activity, 
  ShieldCheck, 
  BarChart3, 
  Radio, 
  Cpu, 
  FileText, 
  Github, 
  ExternalLink 
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('evaluation');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <QuickDemoBanner setActiveTab={setActiveTab} />
        {activeTab === 'evaluation' && <ModelEvaluationTab />}
        {activeTab === 'sensor_test' && <SensorTestingTab />}
        {activeTab === 'domain_shift' && <DomainShiftTab />}
        {activeTab === 'scaling' && <ScalingArchitectureTab />}
        {activeTab === 'methodology' && <MethodologyTab />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-slate-300">GaitID-30 Biometric Evaluation System</span>
              <span className="mx-2 text-slate-700">•</span>
              <span>UCI HAR 30-Subject Dataset</span>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <button 
              onClick={() => setActiveTab('methodology')} 
              className="hover:text-slate-300 transition-colors"
            >
              Evaluation Methodology
            </button>
            <button 
              onClick={() => setActiveTab('scaling')} 
              className="hover:text-slate-300 transition-colors"
            >
              Scaling Proposal
            </button>
            <button 
              onClick={() => setActiveTab('domain_shift')} 
              className="hover:text-slate-300 transition-colors"
            >
              Domain Shift Analysis
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
