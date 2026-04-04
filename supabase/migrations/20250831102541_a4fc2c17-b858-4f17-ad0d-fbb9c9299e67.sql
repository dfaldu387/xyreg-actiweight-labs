-- Add category column to user_needs table with default value
ALTER TABLE user_needs 
ADD COLUMN category TEXT NOT NULL DEFAULT 'General';

-- Create index for category filtering
CREATE INDEX idx_user_needs_category ON user_needs(category);

-- Add a comment to document the category options
COMMENT ON COLUMN user_needs.category IS 'Category of user need: Performance, Safety, Usability, Interface, Design, Regulatory, or General';