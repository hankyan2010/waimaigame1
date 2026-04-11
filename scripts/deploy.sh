#!/bin/bash
# 一键构建+部署到华为云
# 用法: ./scripts/deploy.sh

set -e

echo "📦 构建中..."
cd "$(dirname "$0")/.."
npx next build

echo "🚀 上传到华为云..."
# Apache的DocumentRoot（线上实际服务）
scp -r out/* root@121.36.105.43:/var/www/html/oldgame/
# nginx备份路径
scp -r out/* root@121.36.105.43:/usr/share/nginx/html/oldgame/ 2>/dev/null || true

echo "🔧 修复权限..."
ssh root@121.36.105.43 "chown -R root:root /var/www/html/oldgame && chmod -R 755 /var/www/html/oldgame"

echo "✅ 部署完成！"
echo "🔗 https://waimaiketang.com/oldgame/"
