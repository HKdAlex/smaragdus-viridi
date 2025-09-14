# Russian CSV Gemstone Data Analysis & Mapping Strategy

## CSV Structure Analysis

### Column Mapping
| Russian | English | Database Field | Notes |
|---------|---------|----------------|-------|
| Фото | Photo | - | Usually empty, references photos |
| Камень | Gemstone Type | `name` | Maps to gemstone_type enum |
| Номер | Serial Number | `serial_number` | Unique identifier like "А1", "1'1" |
| Адрес | Storage Address | `internal_code` | Location/storage reference |
| Огранка | Cut | `cut` | Maps to gem_cut enum |
| Кол-во | Quantity | - | Available quantity |
| Вес ct | Weight (carats) | `weight_carats` | Weight in carats |
| Длина | Length (mm) | `length_mm` | Length dimension |
| Ширин | Width (mm) | `width_mm` | Width dimension |
| Глубин | Depth (mm) | `depth_mm` | Depth dimension |
| Цена $ за ct | Price $/ct | `price_amount` | Price per carat in USD |

## Gemstone Type Mapping

### ✅ Already in Database
```typescript
const existingGemstoneTypes = {
  'изумруд': 'emerald',
  'гранат': 'garnet',
  'танзанит': 'tanzanite',
  'сапфир': 'sapphire',
  'аквамарин': 'aquamarine',
  'перидот': 'peridot',
  'циркон': 'zircon',
  'апатит': 'apatite',
  'аметист': 'amethyst',
  'цитрин': 'citrine',
  'топаз': 'topaz',
  'турмалин': 'tourmaline',
  'могранит': 'morganite',
  'кварц дымчатый': 'quartz'
}
```

### ❌ Missing from Database (Need to Add)
```typescript
const missingGemstoneTypes = {
  'параиба синт': 'paraiba', // Synthetic Paraiba Tourmaline
  'шпинель (лаб)': 'spinel', // Lab Spinel
  'александрит': 'alexandrite',
  'агат': 'agate'
}
```

## Cut Type Mapping

### ✅ Already in Database
```typescript
const existingCuts = {
  'фантазийная': 'fantasy',
  'октагон': 'emerald', // Octagon similar to emerald cut
  'круг': 'round',
  'овал': 'oval',
  'принцесса': 'princess',
  'капля': 'pear',
  'маркиз': 'marquise',
  'кушон': 'cushion'
}
```

### ❌ Missing from Database (Need to Add)
```typescript
const missingCuts = {
  'багет': 'baguette',
  'ашер': 'asscher',
  'ромб': 'rhombus',
  'трапеция': 'trapezoid',
  'треугольник': 'triangle',
  'сердце': 'heart',
  'кабошон': 'cabochon',
  'пентагон': 'pentagon',
  'гексагон': 'hexagon'
}
```

## Data Quality Issues

### 1. Complex Pricing
- Some entries: "200 за лот" (200 for the lot)
- Some entries: Multiple prices for multiple stones
- Need to handle per-stone vs lot pricing

### 2. Multi-Stone Entries  
- Quantity > 1 with dimensions like "8,9 5,4"
- Need to split into individual stones or handle as sets

### 3. Missing/Invalid Data
- Empty fields for some stones
- "раб" (repair/work) status stones
- Inconsistent serial number formats

### 4. Special Characters
- Russian decimal separators (commas vs periods)
- Complex dimension strings with ranges

## Implementation Strategy

### Phase 1: Database Schema Updates
1. Add missing gemstone types to enum
2. Add missing cut types to enum
3. Create migration script

### Phase 2: Data Parser
1. Russian-to-English mapping functions
2. Data cleaning and normalization
3. Price calculation (per carat to total price)
4. Dimension parsing

### Phase 3: Import Logic
1. Match existing stones by serial number
2. Update metadata where missing
3. Handle conflicts (prefer CSV data or DB data)
4. Create audit trail

### Phase 4: Validation
1. Data completeness checks
2. Price validation
3. Dimension consistency
4. Quality scoring

## Conflict Resolution Rules

When CSV data conflicts with existing DB data:

1. **Serial Numbers**: CSV wins (more authoritative)
2. **Prices**: Compare dates, use most recent
3. **Dimensions**: Prefer more complete data
4. **Stock Status**: CSV wins (current inventory)
5. **Missing Data**: Fill from CSV where DB is null

## Edge Cases to Handle

1. **Multiple stones with same serial**: Create variants (А1-1, А1-2)
2. **Lot pricing**: Calculate per-stone price from total
3. **Dimension ranges**: Use average or create multiple entries
4. **Invalid gemstone types**: Map to 'quartz' with notes
5. **Invalid cuts**: Map to 'fantasy' with notes

## Sample Data Processing

### Example 1: Standard Entry
```csv
,изумруд,А1,больш,октагон,1,8.34,15.2,10.5,,1600
```
```typescript
{
  name: 'emerald',
  serial_number: 'А1',
  internal_code: 'больш',
  cut: 'emerald', // octagon → emerald
  weight_carats: 8.34,
  length_mm: 15.2,
  width_mm: 10.5,
  depth_mm: null,
  price_amount: 1334400, // 1600 * 8.34 * 100 (to cents)
  price_currency: 'USD'
}
```

### Example 2: Multi-stone Entry
```csv
,гранат\ родолит,Г11,3,овал,9,4.28,5.0,4.0,,100
```
Processing: Create 9 individual entries with average weight (4.28/9 = 0.476ct each)

## Success Metrics

- **Data Coverage**: % of CSV entries successfully mapped
- **Completeness**: % of required fields populated  
- **Price Accuracy**: Validation of price calculations
- **Conflict Resolution**: % of conflicts resolved automatically
- **Error Rate**: % of entries requiring manual review

## Next Steps

1. Create enum update migration
2. Build data parser with mapping functions
3. Create import script with validation
4. Test with sample data subset
5. Full import with audit logging
