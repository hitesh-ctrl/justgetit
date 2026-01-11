import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { CampusLocation, MatchStatus } from '@/types';

interface DbMatch {
  id: string;
  listing_id: string | null;
  request_id: string | null;
  seller_id: string;
  buyer_id: string;
  status: string;
  match_score: number | null;
  meeting_location: string | null;
  meeting_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  listingId?: string;
  requestId?: string;
  sellerId: string;
  buyerId: string;
  status: MatchStatus;
  matchScore: number;
  suggestedLocation?: CampusLocation;
  meetingTime?: string;
  createdAt: string;
  updatedAt: string;
}

function mapDbMatchToMatch(db: DbMatch): Match {
  return {
    id: db.id,
    listingId: db.listing_id || undefined,
    requestId: db.request_id || undefined,
    sellerId: db.seller_id,
    buyerId: db.buyer_id,
    status: db.status as MatchStatus,
    matchScore: db.match_score || 0,
    suggestedLocation: db.meeting_location as CampusLocation | undefined,
    meetingTime: db.meeting_time || undefined,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function useMyMatches() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-matches', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as DbMatch[]).map(mapDbMatchToMatch);
    },
    enabled: !!user,
  });
}

export function useMatch(id: string | undefined) {
  return useQuery({
    queryKey: ['match', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data ? mapDbMatchToMatch(data as DbMatch) : null;
    },
    enabled: !!id,
  });
}

interface CreateMatchData {
  listingId?: string;
  requestId?: string;
  sellerId: string;
  buyerId: string;
  suggestedLocation: CampusLocation;
  matchScore?: number;
}

export function useCreateMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMatchData) => {
      const { data: match, error } = await supabase
        .from('matches')
        .insert({
          listing_id: data.listingId || null,
          request_id: data.requestId || null,
          seller_id: data.sellerId,
          buyer_id: data.buyerId,
          meeting_location: data.suggestedLocation,
          match_score: data.matchScore || 100,
          status: 'chatting',
        })
        .select()
        .single();

      if (error) throw error;
      return mapDbMatchToMatch(match as DbMatch);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-matches'] });
    },
  });
}

export function useUpdateMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, meetingTime, meetingLocation }: { 
      id: string; 
      status?: MatchStatus; 
      meetingTime?: string;
      meetingLocation?: CampusLocation;
    }) => {
      const updateData: Record<string, unknown> = {};
      if (status) updateData.status = status;
      if (meetingTime) updateData.meeting_time = meetingTime;
      if (meetingLocation) updateData.meeting_location = meetingLocation;

      const { data, error } = await supabase
        .from('matches')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapDbMatchToMatch(data as DbMatch);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-matches'] });
      queryClient.invalidateQueries({ queryKey: ['match', data.id] });
    },
  });
}
