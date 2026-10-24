import React, { useState, useMemo } from 'react';
import { 
  HardHat, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Building2, 
  Filter, 
  ArrowUpDown, 
  Send, 
  UserCheck, 
  FileText, 
  ShieldCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { CivicIssue, IssueStatus } from '../types';
import { CATEGORY_CONFIG, SEVERITY_CONFIG, STATUS_CONFIG, DEPARTMENTS } from '../lib/constants';
import { useAuth } from '../context/AuthContext';
import { useIssues } from '../context/IssueContext';

interface AuthorityDashboardProps {
  onSelectIssue: (issue: CivicIssue) => void;
}

export const AuthorityDashboard: React.FC<AuthorityDashboardProps> = ({ onSelectIssue }) => {
  const { currentUser, currentRole, switchRole } = useAuth();
  const { issues, updateIssueStatus, assignIssue } = useIssues();

  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('unresolved');
  const [activeDispatchIssue, setActiveDispatchIssue] = useState<CivicIssue | null>(null);
  const [quickStatus, setQuickStatus] = useState<IssueStatus>('in_progress');
  const [quickAssignee, setQuickAssignee] = useState<string>(currentUser.full_name);
  const [quickNotes, setQuickNotes] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Filter issues for authority view
  const authorityIssues = useMemo(() => {
    return issues.filter(issue => {
      if (selectedDept !== 'all' && issue.department !== selectedDept) return false;
      if (statusFilter === 'unresolved' && issue.status === 'resolved') return false;
      if (statusFilter === 'critical' && issue.severity !== 'critical') return false;
      if (statusFilter === 'in_progress' && issue.status !== 'in_progress') return false;
      return true;
    }).sort((a, b) => b.priority_score - a.priority_score);
  }, [issues, selectedDept, statusFilter]);

  // Urgent tickets (priority >= 75)
  const urgentQueue = useMemo(() => {
    return issues.filter(i => i.priority_score >= 75 && i.status !== 'resolved');
  }, [issues]);

  const handleQuickDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDispatchIssue) return;

    setIsUpdating(true);
    try {
      await updateIssueStatus(
        activeDispatchIssue.id,
        quickStatus,
        quickNotes || undefined
      );
      if (quickAssignee && quickAssignee !== activeDispatchIssue.assigned_to) {
        await assignIssue(activeDispatchIssue.id, quickAssignee);
      }
      setActiveDispatchIssue(null);
      setQuickNotes('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Role Banner if Citizen is viewing */}
      {currentRole === 'citizen' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <HardHat className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Viewing Authority Command Console in Preview Mode
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Switch to Inspector or Admin persona to test live dispatching and status transitions.
              </p>
            </div>
          </div>
          <button
            onClick={() => switchRole('authority')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors shrink-0 shadow-md"
          >
            Switch to Municipal Inspector
          </button>
        </div>
      )}

      {/* Top Stat KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="glass-card rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-400">
              Urgent Action Queue
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {urgentQueue.length}
          </div>
          <span className="text-[11px] text-slate-500">
            Priority score ≥ 75 needing triage
          </span>
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-400">
              In-Field Dispatch
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-500 mt-2">
            {issues.filter(i => i.status === 'in_progress').length}
          </div>
          <span className="text-[11px] text-slate-500">
            Crews currently deployed on-site
          </span>
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-400">
              Under Review
            </span>
            <FileText className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-500 mt-2">
            {issues.filter(i => i.status === 'under_review').length}
          </div>
          <span className="text-[11px] text-slate-500">
            Initial field inspection pending
          </span>
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-400">
              Resolved Cases
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-500 mt-2">
            {issues.filter(i => i.status === 'resolved').length}
          </div>
          <span className="text-[11px] text-slate-500">
            Repairs completed & verified
          </span>
        </div>

      </div>

      {/* Filter and Control Bar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        
        {/* Department Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedDept('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedDept === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All Departments
          </button>

          {DEPARTMENTS.slice(0, 5).map(dept => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedDept === dept
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {dept.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Status Mode Select */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">Filter:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs glass-input text-slate-800 dark:text-slate-200"
          >
            <option value="unresolved">Active / Unresolved</option>
            <option value="critical">Critical Emergency Only</option>
            <option value="in_progress">Currently In-Field</option>
            <option value="all">All Records</option>
          </select>
        </div>

      </div>

      {/* Main Authority Dispatch Table / Card Grid */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-white/20 dark:border-white/10 shadow-xl">
        <div className="px-5 py-4 border-b border-slate-200/50 dark:border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HardHat className="w-4 h-4 text-blue-500" />
            <span>Municipal Dispatch Queue ({authorityIssues.length} tickets)</span>
          </h3>
          <span className="text-[11px] text-slate-400">
            Sorted by AI Priority Score
          </span>
        </div>

        <div className="divide-y divide-slate-200/50 dark:divide-white/5">
          {authorityIssues.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-60" />
              <p className="text-xs text-slate-500">No pending issues match your department criteria.</p>
            </div>
          ) : (
            authorityIssues.map(issue => {
              const sevConfig = SEVERITY_CONFIG[issue.severity];
              const statConfig = STATUS_CONFIG[issue.status];
              return (
                <div
                  key={issue.id}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {/* Left: Priority & Info */}
                  <div className="flex items-start gap-3.5 flex-1 cursor-pointer" onClick={() => onSelectIssue(issue)}>
                    {/* Priority Score Circle */}
                    <div 
                      className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 border ${
                        issue.priority_score >= 80 
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400' 
                          : 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      <span className="text-sm font-black leading-none">{issue.priority_score}</span>
                      <span className="text-[8px] font-bold uppercase tracking-wider">SCORE</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${sevConfig.badge}`}>
                          {sevConfig.label}
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${statConfig.badge}`}>
                          {statConfig.label}
                        </span>
                        <span className="text-xs text-slate-400">
                          {issue.department}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                        {issue.title}
                      </h4>

                      <p className="text-xs text-slate-500 line-clamp-1">
                        📍 {issue.location.address} • Reported by {issue.reporter_name}
                      </p>
                    </div>
                  </div>

                  {/* Right: Quick Authority Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      onClick={() => {
                        setActiveDispatchIssue(issue);
                        setQuickStatus(issue.status === 'reported' ? 'in_progress' : issue.status);
                        setQuickAssignee(issue.assigned_to || currentUser.full_name);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-all flex items-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Dispatch / Triage</span>
                    </button>

                    <button
                      onClick={() => onSelectIssue(issue)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Quick Dispatch Drawer / Modal */}
      {activeDispatchIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="w-full max-w-lg glass-panel rounded-3xl p-6 shadow-2xl border border-white/20 dark:border-white/10 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <HardHat className="w-5 h-5 text-blue-500" />
              <span>Quick Municipal Dispatch: #{activeDispatchIssue.id.toUpperCase()}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4 line-clamp-1">
              {activeDispatchIssue.title}
            </p>

            <form onSubmit={handleQuickDispatch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Change Issue Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['under_review', 'in_progress', 'resolved'] as IssueStatus[]).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setQuickStatus(st)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        quickStatus === st
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10'
                      }`}
                    >
                      {STATUS_CONFIG[st].label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Officer / Crew Name
                </label>
                <input
                  type="text"
                  value={quickAssignee}
                  onChange={e => setQuickAssignee(e.target.value)}
                  placeholder="e.g. Inspector Vance (Public Works Alpha)"
                  className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Official Dispatch or Resolution Note
                </label>
                <textarea
                  rows={2}
                  value={quickNotes}
                  onChange={e => setQuickNotes(e.target.value)}
                  placeholder="e.g. Field crew dispatched with hot-mix asphalt asphalt machine..."
                  className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveDispatchIssue(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-all"
                >
                  {isUpdating ? 'Saving...' : 'Apply Dispatch Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
