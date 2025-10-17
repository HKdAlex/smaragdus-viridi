-- Create colors reference table with multilingual support
-- This table stores standard gemstone colors with translations

CREATE TABLE IF NOT EXISTS colors (
  id SERIAL PRIMARY KEY,
  color_code TEXT UNIQUE NOT NULL,
  hex_value TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create translations table for color names
CREATE TABLE IF NOT EXISTS color_translations (
  id SERIAL PRIMARY KEY,
  color_id INTEGER NOT NULL REFERENCES colors(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(color_id, language_code)
);

-- Add indexes for performance
CREATE INDEX idx_colors_color_code ON colors(color_code);
CREATE INDEX idx_colors_sort_order ON colors(sort_order);
CREATE INDEX idx_color_translations_color_id ON color_translations(color_id);
CREATE INDEX idx_color_translations_language_code ON color_translations(language_code);

-- Insert standard gemstone colors
INSERT INTO colors (color_code, hex_value, sort_order) VALUES
  ('red', '#DC2626', 1),
  ('pink', '#EC4899', 2),
  ('orange', '#EA580C', 3),
  ('yellow', '#EAB308', 4),
  ('green', '#16A34A', 5),
  ('blue', '#2563EB', 6),
  ('purple', '#9333EA', 7),
  ('brown', '#92400E', 8),
  ('black', '#1F2937', 9),
  ('white', '#F9FAFB', 10),
  ('gray', '#6B7280', 11),
  ('colorless', '#F3F4F6', 12),
  ('multi-color', '#7C3AED', 13),
  ('smoky', '#4B5563', 14),
  ('amber', '#F59E0B', 15),
  ('violet', '#8B5CF6', 16),
  ('teal', '#0D9488', 17),
  ('coral', '#F97316', 18),
  ('peach', '#FB923C', 19),
  ('mint', '#10B981', 20)
ON CONFLICT (color_code) DO NOTHING;

-- Insert English translations
INSERT INTO color_translations (color_id, language_code, name) 
SELECT c.id, 'en', c.color_code
FROM colors c
WHERE c.color_code IN (
  'red', 'pink', 'orange', 'yellow', 'green', 'blue', 'purple', 
  'brown', 'black', 'white', 'gray', 'colorless', 'multi-color',
  'smoky', 'amber', 'violet', 'teal', 'coral', 'peach', 'mint'
)
ON CONFLICT (color_id, language_code) DO NOTHING;

-- Insert Russian translations
INSERT INTO color_translations (color_id, language_code, name) VALUES
  ((SELECT id FROM colors WHERE color_code = 'red'), 'ru', 'Красный'),
  ((SELECT id FROM colors WHERE color_code = 'pink'), 'ru', 'Розовый'),
  ((SELECT id FROM colors WHERE color_code = 'orange'), 'ru', 'Оранжевый'),
  ((SELECT id FROM colors WHERE color_code = 'yellow'), 'ru', 'Желтый'),
  ((SELECT id FROM colors WHERE color_code = 'green'), 'ru', 'Зеленый'),
  ((SELECT id FROM colors WHERE color_code = 'blue'), 'ru', 'Синий'),
  ((SELECT id FROM colors WHERE color_code = 'purple'), 'ru', 'Фиолетовый'),
  ((SELECT id FROM colors WHERE color_code = 'brown'), 'ru', 'Коричневый'),
  ((SELECT id FROM colors WHERE color_code = 'black'), 'ru', 'Черный'),
  ((SELECT id FROM colors WHERE color_code = 'white'), 'ru', 'Белый'),
  ((SELECT id FROM colors WHERE color_code = 'gray'), 'ru', 'Серый'),
  ((SELECT id FROM colors WHERE color_code = 'colorless'), 'ru', 'Бесцветный'),
  ((SELECT id FROM colors WHERE color_code = 'multi-color'), 'ru', 'Многоцветный'),
  ((SELECT id FROM colors WHERE color_code = 'smoky'), 'ru', 'Дымчатый'),
  ((SELECT id FROM colors WHERE color_code = 'amber'), 'ru', 'Янтарный'),
  ((SELECT id FROM colors WHERE color_code = 'violet'), 'ru', 'Фиолетовый'),
  ((SELECT id FROM colors WHERE color_code = 'teal'), 'ru', 'Бирюзовый'),
  ((SELECT id FROM colors WHERE color_code = 'coral'), 'ru', 'Коралловый'),
  ((SELECT id FROM colors WHERE color_code = 'peach'), 'ru', 'Персиковый'),
  ((SELECT id FROM colors WHERE color_code = 'mint'), 'ru', 'Мятный')
ON CONFLICT (color_id, language_code) DO NOTHING;

-- Add comments
COMMENT ON TABLE colors IS 'Reference table for standard gemstone colors';
COMMENT ON TABLE color_translations IS 'Multilingual translations for color names';
COMMENT ON COLUMN colors.color_code IS 'Unique color identifier (e.g., brown, smoky)';
COMMENT ON COLUMN colors.hex_value IS 'Hex color code for UI display';
COMMENT ON COLUMN colors.sort_order IS 'Display order for UI';

