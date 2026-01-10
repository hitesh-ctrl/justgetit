-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create enum for listing status
CREATE TYPE public.listing_status AS ENUM ('available', 'reserved', 'sold');

-- Create enum for request status
CREATE TYPE public.request_status AS ENUM ('open', 'matched', 'closed');

-- Create enum for exchange status
CREATE TYPE public.exchange_status AS ENUM ('chatting', 'meeting_scheduled', 'completed', 'cancelled');

-- Create enum for categories
CREATE TYPE public.item_category AS ENUM ('books', 'cycles', 'electronics', 'hostel-items');

-- Create enum for locations
CREATE TYPE public.campus_location AS ENUM ('library', 'canteen', 'department', 'hostel', 'main-gate');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  college_domain TEXT NOT NULL,
  trust_score DECIMAL(3,2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create listings table
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category item_category NOT NULL,
  location campus_location NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  status listing_status DEFAULT 'available' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create need_requests table
CREATE TABLE public.need_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  max_budget DECIMAL(10,2) NOT NULL,
  category item_category NOT NULL,
  preferred_location campus_location NOT NULL,
  status request_status DEFAULT 'open' NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days') NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create matches table
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.need_requests(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status exchange_status DEFAULT 'chatting' NOT NULL,
  meeting_location campus_location,
  meeting_time TIMESTAMP WITH TIME ZONE,
  match_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_system_message BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create ratings table
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  rater_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rated_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  accuracy_rating INTEGER CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
  punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  review TEXT,
  is_flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (match_id, rater_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.need_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create has_role function for admin checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view own roles" 
  ON public.user_roles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" 
  ON public.user_roles FOR ALL 
  USING (public.has_role(auth.uid(), 'admin'));

-- Listings policies
CREATE POLICY "Listings are viewable by everyone" 
  ON public.listings FOR SELECT 
  USING (true);

CREATE POLICY "Users can create own listings" 
  ON public.listings FOR INSERT 
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update own listings" 
  ON public.listings FOR UPDATE 
  USING (auth.uid() = seller_id);

CREATE POLICY "Users can delete own listings" 
  ON public.listings FOR DELETE 
  USING (auth.uid() = seller_id);

-- Need requests policies
CREATE POLICY "Requests are viewable by everyone" 
  ON public.need_requests FOR SELECT 
  USING (true);

CREATE POLICY "Users can create own requests" 
  ON public.need_requests FOR INSERT 
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update own requests" 
  ON public.need_requests FOR UPDATE 
  USING (auth.uid() = requester_id);

CREATE POLICY "Users can delete own requests" 
  ON public.need_requests FOR DELETE 
  USING (auth.uid() = requester_id);

-- Matches policies
CREATE POLICY "Users can view their matches" 
  ON public.matches FOR SELECT 
  USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

CREATE POLICY "Users can create matches" 
  ON public.matches FOR INSERT 
  WITH CHECK (auth.uid() = seller_id OR auth.uid() = buyer_id);

CREATE POLICY "Participants can update matches" 
  ON public.matches FOR UPDATE 
  USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

-- Messages policies
CREATE POLICY "Match participants can view messages" 
  ON public.messages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.matches 
      WHERE id = match_id 
      AND (seller_id = auth.uid() OR buyer_id = auth.uid())
    )
  );

CREATE POLICY "Match participants can send messages" 
  ON public.messages FOR INSERT 
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.matches 
      WHERE id = match_id 
      AND (seller_id = auth.uid() OR buyer_id = auth.uid())
    )
  );

-- Ratings policies
CREATE POLICY "Ratings are viewable by everyone" 
  ON public.ratings FOR SELECT 
  USING (true);

CREATE POLICY "Match participants can create ratings" 
  ON public.ratings FOR INSERT 
  WITH CHECK (
    auth.uid() = rater_id AND
    EXISTS (
      SELECT 1 FROM public.matches 
      WHERE id = match_id 
      AND status = 'completed'
      AND (seller_id = auth.uid() OR buyer_id = auth.uid())
    )
  );

-- Notifications policies
CREATE POLICY "Users can view own notifications" 
  ON public.notifications FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" 
  ON public.notifications FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
  ON public.notifications FOR INSERT 
  WITH CHECK (true);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, college_domain)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    split_part(NEW.email, '@', 2)
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update user trust score
CREATE OR REPLACE FUNCTION public.update_trust_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  avg_rating DECIMAL(3,2);
  total_count INTEGER;
BEGIN
  SELECT AVG(overall_rating), COUNT(*)
  INTO avg_rating, total_count
  FROM public.ratings
  WHERE rated_user_id = NEW.rated_user_id;
  
  UPDATE public.profiles
  SET trust_score = avg_rating, total_ratings = total_count, updated_at = NOW()
  WHERE id = NEW.rated_user_id;
  
  RETURN NEW;
END;
$$;

-- Trigger for updating trust score
CREATE TRIGGER on_rating_created
  AFTER INSERT ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_trust_score();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Timestamp triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_need_requests_updated_at
  BEFORE UPDATE ON public.need_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime for messages and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create storage bucket for listing images
INSERT INTO storage.buckets (id, name, public) VALUES ('listings', 'listings', true);

-- Storage policies for listings bucket
CREATE POLICY "Anyone can view listing images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listings');

CREATE POLICY "Authenticated users can upload listing images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'listings' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own listing images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'listings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own listing images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'listings' AND auth.uid()::text = (storage.foldername(name))[1]);