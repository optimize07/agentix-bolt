-- Add new columns to swipe_files to support multiple content types
ALTER TABLE swipe_files 
ADD COLUMN type TEXT NOT NULL DEFAULT 'image',
ADD COLUMN text_content TEXT,
ADD COLUMN file_url TEXT,
ADD COLUMN video_url TEXT;

-- Add check constraint for valid types
ALTER TABLE swipe_files 
ADD CONSTRAINT swipe_files_type_check 
CHECK (type IN ('image', 'text', 'pdf', 'video', 'link'));

-- Add comment for documentation
COMMENT ON COLUMN swipe_files.type IS 'Content type: image, text, pdf, video, or link';
COMMENT ON COLUMN swipe_files.text_content IS 'For text type - stores the actual text content/notes';
COMMENT ON COLUMN swipe_files.file_url IS 'For pdf/video types - stores the uploaded file URL';
COMMENT ON COLUMN swipe_files.video_url IS 'For video type - stores YouTube/Vimeo embed URL';

-- Create index for type filtering
CREATE INDEX idx_swipe_files_type ON swipe_files(type);
CREATE INDEX idx_swipe_files_project_type ON swipe_files(project_id, type);