# 秘之卡 (MizhiCard)

精致抽卡应用，基于 uni-app + Vue 3 + Cloudflare Workers。

## 功能

- **抽卡系统**：单抽 / 十连抽，SSR(3%) / SR(12%) / R(30%) / N(55%)，十连保底 SR+
- **收藏管理**：卡牌收集、稀有度筛选、统计信息
- **管理后台**：上传卡牌图片（4:3 比例）、管理卡池

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | uni-app + Vue 3 + Pinia + SCSS |
| 后端 | Cloudflare Workers + Hono |
| 数据库 | Cloudflare D1 (SQLite) |
| 存储 | Cloudflare R2 |
| 部署 | Cloudflare Pages + Workers |

## 项目结构

```
mizhiCard/
├── backend/          # Cloudflare Workers API
├── frontend/         # uni-app Vue 3 前端
└── .github/          # CI/CD 工作流
```

## 本地开发

### 后端

```bash
cd backend
npm install
npm run dev              # 启动 wrangler dev
npm run db:migrate:local # 本地数据库迁移
```

### 前端

```bash
cd frontend
npm install
npm run dev              # 启动 H5 开发服务器
```

## 部署

1. 创建 Cloudflare 资源：
   ```bash
   # D1 数据库
   npx wrangler d1 create mizhi-card-db

   # R2 存储桶
   npx wrangler r2 bucket create mizhi-card-images

   # 管理员密钥
   npx wrangler secret put ADMIN_KEY
   ```

2. 更新 `backend/wrangler.toml` 中的 D1 database_id 和 R2_PUBLIC_URL。

3. 推送到 GitHub，GitHub Actions 自动部署。

4. 或在本地手动部署：
   ```bash
   cd backend && npm run deploy
   cd frontend && npm run build && npx wrangler pages deploy dist/build/h5 --project-name=mizhi-card
   ```

## Cloudflare 资源配置

- **Worker**: mizhi-card-api
- **Pages**: mizhi-card
- **R2**: mizhi-card-images
- **D1**: mizhi-card-db

所有服务均可在 Cloudflare 免费额度内运行。
