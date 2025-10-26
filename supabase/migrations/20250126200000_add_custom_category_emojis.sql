-- Add custom_category_emojis column to couples table
-- This stores user-selected emojis for spending categories as a JSON object
-- mapping category names to emoji strings

ALTER TABLE couples
ADD COLUMN IF NOT EXISTS custom_category_emojis JSONB DEFAULT NULL;

-- Add comment to document the column
COMMENT ON COLUMN couples.custom_category_emojis IS 'JSON object mapping category names to custom emoji selections (e.g., {"Groceries": "🛒", "Dining Out": "🍔"})';
