#!/usr/bin/env bash
set -euo pipefail

# สร้างโปรเจกต์ Vercel แยกสำหรับ next-app (ไม่แทนที่ rachawei เดิม)
# ใช้: VERCEL_TOKEN=xxx ./scripts/setup-vercel-project.sh

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "ต้องตั้ง VERCEL_TOKEN ก่อน"
  echo "สร้างที่: https://vercel.com/account/tokens"
  exit 1
fi

cd "$(dirname "$0")/.."

echo "→ สร้างโปรเจกต์ rachawei-next (ถ้ายังไม่มี)"
npx vercel projects add rachawei-next --token "$VERCEL_TOKEN" 2>/dev/null || true

echo "→ ตั้ง Root Directory = next-app"
npx vercel api "/v9/projects/rachawei-next" -X PATCH \
  -F "rootDirectory=next-app" \
  --token "$VERCEL_TOKEN"

echo "→ เชื่อมโปรเจกต์กับโฟลเดอร์นี้"
npx vercel link --yes --project rachawei-next --token "$VERCEL_TOKEN"

echo "→ Deploy production"
npx vercel deploy --prod --yes --token "$VERCEL_TOKEN"

echo ""
echo "เสร็จแล้ว — เก็บค่าเหล่านี้ไว้ใน GitHub Secrets สำหรับ CI:"
echo "  VERCEL_TOKEN"
echo "  VERCEL_ORG_ID=$(cat .vercel/project.json | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).orgId))")"
echo "  VERCEL_PROJECT_ID=$(cat .vercel/project.json | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).projectId))")"
