import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { IssueProvider, useIssues } from './context/IssueContext';
import { Navbar } from './components/Navbar';
import { IssueFeed } from './components/IssueFeed';
import { InteractiveMap } from './components/InteractiveMap';
import { AuthorityDashboard } from './components/AuthorityDashboard';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { AIAdvisorView } from './components/AIAdvisorView';
import { IssueDetailModal } from './components/IssueDetailModal';
import { ReportIssueModal } from './components/ReportIssueModal';
import { DatabaseConfigModal } from './components/DatabaseConfigModal';
import { CivicIssue } from './types';
import { ShieldCheck, Heart, Github, Database, Sparkles } from 'lucide-react';

function MainAppContent() {
  const { selectedIssue, setSelectedIssue } = useIssues();

  const [activeTab, setActiveTab] = useState<'feed' | 'map' | 'authority' | 'analytics' | 'advisor'>('feed');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCoords, setReportCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showDbModal, setShowDbModal] = useState(false);

  // Dark mode handler
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('civicguard_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('civicguard_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('civicguard_theme', 'light');
    }
  }, [darkMode]);

  const handleReportAtCoords = (coords: { lat: number; lng: number }) => {
    setReportCoords(coords);
    setShowReportModal(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-100 via-blue-50/40 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      
      {/* Dynamic Background Mesh Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-[130px]" />
      </div>

      {/* Main Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReportModal={() => {
          setReportCoords(null);
          setShowReportModal(true);
        }}
        onOpenDbModal={() => setShowDbModal(true)}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'feed' && (
          <IssueFeed
            onSelectIssue={setSelectedIssue}
            onOpenReportModal={() => {
              setReportCoords(null);
              setShowReportModal(true);
            }}
            onOpenMap={() => setActiveTab('map')}
          />
        )}

        {activeTab === 'map' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Metropolitan Interactive GIS Map
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Click on pins to inspect incident dossiers, or click anywhere on the grid to drop a new issue pin.
                </p>
              </div>
            </div>
            <InteractiveMap
              onSelectIssue={setSelectedIssue}
              onReportAtCoords={handleReportAtCoords}
            />
          </div>
        )}

        {activeTab === 'authority' && (
          <AuthorityDashboard onSelectIssue={setSelectedIssue} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard />
        )}

        {activeTab === 'advisor' && (
          <AIAdvisorView />
        )}
      </main>

      {/* Modals */}
      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
        />
      )}

      {showReportModal && (
        <ReportIssueModal
          initialCoords={reportCoords}
          onClose={() => {
            setShowReportModal(false);
            setReportCoords(null);
          }}
        />
      )}

      {showDbModal && (
        <DatabaseConfigModal
          onClose={() => setShowDbModal(false)}
        />
      )}

      {/* Footer */}
      <footer className="relative z-10 w-full glass-panel border-t border-white/20 dark:border-white/10 mt-12 py-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-blue-600 text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              AI CivicGuard
            </span>
            <span>• Intelligent Municipal Resolution Platform</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <button
              onClick={() => setShowDbModal(true)}
              className="hover:text-blue-500 transition-colors flex items-center gap-1"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Supabase & SQL</span>
            </button>
            <button
              onClick={() => setActiveTab('advisor')}
              className="hover:text-blue-500 transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              <span>AI Advisor</span>
            </button>
            <span>v2.4 Production</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <IssueProvider>
        <MainAppContent />
      </IssueProvider>
    </AuthProvider>
  );
}
