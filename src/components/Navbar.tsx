import React, { useState } from 'react';
import { 
  ShieldCheck, 
  MapPin, 
  ListFilter, 
  BarChart3, 
  Bot, 
  PlusCircle, 
  Bell, 
  Database, 
  Sun, 
  Moon, 
  UserCircle, 
  ChevronDown,
  HardHat,
  Crown,
  User,
  CheckCircle2,
  AlertTriangle,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useIssues } from '../context/IssueContext';
import { UserRole } from '../types';

interface NavbarProps {
  activeTab: 'feed' | 'map' | 'authority' | 'analytics' | 'advisor';
  setActiveTab: (tab: 'feed' | 'map' | 'authority' | 'analytics' | 'advisor') => void;
  onOpenReportModal: () => void;
  onOpenDbModal: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenReportModal,
  onOpenDbModal,
  darkMode,
  setDarkMode,
}) => {
  const { currentUser, currentRole, switchRole, isSupabaseLive } = useAuth();
  const { notifications, unreadNotificationsCount, markNotificationRead, setSelectedIssue, issues } = useIssues();
  
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const roles: { role: UserRole; title: string; subtitle: string; icon: any }[] = [
    { role: 'citizen', title: 'Citizen Reporter', subtitle: 'Sarah Jenkins', icon: User },
    { role: 'authority', title: 'Municipal Inspector', subtitle: 'Inspector Vance (Public Works)', icon: HardHat },
    { role: 'admin', title: 'City Director (Admin)', subtitle: 'Elena Rostova', icon: Crown },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/20 dark:border-white/10 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('feed')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25">
              <ShieldCheck className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 dark:from-cyan-400 dark:via-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">
                  CivicGuard
                </span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-500/10 dark:bg-blue-400/20 text-blue-600 dark:text-blue-300 border border-blue-500/20">
                  AI
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 font-medium -mt-0.5">
                Intelligent Municipal Platform
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/70 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200/50 dark:border-white/5">
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'feed'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Issues Feed</span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'map'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Interactive Map</span>
            </button>

            <button
              onClick={() => setActiveTab('authority')}
              className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'authority'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <HardHat className="w-3.5 h-3.5" />
              <span>Authority Dispatch</span>
              {currentRole !== 'citizen' && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('advisor')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'advisor'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-indigo-500" />
              <span>AI Advisor</span>
            </button>
          </nav>

          {/* Action Area: Report Button, DB Status, Role Switcher, Notifications, Dark Mode */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Primary Report CTA */}
            <button
              onClick={onOpenReportModal}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-md shadow-blue-500/25 active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Report Issue</span>
              <span className="sm:hidden">Report</span>
            </button>

            {/* Supabase Status Pill */}
            <button
              onClick={onOpenDbModal}
              title="Supabase Database Configuration & SQL Schema"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                isSupabaseLive
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300/50 dark:border-white/10 hover:border-blue-400'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-[11px] font-semibold">
                {isSupabaseLive ? 'Supabase Live' : 'Supabase SQL'}
              </span>
              <span className={`w-2 h-2 rounded-full ${isSupabaseLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-rose-500 rounded-full">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-panel rounded-2xl p-3 shadow-2xl border border-slate-200 dark:border-slate-700/60 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/50 dark:border-slate-700/50">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Notifications ({unreadNotificationsCount} Unread)
                    </span>
                    <button
                      onClick={() => setShowNotifMenu(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-center py-4 text-xs text-slate-500">No notifications yet.</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markNotificationRead(n.id);
                            if (n.issue_id) {
                              const iss = issues.find(i => i.id === n.issue_id);
                              if (iss) setSelectedIssue(iss);
                            }
                            setShowNotifMenu(false);
                          }}
                          className={`p-2.5 rounded-xl cursor-pointer text-left transition-all ${
                            n.read
                              ? 'bg-slate-50/50 dark:bg-slate-800/40 opacity-70'
                              : 'bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-800/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {n.title}
                            </span>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1"></span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Role Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all text-xs font-medium"
              >
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.full_name}
                  className="w-6 h-6 rounded-full object-cover ring-2 ring-blue-500/30"
                />
                <div className="hidden sm:block text-left">
                  <div className="text-[11px] font-bold text-slate-900 dark:text-white capitalize flex items-center gap-1">
                    {currentRole}
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </div>
                </div>
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 glass-panel rounded-2xl p-2 shadow-2xl border border-slate-200 dark:border-slate-700/60 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-200/50 dark:border-slate-700/50 mb-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Switch Role Persona
                    </p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {currentUser.full_name}
                    </p>
                  </div>
                  {roles.map(r => {
                    const Icon = r.icon;
                    const isSelected = currentRole === r.role;
                    return (
                      <button
                        key={r.role}
                        onClick={() => {
                          switchRole(r.role);
                          setShowRoleMenu(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold">{r.title}</div>
                            <div className="text-[10px] text-slate-400">{r.subtitle}</div>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-200/50 dark:border-slate-800 space-y-1">
            <button
              onClick={() => { setActiveTab('feed'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold ${
                activeTab === 'feed' ? 'bg-blue-500 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <ListFilter className="w-4 h-4" />
              <span>Issues Feed</span>
            </button>

            <button
              onClick={() => { setActiveTab('map'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold ${
                activeTab === 'map' ? 'bg-blue-500 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Interactive Map</span>
            </button>

            <button
              onClick={() => { setActiveTab('authority'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold ${
                activeTab === 'authority' ? 'bg-blue-500 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <HardHat className="w-4 h-4" />
              <span>Authority Dispatch</span>
            </button>

            <button
              onClick={() => { setActiveTab('analytics'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold ${
                activeTab === 'analytics' ? 'bg-blue-500 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>

            <button
              onClick={() => { setActiveTab('advisor'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold ${
                activeTab === 'advisor' ? 'bg-blue-500 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <Bot className="w-4 h-4 text-indigo-400" />
              <span>AI Advisor</span>
            </button>
          </div>
        )}

      </div>
    </header>
  );
};
