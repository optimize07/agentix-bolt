-- Add position and group_name columns to agent_boards
ALTER TABLE agent_boards 
ADD COLUMN position integer DEFAULT 0,
ADD COLUMN group_name text DEFAULT NULL;

-- Create project_groups table
CREATE TABLE project_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  position integer DEFAULT 0,
  color text DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE project_groups ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations on project_groups"
ON project_groups
FOR ALL
USING (true)
WITH CHECK (true);

-- Insert default groups
INSERT INTO project_groups (name, slug, position) VALUES 
  ('Top 5', 'top5', 0),
  ('Active', 'active', 1),
  ('Archive', 'archive', 2);

-- Create trigger for updated_at
CREATE TRIGGER update_project_groups_updated_at
BEFORE UPDATE ON project_groups
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();