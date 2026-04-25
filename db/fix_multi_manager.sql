-- Replace the self-referencing organization_members policy
DROP POLICY IF EXISTS "org_members_access" ON public.organization_members;

CREATE OR REPLACE FUNCTION public.get_user_organization_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM organizations WHERE owner_id = auth.uid()
  UNION
  SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
$$;

CREATE POLICY "org_members_access" ON public.organization_members
  FOR ALL USING (
    organization_id IN (SELECT get_user_organization_ids())
  );

-- Also fix the invites policy for the same reason
DROP POLICY IF EXISTS "invites_org_access" ON public.manager_invites;

CREATE POLICY "invites_org_access" ON public.manager_invites
  FOR ALL USING (
    organization_id IN (SELECT get_user_organization_ids())
  );
