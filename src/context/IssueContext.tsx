import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { CivicIssue, IssueStatus, IssueSeverity, NotificationItem, IssueActivity } from '../types';
import { StorageService } from '../lib/storage';
import { useAuth } from './AuthContext';
import confetti from 'canvas-confetti';

interface IssueContextType {
  issues: CivicIssue[];
  loading: boolean;
  error: string | null;
  refreshIssues: () => Promise<void>;
  selectedIssue: CivicIssue | null;
  setSelectedIssue: (issue: CivicIssue | null) => void;
  createIssue: (issueData: Omit<CivicIssue, 'id' | 'created_at' | 'updated_at' | 'upvotes_count'>) => Promise<CivicIssue>;
  updateIssueStatus: (issueId: string, status: IssueStatus, resolutionNotes?: string, resolutionImageUrl?: string) => Promise<void>;
  assignIssue: (issueId: string, assigneeName: string) => Promise<void>;
  adjustPriority: (issueId: string, newScore: number) => Promise<void>;
  toggleUpvote: (issueId: string) => Promise<void>;
  activities: IssueActivity[];
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  markNotificationRead: (id: string) => Promise<void>;
  
  // Filters & Search
  filterCategory: string;
  setFilterCategory: (cat: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  filterSeverity: string;
  setFilterSeverity: (sev: string) => void;
  filterDepartment: string;
  setFilterDepartment: (dep: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: 'priority' | 'upvotes' | 'recent';
  setSortBy: (sort: 'priority' | 'upvotes' | 'recent') => void;
  
  filteredIssues: CivicIssue[];
  metrics: {
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    criticalCount: number;
    resolutionRate: number;
    avgPriorityScore: number;
  };
}

const IssueContext = createContext<IssueContextType | undefined>(undefined);

export const IssueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null);
  const [activities, setActivities] = useState<IssueActivity[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Filter states
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'priority' | 'upvotes' | 'recent'>('priority');

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [fetchedIssues, fetchedActivities, fetchedNotifs] = await Promise.all([
        StorageService.getIssues(),
        StorageService.getActivities(),
        StorageService.getNotifications(),
      ]);
      setIssues(fetchedIssues);
      setActivities(fetchedActivities);
      setNotifications(fetchedNotifs);
    } catch (err: any) {
      console.error('Failed to load civic data:', err);
      setError('Unable to load issues. Please check connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const createIssue = async (issueData: Omit<CivicIssue, 'id' | 'created_at' | 'updated_at' | 'upvotes_count'>): Promise<CivicIssue> => {
    const created = await StorageService.createIssue(issueData);
    setIssues(prev => [created, ...prev]);
    
    // Trigger celebratory confetti for civic action
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {
      // safe fallback
    }

    // Refresh activities
    const acts = await StorageService.getActivities();
    setActivities(acts);
    return created;
  };

  const updateIssueStatus = async (
    issueId: string, 
    status: IssueStatus, 
    resolutionNotes?: string, 
    resolutionImageUrl?: string
  ) => {
    const updates: Partial<CivicIssue> = {
      status,
      resolution_notes: resolutionNotes,
      resolution_image_url: resolutionImageUrl,
    };
    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }

    const updated = await StorageService.updateIssue(
      issueId,
      updates,
      { id: currentUser.id, name: currentUser.full_name, role: currentUser.role }
    );

    if (updated) {
      setIssues(prev => prev.map(i => (i.id === issueId ? updated : i)));
      if (selectedIssue && selectedIssue.id === issueId) {
        setSelectedIssue(updated);
      }
      const acts = await StorageService.getActivities();
      setActivities(acts);
    }
  };

  const assignIssue = async (issueId: string, assigneeName: string) => {
    const updated = await StorageService.updateIssue(
      issueId,
      { assigned_to: assigneeName, status: 'under_review' },
      { id: currentUser.id, name: currentUser.full_name, role: currentUser.role }
    );
    if (updated) {
      setIssues(prev => prev.map(i => (i.id === issueId ? updated : i)));
      if (selectedIssue && selectedIssue.id === issueId) {
        setSelectedIssue(updated);
      }
      const acts = await StorageService.getActivities();
      setActivities(acts);
    }
  };

  const adjustPriority = async (issueId: string, newScore: number) => {
    const updated = await StorageService.updateIssue(
      issueId,
      { priority_score: newScore },
      { id: currentUser.id, name: currentUser.full_name, role: currentUser.role }
    );
    if (updated) {
      setIssues(prev => prev.map(i => (i.id === issueId ? updated : i)));
      if (selectedIssue && selectedIssue.id === issueId) {
        setSelectedIssue(updated);
      }
    }
  };

  const toggleUpvote = async (issueId: string) => {
    const { upvotes_count, has_upvoted } = await StorageService.toggleUpvote(issueId, currentUser.id);
    setIssues(prev =>
      prev.map(i => (i.id === issueId ? { ...i, upvotes_count, has_upvoted } : i))
    );
    if (selectedIssue && selectedIssue.id === issueId) {
      setSelectedIssue(prev => prev ? { ...prev, upvotes_count, has_upvoted } : null);
    }
  };

  const markNotificationRead = async (id: string) => {
    await StorageService.markNotificationRead(id);
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  // Filtered issues computation
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      // Category filter
      if (filterCategory !== 'all' && issue.category !== filterCategory) return false;
      // Status filter
      if (filterStatus !== 'all' && issue.status !== filterStatus) return false;
      // Severity filter
      if (filterSeverity !== 'all' && issue.severity !== filterSeverity) return false;
      // Department filter
      if (filterDepartment !== 'all' && issue.department !== filterDepartment) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = issue.title.toLowerCase().includes(q);
        const matchesDesc = issue.description.toLowerCase().includes(q);
        const matchesAddress = issue.location.address.toLowerCase().includes(q);
        const matchesDept = issue.department.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesAddress && !matchesDept) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'priority') {
        return b.priority_score - a.priority_score;
      }
      if (sortBy === 'upvotes') {
        return b.upvotes_count - a.upvotes_count;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [issues, filterCategory, filterStatus, filterSeverity, filterDepartment, searchQuery, sortBy]);

  // Overall metrics
  const metrics = useMemo(() => {
    const total = issues.length;
    const pending = issues.filter(i => i.status === 'reported' || i.status === 'under_review').length;
    const inProgress = issues.filter(i => i.status === 'in_progress').length;
    const resolved = issues.filter(i => i.status === 'resolved').length;
    const criticalCount = issues.filter(i => i.severity === 'critical' && i.status !== 'resolved').length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    const avgPriorityScore = total > 0 ? Math.round(issues.reduce((acc, i) => acc + i.priority_score, 0) / total) : 0;

    return {
      total,
      pending,
      inProgress,
      resolved,
      criticalCount,
      resolutionRate,
      avgPriorityScore,
    };
  }, [issues]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  return (
    <IssueContext.Provider
      value={{
        issues,
        loading,
        error,
        refreshIssues: loadAllData,
        selectedIssue,
        setSelectedIssue,
        createIssue,
        updateIssueStatus,
        assignIssue,
        adjustPriority,
        toggleUpvote,
        activities,
        notifications,
        unreadNotificationsCount,
        markNotificationRead,
        filterCategory,
        setFilterCategory,
        filterStatus,
        setFilterStatus,
        filterSeverity,
        setFilterSeverity,
        filterDepartment,
        setFilterDepartment,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        filteredIssues,
        metrics,
      }}
    >
      {children}
    </IssueContext.Provider>
  );
};

export const useIssues = () => {
  const context = useContext(IssueContext);
  if (!context) {
    throw new Error('useIssues must be used within an IssueProvider');
  }
  return context;
};
