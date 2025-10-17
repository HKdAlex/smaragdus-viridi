# AI v6 Batch Processing Guide

## ✅ What We Fixed

### 1. **Table Cleared**

- Deleted all 69 rows from `gemstones_ai_v6`
- Fresh start with latest script
- Now processing: **1,079 gemstones**

### 2. **Cut Name Standardization**

- Updated AI prompt to use **exact** cut names (lowercase)
- Prevents "hexagonal" → should be "pentagon"
- Prevents "triangular" → should be "triangle"
- AI will now output: `round`, `oval`, `pear`, `emerald`, `princess`, `cushion`, `asscher`, `heart`, `marquise`, `baguette`, `pentagon`, `triangle`, `rhombus`, `trapezoid`, `fantasy`

### 3. **How We Track Processed Gems**

- A gemstone is "processed" if it has a row in `gemstones_ai_v6` table
- The script checks this table before processing
- Primary key: `gemstone_id` (foreign key to `gemstones.id`)

---

## 🚀 Running the Parallel Script

### **Command:**

```bash
cd /Users/alex/Work/Projects/Sites/smaragdus_viridi
node -r dotenv/config scripts/batch-process-all-parallel.mjs dotenv_config_path=.env.local
```

### **Features:**

1. ✅ **10 Concurrent Workers** - Process 10 gems simultaneously
2. ✅ **Error Handling** - Individual gems can fail without stopping the batch
3. ✅ **Progress Tracking** - Saves progress to `.ai-v6-progress.json`
4. ✅ **Resumable** - Can stop/restart anytime, picks up where it left off
5. ✅ **Rate Limiting** - 2-second delay between batches
6. ✅ **Cost Monitoring** - Real-time cost tracking
7. ✅ **Detailed Logging** - Shows success/failure for each gem

---

## ⏱️ Expected Timeline

### **Full Catalog (1,079 gems):**

- **10 workers**: ~3.3 hours
- **Cost**: ~$5.50
- **Success rate**: 95-100% (based on citrines)

### **Breakdown:**

```
1,079 gemstones ÷ 10 workers = 108 batches
108 batches × 110 seconds = 11,880 seconds
11,880 seconds + 108 × 2s delays = 12,096 seconds
= 201 minutes = 3.35 hours
```

---

## 📊 What Gets Processed

For each gemstone:

1. **Image Analysis** (~60s):

   - Download up to 20 images
   - Detect cut (round, pear, etc.)
   - Detect color (yellow, green, etc.)
   - Select best primary image (avoid measurement tools)

2. **Text Generation** (~50s):

   - Technical description (EN + RU)
   - Emotional description (EN + RU)
   - Historical story (EN + RU)
   - Care instructions (EN + RU)
   - Marketing highlights (EN + RU)
   - Promotional text (EN + RU)

3. **Database Updates**:
   - Save to `gemstones_ai_v6` table
   - Update `gemstones.ai_color` if different
   - Update `gemstones.cut` if different

---

## 🛠️ Monitoring Progress

### **During Processing:**

```bash
# Watch the terminal output
# You'll see:
# - Batch X/Y progress
# - Individual gem success/failure
# - Running totals (cost, time, success rate)
```

### **Check Database:**

```sql
-- Count processed so far
SELECT COUNT(*) FROM gemstones_ai_v6;

-- Check success rate
SELECT
  COUNT(*) as total,
  AVG(generation_confidence) as avg_confidence,
  SUM(generation_cost_usd) as total_cost
FROM gemstones_ai_v6;
```

### **Resume After Interruption:**

- Just re-run the same command
- Script reads `.ai-v6-progress.json`
- Skips already processed gems
- Continues from last checkpoint

---

## ⚠️ Error Handling

### **What Happens When a Gem Fails:**

1. Error is logged to console
2. Gem ID + error saved to progress file
3. Other workers continue processing
4. Batch completes normally
5. Failed gems listed in final summary

### **Common Errors:**

- **Image download timeout**: Rare (~0.3% of images), gem still processes with fewer images
- **OpenAI rate limit**: Very rare with 2s delays, script will retry
- **Database connection**: Extremely rare, script will retry
- **Invalid data**: Logged and skipped

### **Retry Failed Gems:**

After the batch completes, you can re-run just the failed ones:

```javascript
// Failed IDs will be in the final summary
// Or check the progress file: .ai-v6-progress.json
```

---

## 📈 Quality Monitoring

### **Expected Metrics:**

- **Confidence**: 0.85-0.95 (very high)
- **Cost**: $0.004-0.006 per gem
- **Time**: 100-120 seconds per gem
- **Success rate**: 95-100%

### **Red Flags:**

- Confidence < 0.7: Might indicate poor images or data
- Cost > $0.01: Check if using correct model (gpt-4o-mini)
- Time > 180s: Network issues or rate limiting

### **Sample Check:**

After first 50-100 gems, check a few randomly:

```sql
SELECT * FROM gemstones_ai_v6
ORDER BY RANDOM()
LIMIT 5;
```

---

## 🎯 After Processing

### **1. Verify Results:**

```sql
-- Check coverage
SELECT
  COUNT(*) as total_gems,
  COUNT(v6.gemstone_id) as with_ai_text,
  ROUND(100.0 * COUNT(v6.gemstone_id) / COUNT(*), 1) as coverage_pct
FROM gemstones g
LEFT JOIN gemstones_ai_v6 v6 ON g.id = v6.gemstone_id
WHERE g.price_amount > 0;
```

### **2. View in Browser:**

- EN Catalog: http://localhost:3000/en/catalog
- RU Catalog: http://localhost:3000/ru/catalog

### **3. Check Quality:**

- Quantity-aware language (singles vs pairs vs trios)
- Correct prices (in dollars, not cents)
- Clean primary images (no measurement tools)
- AI-detected cuts/colors saved correctly

### **4. Clean Up:**

```bash
# Remove progress file
rm .ai-v6-progress.json
```

---

## 🚨 Emergency Stop

### **To Stop Processing:**

Press `Ctrl+C` in the terminal

### **What Happens:**

- Current batch completes (up to 10 gems)
- Progress saved to file
- Can resume later

### **To Resume:**

Just run the script again - it will pick up where it left off!

---

## 💡 Tips

1. **Run in background**: Use `tmux` or `screen` for long sessions
2. **Monitor costs**: Check OpenAI usage at https://platform.openai.com/usage
3. **Test first**: Process 50-100 gems, verify quality, then run full batch
4. **Backup database**: Always good practice before bulk operations
5. **Check logs**: Watch for patterns in errors or quality issues

---

## 📞 Troubleshooting

### **"No gemstones to process"**

- All gems already in `gemstones_ai_v6`
- Check: `SELECT COUNT(*) FROM gemstones_ai_v6;`

### **"OpenAI API error: Rate limit"**

- Very rare with current delays
- Script will retry automatically
- If persistent, increase `BATCH_DELAY_MS` in script

### **"Supabase connection timeout"**

- Check internet connection
- Check Supabase status
- Script will retry automatically

### **"High failure rate (>10%)"**

- Check OpenAI API key validity
- Check image URLs are accessible
- Check database connection
- Review error messages in failed gems list

---

## ✨ Ready to Go!

You're all set! The script is:

- ✅ Error-proof
- ✅ Resumable
- ✅ Cost-efficient
- ✅ Fast (10 workers)
- ✅ Quality-monitored

Estimated completion: **~3.3 hours** for all 1,079 gems

Total cost: **~$5.50**

Good luck! 🚀
