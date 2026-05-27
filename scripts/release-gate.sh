#!/usr/bin/env bash
set -euo pipefail

echo "== FabZClean release verification =="

npm run audit:security
npm run test:unit
npm run check

echo "Manual smoke (staging/prod):"
echo "  - GET /api/health/ready"
echo "  - GET /api/health/slo"
echo "  - Wallet recharge + print receipt"
echo "  - Orders list pagination"

echo "Release gate passed."
