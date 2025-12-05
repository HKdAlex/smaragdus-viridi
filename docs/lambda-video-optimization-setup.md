# Lambda Video Optimization Setup Guide

This guide walks you through setting up AWS Lambda for video processing to replace the failing ffmpeg.wasm approach.

## Prerequisites

1. AWS CLI installed and configured
2. AWS account with Lambda permissions
3. Supabase project with Edge Functions

## Step 1: Deploy Lambda Function

Run the deployment script:

```bash
./scripts/deploy-lambda-video-optimizer.sh
```

This will:
- Create the Lambda function (`video-optimizer`)
- Set up IAM role with necessary permissions
- Configure memory (2GB) and timeout (15 minutes)
- Attach FFmpeg layer

**Note**: The script uses a public FFmpeg layer. If it's not available in your region, you may need to create your own layer or adjust the region.

## Step 2: Configure AWS Credentials

You need AWS credentials that can invoke Lambda functions. Create an IAM user with `lambda:InvokeFunction` permission:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "lambda:InvokeFunction",
      "Resource": "arn:aws:lambda:REGION:ACCOUNT_ID:function:video-optimizer"
    }
  ]
}
```

## Step 3: Set Supabase Edge Function Secrets

In your Supabase project dashboard, go to **Edge Functions** → **Settings** → **Secrets** and add:

```
AWS_LAMBDA_FUNCTION_NAME=video-optimizer
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
```

Or via Supabase CLI:

```bash
supabase secrets set AWS_LAMBDA_FUNCTION_NAME=video-optimizer --project-ref YOUR_PROJECT_REF
supabase secrets set AWS_REGION=eu-north-1 --project-ref YOUR_PROJECT_REF
supabase secrets set AWS_ACCESS_KEY_ID=your-access-key-id --project-ref YOUR_PROJECT_REF
supabase secrets set AWS_SECRET_ACCESS_KEY=your-secret-access-key --project-ref YOUR_PROJECT_REF
```

## Step 4: Update Edge Function

The Edge Function code has been updated to call Lambda instead of ffmpeg.wasm. Redeploy:

```bash
supabase functions deploy optimize-video --project-ref YOUR_PROJECT_REF
```

## Step 5: Test

1. Upload a video through the admin interface
2. Check Edge Function logs for Lambda invocation
3. Verify video optimization status updates in the database
4. Check Lambda CloudWatch logs for processing details

## Troubleshooting

### Lambda Function Not Found

If you get "Function not found" errors:
- Verify the function name matches: `AWS_LAMBDA_FUNCTION_NAME`
- Check the region matches: `AWS_REGION`
- Ensure the function was deployed successfully

### Authentication Errors

If you get authentication errors:
- Verify AWS credentials are correct
- Check IAM user has `lambda:InvokeFunction` permission
- Ensure credentials are set as Supabase secrets

### FFmpeg Layer Not Found

If FFmpeg layer is not available in your region:
1. Create your own layer using: https://github.com/serverlesspub/ffmpeg-aws-lambda-layer
2. Update the `FFMPEG_LAYER_ARN` in the deployment script
3. Redeploy the function

### Timeout Errors

If videos timeout:
- Increase Lambda timeout (max 15 minutes)
- Increase memory allocation (helps with processing speed)
- Check video size limits

## Cost Monitoring

Monitor Lambda costs in AWS Cost Explorer:
- Filter by service: Lambda
- Filter by function: `video-optimizer`

Expected costs:
- **10 videos/month**: ~$0.005
- **100 videos/month**: ~$0.05
- **1,000 videos/month**: ~$0.50

## Architecture

```
Admin Uploads Video
    ↓
Supabase Storage
    ↓
Edge Function (optimize-video)
    ↓
AWS Lambda (video-optimizer)
    ↓
FFmpeg Processing
    ↓
Optimized Video + Thumbnail
    ↓
Supabase Storage
    ↓
Database Updated
```

## Rollback

If you need to rollback to the original implementation:

1. Remove AWS secrets from Supabase
2. The Edge Function will automatically fallback to using original video (no optimization)
3. Videos will still work, just not optimized


