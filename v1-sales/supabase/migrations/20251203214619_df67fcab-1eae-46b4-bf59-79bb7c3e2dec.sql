-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view presets in their org" ON custom_theme_presets;

-- Create new policy that allows viewing org presets OR own presets
CREATE POLICY "Users can view presets in their org or own presets" 
ON custom_theme_presets 
FOR SELECT 
USING (
  (organization_id IN (
    SELECT profiles.organization_id 
    FROM profiles 
    WHERE profiles.id = auth.uid()
  )) 
  OR (user_id = auth.uid())
);