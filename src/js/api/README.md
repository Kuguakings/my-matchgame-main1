# 关卡上传 API 部署指南

## 方案选择

### 方案 A: Vercel Serverless Functions（推荐，完全免费）

1. **注册 Vercel 账号**
   - 访问 https://vercel.com
   - 使用 GitHub 账号登录（免费）

2. **部署项目**
   - 将项目推送到 GitHub
   - 在 Vercel 中导入 GitHub 仓库
   - Vercel 会自动检测并部署

3. **配置环境变量（可选）**
   - 如果需要从 GitHub 读取，设置 `GITHUB_REPO` 环境变量
   - 格式：`用户名/仓库名`

4. **使用 API**
   - 部署后，API 地址为：`https://你的项目名.vercel.app/api/levels`
   - 在前端代码中使用此地址

### 方案 B: Supabase（推荐用于生产，免费额度大）

Supabase 提供：
- 免费 PostgreSQL 数据库（500MB）
- 免费 API 自动生成
- 免费认证系统
- 实时数据同步

**部署步骤：**
1. 注册 Supabase：https://supabase.com
2. 创建新项目
3. 创建 `levels` 表
4. 使用 Supabase 自动生成的 API

### 方案 C: Netlify Functions（完全免费）

类似 Vercel，但使用 Netlify Functions。

## 数据库方案（推荐使用 Supabase）

如果使用 Supabase，需要创建以下表结构：

```sql
CREATE TABLE levels (
  id SERIAL PRIMARY KEY,
  level_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 费用说明

- **Vercel**: 个人项目完全免费
- **Supabase**: 免费额度 500MB 数据库，足够小项目使用
- **Netlify**: 个人项目完全免费

所有方案都有免费额度，对于个人项目完全够用！

