import React from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  PlusCircle, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { useIssues } from '../context/IssueContext';
import { IssueCard } from './IssueCard';
import { CivicIssue, IssueCategory, IssueSeverity, IssueStatus } from '../types';
import { CATEGORY_CONFIG, DEPARTMENTS } from '../lib/constants';

interface IssueFeedProps {
  onSelectIssue: (issue: CivicIssue) => void;
  onOpenReportModal: () => void;
  onOpenMap: () => void;
}

export const IssueFeed: React.FC<IssueFeedProps> = ({ 
  onSelectIssue, 
  onOpenReportModal,
  onOpenMap 
}) => {
  const {
    filteredIssues,
    loading,
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    filterStatus,
    setFilterStatus,
    filterSeverity,
    setFilterSeverity,
    filterDepartment,
    setFilterDepartment,
    sortBy,
    setSortBy,
    metrics,
  } = useIssues();

  const resetFilters = () => {
    setSearchQuery('');
    setFilterCategory('all');
    setFilterStatus('all');
    setFilterSeverity('all');
    setFilterDepartment('all');
  };

  const hasActiveFilters = 
    searchQuery || 
    filterCategory !== 'all' || 
    filterStatus !== 'all' || 
    filterSeverity !== 'all' || 
    filterDepartment !== 'all';

  return (
    <div className="space-y-6">
      
      {/* Hero Welcome & Quick Metric Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-panel p-6 sm:p-8 border border-white/20 dark:border-white/10 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 dark:bg-blue-400/20 text-blue-600 dark:text-blue-300 text-xs font-bold border border-blue-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Urban Infrastructure Monitoring</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Fix your neighborhood faster with <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 dark:from-cyan-400 dark:via-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">
              Automated Severity & Priority Routing
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
            Report broken streetlights, hazardous potholes, or water main ruptures with photos and GPS. Our AI engine instantly computes severity scores, determines risk hazards, and dispatches field crews.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onOpenReportModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report a Civic Issue</span>
            </button>

            <button
              onClick={onOpenMap}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold glass-card text-slate-700 dark:text-slate-200 hover:text-blue-600 hover:border-blue-400/50 transition-all"
            >
              <span>Explore Interactive Map</span>
            </button>
          </div>
        </div>

        {/* Ambient decorative gradient circle */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-blue-500/15 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Filter and Search Command Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-white/20 dark:border-white/10 shadow-lg space-y-3">
        
        {/* Top search & sorting row */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by issue title, landmark, address, or department..."
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm glass-input text-slate-900 dark:text-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl text-xs glass-input text-slate-800 dark:text-slate-200 font-semibold"
            >
              <option value="priority">Highest Priority (AI)</option>
              <option value="upvotes">Most Upvoted</option>
              <option value="recent">Most Recent</option>
            </select>
          </div>

        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
              filterCategory === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>

          {(Object.keys(CATEGORY_CONFIG) as IssueCategory[]).map(catKey => {
            const conf = CATEGORY_CONFIG[catKey];
            const isSelected = filterCategory === catKey;
            return (
              <button
                key={catKey}
                onClick={() => setFilterCategory(catKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {conf.label}
              </button>
            );
          })}
        </div>

        {/* Secondary dropdown filters: Severity, Status, Department */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/50 dark:border-white/5">
          
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl text-xs glass-input text-slate-700 dark:text-slate-300"
          >
            <option value="all">Status: All</option>
            <option value="reported">Reported</option>
            <option value="under_review">Under Review</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl text-xs glass-input text-slate-700 dark:text-slate-300"
          >
            <option value="all">Severity: All</option>
            <option value="critical">Critical Emergency</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filterDepartment}
            onChange={e => setFilterDepartment(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl text-xs glass-input text-slate-700 dark:text-slate-300"
          >
            <option value="all">Department: All</option>
            {DEPARTMENTS.map(dept => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs font-bold text-rose-500 hover:underline px-2 py-1"
            >
              Reset Filters
            </button>
          )}

          <div className="ml-auto text-xs text-slate-400 font-medium">
            Showing <strong>{filteredIssues.length}</strong> reports
          </div>

        </div>

      </div>

      {/* Issues Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="glass-card rounded-2xl p-5 h-64 animate-pulse bg-slate-200/40 dark:bg-slate-800/40" />
          ))}
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-3xl p-8 border border-white/20 dark:border-white/10">
          <ShieldAlert className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No civic issues found matching your filters.
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Try resetting your search query or report a new issue in your neighborhood.
          </p>
          <div className="flex justify-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Clear Filters
              </button>
            )}
            <button
              onClick={onOpenReportModal}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md"
            >
              Report New Issue
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredIssues.map(issue => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onSelect={onSelectIssue}
            />
          ))}
        </div>
      )}

    </div>
  );
};
