import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  ThumbsUp, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  User, 
  HardHat, 
  Building2, 
  Navigation, 
  Send,
  AlertCircle,
  CheckCircle,
  UploadCloud,
  FileCheck2,
  ExternalLink
} from 'lucide-react';
import { CivicIssue, IssueStatus } from '../types';
import { CATEGORY_CONFIG, SEVERITY_CONFIG, STATUS_CONFIG } from '../lib/constants';
import { useAuth } from '../context/AuthContext';
import { useIssues } from '../context/IssueContext';

interface IssueDetailModalProps {
  issue: CivicIssue;
  onClose: () => void;
}

export const IssueDetailModal: React.FC<IssueDetailModalProps> = ({ issue, onClose }) => {
  const { currentUser, currentRole } = useAuth();
  const { updateIssueStatus, assignIssue, adjustPriority, toggleUpvote, activities } = useIssues();

  // Authority actions state
  const [selectedStatus, setSelectedStatus] = useState<IssueStatus>(issue.status);
  const [resolutionNotes, setResolutionNotes] = useState(issue.resolution_notes || '');
  const [resolutionImgUrl, setResolutionImgUrl] = useState(issue.resolution_image_url || '');
  const [assigneeInput, setAssigneeInput] = useState(issue.assigned_to || currentUser.full_name);
  const [priorityInput, setPriorityInput] = useState<number>(issue.priority_score);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'ai' | 'timeline' | 'manage'>('overview');

  const issueActivities = activities.filter(a => a.issue_id === issue.id);

  const catConfig = CATEGORY_CONFIG[issue.category] || CATEGORY_CONFIG.other;
  const sevConfig = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.medium;
  const statConfig = STATUS_CONFIG[issue.status] || STATUS_CONFIG.reported;

  const steps: { key: IssueStatus; label: string; step: number }[] = [
    { key: 'reported', label: 'Reported', step: 1 },
    { key: 'under_review', label: 'Under Review', step: 2 },
    { key: 'in_progress', label: 'In Progress', step: 3 },
    { key: 'resolved', label: 'Resolved', step: 4 },
  ];

  const currentStepNumber = statConfig.step;

  const handleSaveStatus = async () => {
    setIsUpdating(true);
    try {
      await updateIssueStatus(issue.id, selectedStatus, resolutionNotes, resolutionImgUrl);
      if (assigneeInput !== issue.assigned_to) {
        await assignIssue(issue.id, assigneeInput);
      }
      if (priorityInput !== issue.priority_score) {
        await adjustPriority(issue.id, priorityInput);
      }
      setActiveTab('overview');
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col glass-panel rounded-3xl overflow-hidden shadow-2xl border border-white/20 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200/50 dark:border-white/10 flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-2.5 py-0.5 rounded-xl text-xs font-bold ${catConfig.bg} ${catConfig.color} border ${catConfig.border}`}>
                {catConfig.label}
              </span>
              <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${sevConfig.badge}`}>
                {sevConfig.label}
              </span>
              <span className={`px-2.5 py-0.5 rounded-xl text-xs font-bold border ${statConfig.badge}`}>
                {statConfig.label}
              </span>
              <span className="text-xs text-slate-400">
                Ticket #{issue.id.toUpperCase()}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
              {issue.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Stepper Tracker */}
        <div className="px-4 sm:px-8 py-3 bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-200/50 dark:border-white/5">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((st, index) => {
              const isCompleted = currentStepNumber >= st.step;
              const isCurrent = currentStepNumber === st.step;
              return (
                <React.Fragment key={st.key}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCompleted
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-4 ring-blue-500/15'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : st.step}
                    </div>
                    <span className={`mt-1.5 text-[11px] font-semibold text-center ${
                      isCurrent
                        ? 'text-blue-600 dark:text-blue-400'
                        : isCompleted
                        ? 'text-slate-700 dark:text-slate-300'
                        : 'text-slate-400'
                    }`}>
                      {st.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${
                      currentStepNumber > st.step
                        ? 'bg-blue-600'
                        : 'bg-slate-200 dark:bg-slate-800'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200/50 dark:border-white/10 px-4 sm:px-6 bg-white/40 dark:bg-slate-900/20">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Overview & Details
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-1.5 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'ai'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
            AI Diagnostics
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'timeline'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Timeline & Audits ({issueActivities.length})
          </button>

          {(currentRole === 'authority' || currentRole === 'admin') && (
            <button
              onClick={() => setActiveTab('manage')}
              className={`flex items-center gap-1.5 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'manage'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <HardHat className="w-3.5 h-3.5 text-amber-500" />
              Authority Dispatch
            </button>
          )}
        </div>

        {/* Modal Body / Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left Column: Photos & Details */}
              <div className="md:col-span-2 space-y-5">
                
                {/* Photo Gallery */}
                {issue.image_url && (
                  <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-black/5">
                    <img
                      src={issue.image_url}
                      alt={issue.title}
                      className="w-full max-h-80 object-cover"
                    />
                  </div>
                )}

                {/* Description */}
                <div className="glass-card rounded-2xl p-4 sm:p-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Issue Description
                  </h4>
                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                    {issue.description}
                  </p>
                </div>

                {/* Official Resolution Report if Resolved */}
                {issue.status === 'resolved' && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                    <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
                      <FileCheck2 className="w-5 h-5" />
                      <h4 className="text-sm font-bold">Official Municipal Resolution</h4>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                      {issue.resolution_notes || 'Repairs completed and site inspected.'}
                    </p>
                    {issue.resolved_at && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                        Resolved on {new Date(issue.resolved_at).toLocaleString()}
                      </p>
                    )}
                    {issue.resolution_image_url && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-emerald-500/30">
                        <img
                          src={issue.resolution_image_url}
                          alt="Resolution evidence"
                          className="w-full h-44 object-cover"
                        />
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Right Column: Meta details, GPS, Upvotes */}
              <div className="space-y-4">
                
                {/* Community Upvote CTA */}
                <div className="glass-card rounded-2xl p-4 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    Does this affect your neighborhood?
                  </p>
                  <button
                    onClick={() => toggleUpvote(issue.id)}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                      issue.has_upvoted
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <ThumbsUp className={`w-4 h-4 ${issue.has_upvoted ? 'fill-current' : ''}`} />
                    <span>{issue.has_upvoted ? 'Upvoted' : 'Upvote Issue'} ({issue.upvotes_count})</span>
                  </button>
                </div>

                {/* Location Card */}
                <div className="glass-card rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    <span>Location & Coordinates</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {issue.location.address}
                  </p>
                  {issue.location.landmark && (
                    <p className="text-[11px] text-slate-500">
                      Landmark: {issue.location.landmark}
                    </p>
                  )}
                  <div className="text-[10px] font-mono text-slate-400 pt-1">
                    GPS: {issue.location.lat.toFixed(5)}, {issue.location.lng.toFixed(5)}
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${issue.location.lat},${issue.location.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline pt-1"
                  >
                    <span>Open in Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Assignment & Department Card */}
                <div className="glass-card rounded-2xl p-4 space-y-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Department Assigned
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <Building2 className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {issue.department}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Officer / Inspector
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <HardHat className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {issue.assigned_to || 'Unassigned (In Dispatch Queue)'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Reported By
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-700 dark:text-slate-300">
                        {issue.reporter_name}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: AI DIAGNOSTICS */}
          {activeTab === 'ai' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {issue.ai_analysis ? (
                <>
                  {/* AI Score Banner */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-600/10 via-blue-600/10 to-indigo-600/10 border border-cyan-500/30">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-cyan-500 text-white shadow-lg shadow-cyan-500/30">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            CivicGuard AI Priority Assessment
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Confidence Score: {(issue.ai_analysis.confidence * 100).toFixed(0)}% • Analyzed via Gemini Diagnostic Model
                          </p>
                        </div>
                      </div>

                      <div className="text-center sm:text-right">
                        <div className="text-3xl font-black bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                          {issue.ai_analysis.priorityScore}/100
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Calculated Severity Index
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary & Recommended Action */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="glass-card rounded-2xl p-4">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        AI Executive Summary
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-200 mt-1 leading-relaxed font-medium">
                        {issue.ai_analysis.summary}
                      </p>
                    </div>

                    <div className="glass-card rounded-2xl p-4">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Recommended Municipal Action
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-200 mt-1 leading-relaxed font-medium">
                        {issue.ai_analysis.recommendedAction}
                      </p>
                    </div>
                  </div>

                  {/* Identified Civic Hazards */}
                  <div className="glass-card rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldAlert className="w-4 h-4 text-rose-500" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Identified Public Hazards
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {issue.ai_analysis.hazards.map((hazard, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        >
                          ⚠️ {hazard}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* SLA & Turnaround Forecast */}
                  <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Estimated Resolution SLA
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Based on municipal equipment availability & weather constraints
                      </p>
                    </div>
                    <span className="text-sm font-bold px-3 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      {issue.ai_analysis.estimatedDays} Days
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center py-10 glass-card rounded-2xl">
                  <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">
                    AI Diagnostic report pending for this ticket.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              {issueActivities.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400">No activity logged yet.</p>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {issueActivities.map(act => (
                    <div key={act.id} className="relative">
                      <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
                      <div className="glass-card rounded-2xl p-3.5">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {act.actor_name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(act.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {act.details}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AUTHORITY MANAGEMENT */}
          {activeTab === 'manage' && (currentRole === 'authority' || currentRole === 'admin') && (
            <div className="max-w-2xl mx-auto space-y-5">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
                <HardHat className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  You are viewing this ticket with <strong>{currentUser.role.toUpperCase()}</strong> credentials. Updates immediately sync to the city registry and notify the reporting citizen.
                </p>
              </div>

              {/* Status Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Update Issue Status
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['reported', 'under_review', 'in_progress', 'resolved'] as IssueStatus[]).map(st => {
                    const isSelected = selectedStatus === st;
                    const conf = STATUS_CONFIG[st];
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setSelectedStatus(st)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-blue-400'
                        }`}
                      >
                        {conf.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Assignee Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Officer / Crew
                </label>
                <input
                  type="text"
                  value={assigneeInput}
                  onChange={e => setAssigneeInput(e.target.value)}
                  placeholder="e.g. Field Crew Beta-2 or Inspector Vance"
                  className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-900 dark:text-white"
                />
              </div>

              {/* Priority Score Override Slider */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Municipal Priority Score (1-100)
                  </label>
                  <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                    {priorityInput}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={priorityInput}
                  onChange={e => setPriorityInput(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              {/* Resolution Notes (Mandatory if resolved) */}
              {selectedStatus === 'resolved' && (
                <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-white/10 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Official Resolution Report Notes *
                    </label>
                    <textarea
                      rows={3}
                      value={resolutionNotes}
                      onChange={e => setResolutionNotes(e.target.value)}
                      placeholder="Specify work completed, equipment utilized, and verification inspection results..."
                      className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Resolution Verification Photo URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={resolutionImgUrl}
                      onChange={e => setResolutionImgUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Submit Update Button */}
              <button
                onClick={handleSaveStatus}
                disabled={isUpdating}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isUpdating ? 'Saving...' : 'Commit Authority Action'}
              </button>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200/50 dark:border-white/10 flex items-center justify-between text-xs text-slate-500">
          <span>Created on {new Date(issue.created_at).toLocaleDateString()}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
