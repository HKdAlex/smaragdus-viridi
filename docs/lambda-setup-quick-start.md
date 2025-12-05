# Lambda Video Optimization - Quick Start

## What's Been Set Up

✅ Lambda function code (`aws/lambda/video-optimizer/`)
✅ Edge Function updated to call Lambda
✅ Deployment script (`scripts/deploy-lambda-video-optimizer.sh`)
✅ Setup documentation

## Next Steps

### 1. Deploy Lambda Function

```bash
./scripts/deploy-lambda-video-optimizer.sh
```

This creates:
- Lambda function: `video-optimizer`
- IAM role with permissions
- FFmpeg layer attachment

### 2. Enable Lambda Function URL (Recommended)

Lambda Function URL provides a simple HTTP endpoint without AWS signing:

```bash
aws lambda create-function-url-config \
  --function-name video-optimizer \
  --auth-type NONE \
  --cors '{"AllowOrigins": ["*"], "AllowMethods": ["POST"], "AllowHeaders": ["content-type"]}'
```

Get the URL:
```bash
aws lambda get-function-url-config --function-name video-optimizer --query FunctionUrl --output text
```

### 3. Configure Supabase Secrets

**Option A: Using Lambda Function URL (Simpler)**
```bash
supabase secrets set AWS_LAMBDA_FUNCTION_URL=https://xxx.lambda-url.REGION.on.aws/ --project-ref YOUR_PROJECT_REF
```

**Option B: Using Lambda Invoke (Requires AWS Credentials)**
```bash
supabase secrets set AWS_LAMBDA_FUNCTION_NAME=video-optimizer --project-ref YOUR_PROJECT_REF
supabase secrets set AWS_REGION=eu-north-1 --project-ref YOUR_PROJECT_REF
supabase secrets set AWS_ACCESS_KEY_ID=your-key --project-ref YOUR_PROJECT_REF
supabase secrets set AWS_SECRET_ACCESS_KEY=your-secret --project-ref YOUR_PROJECT_REF
```

### 4. Update Edge Function Code (if using Function URL)

If using Function URL, update the `callLambdaFunction` in Edge Function to use HTTP instead of AWS SDK.

### 5. Deploy Edge Function

```bash
supabase functions deploy optimize-video --project-ref YOUR_PROJECT_REF
```

### 6. Test

Upload a video and check:
- Edge Function logs
- Lambda CloudWatch logs
- Database `processing_status` updates

## Cost Estimate

- **10 videos/month**: ~$0.005
- **100 videos/month**: ~$0.05
- **1,000 videos/month**: ~$0.50

Much cheaper than EC2 for low volume! 🎉


