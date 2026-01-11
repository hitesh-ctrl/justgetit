import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@/types';

interface DbProfile {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  college_domain: string;
  trust_score: number;
  total_ratings: number;
  created_at: string;
  updated_at: string;
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

function mapDbProfileToUser(db: DbProfile): User {
  const trustScore = Number(db.trust_score) || 0;
  const totalRatings = db.total_ratings || 0;
  
  return {
    id: db.id,
    email: db.email,
    name: db.name,
    avatarUrl: db.avatar_url || undefined,
    college: extractCollegeName(db.email),
    createdAt: db.created_at,
    trustScore,
    totalRatings,
    totalExchanges: 0,
    badge: getBadge(trustScore, totalRatings),
  };
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data ? mapDbProfileToUser(data as DbProfile) : null;
    },
    enabled: !!userId,
  });
}

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) throw error;
      return (data as DbProfile[]).map(mapDbProfileToUser);
    },
  });
}

export function useProfilesByIds(userIds: string[]) {
  return useQuery({
    queryKey: ['profiles', userIds],
    queryFn: async () => {
      if (userIds.length === 0) return {};
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);
      
      if (error) throw error;
      
      const profileMap: Record<string, User> = {};
      (data as DbProfile[]).forEach(profile => {
        profileMap[profile.id] = mapDbProfileToUser(profile);
      });
      return profileMap;
    },
    enabled: userIds.length > 0,
  });
}
