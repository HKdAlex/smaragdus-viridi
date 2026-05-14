-- Fix Russian marquise cut label: "Маркиза" -> "Маркиз"
UPDATE cuts
SET name_ru = 'Маркиз'
WHERE code = 'marquise';

UPDATE gemstones
SET cut_custom = 'Маркиз'
WHERE trim(cut_custom) IN ('Маркиза', 'маркиза');
