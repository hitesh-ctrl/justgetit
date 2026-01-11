import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

interface DbMessage {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  is_system_message: boolean | null;
  created_at: string;
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  isSystemMessage: boolean;
  createdAt: string;
}

function mapDbMessageToMessage(db: DbMessage): Message {
  return {
    id: db.id,
    matchId: db.match_id,
    senderId: db.sender_id,
    content: db.content,
    isSystemMessage: db.is_system_message || false,
    createdAt: db.created_at,
  };
}

export function useMessages(matchId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['messages', matchId],
    queryFn: async () => {
      if (!matchId) return [];

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data as DbMessage[]).map(mapDbMessageToMessage);
    },
    enabled: !!matchId,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!matchId) return;

    const channel = supabase
      .channel(`messages-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', matchId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, queryClient]);

  return query;
}

export function useSendMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ matchId, content, isSystemMessage = false }: { 
      matchId: string; 
      content: string;
      isSystemMessage?: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: user.id,
          content,
          is_system_message: isSystemMessage,
        })
        .select()
        .single();

      if (error) throw error;
      return mapDbMessageToMessage(data as DbMessage);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['messages', data.matchId] });
    },
  });
}
