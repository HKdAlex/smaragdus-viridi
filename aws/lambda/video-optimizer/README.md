# Video Optimizer Lambda Function

AWS Lambda function for processing videos using FFmpeg.

## Deployment

### Prerequisites

1. AWS CLI configured
2. FFmpeg Lambda Layer ARN (see below)

### FFmpeg Layer

Use this public FFmpeg layer:
- **ARN**: `arn:aws:lambda:us-east-1:898466741470:layer:ffmpeg:11`
- **Region**: Adjust for your region or use a custom layer

Or create your own using: https://github.com/serverlesspub/ffmpeg-aws-lambda-layer

### Deploy

```bash
# Package the function
cd aws/lambda/video-optimizer
zip -r function.zip index.js package.json

# Create Lambda function
aws lambda create-function \
  --function-name video-optimizer \
  --runtime nodejs20.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 900 \
  --memory-size 2048 \
  --layers arn:aws:lambda:REGION:898466741470:layer:ffmpeg:11

# Or update existing function
aws lambda update-function-code \
  --function-name video-optimizer \
  --zip-file fileb://function.zip
```

### Configuration

- **Memory**: 2048 MB (recommended for video processing)
- **Timeout**: 900 seconds (15 minutes)
- **Runtime**: Node.js 20.x

### IAM Role Permissions

The Lambda execution role needs:
- Basic Lambda execution permissions
- (Optional) CloudWatch Logs for debugging

## Usage

The function expects:
```json
{
  "videoBuffer": "<base64-encoded-video>",
  "videoSize": 27044445
}
```

Returns:
```json
{
  "success": true,
  "optimizedVideo": "<base64-encoded-optimized-video>",
  "thumbnail": "<base64-encoded-thumbnail>",
  "duration": 15.5,
  "originalSize": 27044445,
  "optimizedSize": 5000000,
  "optimizationPercentage": 81.5
}
```


