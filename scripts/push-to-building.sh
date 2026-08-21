#!/usr/bin/env bash
set -euo pipefail

# ย้าย next-app ไป repo Building
# ใช้: BUILDING_REPO_TOKEN=ghp_xxx ./scripts/push-to-building.sh

if [[ -z "${BUILDING_REPO_TOKEN:-}" ]]; then
  echo "ต้องสร้าง repo Building ก่อน: https://github.com/new (ชื่อ Building)"
  echo "แล้วสร้าง token ที่ https://github.com/settings/tokens (scope: repo)"
  echo "รัน: BUILDING_REPO_TOKEN=ghp_xxx ./scripts/push-to-building.sh"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"

cp -a "$ROOT/next-app/." "$TMP/"
cd "$TMP"
git init -q
git config user.name "cursor-agent"
git config user.email "cursor-agent@users.noreply.github.com"
git add -A
git commit -q -m "feat: ราชาหวาย Next.js shop"
git branch -M main
git remote add origin "https://x-access-token:${BUILDING_REPO_TOKEN}@github.com/t9charoen-max/Building.git"
git push --force origin main

echo ""
echo "เสร็จแล้ว → https://github.com/t9charoen-max/Building"
echo "Vercel: https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ft9charoen-max%2FBuilding&project-name=rachawei-shop"
echo "GitHub Pages: เปิด Settings → Pages → branch gh-pages"
