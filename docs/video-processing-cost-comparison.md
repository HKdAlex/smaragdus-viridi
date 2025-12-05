# Video Processing Cost Comparison: EC2 vs Lambda

## Cost Calculation Assumptions

**Video Processing Requirements:**
- Average video size: 27MB (as per your uploads)
- Processing time: 5-15 seconds (EC2) vs 10-30 seconds (Lambda)
- Memory needed: 1-2GB
- CPU: Moderate (ffmpeg encoding)

---

## EC2 Pricing

### Option 1: On-Demand t3.medium
- **Instance**: t3.medium (2 vCPU, 4GB RAM)
- **Cost**: ~$0.0416/hour = **~$30/month** (always running)
- **Processing time**: 5-15 seconds per video
- **Best for**: Consistent, predictable workload

### Option 2: On-Demand c5.large
- **Instance**: c5.large (2 vCPU, 4GB RAM)
- **Cost**: ~$0.085/hour = **~$61/month** (always running)
- **Processing time**: 3-10 seconds per video (faster)
- **Best for**: Higher performance needs

### Option 3: Spot Instance (t3.medium)
- **Instance**: t3.medium Spot
- **Cost**: ~$0.007-0.015/hour = **~$5-11/month** (can be interrupted)
- **Processing time**: 5-15 seconds per video
- **Best for**: Cost optimization, can handle interruptions
- **Risk**: Can be terminated with 2-minute notice

### Option 4: Spot Instance (c5.large)
- **Instance**: c5.large Spot
- **Cost**: ~$0.015-0.025/hour = **~$11-18/month**
- **Processing time**: 3-10 seconds per video
- **Best for**: Best performance/cost ratio

---

## Lambda Pricing

**Lambda Pricing Components:**
1. **Requests**: $0.20 per 1M requests
2. **Compute**: $0.0000166667 per GB-second
3. **Memory**: Need 1-2GB for video processing

### Lambda Cost Calculation

**Per Video:**
- Memory: 1.5GB (1500MB)
- Processing time: 20 seconds (average)
- Compute cost: 1.5GB × 20s × $0.0000166667 = **$0.0005 per video**
- Request cost: $0.20 / 1M = **$0.0000002 per video** (negligible)

**Total per video: ~$0.0005**

---

## Cost Comparison by Volume

### Scenario 1: Low Volume (10 videos/month)
- **EC2 (t3.medium On-Demand)**: $30/month = **$3.00 per video**
- **EC2 (t3.medium Spot)**: $5-11/month = **$0.50-1.10 per video**
- **Lambda**: 10 × $0.0005 = **$0.005 total** = **$0.0005 per video**

**Winner: Lambda** (600x cheaper)

---

### Scenario 2: Medium Volume (100 videos/month)
- **EC2 (t3.medium On-Demand)**: $30/month = **$0.30 per video**
- **EC2 (t3.medium Spot)**: $5-11/month = **$0.05-0.11 per video**
- **Lambda**: 100 × $0.0005 = **$0.05 total** = **$0.0005 per video**

**Winner: Lambda** (100-600x cheaper)

---

### Scenario 3: High Volume (1,000 videos/month)
- **EC2 (t3.medium On-Demand)**: $30/month = **$0.03 per video**
- **EC2 (t3.medium Spot)**: $5-11/month = **$0.005-0.011 per video**
- **Lambda**: 1,000 × $0.0005 = **$0.50 total** = **$0.0005 per video**

**Winner: Lambda** (10-100x cheaper)

---

### Scenario 4: Very High Volume (10,000 videos/month)
- **EC2 (t3.medium On-Demand)**: $30/month = **$0.003 per video**
- **EC2 (t3.medium Spot)**: $5-11/month = **$0.0005-0.0011 per video**
- **Lambda**: 10,000 × $0.0005 = **$5.00 total** = **$0.0005 per video**

**Winner: EC2 Spot** (slightly cheaper) or **Lambda** (comparable)

---

## Break-Even Analysis

**EC2 becomes cheaper than Lambda when:**
- Processing more than **~60,000 videos/month** (On-Demand)
- Processing more than **~10,000-22,000 videos/month** (Spot)

**For most use cases (< 1,000 videos/month): Lambda is significantly cheaper**

---

## Additional Considerations

### EC2 Advantages:
- ✅ Always available (no cold starts)
- ✅ Can handle multiple videos simultaneously
- ✅ More control over environment
- ✅ Can install custom tools/scripts
- ✅ Better for batch processing

### EC2 Disadvantages:
- ❌ Pay even when idle
- ❌ Need to manage server (updates, security)
- ❌ Fixed cost regardless of usage
- ❌ Spot instances can be interrupted

### Lambda Advantages:
- ✅ Pay only for what you use
- ✅ Auto-scaling (handles spikes)
- ✅ No server management
- ✅ No idle costs
- ✅ Built-in monitoring/logging

### Lambda Disadvantages:
- ⚠️ Cold starts (1-3 seconds)
- ⚠️ 15-minute timeout limit
- ⚠️ 10GB memory limit
- ⚠️ More complex setup (need FFmpeg Layer)
- ⚠️ Slower processing (10-30s vs 5-15s)

---

## Recommendation

### For Your Use Case (Admin Uploads):

**Lambda is cheaper** for typical admin upload volumes (< 1,000 videos/month).

**Estimated Monthly Costs:**
- **10 videos**: Lambda = $0.005 vs EC2 = $30
- **100 videos**: Lambda = $0.05 vs EC2 = $30
- **1,000 videos**: Lambda = $0.50 vs EC2 = $30

**However**, if you expect:
- Very high volume (> 10,000 videos/month)
- Need for batch processing
- Custom processing requirements

Then **EC2 Spot** becomes competitive.

---

## Final Recommendation

**Start with Lambda** because:
1. ✅ Much cheaper for typical usage
2. ✅ No infrastructure management
3. ✅ Auto-scales automatically
4. ✅ Can switch to EC2 later if needed

**Switch to EC2 Spot** if:
- Processing > 10,000 videos/month
- Need faster processing times
- Need custom tools/scripts

---

## Cost Summary Table

| Volume | EC2 On-Demand | EC2 Spot | Lambda | Winner |
|--------|---------------|----------|--------|--------|
| 10/mo | $30 ($3/video) | $5-11 ($0.50-1.10/video) | $0.005 ($0.0005/video) | **Lambda** |
| 100/mo | $30 ($0.30/video) | $5-11 ($0.05-0.11/video) | $0.05 ($0.0005/video) | **Lambda** |
| 1,000/mo | $30 ($0.03/video) | $5-11 ($0.005-0.011/video) | $0.50 ($0.0005/video) | **Lambda** |
| 10,000/mo | $30 ($0.003/video) | $5-11 ($0.0005-0.0011/video) | $5.00 ($0.0005/video) | **EC2 Spot** |

**Conclusion: Lambda is cheaper for volumes < 10,000 videos/month**


