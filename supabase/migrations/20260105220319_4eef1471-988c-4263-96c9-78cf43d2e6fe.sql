-- Add INSERT policy for admins on app_settings
CREATE POLICY "Admins can insert settings"
ON public.app_settings
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));