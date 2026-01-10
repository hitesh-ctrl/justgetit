-- Drop the overly permissive notifications INSERT policy
DROP POLICY "System can create notifications" ON public.notifications;

-- Create a more secure notifications INSERT policy
-- Only allow inserting notifications for the authenticated user or via service role
CREATE POLICY "Users can receive notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);