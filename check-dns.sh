#!/bin/bash

echo "🔍 Checking DNS status for crystallique.ru"
echo "=========================================="

echo "📡 Current nameservers:"
dig crystallique.ru NS +short

echo ""
echo "🌐 Current A record:"
dig crystallique.ru A +short

echo ""
echo "⏰ Check time: $(date)"
echo ""
echo "✅ Expected nameservers should be:"
echo "   ns1.vercel-dns.com"
echo "   ns2.vercel-dns.com"
echo ""
echo "🔄 Run this script again in a few hours to check propagation"
