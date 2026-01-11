import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DbRating {
  id: string;
  match_id: string;
  rater_id: string;
  rated_user_id: string;
  overall_rating: number;
  communication_rating: number | null;
  accuracy_rating: number | null;
  punctuality_rating: number | null;
  review: string | null;
  is_flagged: boolean | null;
  created_at: string;
}

export interface Rating {
  id: string;
  matchId: string;
  fromUserId: string;
  toUserId: string;
  overallRating: number;
  communication: number;
  itemAccuracy: number;
  punctuality: number;
  review?: string;
  createdAt: string;
}

function mapDbRatingToRating(db: DbRating): Rating {
  return {
    id: db.id,
    matchId: db.match_id,
    fromUserId: db.rater_id,
    toUserId: db.rated_user_id,
    overallRating: db.overall_rating,
    communication: db.communication_rating || db.overall_rating,
    itemAccuracy: db.accuracy_rating || db.overall_rating,
    punctuality: db.punctuality_rating || db.overall_rating,
    review: db.review || undefined,
    createdAt: db.created_at,
  };
}

export function useRatingsByUser(userId: string | undefined) {
  return useQuery({
    queryKey: ['ratings', 'user', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('rated_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as DbRating[]).map(mapDbRatingToRating);
    },
    enabled: !!userId,
  });
}

export function useRatingsByMatch(matchId: string | undefined) {
  return useQuery({
    queryKey: ['ratings', 'match', matchId],
    queryFn: async () => {
      if (!matchId) return [];

      const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('match_id', matchId);

      if (error) throw error;
      return (data as DbRating[]).map(mapDbRatingToRating);
    },
    enabled: !!matchId,
  });
}

interface CreateRatingData {
  matchId: string;
  toUserId: string;
  overallRating: number;
  communication?: number;
  itemAccuracy?: number;
  punctuality?: number;
  review?: string;
}

export function useCreateRating() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRatingData) => {
      if (!user) throw new Error('Not authenticated');

      const { data: rating, error } = await supabase
        .from('ratings')
        .insert({
          match_id: data.matchId,
          rater_id: user.id,
          rated_user_id: data.toUserId,
          overall_rating: data.overallRating,
          communication_rating: data.communication || data.overallRating,
          accuracy_rating: data.itemAccuracy || data.overallRating,
          punctuality_rating: data.punctuality || data.overallRating,
          review: data.review || null,
        })
        .select()
        .single();

      if (error) throw error;
      return mapDbRatingToRating(rating as DbRating);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ratings'] });
      queryClient.invalidateQueries({ queryKey: ['profile', data.toUserId] });
    },
  });
}
