import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { NeedRequest, Category, CampusLocation, NeedStatus } from '@/types';

interface DbNeedRequest {
  id: string;
  requester_id: string;
  title: string;
  description: string;
  max_budget: number;
  category: string;
  preferred_location: string;
  status: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

function mapDbRequestToNeedRequest(db: DbNeedRequest): NeedRequest {
  return {
    id: db.id,
    userId: db.requester_id,
    title: db.title,
    description: db.description,
    maxBudget: Number(db.max_budget),
    category: db.category as Category,
    preferredLocation: db.preferred_location as CampusLocation,
    status: db.status as NeedStatus,
    createdAt: db.created_at,
    expiresAt: db.expires_at,
  };
}

export function useNeedRequests(status?: NeedStatus) {
  return useQuery({
    queryKey: ['need-requests', status],
    queryFn: async () => {
      let query = supabase
        .from('need_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return (data as DbNeedRequest[]).map(mapDbRequestToNeedRequest);
    },
  });
}

export function useNeedRequest(id: string | undefined) {
  return useQuery({
    queryKey: ['need-request', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('need_requests')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data ? mapDbRequestToNeedRequest(data as DbNeedRequest) : null;
    },
    enabled: !!id,
  });
}

export function useMyNeedRequests() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my-need-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('need_requests')
        .select('*')
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data as DbNeedRequest[]).map(mapDbRequestToNeedRequest);
    },
    enabled: !!user,
  });
}

interface CreateNeedRequestData {
  title: string;
  description: string;
  maxBudget: number;
  category: Category;
  preferredLocation: CampusLocation;
}

export function useCreateNeedRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateNeedRequestData) => {
      if (!user) throw new Error('Not authenticated');

      const { data: request, error } = await supabase
        .from('need_requests')
        .insert({
          requester_id: user.id,
          title: data.title,
          description: data.description,
          max_budget: data.maxBudget,
          category: data.category,
          preferred_location: data.preferredLocation,
          status: 'open',
        })
        .select()
        .single();

      if (error) throw error;
      return mapDbRequestToNeedRequest(request as DbNeedRequest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['need-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-need-requests'] });
    },
  });
}

export function useDeleteNeedRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('need_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['need-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-need-requests'] });
    },
  });
}
