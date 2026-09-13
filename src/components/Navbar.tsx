import React from 'react';
import { Activity, BarChart3, Radio, ShieldAlert, Cpu, FileText } from 'lucide-react';

export type TabType = 'evaluation' | 'sensor_test' | 'domain_shift' | 'scaling' | 'methodology';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const navItems: { id: TabType; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'evaluation', label: 'Model & Evaluation', icon: <BarChart3 className="w-4 h-4" />, badge: '86.4% Acc' },
    { id: 'sensor_test', label: 'Live & Real-World Testing', icon: <Radio className="w-4 h-4" /> },
    { id: 'domain_shift', label: 'Domain Shift Analysis', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'scaling', label: 'Scaling Beyond 30 Users', icon: <Cpu className="w-4 h-4" />, badge: 'Metric Learning' },
    { id: 'methodology', label: 'Scientific Methodology', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-white">GaitID-30</span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                  UCI HAR Biometrics
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Smartphone Sensor Biometric Person-Identification System</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-800 text-indigo-400 border border-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile / Tablet scrollable tab row */}
        <div className="lg:hidden flex items-center space-x-2 overflow-x-auto pb-3 pt-1 scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-mobile-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 bg-slate-800/80 hover:bg-slate-800'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
