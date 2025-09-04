-- Add missing RLS policies for tenants table
CREATE POLICY "Everyone can read tenants"
ON public.tenants FOR SELECT
USING (true);

CREATE POLICY "Admins can manage tenants"
ON public.tenants FOR ALL
USING (public.get_user_role() = 'admin');