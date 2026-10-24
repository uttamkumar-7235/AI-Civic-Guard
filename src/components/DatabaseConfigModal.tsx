import React, { useState } from 'react';
import { 
  X, 
  Database, 
  Check, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  KeyRound, 
  Sparkles,
  RefreshCw,
  RotateCcw,
  Code
} from 'lucide-react';
import { 
  getSupabaseCredentials, 
  isSupabaseConfigured, 
  saveSupabaseCredentials, 
  clearSupabaseCredentials, 
  testSupabaseConnection 
} from '../lib/supabase';
import { StorageService } from '../lib/storage';
import { useIssues } from '../context/IssueContext';

interface DatabaseConfigModalProps {
  onClose: () => void;
}

export const DatabaseConfigModal: React.FC<DatabaseConfigModalProps> = ({ onClose }) => {
  const { refreshIssues } = useIssues();
  const currentCreds = getSupabaseCredentials();

  const [url, setUrl] = useState(currentCreds.url);
  const [anonKey, setAnonKey] = useState(currentCreds.anonKey);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'schema' | 'instructions'>('config');

  const isConnected = isSupabaseConfigured();

  const handleSave = () => {
    saveSupabaseCredentials(url, anonKey);
    setTestResult(null);
    refreshIssues();
  };

  const handleClear = () => {
    clearSupabaseCredentials();
    setUrl('');
    setAnonKey('');
    setTestResult(null);
    refreshIssues();
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    // temporarily save to test
    saveSupabaseCredentials(url, anonKey);
    const result = await testSupabaseConnection();
    setTestResult(result);
    setTesting(false);
    refreshIssues();
  };

  const handleResetDemo = () => {
    if (confirm('Reset demo issues and activities to initial state?')) {
      StorageService.resetDemoData();
      refreshIssues();
      onClose();
    }
  };

  const sqlSchemaCode = `-- AI CivicGuard Supabase Schema
-- Run in Supabase SQL Editor:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'authority', 'admin')),
  department TEXT,
  reputation_points INT DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Issues
CREATE TABLE IF NOT EXISTS public.issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('roads', 'lighting', 'sanitation', 'water', 'traffic', 'parks', 'safety', 'other')),
  status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'under_review', 'in_progress', 'resolved', 'dismissed')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  priority_score INT DEFAULT 50,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT NOT NULL,
  neighborhood TEXT,
  landmark TEXT,
  image_url TEXT,
  ai_analysis JSONB,
  reported_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reporter_name TEXT NOT NULL,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  department TEXT NOT NULL DEFAULT 'Public Works',
  upvotes_count INT DEFAULT 1,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  resolution_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read issues" ON public.issues FOR SELECT USING (true);
CREATE POLICY "Auth insert issues" ON public.issues FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authority update" ON public.issues FOR UPDATE USING (true);

-- 4. Storage Bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('civic-evidence', 'civic-evidence', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Public view evidence" ON storage.objects FOR SELECT USING (bucket_id = 'civic-evidence');
CREATE POLICY "Auth upload evidence" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'civic-evidence');`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSchemaCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col glass-panel rounded-3xl overflow-hidden shadow-2xl border border-white/20 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200/50 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-md">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Supabase Database & Backend</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isConnected
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                }`}>
                  {isConnected ? 'Live Supabase Connected' : 'Offline / Demo Mode Active'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                PostgreSQL schema, Row Level Security, and live cloud sync configuration.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Header */}
        <div className="flex border-b border-slate-200/50 dark:border-white/10 px-4 sm:px-6 bg-white/40 dark:bg-slate-900/30">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'config'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Connection Settings
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`flex items-center gap-1.5 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'schema'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>SQL Schema (Postgres)</span>
          </button>

          <button
            onClick={() => setActiveTab('instructions')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'instructions'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Setup Guide
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* TAB 1: CONNECTION CONFIG */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <p className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                  💡 Zero-Config Fallback Active:
                </p>
                The platform includes a built-in reactive offline database seeded with realistic municipal issues so you can test all features right now. To connect your own live Supabase project, paste your URL and Anon Key below or define them in <code className="font-mono bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">.env</code>.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Supabase Project URL (VITE_SUPABASE_URL)
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs glass-input text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Supabase Anon Key (VITE_SUPABASE_ANON_KEY)
                </label>
                <input
                  type="password"
                  value={anonKey}
                  onChange={e => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs glass-input text-slate-900 dark:text-white font-mono"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition-all"
                >
                  Save Credentials
                </button>

                <button
                  type="button"
                  onClick={handleTest}
                  disabled={testing || !url}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300/60 dark:border-white/10 transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                  <span>{testing ? 'Testing...' : 'Test Connection'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all ml-auto"
                >
                  Clear & Revert to Demo
                </button>
              </div>

              {/* Test Connection Results Card */}
              {testResult && (
                <div
                  className={`p-3.5 rounded-2xl text-xs border flex items-start gap-2.5 animate-in fade-in ${
                    testResult.success
                      ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-800 dark:text-rose-200 border-rose-500/30'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <p className="leading-relaxed font-medium">{testResult.message}</p>
                </div>
              )}

              {/* Reset Demo Data button */}
              <div className="pt-4 border-t border-slate-200/50 dark:border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Reset Local Demo Records
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Restores the initial set of realistic municipal issues and activities.
                  </p>
                </div>

                <button
                  onClick={handleResetDemo}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Demo Data</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: SQL SCHEMA */}
          {activeTab === 'schema' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  PostgreSQL DDL & RLS Policies
                </span>

                <button
                  onClick={copySql}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-all shadow-sm"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-950 p-4 font-mono text-xs text-emerald-400 max-h-96 overflow-y-auto leading-relaxed">
                <pre>{sqlSchemaCode}</pre>
              </div>
              <p className="text-[11px] text-slate-400">
                You can also find the full version with comments in the root workspace file <code className="text-blue-400">supabase/schema.sql</code>.
              </p>
            </div>
          )}

          {/* TAB 3: SETUP INSTRUCTIONS */}
          {activeTab === 'instructions' && (
            <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <div className="p-4 rounded-2xl glass-card space-y-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  1. Create a Supabase Project
                </h4>
                <p>
                  Visit <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-500 font-bold hover:underline inline-flex items-center gap-1">supabase.com <ExternalLink className="w-3 h-3" /></a> and create a new project. Select your preferred region.
                </p>
              </div>

              <div className="p-4 rounded-2xl glass-card space-y-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  2. Run the Schema in SQL Editor
                </h4>
                <p>
                  In your Supabase Dashboard, click <strong>SQL Editor</strong> on the left navigation, create a <strong>New Query</strong>, paste the contents from the <strong>SQL Schema</strong> tab above, and click <strong>Run</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl glass-card space-y-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  3. Copy Project API Keys
                </h4>
                <p>
                  Go to <strong>Project Settings → API</strong>. Copy the <strong>Project URL</strong> and <strong>anon (public) Key</strong>, and paste them into the Connection Settings tab or into your <code className="font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">.env</code> file.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200/50 dark:border-white/10 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
