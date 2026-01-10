import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { User as AppUser } from '@/types';

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<AppUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Allowed college email domains
const ALLOWED_DOMAINS = [
  'edu',
  'ac.in',
  'edu.in',
  'university.edu',
  'college.edu',
  'iit.ac.in',
  'nit.ac.in',
  'iiit.ac.in',
];

function isCollegeEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  return ALLOWED_DOMAINS.some(allowed => domain.endsWith(allowed));
}

function extractCollegeName(email: string): string {
  const domain = email.split('@')[1] || '';
  const parts = domain.split('.');
  if (parts.length >= 2) {
    return parts[0].toUpperCase();
  }
  return 'University';
}

function getBadge(trustScore: number, totalRatings: number): 'new' | 'trusted' | 'top-seller' {
  if (totalRatings >= 25 && trustScore >= 4.5) return 'top-seller';
  if (totalRatings >= 10 && trustScore >= 4.0) return 'trusted';
  return 'new';
}

type UserUpdates = {
  name?: string;
  avatarUrl?: string;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    if (profile) {
      const appUser: AppUser = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatar_url || undefined,
        college: extractCollegeName(profile.email),
        createdAt: profile.created_at,
        trustScore: Number(profile.trust_score) || 0,
        totalRatings: profile.total_ratings || 0,
        totalExchanges: 0,
        badge: getBadge(Number(profile.trust_score) || 0, profile.total_ratings || 0),
      };
      return appUser;
    }
    return null;
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Defer Supabase calls with setTimeout to prevent deadlocks
          setTimeout(() => {
            fetchProfile(currentSession.user.id).then(profile => {
              setUser(profile);
              setIsLoading(false);
            });
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id).then(profile => {
          setUser(profile);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Validate email format
    if (!email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { success: false, error: 'Invalid email or password' };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  const register = async (
    email: string,
    password: string,
    name: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Validate email format
    if (!email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    // Validate college email
    if (!isCollegeEmail(email)) {
      return { 
        success: false, 
        error: 'Please use your college email address (must end with .edu, .ac.in, etc.)' 
      };
    }

    // Validate password
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    // Validate name
    if (name.trim().length < 2) {
      return { success: false, error: 'Please enter your full name' };
    }

    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: name.trim(),
        },
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return { success: false, error: 'An account with this email already exists' };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const updateUser = async (updates: UserUpdates) => {
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: updates.name,
          avatar_url: updates.avatarUrl,
        })
        .eq('id', user.id);

      if (!error) {
        setUser({ ...user, ...updates });
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
