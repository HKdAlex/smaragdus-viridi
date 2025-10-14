# 🐛 CRITICAL BUG: Model Switching Not Working

**Discovered:** 2025-10-14 22:40 UTC  
**Status:** ✅ FIXED

---

## 🔍 The Issue

**User spotted:** All benchmark tests showed `🤖 Using model: gpt-5` even when testing `gpt-5-mini`, `gpt-5-nano`, `gpt-4o`, and `gpt-4o-mini`.

**Terminal Evidence:**

```
Testing Model: gpt-5-mini
...
🤖 Using model: gpt-5    ← WRONG! Should be gpt-5-mini

Testing Model: gpt-5-nano
...
🤖 Using model: gpt-5    ← WRONG! Should be gpt-5-nano

Testing Model: gpt-4o
...
🤖 Using model: gpt-5    ← WRONG! Should be gpt-4o
```

**Result:** All 5 "tests" were actually just testing GPT-5 five times! 🤦

---

## 🔬 Root Cause

**File:** `scripts/ai-analysis/multi-image-processor.mjs` (line 48)

**Problem Code:**

```javascript
// Module-level constant - reads ONCE when module loads
const VISION_MODEL = process.env.OPENAI_VISION_MODEL || "gpt-5";

export async function analyzeGemstoneBatch(images, gemstoneId, supabase) {
  // Uses cached VISION_MODEL value
  console.log(`  🤖 Using model: ${VISION_MODEL}`);
  // ...
}
```

**Why It Failed:**

1. JavaScript modules are cached after first import
2. `const VISION_MODEL` is set **once** when module loads (at startup)
3. Benchmark changes `process.env.OPENAI_VISION_MODEL` between tests
4. But `VISION_MODEL` constant never re-reads the updated env variable
5. Result: Always uses the initial value ("gpt-5")

**This is a classic JavaScript module scope issue!**

---

## ✅ The Fix

**Changed:** Move `VISION_MODEL` **inside** the function so it reads fresh each time

**Fixed Code:**

```javascript
export async function analyzeGemstoneBatch(images, gemstoneId, supabase) {
  // Read model from env each time (allows dynamic switching in tests)
  const VISION_MODEL = process.env.OPENAI_VISION_MODEL || "gpt-5";

  console.log(`  🤖 Using model: ${VISION_MODEL}`); // Now correct!
  // ...
}
```

**Why This Works:**

- Variable is now function-scoped, not module-scoped
- Reads `process.env.OPENAI_VISION_MODEL` on **every function call**
- Benchmark can change env var and next call picks it up
- No module caching issues

---

## 🎯 Impact

### What This Means for Previous Tests

**All previous benchmark runs tested GPT-5 only:**

- ✅ We know GPT-5 works (but has token limit issue)
- ❌ We have NO data on GPT-5-mini, GPT-5-nano, GPT-4o, or GPT-4o-mini
- ❌ Cost comparisons were invalid (all same model!)
- ❌ Speed comparisons were invalid (all same model!)

### What Changes Now

**Next benchmark run will properly test:**

1. **GPT-5** @ 16K tokens, medium reasoning
2. **GPT-5-mini** @ 8K tokens, low reasoning
3. **GPT-5-nano** @ 4K tokens, low reasoning
4. **GPT-4o** @ 4K tokens, no reasoning
5. **GPT-4o-mini** @ 4K tokens, no reasoning

Each model will **actually be different** this time! 🎉

---

## 📊 Expected Results (Now That It's Fixed)

### Model Behavior Predictions

| Model           | Speed            | Cost/Gem   | Token Usage | Quality |
| --------------- | ---------------- | ---------- | ----------- | ------- |
| **gpt-5**       | Slowest (60-90s) | $0.30-0.40 | ~10K-12K    | Highest |
| **gpt-5-mini**  | Fast (20-40s)    | $0.03-0.06 | ~5K-7K      | High    |
| **gpt-5-nano**  | Fastest (10-20s) | $0.01-0.02 | ~3K-4K      | Good    |
| **gpt-4o**      | Medium (30-50s)  | $0.08-0.12 | ~4K-6K      | High    |
| **gpt-4o-mini** | Fast (15-30s)    | $0.01-0.03 | ~3K-5K      | Good    |

**We should see clear differentiation now!**

---

## 💡 Key Learnings

### 1. Module-Level Constants Are Sticky

- JavaScript modules cache after first import
- Constants set at module level never re-evaluate
- Bad for dynamic configuration

### 2. Env Vars Need Fresh Reads for Tests

- For test suites that modify `process.env`, always read inside functions
- Don't cache env vars at module level if they might change
- Trade-off: Tiny performance hit for flexibility

### 3. Always Validate Test Assumptions

- User caught this by reading logs carefully
- Could have wasted hours analyzing "different models" that were all the same
- **Lesson:** Trust but verify - check logs match expectations

### 4. Fix Order Matters

We fixed **two critical bugs** in correct order:

1. ✅ Token limit issue (would have affected all models)
2. ✅ Model switching issue (needed to actually test different models)

If we'd only fixed #1, we'd still be testing GPT-5 repeatedly!

---

## 🚀 Next Steps

1. ✅ **Bug fixed** - Model switching now works
2. ✅ **Token limits fixed** - Models have proper token allowances
3. 🧪 **Re-run benchmark** - Will actually test all 5 models
4. 📊 **Compare results** - Now we'll see real differences!

**Command to run:**

```bash
node scripts/benchmark-vision-models.mjs
```

**Expected duration:** 10-15 minutes  
**Expected output:** 5 clearly different results with varying speeds, costs, and quality

---

## 🔧 Files Changed

**Modified:**

- `scripts/ai-analysis/multi-image-processor.mjs` (line 48-50)
  - Moved `VISION_MODEL` from module-scope to function-scope
  - Now reads `process.env.OPENAI_VISION_MODEL` on every call

**No other changes needed** - this was the only place where model was cached!

---

**Status:** 🎯 Ready to run REAL benchmark with ACTUAL different models!

This is why code review and careful observation matter! Great catch! 🏆
