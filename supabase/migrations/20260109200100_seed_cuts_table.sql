-- Seed cuts table with existing gem_cut enum values and translations
-- Contract: CUT-C0.2

INSERT INTO cuts (code, name_en, name_ru, display_order) VALUES
  ('round', 'Round Brilliant', 'Круглая огранка', 1),
  ('oval', 'Oval', 'Овальная огранка', 2),
  ('marquise', 'Marquise', 'Маркиз', 3),
  ('pear', 'Pear', 'Капля', 4),
  ('emerald', 'Emerald Cut', 'Изумрудная огранка', 5),
  ('princess', 'Princess', 'Принцесса', 6),
  ('cushion', 'Cushion', 'Подушка', 7),
  ('radiant', 'Radiant', 'Радиант', 8),
  ('asscher', 'Asscher', 'Ашер', 9),
  ('baguette', 'Baguette', 'Багет', 10),
  ('heart', 'Heart', 'Сердце', 11),
  ('triangle', 'Triangle', 'Треугольник', 12),
  ('trapezoid', 'Trapezoid', 'Трапеция', 13),
  ('rhombus', 'Rhombus', 'Ромб', 14),
  ('pentagon', 'Pentagon', 'Пентагон', 15),
  ('hexagon', 'Hexagon', 'Шестигранник', 16),
  ('cabochon', 'Cabochon', 'Кабошон', 17),
  ('fantasy', 'Fantasy', 'Фантазийная огранка', 18)
ON CONFLICT (code) DO NOTHING;
