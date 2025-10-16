-- Add column to store the UUID of the AI-recommended primary image
-- This allows reliable image selection regardless of sort order

ALTER TABLE gemstones_ai_v6
ADD COLUMN selected_image_uuid UUID NULL;

-- Add comment to explain the column
COMMENT ON COLUMN gemstones_ai_v6.selected_image_uuid IS 'UUID of the image selected by AI as the best primary image';

-- Add index for faster lookups
CREATE INDEX idx_gemstones_ai_v6_selected_image_uuid ON gemstones_ai_v6(selected_image_uuid);

