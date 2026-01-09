-- Migration: Seed origins table with major gemstone mining locations
-- Purpose: Populate the origins table with common gemstone mining locations
--          that are already localized via translation keys in gemstones.json
--
-- Note: The 'name' field uses translation keys (e.g., 'myanmar', 'colombia')
--       which are automatically translated via the translateOrigin() function
--       using keys from gemstones.origins in EN/RU translation files.

-- Insert major gemstone mining origins
-- Using INSERT ... ON CONFLICT DO NOTHING to allow re-running safely

INSERT INTO origins (name, country, region, mine_name) VALUES
  -- Asia
  ('myanmar', 'Myanmar', 'Mogok Valley', 'Mogok Ruby Mines'),
  ('thailand', 'Thailand', 'Chanthaburi', 'Various Ruby & Sapphire Mines'),
  ('sri-lanka', 'Sri Lanka', 'Ratnapura', 'Gem Fields'),
  ('india', 'India', 'Rajasthan', 'Various Mines'),
  ('pakistan', 'Pakistan', 'Northern Areas', 'Emerald & Ruby Mines'),
  ('china', 'China', 'Various Provinces', 'Various Mines'),
  
  -- South America
  ('colombia', 'Colombia', 'Boyacá', 'Muzo & Chivor Emerald Mines'),
  ('brazil', 'Brazil', 'Minas Gerais', 'Various Mines'),
  ('ecuador', 'Ecuador', 'Various Regions', 'Various Mines'),
  
  -- Africa
  ('tanzania', 'Tanzania', 'Merelani Hills', 'Tanzanite Mines'),
  ('madagascar', 'Madagascar', 'Ilakaka', 'Sapphire Deposits'),
  ('south-africa', 'South Africa', 'Various Regions', 'Diamond Mines'),
  ('botswana', 'Botswana', 'Various Regions', 'Diamond Mines'),
  ('zimbabwe', 'Zimbabwe', 'Various Regions', 'Emerald Mines'),
  ('mozambique', 'Mozambique', 'Various Regions', 'Ruby & Garnet Mines'),
  ('kenya', 'Kenya', 'Various Regions', 'Various Mines'),
  ('democratic-republic-congo', 'Democratic Republic of Congo', 'Various Regions', 'Various Mines'),
  
  -- North America
  ('usa', 'United States', 'Various States', 'Various Mines'),
  ('canada', 'Canada', 'Various Provinces', 'Various Mines'),
  ('mexico', 'Mexico', 'Various States', 'Various Mines'),
  
  -- Europe
  ('russia', 'Russia', 'Ural Mountains', 'Alexandrite & Emerald Mines'),
  
  -- Australia
  ('australia', 'Australia', 'New South Wales', 'Lightning Ridge Opal Fields'),
  
  -- Synthetic/Lab-Grown
  ('laboratory-grown', 'Laboratory', 'Various Locations', 'Lab-Grown Gemstones'),
  ('synthetic', 'Laboratory', 'Various Locations', 'Synthetic Gemstones')
ON CONFLICT (name) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE origins IS 'Gemstone mining origins. The name field uses translation keys that are localized via gemstones.origins translation namespace.';
COMMENT ON COLUMN origins.name IS 'Translation key (e.g., "myanmar", "colombia") used for localization via translateOrigin() function';
COMMENT ON COLUMN origins.country IS 'Country name in English (used for display alongside translated name)';
COMMENT ON COLUMN origins.region IS 'Specific region within the country where mining occurs';
COMMENT ON COLUMN origins.mine_name IS 'Specific mine name (optional, for well-known mines)';
