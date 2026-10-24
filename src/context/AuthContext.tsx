import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { DEMO_USERS } from '../data/mockData';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  currentUser: UserProfile;
  currentRole: UserRole;
  switchRole: (role: UserRole) => void;
  setUser: (user: UserProfile) => void;
  isSupabaseLive: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('civicguard_active_user') : null;
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return DEMO_USERS[0]; // Citizen by default
  });

  const [isSupabaseLive, setIsSupabaseLive] = useState(isSupabaseConfigured());

  useEffect(() => {
    setIsSupabaseLive(isSupabaseConfigured());
  }, []);

  const switchRole = (role: UserRole) => {
    const target = DEMO_USERS.find(u => u.role === role) || DEMO_USERS[0];
    setCurrentUser(target);
    if (typeof window !== 'undefined') {
      localStorage.setItem('civicguard_active_user', JSON.stringify(target));
    }
  };

  const setUser = (user: UserProfile) => {
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('civicguard_active_user', JSON.stringify(user));
    }
  };

  const signOut = () => {
    const supabase = getSupabase();
    if (supabase) {
      supabase.auth.signOut().catch(() => {});
    }
    switchRole('citizen');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole: currentUser.role,
        switchRole,
        setUser,
        isSupabaseLive,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
