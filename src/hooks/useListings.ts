import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Listing, Category, CampusLocation, ListingStatus } from '@/types';

interface DbListing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  images: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

function mapDbListingToListing(db: DbListing): Listing {
  return {
    id: db.id,
    userId: db.seller_id,
    title: db.title,
    description: db.description,
    price: Number(db.price),
    category: db.category as Category,
    location: db.location as CampusLocation,
    images: db.images || [],
    status: db.status as ListingStatus,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function useListings(status?: ListingStatus) {
  return useQuery({
    queryKey: ['listings', status],
    queryFn: async () => {
      let query = supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return (data as DbListing[]).map(mapDbListingToListing);
    },
  });
}

export function useListing(id: string | undefined) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data ? mapDbListingToListing(data as DbListing) : null;
    },
    enabled: !!id,
  });
}

export function useMyListings() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my-listings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data as DbListing[]).map(mapDbListingToListing);
    },
    enabled: !!user,
  });
}

interface CreateListingData {
  title: string;
  description: string;
  price: number;
  category: Category;
  location: CampusLocation;
  images: string[];
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateListingData) => {
      if (!user) throw new Error('Not authenticated');

      const { data: listing, error } = await supabase
        .from('listings')
        .insert({
          seller_id: user.id,
          title: data.title,
          description: data.description,
          price: data.price,
          category: data.category,
          location: data.location,
          images: data.images,
          status: 'available',
        })
        .select()
        .single();

      if (error) throw error;
      return mapDbListingToListing(listing as DbListing);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
    },
  });
}

export function useUpdateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<CreateListingData> & { id: string; status?: ListingStatus }) => {
      const updateData: Record<string, unknown> = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.images !== undefined) updateData.images = data.images;
      if (data.status !== undefined) updateData.status = data.status;

      const { data: listing, error } = await supabase
        .from('listings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapDbListingToListing(listing as DbListing);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['listing', data.id] });
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
    },
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
    },
  });
}

export async function uploadListingImage(file: File, userId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('listings')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('listings')
    .getPublicUrl(fileName);

  return publicUrl;
}
