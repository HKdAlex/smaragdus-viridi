#!/bin/bash

# Video Optimization Deployment Script
# This script deploys the video optimization Edge Function and runs migrations

set -e

echo "🚀 Deploying Video Optimization System..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   brew install supabase/tap/supabase"
    exit 1
fi

echo "✅ Supabase CLI found: $(supabase --version)"
echo ""

# Check if project is linked
if [ ! -f ".supabase/config.toml" ]; then
    echo "⚠️  Project not linked. Please link your project first:"
    echo "   supabase link --project-ref YOUR_PROJECT_REF"
    echo ""
    read -p "Enter your Supabase project reference (or press Enter to skip): " PROJECT_REF
    if [ -n "$PROJECT_REF" ]; then
        supabase link --project-ref "$PROJECT_REF"
    else
        echo "❌ Cannot proceed without linking project"
        exit 1
    fi
fi

echo "📦 Step 1: Running database migration..."
supabase db push
echo "✅ Migration applied"
echo ""

echo "🔧 Step 2: Deploying Edge Function..."
supabase functions deploy optimize-video
echo "✅ Edge Function deployed"
echo ""

echo "📋 Next steps:"
echo ""
echo "1. Set up Storage Webhook in Supabase Dashboard:"
echo "   - Go to Storage → Policies → Webhooks"
echo "   - Create webhook for 'objects' table"
echo "   - Event: INSERT"
echo "   - Filter: bucket_id = 'gemstone-media' AND name LIKE '%/videos/%.mp4'"
echo "   - URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/optimize-video"
echo "   - Add Authorization header with service role key"
echo ""
echo "2. Test by uploading a video in the admin UI"
echo ""
echo "3. Check logs: supabase functions logs optimize-video"
echo ""
echo "✅ Deployment complete!"

