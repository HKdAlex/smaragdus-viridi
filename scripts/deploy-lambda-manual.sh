#!/bin/bash

# Manual Lambda deployment script (when IAM permissions are limited)
# This script packages the function - you'll need to create the function manually or use AWS Console

set -e

FUNCTION_NAME="video-optimizer"
REGION="${AWS_REGION:-eu-north-1}"

echo "📦 Packaging Lambda function..."

cd "$(dirname "$0")/../aws/lambda/video-optimizer"
zip -r /tmp/video-optimizer.zip index.js package.json

echo "✅ Function packaged: /tmp/video-optimizer.zip"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Create IAM Role (if needed):"
echo "   - Go to AWS Console → IAM → Roles → Create Role"
echo "   - Select 'Lambda' as trusted entity"
echo "   - Attach policy: AWSLambdaBasicExecutionRole"
echo "   - Name: lambda-video-optimizer-role"
echo ""
echo "2. Create Lambda Function:"
echo "   - Go to AWS Console → Lambda → Create Function"
echo "   - Name: $FUNCTION_NAME"
echo "   - Runtime: Node.js 20.x"
echo "   - Role: lambda-video-optimizer-role (or existing role)"
echo "   - Upload: /tmp/video-optimizer.zip"
echo "   - Memory: 2048 MB"
echo "   - Timeout: 900 seconds (15 minutes)"
echo ""
echo "3. Add FFmpeg Layer:"
echo "   - In Lambda function → Layers → Add a layer"
echo "   - Use public layer ARN (if available in your region):"
echo "     arn:aws:lambda:${REGION}:898466741470:layer:ffmpeg:11"
echo "   - Or create your own using:"
echo "     https://github.com/serverlesspub/ffmpeg-aws-lambda-layer"
echo ""
echo "4. Enable Function URL (recommended):"
echo "   - In Lambda function → Configuration → Function URL"
echo "   - Create Function URL"
echo "   - Auth type: NONE"
echo "   - Copy the URL and set as Supabase secret:"
echo "     supabase secrets set AWS_LAMBDA_FUNCTION_URL=<url>"
echo ""
echo "Or use AWS CLI (if you have permissions):"
echo "  aws lambda create-function \\"
echo "    --function-name $FUNCTION_NAME \\"
echo "    --runtime nodejs20.x \\"
echo "    --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-video-optimizer-role \\"
echo "    --handler index.handler \\"
echo "    --zip-file fileb:///tmp/video-optimizer.zip \\"
echo "    --timeout 900 \\"
echo "    --memory-size 2048 \\"
echo "    --region $REGION"


