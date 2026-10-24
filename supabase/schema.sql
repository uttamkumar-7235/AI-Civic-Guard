-- ==============================================================================
-- AI CivicGuard: Supabase (PostgreSQL) Production Schema & RLS Policies
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Linked with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'authority', 'admin')),
  department TEXT, -- e.g. 'Public Works', 'Traffic & Transit', 'Sanitation'
  reputation_points INT DEFAULT 10,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  head_contact TEXT,
  sla_hours INT DEFAULT 48,
  active_officers INT DEFAULT 0
);

INSERT INTO public.departments (id, name, sla_hours) VALUES
  ('public-works', 'Public Works & Infrastructure', 72),
  ('traffic', 'Traffic & Road Transit', 24),
  ('sanitation', 'Sanitation & Solid Waste', 24),
  ('water', 'Water Authority & Sewage', 12),
  ('lighting', 'Municipal Lighting & Electrical', 36),
  ('parks', 'Parks & Urban Canopy', 96),
  ('safety', 'Public Safety & Code Compliance', 6)
ON CONFLICT (id) DO NOTHING;

-- 3. ISSUES TABLE
CREATE TABLE IF NOT EXISTS public.issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('roads', 'lighting', 'sanitation', 'water', 'traffic', 'parks', 'safety', 'other')),
  status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'under_review', 'in_progress', 'resolved', 'dismissed')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  priority_score INT DEFAULT 50 CHECK (priority_score >= 1 AND priority_score <= 100),
  
  -- Geographic Location
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT NOT NULL,
  neighborhood TEXT,
  landmark TEXT,
  
  -- Media & AI Metadata
  image_url TEXT,
  ai_analysis JSONB,
  
  -- Ownership & Assignment
  reported_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reporter_name TEXT NOT NULL,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  department TEXT NOT NULL DEFAULT 'Public Works',
  
  -- Community engagement
  upvotes_count INT DEFAULT 1,
  
  -- Resolution details
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  resolution_image_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for high-speed GIS and dashboard queries
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_severity ON public.issues(severity);
CREATE INDEX IF NOT EXISTS idx_issues_category ON public.issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_department ON public.issues(department);
CREATE INDEX IF NOT EXISTS idx_issues_coords ON public.issues(latitude, longitude);

-- 4. ISSUE ACTIVITIES / TIMELINE TABLE
CREATE TABLE IF NOT EXISTS public.issue_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL DEFAULT 'citizen',
  action_type TEXT NOT NULL CHECK (action_type IN ('created', 'status_changed', 'assigned', 'priority_adjusted', 'comment', 'resolved')),
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ISSUE UPVOTES TABLE (Prevent duplicate upvotes)
CREATE TABLE IF NOT EXISTS public.issue_upvotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(issue_id, user_id)
);

-- 6. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can view public profiles; users can update own profile
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Issues: Publicly viewable; Authenticated users can insert; Authority/Admin or creator can edit
CREATE POLICY "Issues are viewable by everyone" 
  ON public.issues FOR SELECT USING (true);

CREATE POLICY "Authenticated citizens can insert issues" 
  ON public.issues FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authorities and Admins can update any issue"
  ON public.issues FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('authority', 'admin')
    ) OR reported_by = auth.uid()
  );

-- Upvotes: Viewable by all; Authenticated can insert/delete own upvote
CREATE POLICY "Upvotes viewable by all"
  ON public.issue_upvotes FOR SELECT USING (true);

CREATE POLICY "Users can manage their own upvotes"
  ON public.issue_upvotes FOR ALL USING (auth.uid() = user_id);

-- Activities: Publicly readable; Authenticated can add
CREATE POLICY "Activities are viewable by everyone"
  ON public.issue_activities FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert activity logs"
  ON public.issue_activities FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Notifications: Users only see their own notifications
CREATE POLICY "Users can see own notifications"
  ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- ==============================================================================
-- STORAGE BUCKETS CONFIGURATION (Supabase Storage)
-- ==============================================================================
-- Insert storage bucket for issue evidence photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('civic-evidence', 'civic-evidence', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Anyone can view uploaded civic evidence photos
CREATE POLICY "Civic evidence photos are publicly accessible" 
  ON storage.objects FOR SELECT USING (bucket_id = 'civic-evidence');

CREATE POLICY "Authenticated users can upload civic evidence" 
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'civic-evidence' AND auth.role() = 'authenticated'
  );
