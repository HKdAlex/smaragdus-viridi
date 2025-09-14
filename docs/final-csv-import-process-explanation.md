# 💎 Final CSV Import Process - Complete Explanation

## 🎯 **What Happens During Import**

Based on your corrections, here's exactly what will happen when you run the CSV import:

## 📊 **Database Schema (Confirmed)**

### ✅ **Price Fields - CORRECT INTEGER APPROACH**

```sql
price_amount:      INTEGER  -- Total price in cents (e.g., 3867000 = $38,670.00)
price_per_carat:   INTEGER  -- Per-carat price in cents (e.g., 300000 = $3,000.00/ct)
quantity:          INTEGER  -- Number of stones in lot (e.g., 9 stones)
```

**Why integers are perfect:**

- No floating-point precision errors
- Standard financial data practice
- Handles large values: up to $21M per stone

## 🔄 **Import Process Flow**

### **Step 1: CSV Row Processing**

**Input CSV Row:**

```
,гранат\ родолит,Г 11,3,овал,9,4.28,5.0,4.0,,100
```

**Processing:**

1. **Serial Normalization**: `"Г 11"` → `"Г11"` (removes spaces/dashes)
2. **Gemstone Mapping**: `"гранат\ родолит"` → `"garnet"`
3. **Cut Mapping**: `"овал"` → `"oval"`
4. **Pricing Analysis**: `"100"` per-carat → `pricePerCarat: 10000, totalPrice: 42800`

**Database Entry Created:**

```json
{
  "serial_number": "Г11", // Normalized
  "name": "garnet",
  "cut": "oval",
  "weight_carats": 4.28, // Total weight of all 9 stones
  "quantity": 9, // Kept as lot (no splitting!)
  "price_amount": 42800, // $428 total (100 × 4.28ct)
  "price_per_carat": 10000, // $100/ct
  "in_stock": true
}
```

### **Step 2: Pricing Models Handled**

#### **Per-Carat Pricing (Most Common)**

```
CSV: изумруд,1,больш,фантазийная,1,12.89,15.0,20.7,7.2,3000
```

**Result:**

- `price_per_carat` = 300,000 cents ($3,000/ct)
- `price_amount` = 3,866,700 cents ($38,667 total)
- `quantity` = 1 stone

#### **Lot Pricing ("за лот")**

```
CSV: сапфир,С1,7,овал,3,7.18,12.5,9.3,6.4,"200 за лот"
```

**Result:**

- `price_per_carat` = NULL (no per-carat pricing)
- `price_amount` = 20,000 cents ($200 for entire lot)
- `quantity` = 3 stones

### **Step 3: ID Normalization Examples**

| CSV Input | Database Stored | Matches |
| --------- | --------------- | ------- |
| `"А9"`    | `"А9"`          | ✅      |
| `"А 9"`   | `"А9"`          | ✅      |
| `"а-9"`   | `"А9"`          | ✅      |
| `"Г11"`   | `"Г11"`         | ✅      |
| `"г 11"`  | `"Г11"`         | ✅      |

## 🚫 **What We DON'T Do (Per Your Corrections)**

### ❌ **No Lot Splitting**

```
// OLD (wrong):
// 9 stones → Create 9 separate database entries

// NEW (correct):
// 9 stones → Create 1 database entry with quantity=9
```

### ❌ **No Decimal Price Issues**

```
// We store in cents (integers):
$3,000.50 → 300050 cents ✅

// NOT as decimals:
$3,000.50 → 3000.50 ❌ (floating point errors)
```

## 📋 **Expected Import Results**

### **From Sample CSV Data (10 rows):**

```
Input:  10 CSV rows
Output: 10 database entries (lots kept intact)

Pricing:
- 8 per-carat entries: price_per_carat populated
- 2 lot entries: price_per_carat = NULL

Multi-stone lots:
- Г11: quantity=9, total_weight=4.28ct, price=$428 for lot
- Others: quantity=1 (individual stones)
```

### **Database Fields Populated:**

```sql
-- Always populated:
serial_number     -- Normalized (spaces removed)
name             -- Mapped to English enum
cut              -- Mapped to English enum
weight_carats    -- Total weight of lot
quantity         -- Number of stones in lot
price_amount     -- Total price in cents
price_currency   -- 'USD'
in_stock         -- true

-- Conditionally populated:
price_per_carat  -- Per-carat price (NULL for lot pricing)
internal_code    -- Storage location if provided
length_mm        -- Dimension if provided
width_mm         -- Dimension if provided
depth_mm         -- Dimension if provided

-- Defaults (to be updated by AI analysis later):
color           -- 'colorless'
clarity         -- 'SI1'
```

## 🔍 **Conflict Resolution**

### **Existing Stone Found (by normalized serial):**

1. **Update missing fields** (dimensions, location)
2. **Always update pricing** (CSV assumed current)
3. **Update stock status**
4. **Keep existing AI analysis data** (color, clarity)

### **New Stone:**

1. **Create with CSV data**
2. **Set default color/clarity** for future AI analysis
3. **Generate internal ID** for tracking

## 🚀 **Usage Commands**

### **Full Import:**

```bash
export NEXT_PUBLIC_SUPABASE_URL="your-url"
export SUPABASE_SERVICE_ROLE_KEY="your-key"
node scripts/csv-gemstone-parser.mjs
```

### **Test Only:**

```bash
node scripts/test-csv-parser-standalone.mjs
```

## ✅ **Quality Assurance**

- **✅ ID Normalization**: Handles "А9" vs "А 9" variations
- **✅ Pricing Integrity**: Integer storage prevents precision errors
- **✅ Lot Preservation**: Multi-stone entries kept as single lots
- **✅ Bilingual Mapping**: Complete Russian → English translation
- **✅ Data Validation**: Skips invalid entries with clear error reporting
- **✅ Conflict Resolution**: Smart updates preserve existing data

**Ready for production import!** 🎉

---

**Last Updated**: January 25, 2025  
**Version**: 2.0 - With lot preservation and ID normalization
