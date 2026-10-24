import { IssueCategory, IssueSeverity, IssueStatus } from '../types';

export const CATEGORY_CONFIG: Record<
  IssueCategory,
  { label: string; icon: string; color: string; bg: string; border: string }
> = {
  roads: {
    label: 'Roads & Potholes',
    icon: 'Car',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    border: 'border-amber-500/30',
  },
  lighting: {
    label: 'Street Lighting',
    icon: 'Lightbulb',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10 dark:bg-yellow-500/20',
    border: 'border-yellow-500/30',
  },
  sanitation: {
    label: 'Sanitation & Waste',
    icon: 'Trash2',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    border: 'border-emerald-500/30',
  },
  water: {
    label: 'Water & Sewage',
    icon: 'Droplets',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    border: 'border-blue-500/30',
  },
  traffic: {
    label: 'Traffic & Signals',
    icon: 'TrafficCone',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    border: 'border-rose-500/30',
  },
  parks: {
    label: 'Parks & Trees',
    icon: 'Trees',
    color: 'text-teal-500',
    bg: 'bg-teal-500/10 dark:bg-teal-500/20',
    border: 'border-teal-500/30',
  },
  safety: {
    label: 'Public Safety',
    icon: 'ShieldAlert',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    border: 'border-purple-500/30',
  },
  other: {
    label: 'Other Civic Issue',
    icon: 'HelpCircle',
    color: 'text-gray-500',
    bg: 'bg-gray-500/10 dark:bg-gray-500/20',
    border: 'border-gray-500/30',
  },
};

export const SEVERITY_CONFIG: Record<
  IssueSeverity,
  { label: string; badge: string; dot: string; text: string; bg: string }
> = {
  critical: {
    label: 'Critical Emergency',
    badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    dot: 'bg-rose-500 ring-rose-400',
    text: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-500',
  },
  high: {
    label: 'High Priority',
    badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    dot: 'bg-amber-500 ring-amber-400',
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500',
  },
  medium: {
    label: 'Medium Severity',
    badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    dot: 'bg-blue-500 ring-blue-400',
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500',
  },
  low: {
    label: 'Low Priority',
    badge: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
    dot: 'bg-slate-500 ring-slate-400',
    text: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-500',
  },
};

export const STATUS_CONFIG: Record<
  IssueStatus,
  { label: string; step: number; color: string; badge: string; description: string }
> = {
  reported: {
    label: 'Reported',
    step: 1,
    color: 'text-blue-500',
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    description: 'Received & cataloged in municipal registry.',
  },
  under_review: {
    label: 'Under Review',
    step: 2,
    color: 'text-purple-500',
    badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    description: 'Assigned to field inspector for assessment.',
  },
  in_progress: {
    label: 'In Progress',
    step: 3,
    color: 'text-amber-500',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    description: 'Work crew dispatched on-site conducting repairs.',
  },
  resolved: {
    label: 'Resolved',
    step: 4,
    color: 'text-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    description: 'Repairs completed and verified with evidence.',
  },
  dismissed: {
    label: 'Dismissed',
    step: 0,
    color: 'text-gray-400',
    badge: 'bg-gray-500/10 text-gray-500 border-gray-500/30',
    description: 'Duplicate or non-municipal jurisdiction.',
  },
};

export const DEPARTMENTS = [
  'Public Works',
  'Electricity & Lighting',
  'Water & Sewage',
  'Sanitation & Waste',
  'Traffic & Transit',
  'Parks & Recreation',
  'Public Safety',
];
