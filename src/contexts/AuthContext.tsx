import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@/types';
import { userStorage, generateId } from '@/lib/storage';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
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

// Simple password storage (in real app, this would be hashed and stored securely)
const PASSWORD_STORAGE_KEY = 'get_passwords';

function getPasswords(): Record<string, string> {
  try {
    const data = localStorage.getItem(PASSWORD_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function savePassword(email: string, password: string): void {
  const passwords = getPasswords();
  passwords[email.toLowerCase()] = password;
  localStorage.setItem(PASSWORD_STORAGE_KEY, JSON.stringify(passwords));
}

function checkPassword(email: string, password: string): boolean {
  const passwords = getPasswords();
  return passwords[email.toLowerCase()] === password;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user from storage on mount
    const storedUser = userStorage.getCurrentUser();
    setUser(storedUser);
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Validate email format
    if (!email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    // Check if user exists
    const existingUser = userStorage.getUserByEmail(email);
    if (!existingUser) {
      return { success: false, error: 'No account found with this email' };
    }

    // Check password
    if (!checkPassword(email, password)) {
      return { success: false, error: 'Incorrect password' };
    }

    // Login successful
    setUser(existingUser);
    userStorage.setCurrentUser(existingUser);
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

    // Check if user already exists
    if (userStorage.getUserByEmail(email)) {
      return { success: false, error: 'An account with this email already exists' };
    }

    // Validate password
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    // Validate name
    if (name.trim().length < 2) {
      return { success: false, error: 'Please enter your full name' };
    }

    // Create new user
    const newUser: User = {
      id: generateId(),
      email: email.toLowerCase(),
      name: name.trim(),
      college: extractCollegeName(email),
      createdAt: new Date().toISOString(),
      trustScore: 0,
      totalRatings: 0,
      totalExchanges: 0,
      badge: 'new',
    };

    // Save user and password
    userStorage.saveUser(newUser);
    savePassword(email, password);
    
    // Log in the new user
    setUser(newUser);
    userStorage.setCurrentUser(newUser);

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    userStorage.setCurrentUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      userStorage.saveUser(updatedUser);
      userStorage.setCurrentUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser }}>
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
