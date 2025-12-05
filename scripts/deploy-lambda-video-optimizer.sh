#!/bin/bash

# Deploy AWS Lambda function for video optimization
# This script creates/updates the Lambda function with FFmpeg layer

set -e

# Configuration
FUNCTION_NAME="video-optimizer"
RUNTIME="nodejs20.x"
MEMORY_SIZE=2048
TIMEOUT=900
REGION="${AWS_REGION:-eu-north-1}"
ROLE_NAME="lambda-video-optimizer-role"

# FFmpeg Layer ARN (public layer)
# For eu-north-1, you may need to create your own layer or use a different region
# Check: https://github.com/serverlesspub/ffmpeg-aws-lambda-layer
FFMPEG_LAYER_ARN="arn:aws:lambda:${REGION}:898466741470:layer:ffmpeg:11"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Deploying Lambda function: ${FUNCTION_NAME}${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if function exists
FUNCTION_EXISTS=$(aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" 2>&1 || echo "NOT_FOUND")

if [[ "$FUNCTION_EXISTS" == *"NOT_FOUND"* ]] || [[ "$FUNCTION_EXISTS" == *"ResourceNotFoundException"* ]]; then
    echo -e "${YELLOW}📦 Function doesn't exist, creating new function...${NC}"
    
    # Create IAM role if it doesn't exist
    echo -e "${YELLOW}🔐 Checking IAM role...${NC}"
    ROLE_EXISTS=$(aws iam get-role --role-name "$ROLE_NAME" 2>&1 || echo "NOT_FOUND")
    
    if [[ "$ROLE_EXISTS" == *"NOT_FOUND"* ]] || [[ "$ROLE_EXISTS" == *"NoSuchEntity"* ]]; then
        echo -e "${YELLOW}Creating IAM role...${NC}"
        
        # Create trust policy
        cat > /tmp/trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
        
        # Create role
        aws iam create-role \
            --role-name "$ROLE_NAME" \
            --assume-role-policy-document file:///tmp/trust-policy.json
        
        # Attach basic Lambda execution policy
        aws iam attach-role-policy \
            --role-name "$ROLE_NAME" \
            --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
        
        echo -e "${GREEN}✅ IAM role created${NC}"
        
        # Wait for role to be available
        sleep 5
    else
        echo -e "${GREEN}✅ IAM role already exists${NC}"
    fi
    
    # Get role ARN
    ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)
    
    # Package function
    echo -e "${YELLOW}📦 Packaging Lambda function...${NC}"
    cd "$(dirname "$0")/../aws/lambda/video-optimizer"
    zip -r /tmp/function.zip index.js package.json
    
    # Create function
    echo -e "${YELLOW}Creating Lambda function...${NC}"
    aws lambda create-function \
        --function-name "$FUNCTION_NAME" \
        --runtime "$RUNTIME" \
        --role "$ROLE_ARN" \
        --handler index.handler \
        --zip-file fileb:///tmp/function.zip \
        --timeout "$TIMEOUT" \
        --memory-size "$MEMORY_SIZE" \
        --layers "$FFMPEG_LAYER_ARN" \
        --region "$REGION" \
        --description "Video optimization using FFmpeg for Supabase Edge Functions"
    
    echo -e "${GREEN}✅ Lambda function created successfully!${NC}"
else
    echo -e "${YELLOW}📦 Function exists, updating code...${NC}"
    
    # Package function
    cd "$(dirname "$0")/../aws/lambda/video-optimizer"
    zip -r /tmp/function.zip index.js package.json
    
    # Update function code
    aws lambda update-function-code \
        --function-name "$FUNCTION_NAME" \
        --zip-file fileb:///tmp/function.zip \
        --region "$REGION"
    
    # Update configuration
    aws lambda update-function-configuration \
        --function-name "$FUNCTION_NAME" \
        --timeout "$TIMEOUT" \
        --memory-size "$MEMORY_SIZE" \
        --layers "$FFMPEG_LAYER_ARN" \
        --region "$REGION"
    
    echo -e "${GREEN}✅ Lambda function updated successfully!${NC}"
fi

# Get function ARN
FUNCTION_ARN=$(aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" --query 'Configuration.FunctionArn' --output text)

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Set environment variables in Supabase Edge Function:"
echo "   - AWS_LAMBDA_FUNCTION_NAME=$FUNCTION_NAME"
echo "   - AWS_REGION=$REGION"
echo "   - AWS_ACCESS_KEY_ID=<your-access-key>"
echo "   - AWS_SECRET_ACCESS_KEY=<your-secret-key>"
echo ""
echo "2. Function ARN: $FUNCTION_ARN"
echo ""
echo "3. Test the function:"
echo "   aws lambda invoke --function-name $FUNCTION_NAME --payload '{\"videoBuffer\":\"...\",\"videoSize\":1000}' /tmp/response.json"
echo ""

# Cleanup
rm -f /tmp/function.zip /tmp/trust-policy.json


