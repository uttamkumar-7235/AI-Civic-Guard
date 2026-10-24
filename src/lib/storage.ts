import { CivicIssue, IssueActivity, NotificationItem, UserProfile } from '../types';
import { INITIAL_ISSUES, INITIAL_ACTIVITIES, INITIAL_NOTIFICATIONS, DEMO_USERS } from '../data/mockData';
import { getSupabase, isSupabaseConfigured } from './supabase';

const STORAGE_ISSUES_KEY = 'civicguard_local_issues_v2';
const STORAGE_ACTIVITIES_KEY = 'civicguard_local_activities_v2';
const STORAGE_NOTIFICATIONS_KEY = 'civicguard_local_notifications_v2';

export class StorageService {
  // Load issues
  static async getIssues(): Promise<CivicIssue[]> {
    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('issues')
          .select('*')
          .order('priority_score', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((row: any) => ({
            id: row.id,
            title: row.title,
            description: row.description,
            category: row.category,
            status: row.status,
            severity: row.severity,
            priority_score: row.priority_score,
            location: {
              lat: row.latitude,
              lng: row.longitude,
              address: row.address,
              neighborhood: row.neighborhood,
              landmark: row.landmark,
            },
            image_url: row.image_url,
            ai_analysis: row.ai_analysis,
            reported_by: row.reported_by,
            reporter_name: row.reporter_name,
            assigned_to: row.assigned_to,
            department: row.department,
            upvotes_count: row.upvotes_count,
            created_at: row.created_at,
            updated_at: row.updated_at,
            resolved_at: row.resolved_at,
            resolution_notes: row.resolution_notes,
            resolution_image_url: row.resolution_image_url,
          }));
        }
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to local store:', err);
      }
    }

    // Local storage fallback
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_ISSUES_KEY) : null;
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error('Error parsing local issues:', e);
      }
    }

    // First time init: save initial issues
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ISSUES_KEY, JSON.stringify(INITIAL_ISSUES));
    }
    return INITIAL_ISSUES;
  }

  // Create new issue
  static async createIssue(issue: Omit<CivicIssue, 'id' | 'created_at' | 'updated_at' | 'upvotes_count'>): Promise<CivicIssue> {
    const newId = 'iss-' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();
    const newIssue: CivicIssue = {
      ...issue,
      id: newId,
      created_at: now,
      updated_at: now,
      upvotes_count: 1,
      has_upvoted: true,
    };

    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('issues').insert({
          title: newIssue.title,
          description: newIssue.description,
          category: newIssue.category,
          status: newIssue.status,
          severity: newIssue.severity,
          priority_score: newIssue.priority_score,
          latitude: newIssue.location.lat,
          longitude: newIssue.location.lng,
          address: newIssue.location.address,
          neighborhood: newIssue.location.neighborhood,
          landmark: newIssue.location.landmark,
          image_url: newIssue.image_url,
          ai_analysis: newIssue.ai_analysis,
          reporter_name: newIssue.reporter_name,
          department: newIssue.department,
          upvotes_count: 1,
        }).select().single();

        if (!error && data) {
          newIssue.id = data.id;
        }
      } catch (err) {
        console.warn('Supabase insert issue failed, stored locally:', err);
      }
    }

    // Store in local storage
    const current = await this.getIssues();
    const updated = [newIssue, ...current];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ISSUES_KEY, JSON.stringify(updated));
    }

    // Add activity log
    await this.addActivity({
      issue_id: newIssue.id,
      actor_id: newIssue.reported_by,
      actor_name: newIssue.reporter_name,
      actor_role: 'citizen',
      action_type: 'created',
      details: `Filed report with AI severity "${newIssue.severity.toUpperCase()}" and priority score ${newIssue.priority_score}/100.`,
    });

    return newIssue;
  }

  // Update issue status / assignment / resolution
  static async updateIssue(id: string, updates: Partial<CivicIssue>, actor: { id: string; name: string; role: any }): Promise<CivicIssue | null> {
    const supabase = getSupabase();
    const now = new Date().toISOString();

    if (supabase && isSupabaseConfigured()) {
      try {
        const payload: any = { updated_at: now };
        if (updates.status) payload.status = updates.status;
        if (updates.severity) payload.severity = updates.severity;
        if (updates.priority_score !== undefined) payload.priority_score = updates.priority_score;
        if (updates.assigned_to !== undefined) payload.assigned_to = updates.assigned_to;
        if (updates.department) payload.department = updates.department;
        if (updates.resolution_notes !== undefined) payload.resolution_notes = updates.resolution_notes;
        if (updates.resolution_image_url !== undefined) payload.resolution_image_url = updates.resolution_image_url;
        if (updates.resolved_at !== undefined) payload.resolved_at = updates.resolved_at;

        await supabase.from('issues').update(payload).eq('id', id);
      } catch (err) {
        console.warn('Supabase update failed:', err);
      }
    }

    const issues = await this.getIssues();
    const index = issues.findIndex(i => i.id === id);
    if (index === -1) return null;

    const current = issues[index];
    const updatedIssue: CivicIssue = {
      ...current,
      ...updates,
      updated_at: now,
    };
    issues[index] = updatedIssue;

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ISSUES_KEY, JSON.stringify(issues));
    }

    // Generate activity
    let actionDesc = '';
    if (updates.status && updates.status !== current.status) {
      actionDesc = `Status transitioned from ${current.status.replace('_', ' ')} to ${updates.status.replace('_', ' ')}.`;
      if (updates.resolution_notes) {
        actionDesc += ` Resolution: "${updates.resolution_notes}"`;
      }
    } else if (updates.assigned_to && updates.assigned_to !== current.assigned_to) {
      actionDesc = `Assigned ticket to ${updates.assigned_to}.`;
    } else if (updates.priority_score && updates.priority_score !== current.priority_score) {
      actionDesc = `Priority adjusted to ${updates.priority_score}/100.`;
    }

    if (actionDesc) {
      await this.addActivity({
        issue_id: id,
        actor_id: actor.id,
        actor_name: actor.name,
        actor_role: actor.role,
        action_type: updates.status === 'resolved' ? 'resolved' : 'status_changed',
        details: actionDesc,
      });
    }

    return updatedIssue;
  }

  // Toggle upvote
  static async toggleUpvote(issueId: string, _userId: string): Promise<{ upvotes_count: number; has_upvoted: boolean }> {
    const issues = await this.getIssues();
    const issue = issues.find(i => i.id === issueId);
    if (!issue) return { upvotes_count: 0, has_upvoted: false };

    const wasUpvoted = !!issue.has_upvoted;
    const newCount = wasUpvoted ? Math.max(0, issue.upvotes_count - 1) : issue.upvotes_count + 1;
    issue.has_upvoted = !wasUpvoted;
    issue.upvotes_count = newCount;

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ISSUES_KEY, JSON.stringify(issues));
    }

    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from('issues').update({ upvotes_count: newCount }).eq('id', issueId);
      } catch (err) {
        console.warn('Failed to sync upvote with Supabase:', err);
      }
    }

    return { upvotes_count: newCount, has_upvoted: !wasUpvoted };
  }

  // Activities
  static async getActivities(issueId?: string): Promise<IssueActivity[]> {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_ACTIVITIES_KEY) : null;
    let list: IssueActivity[] = INITIAL_ACTIVITIES;
    if (raw) {
      try {
        list = JSON.parse(raw);
      } catch (e) {
        console.error('Error parsing activities:', e);
      }
    } else if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ACTIVITIES_KEY, JSON.stringify(INITIAL_ACTIVITIES));
    }

    if (issueId) {
      return list.filter(a => a.issue_id === issueId);
    }
    return list;
  }

  static async addActivity(activity: Omit<IssueActivity, 'id' | 'created_at'>): Promise<IssueActivity> {
    const newActivity: IssueActivity = {
      ...activity,
      id: 'act-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
    };

    const current = await this.getActivities();
    const updated = [newActivity, ...current];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ACTIVITIES_KEY, JSON.stringify(updated));
    }
    return newActivity;
  }

  // Notifications
  static async getNotifications(): Promise<NotificationItem[]> {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_NOTIFICATIONS_KEY) : null;
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error('Error parsing notifications:', e);
      }
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_NOTIFICATIONS_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
    }
    return INITIAL_NOTIFICATIONS;
  }

  static async markNotificationRead(id: string): Promise<void> {
    const list = await this.getNotifications();
    const item = list.find(n => n.id === id);
    if (item) {
      item.read = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_NOTIFICATIONS_KEY, JSON.stringify(list));
      }
    }
  }

  // Reset demo state
  static resetDemoData(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ISSUES_KEY, JSON.stringify(INITIAL_ISSUES));
      localStorage.setItem(STORAGE_ACTIVITIES_KEY, JSON.stringify(INITIAL_ACTIVITIES));
      localStorage.setItem(STORAGE_NOTIFICATIONS_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
    }
  }
}
