# 部署说明

## 华为云服务器

| 项目 | 值 |
|------|-----|
| 服务器 IP | 121.36.105.43 |
| 系统 | CentOS 7（1核1.8G） |
| 用户 | root |
| 密码 | HankyHh441402@@ |
| Web 服务 | Nginx |

## 线上地址

| 页面 | 地址 |
|------|------|
| 游戏首页 | http://121.36.105.43:18899/waimai-game/ |
| 答题页 | http://121.36.105.43:18899/waimai-game/play |
| 结果页 | http://121.36.105.43:18899/waimai-game/result |
| 领奖页 | http://121.36.105.43:18899/waimai-game/reward |

## 相关服务端口

| 端口 | 用途 |
|------|------|
| :18899 | 主服务（静态网页 + 微信API代理 /wechat-api） |
| :18902 | 微信机器人代理（/bot） |

## 服务器部署目录

游戏静态文件部署在：`/var/www/html/waimai-game/`

## 部署步骤

1. 本地构建静态文件：
```bash
cd /Users/yanhan/.openclaw/workspace/projects/waimai-quiz-game
npm run build
```

2. 上传到服务器：
```bash
sshpass -p 'HankyHh441402@@' scp -r -o StrictHostKeyChecking=no out/* root@121.36.105.43:/var/www/html/waimai-game/
```

3. 验证：浏览器访问 http://121.36.105.43:18899/waimai-game/

## 微信相关配置

| 项目 | 值 |
|------|-----|
| 微信API代理 | http://121.36.105.43:18899/wechat-api |
| APP_ID | wx5fa3f116c72fccb0 |
| 预览微信号 | yanhan9888 |

## 注意

- 此仓库为 **private**，敏感信息仅团队可见
- 如需更改为 public，务必先移除密码等敏感信息
