-- Migration: Create translation tables for multilingual gemstone attributes
-- Date: 2025-10-15
-- Purpose: Replace rigid enums with flexible translation tables and introduce code columns

BEGIN;

-- 1. Translation tables -----------------------------------------------------

CREATE TABLE IF NOT EXISTS gemstone_type_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_code text NOT NULL,
  locale text NOT NULL,
  name text NOT NULL,
  description text,
  UNIQUE (type_code, locale)
);

CREATE TABLE IF NOT EXISTS gem_color_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  color_code text NOT NULL,
  locale text NOT NULL,
  name text NOT NULL,
  description text,
  UNIQUE (color_code, locale)
);

CREATE TABLE IF NOT EXISTS gem_cut_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cut_code text NOT NULL,
  locale text NOT NULL,
  name text NOT NULL,
  description text,
  UNIQUE (cut_code, locale)
);

CREATE TABLE IF NOT EXISTS gem_clarity_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clarity_code text NOT NULL,
  locale text NOT NULL,
  name text NOT NULL,
  description text,
  UNIQUE (clarity_code, locale)
);

-- Helpful indexes for lookups
CREATE INDEX IF NOT EXISTS idx_gemstone_type_translations_code_locale
  ON gemstone_type_translations (type_code, locale);

CREATE INDEX IF NOT EXISTS idx_gem_color_translations_code_locale
  ON gem_color_translations (color_code, locale);

CREATE INDEX IF NOT EXISTS idx_gem_cut_translations_code_locale
  ON gem_cut_translations (cut_code, locale);

CREATE INDEX IF NOT EXISTS idx_gem_clarity_translations_code_locale
  ON gem_clarity_translations (clarity_code, locale);

-- 2. Add flexible code columns to gemstones ---------------------------------

ALTER TABLE gemstones ADD COLUMN type_code text;
ALTER TABLE gemstones ADD COLUMN color_code text;
ALTER TABLE gemstones ADD COLUMN cut_code text;
ALTER TABLE gemstones ADD COLUMN clarity_code text;

-- Backfill code columns from existing enums
UPDATE gemstones
SET
  type_code = COALESCE(type_code, name::text),
  color_code = COALESCE(color_code, color::text),
  cut_code = COALESCE(cut_code, cut::text),
  clarity_code = COALESCE(clarity_code, clarity::text);

ALTER TABLE gemstones ALTER COLUMN type_code SET NOT NULL;
ALTER TABLE gemstones ALTER COLUMN color_code SET NOT NULL;
ALTER TABLE gemstones ALTER COLUMN cut_code SET NOT NULL;
ALTER TABLE gemstones ALTER COLUMN clarity_code SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gemstones_type_code ON gemstones (type_code);
CREATE INDEX IF NOT EXISTS idx_gemstones_color_code ON gemstones (color_code);
CREATE INDEX IF NOT EXISTS idx_gemstones_cut_code ON gemstones (cut_code);
CREATE INDEX IF NOT EXISTS idx_gemstones_clarity_code ON gemstones (clarity_code);

-- 3. Seed translations -------------------------------------------------------

-- Gemstone types
INSERT INTO gemstone_type_translations (type_code, locale, name, description)
VALUES
  ('diamond', 'en', 'Diamond', null),
  ('emerald', 'en', 'Emerald', null),
  ('ruby', 'en', 'Ruby', null),
  ('sapphire', 'en', 'Sapphire', null),
  ('amethyst', 'en', 'Amethyst', null),
  ('topaz', 'en', 'Topaz', null),
  ('garnet', 'en', 'Garnet', null),
  ('peridot', 'en', 'Peridot', null),
  ('citrine', 'en', 'Citrine', null),
  ('tanzanite', 'en', 'Tanzanite', null),
  ('aquamarine', 'en', 'Aquamarine', null),
  ('morganite', 'en', 'Morganite', null),
  ('tourmaline', 'en', 'Tourmaline', null),
  ('zircon', 'en', 'Zircon', null),
  ('apatite', 'en', 'Apatite', null),
  ('quartz', 'en', 'Quartz', null),
  ('paraiba', 'en', 'Paraíba Tourmaline', null),
  ('spinel', 'en', 'Spinel', null),
  ('alexandrite', 'en', 'Alexandrite', null),
  ('agate', 'en', 'Agate', null),
  ('diamond', 'ru', 'Бриллиант', null),
  ('emerald', 'ru', 'Изумруд', null),
  ('ruby', 'ru', 'Рубин', null),
  ('sapphire', 'ru', 'Сапфир', null),
  ('amethyst', 'ru', 'Аметист', null),
  ('topaz', 'ru', 'Топаз', null),
  ('garnet', 'ru', 'Гранат', null),
  ('peridot', 'ru', 'Перидот', null),
  ('citrine', 'ru', 'Цитрин', null),
  ('tanzanite', 'ru', 'Танзанит', null),
  ('aquamarine', 'ru', 'Аквамарин', null),
  ('morganite', 'ru', 'Морганит', null),
  ('tourmaline', 'ru', 'Турмалин', null),
  ('zircon', 'ru', 'Циркон', null),
  ('apatite', 'ru', 'Апатит', null),
  ('quartz', 'ru', 'Кварц', null),
  ('paraiba', 'ru', 'Параиба', null),
  ('spinel', 'ru', 'Шпинель', null),
  ('alexandrite', 'ru', 'Александрит', null),
  ('agate', 'ru', 'Агат', null)
ON CONFLICT (type_code, locale) DO UPDATE SET name = EXCLUDED.name;

-- Gem colors
INSERT INTO gem_color_translations (color_code, locale, name, description)
VALUES
  ('red', 'en', 'Red', null),
  ('blue', 'en', 'Blue', null),
  ('green', 'en', 'Green', null),
  ('yellow', 'en', 'Yellow', null),
  ('pink', 'en', 'Pink', null),
  ('white', 'en', 'White', null),
  ('black', 'en', 'Black', null),
  ('colorless', 'en', 'Colorless', null),
  ('fancy-yellow', 'en', 'Fancy Yellow', null),
  ('fancy-blue', 'en', 'Fancy Blue', null),
  ('fancy-pink', 'en', 'Fancy Pink', null),
  ('fancy-green', 'en', 'Fancy Green', null),
  ('red', 'ru', 'Красный', null),
  ('blue', 'ru', 'Синий', null),
  ('green', 'ru', 'Зелёный', null),
  ('yellow', 'ru', 'Жёлтый', null),
  ('pink', 'ru', 'Розовый', null),
  ('white', 'ru', 'Белый', null),
  ('black', 'ru', 'Чёрный', null),
  ('colorless', 'ru', 'Бесцветный', null),
  ('fancy-yellow', 'ru', 'Фэнси жёлтый', null),
  ('fancy-blue', 'ru', 'Фэнси синий', null),
  ('fancy-pink', 'ru', 'Фэнси розовый', null),
  ('fancy-green', 'ru', 'Фэнси зелёный', null)
ON CONFLICT (color_code, locale) DO UPDATE SET name = EXCLUDED.name;

-- Gem cuts
INSERT INTO gem_cut_translations (cut_code, locale, name, description)
VALUES
  ('round', 'en', 'Round Brilliant', null),
  ('oval', 'en', 'Oval', null),
  ('marquise', 'en', 'Marquise', null),
  ('pear', 'en', 'Pear', null),
  ('emerald', 'en', 'Emerald Cut', null),
  ('princess', 'en', 'Princess', null),
  ('cushion', 'en', 'Cushion', null),
  ('radiant', 'en', 'Radiant', null),
  ('fantasy', 'en', 'Fantasy', null),
  ('baguette', 'en', 'Baguette', null),
  ('asscher', 'en', 'Asscher', null),
  ('rhombus', 'en', 'Rhombus', null),
  ('trapezoid', 'en', 'Trapezoid', null),
  ('triangle', 'en', 'Triangle', null),
  ('heart', 'en', 'Heart', null),
  ('cabochon', 'en', 'Cabochon', null),
  ('pentagon', 'en', 'Pentagon', null),
  ('hexagon', 'en', 'Hexagon', null),
  ('round', 'ru', 'Круглая огранка', null),
  ('oval', 'ru', 'Овальная огранка', null),
  ('marquise', 'ru', 'Маркиза', null),
  ('pear', 'ru', 'Капля', null),
  ('emerald', 'ru', 'Изумрудная огранка', null),
  ('princess', 'ru', 'Принцесса', null),
  ('cushion', 'ru', 'Подушка', null),
  ('radiant', 'ru', 'Радиант', null),
  ('fantasy', 'ru', 'Фантазийная огранка', null),
  ('baguette', 'ru', 'Багет', null),
  ('asscher', 'ru', 'Ашер', null),
  ('rhombus', 'ru', 'Ромб', null),
  ('trapezoid', 'ru', 'Трапеция', null),
  ('triangle', 'ru', 'Треугольник', null),
  ('heart', 'ru', 'Сердце', null),
  ('cabochon', 'ru', 'Кабошон', null),
  ('pentagon', 'ru', 'Пентагон', null),
  ('hexagon', 'ru', 'Шестигранник', null)
ON CONFLICT (cut_code, locale) DO UPDATE SET name = EXCLUDED.name;

-- Gem clarity
INSERT INTO gem_clarity_translations (clarity_code, locale, name, description)
VALUES
  ('FL', 'en', 'FL (Flawless)', 'No inclusions or blemishes visible under 10x magnification'),
  ('IF', 'en', 'IF (Internally Flawless)', 'No inclusions, only surface blemishes visible under 10x'),
  ('VVS1', 'en', 'VVS1 (Very, Very Slightly Included 1)', null),
  ('VVS2', 'en', 'VVS2 (Very, Very Slightly Included 2)', null),
  ('VS1', 'en', 'VS1 (Very Slightly Included 1)', null),
  ('VS2', 'en', 'VS2 (Very Slightly Included 2)', null),
  ('SI1', 'en', 'SI1 (Slightly Included 1)', null),
  ('SI2', 'en', 'SI2 (Slightly Included 2)', null),
  ('I1', 'en', 'I1 (Included 1)', null),
  ('FL', 'ru', 'FL (Без включений)', 'Включения и дефекты отсутствуют при 10-кратном увеличении'),
  ('IF', 'ru', 'IF (Практически безупречный)', 'Нет внутренних включений при 10-кратном увеличении'),
  ('VVS1', 'ru', 'VVS1 (Очень, очень незначительные включения 1)', null),
  ('VVS2', 'ru', 'VVS2 (Очень, очень незначительные включения 2)', null),
  ('VS1', 'ru', 'VS1 (Очень незначительные включения 1)', null),
  ('VS2', 'ru', 'VS2 (Очень незначительные включения 2)', null),
  ('SI1', 'ru', 'SI1 (Незначительные включения 1)', null),
  ('SI2', 'ru', 'SI2 (Незначительные включения 2)', null),
  ('I1', 'ru', 'I1 (Включения заметны)', null)
ON CONFLICT (clarity_code, locale) DO UPDATE SET name = EXCLUDED.name;

COMMIT;

