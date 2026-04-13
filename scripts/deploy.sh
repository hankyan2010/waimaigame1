#!/bin/bash
# 一键构建+部署到华为云
# 用法: ./scripts/deploy.sh

echo "📦 构建中..."
cd "$(dirname "$0")/.."
npx next build || { echo "❌ 构建失败"; exit 1; }

echo "🚀 上传到华为云..."
# 先删旧_next避免残留chunk
ssh root@121.36.105.43 "rm -rf /var/www/html/oldgame/_next" 2>/dev/null
# Apache的DocumentRoot（线上实际服务）
scp -r out/* root@121.36.105.43:/var/www/html/oldgame/ || { echo "❌ SCP失败"; exit 1; }
# nginx备份路径
scp -r out/* root@121.36.105.43:/usr/share/nginx/html/oldgame/ 2>/dev/null

echo "🔧 修复权限..."
# 重试5次，每次间隔1秒
for i in 1 2 3 4 5; do
  if ssh -o ConnectTimeout=10 root@121.36.105.43 "chown -R root:root /var/www/html/oldgame && chmod -R 755 /var/www/html/oldgame" 2>/dev/null; then
    echo "  ✅ 权限修复成功"
    break
  fi
  echo "  权限修复第${i}次失败，1秒后重试..."
  sleep 1
done

echo "✅ 部署完成！"
echo "🔗 https://waimaiketang.com/oldgame/"
