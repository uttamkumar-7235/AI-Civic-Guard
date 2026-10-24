export type UserRole = 'citizen' | 'authority' | 'admin';

export type IssueCategory = 
  | 'roads' 
  | 'lighting' 
  | 'sanitation' 
  | 'water' 
  | 'traffic' 
  | 'parks' 
  | 'safety' 
  | 'other';

export type IssueStatus = 
  | 'reported' 
  | 'under_review' 
  | 'in_progress' 
  | 'resolved' 
  | 'dismissed';

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface LocationData {
  lat: number;
  lng: number;
  address: string;
  neighborhood?: string;
  landmark?: string;
}

export interface AIAnalysisResult {
  severity: IssueSeverity;
  priorityScore: number;
  detectedCategory: string;
  department: string;
  recommendedAction: string;
  estimatedDays: number;
  hazards: string[];
  confidence: number;
  summary: string;
}

export interface CivicIssue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  severity: IssueSeverity;
  priority_score: number;
  location: LocationData;
  image_url?: string;
  ai_analysis?: AIAnalysisResult;
  reported_by: string;
  reporter_name: string;
  assigned_to?: string;
  department: string;
  upvotes_count: number;
  has_upvoted?: boolean;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  resolution_notes?: string;
  resolution_image_url?: string;
}

export interface IssueActivity {
  id: string;
  issue_id: string;
  actor_id: string;
  actor_name: string;
  actor_role: UserRole;
  action_type: 'created' | 'status_changed' | 'assigned' | 'priority_adjusted' | 'comment' | 'resolved';
  details: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  role: UserRole;
  department?: string;
  reputation_points?: number;
  phone?: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  issue_id?: string;
  read: boolean;
  type: 'status_change' | 'assignment' | 'upvote' | 'alert';
  created_at: string;
}

export interface DepartmentInfo {
  id: string;
  name: string;
  head_contact: string;
  sla_hours: number;
  active_officers: number;
  color: string;
}
