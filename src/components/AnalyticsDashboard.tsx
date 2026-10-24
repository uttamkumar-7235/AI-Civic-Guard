import React, { useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Building2, 
  ThumbsUp, 
  Activity, 
  ShieldCheck,
  Award,
  ArrowUpRight
} from 'lucide-react';
import { useIssues } from '../context/IssueContext';
import { CATEGORY_CONFIG, DEPARTMENTS } from '../lib/constants';
import { IssueCategory } from '../types';

export const AnalyticsDashboard: React.FC = () => {
  const { issues, metrics } = useIssues();

  // Category counts
  const categoryStats = useMemo(() => {
    const total = issues.length || 1;
    const cats: { key: IssueCategory; label: string; count: number; percent: number; color: string }[] = [];

    (Object.keys(CATEGORY_CONFIG) as IssueCategory[]).forEach(catKey => {
      const count = issues.filter(i => i.category === catKey).length;
      if (count > 0 || catKey !== 'other') {
        cats.push({
          key: catKey,
          label: CATEGORY_CONFIG[catKey].label,
          count,
          percent: Math.round((count / total) * 100),
          color: CATEGORY_CONFIG[catKey].color,
        });
      }
    });

    return cats.sort((a, b) => b.count - a.count);
  }, [issues]);

  // Department workload
  const departmentStats = useMemo(() => {
    return DEPARTMENTS.map(dept => {
      const deptIssues = issues.filter(i => i.department === dept);
      const total = deptIssues.length;
      const resolved = deptIssues.filter(i => i.status === 'resolved').length;
      const active = total - resolved;
      const rate = total > 0 ? Math.round((resolved / total) * 100) : 100;
      return { dept, total, resolved, active, rate };
    }).sort((a, b) => b.total - a.total);
  }, [issues]);

  // Recent city triumphs (resolved issues)
  const resolvedIssues = useMemo(() => {
    return issues.filter(i => i.status === 'resolved').slice(0, 4);
  }, [issues]);

  return (
    <div className="space-y-6">
      
      {/* Executive Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <span>Civic Intelligence & Resolution Analytics</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time telemetry across municipal departments, SLA velocity, and neighborhood safety indices.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 self-start sm:self-auto">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span>Real-time Sync Active</span>
        </div>
      </div>

      {/* 4 Core Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="glass-card rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Total Reported</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            {metrics.total}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Registered civic issues citywide
          </p>
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Resolution Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-500 mt-2">
            {metrics.resolutionRate}%
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${metrics.resolutionRate}%` }}
            />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Critical Incidents</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {metrics.criticalCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Tier-1 high hazard emergencies active
          </p>
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Avg Severity Index</span>
            <ShieldCheck className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-500 mt-2">
            {metrics.avgPriorityScore}
            <span className="text-sm font-normal text-slate-400">/100</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            AI calculated municipal severity score
          </p>
        </div>

      </div>

      {/* Analytics Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Issues by Category */}
        <div className="glass-panel rounded-3xl p-5 border border-white/20 dark:border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              <span>Incidents by Civic Category</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Distribution %</span>
          </div>

          <div className="space-y-3 pt-2">
            {categoryStats.map(cat => (
              <div key={cat.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {cat.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{cat.count}</span>
                    <span className="text-[10px] text-slate-400">({cat.percent}%)</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                    style={{ width: `${Math.max(5, cat.percent)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Department Workload & Completion Ratio */}
        <div className="glass-panel rounded-3xl p-5 border border-white/20 dark:border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-500" />
              <span>Department Workload & Turnaround</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Active vs Resolved</span>
          </div>

          <div className="space-y-3 pt-2">
            {departmentStats.map(dept => (
              <div key={dept.dept} className="p-3 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-800 dark:text-slate-200">{dept.dept}</span>
                  <span className="text-emerald-500">{dept.rate}% Solved</span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span>Total: <strong>{dept.total}</strong></span>
                  <span>Active: <strong className="text-amber-500">{dept.active}</strong></span>
                  <span>Resolved: <strong className="text-emerald-500">{dept.resolved}</strong></span>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${dept.rate}%` }}
                    title={`Resolved: ${dept.rate}%`}
                  />
                  <div
                    className="bg-amber-400 h-full transition-all duration-500"
                    style={{ width: `${100 - dept.rate}%` }}
                    title={`Active: ${100 - dept.rate}%`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Status Pipeline Visualizer */}
      <div className="glass-panel rounded-3xl p-5 border border-white/20 dark:border-white/10 shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" />
          <span>Citywide Issue Pipeline Lifecycle</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
            <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">
              1. Reported
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {issues.filter(i => i.status === 'reported').length}
            </div>
            <span className="text-[10px] text-slate-400">Queued for review</span>
          </div>

          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center">
            <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400">
              2. Under Review
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {issues.filter(i => i.status === 'under_review').length}
            </div>
            <span className="text-[10px] text-slate-400">Inspector assigned</span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
            <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">
              3. In Progress
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {issues.filter(i => i.status === 'in_progress').length}
            </div>
            <span className="text-[10px] text-slate-400">Crews working on-site</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
              4. Resolved
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {issues.filter(i => i.status === 'resolved').length}
            </div>
            <span className="text-[10px] text-slate-400">Repairs completed</span>
          </div>

        </div>
      </div>

      {/* Recent Resolutions Showcase */}
      {resolvedIssues.length > 0 && (
        <div className="glass-panel rounded-3xl p-5 border border-white/20 dark:border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-500" />
              <span>Recent Municipal Resolutions</span>
            </h3>
            <span className="text-[11px] text-slate-400">Public Accountability Ledger</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {resolvedIssues.map(item => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white line-clamp-1">
                    {item.title}
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                  {item.resolution_notes || 'Resolved by city works crew.'}
                </p>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Department: {item.department}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
