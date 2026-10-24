import React from 'react';
import { 
  MapPin, 
  ThumbsUp, 
  AlertTriangle, 
  Clock, 
  ArrowRight,
  Shield,
  CheckCircle2,
  Car,
  Lightbulb,
  Trash2,
  Droplets,
  TrafficCone,
  Trees,
  ShieldAlert,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { CivicIssue } from '../types';
import { CATEGORY_CONFIG, SEVERITY_CONFIG, STATUS_CONFIG } from '../lib/constants';
import { useIssues } from '../context/IssueContext';

interface IssueCardProps {
  issue: CivicIssue;
  onSelect: (issue: CivicIssue) => void;
}

export const IssueCard: React.FC<IssueCardProps> = ({ issue, onSelect }) => {
  const { toggleUpvote } = useIssues();

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'roads': return Car;
      case 'lighting': return Lightbulb;
      case 'sanitation': return Trash2;
      case 'water': return Droplets;
      case 'traffic': return TrafficCone;
      case 'parks': return Trees;
      case 'safety': return ShieldAlert;
      default: return HelpCircle;
    }
  };

  const CategoryIcon = getCategoryIcon(issue.category);
  const catConfig = CATEGORY_CONFIG[issue.category] || CATEGORY_CONFIG.other;
  const sevConfig = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.medium;
  const statConfig = STATUS_CONFIG[issue.status] || STATUS_CONFIG.reported;

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleUpvoteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleUpvote(issue.id);
  };

  return (
    <div
      onClick={() => onSelect(issue)}
      className="group relative glass-card rounded-2xl p-4 sm:p-5 cursor-pointer flex flex-col justify-between overflow-hidden"
    >
      {/* Glow highlight for Critical issues */}
      {issue.severity === 'critical' && issue.status !== 'resolved' && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none"></div>
      )}

      {/* Top Bar: Category badge, Severity, Priority Score */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold ${catConfig.bg} ${catConfig.color} border ${catConfig.border}`}>
              <CategoryIcon className="w-3.5 h-3.5" />
              <span>{catConfig.label}</span>
            </span>
            
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${sevConfig.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sevConfig.bg} ${issue.severity === 'critical' ? 'animate-ping' : ''}`}></span>
              <span>{sevConfig.label}</span>
            </span>
          </div>

          {/* AI Priority Gauge Pill */}
          <div 
            className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10"
            title="AI Calculated Priority Score (1-100)"
          >
            <Sparkles className="w-3 h-3 text-cyan-500" />
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
              {issue.priority_score}
            </span>
            <span className="text-[9px] uppercase font-bold text-slate-400">PRIORITY</span>
          </div>
        </div>

        {/* Issue Media Preview if available */}
        {issue.image_url && (
          <div className="relative w-full h-44 mb-3 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
            <img
              src={issue.image_url}
              alt={issue.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {issue.status === 'resolved' && (
              <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-[2px] flex items-center justify-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold shadow-lg">
                  <CheckCircle2 className="w-4 h-4" />
                  Resolved & Verified
                </span>
              </div>
            )}
          </div>
        )}

        {/* Title and Short Description */}
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {issue.title}
        </h3>

        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-2 leading-relaxed">
          {issue.description}
        </p>

        {/* Location & Department */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
          <div className="flex items-center gap-1 truncate max-w-[200px]" title={issue.location.address}>
            <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate">{issue.location.address}</span>
          </div>
          <span>•</span>
          <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 bg-slate-200/50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md">
            {issue.department}
          </span>
        </div>
      </div>

      {/* Bottom Bar: Status, Reporter time, Upvotes, View Button */}
      <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-2">
        
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border ${statConfig.badge}`}>
            <span className={`w-2 h-2 rounded-full ${statConfig.color.replace('text-', 'bg-')}`}></span>
            {statConfig.label}
          </span>
          <span className="text-[11px] text-slate-400">
            {timeAgo(issue.created_at)}
          </span>
        </div>

        {/* Community Upvote Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleUpvoteClick}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
              issue.has_upvoted
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600'
            }`}
            title="Upvote to raise community priority"
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${issue.has_upvoted ? 'fill-current' : ''}`} />
            <span>{issue.upvotes_count}</span>
          </button>

          <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

      </div>
    </div>
  );
};
