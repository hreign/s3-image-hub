# S3 Image Hub

> 基于 Vue 3、Naive UI、Express 与 S3 兼容存储构建的轻量级图床管理系统，支持图片上传、浏览、检索与静态文件分发。

📄 **English Documentation**: [README.en.md](./README.en.md)

---

## 功能特性

- **图片管理** — 上传、浏览、搜索、删除，支持拖拽上传与批量操作
- **静态文件分发** — `/static/<md5>` 直接返回原文件，自动设置 Content-Type，支持 1 年缓存
- **S3 同步** — 一键扫描 S3 桶中已有文件并建立索引
- **用户系统** — JWT 认证，管理员 / 普通用户角色，管理员可管理所有用户
- **权限隔离** — 非管理员只能查看和管理自己上传的图片
- **中英双语** — 前端支持中文 / 英文一键切换
- **暗色主题** — 精心设计的深色 UI，响应式布局

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Naive UI（CDN 引入） |
| 后端 | Node.js + Express |
| 数据库 | MongoDB（Mongoose） |
| 存储 | S3 兼容 API（AWS SDK v3） |
| 认证 | JWT + bcrypt |

## 快速部署

### 环境要求

- Node.js >= 18
- MongoDB 实例
- S3 兼容存储桶（Backblaze B2 / MinIO / AWS S3 等）

### 通过 GitHub 拉取仓库

```bash
git clone https://github.com/your-username/s3-image-hub.git
cd s3-image-hub
```

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，填写你的 S3、MongoDB 与认证配置（各项含义参见 `.env.example` 中的注释）：

```env
# S3 配置
S3_ENDPOINT=https://s3.example.com
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY_ID=your-access-key-id
S3_SECRET_ACCESS_KEY=your-secret-access-key
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true

# MongoDB
MONGODB_URI=mongodb://localhost:27017/s3-image-hub

# 认证
JWT_SECRET=replace-with-a-random-secret-string
ADMIN_USERNAME=admin
ADMIN_PASSWORD=replace-with-a-strong-password

# 服务
PORT=3000
BASE_URL=http://localhost:3000
```

> **注意：** Backblaze B2、MinIO 等 S3 兼容服务必须设置 `S3_FORCE_PATH_STYLE=true`。

### 启动服务

```bash
# 开发模式（文件变动自动重启）
pnpm dev

# 生产模式
pnpm start
```

服务启动后，访问 `http://localhost:3000`，使用 `.env` 中配置的管理员账号登录即可。

## 开始使用

### 1. 登录系统

打开 `http://localhost:3000`，使用 `.env` 中配置的 `ADMIN_USERNAME` 与 `ADMIN_PASSWORD` 登录。首次启动时系统会自动创建管理员账号。

### 2. 上传图片

- 进入图片管理页面，点击上传按钮或直接将图片拖拽到上传区域
- 支持批量选择多张图片同时上传
- 上传完成后图片会自动出现在列表中

### 3. 获取图片链接

上传成功后，每张图片会生成一个以文件 MD5 命名的静态访问地址：

```
https://your-domain/static/<md5哈希值>
```

可直接在 `<img>` 标签中使用：

```html
<img src="https://your-domain/static/d41d8cd98f00b204e9800998ecf8427e">
```

特点：

- 自动根据文件类型设置 `Content-Type`
- 响应头包含 `Cache-Control: public, max-age=31536000, immutable`
- 无需认证即可访问，适合作为图床直接引用

### 4. 浏览与管理

- **搜索**：在搜索框中输入关键词，按文件名、标签等筛选图片
- **查看详情**：点击图片查看元数据（大小、类型、上传时间等）
- **删除图片**：管理员可删除任意图片，普通用户仅能删除自己上传的图片

### 5. 同步 S3 已有文件

如果你的 S3 桶中已有图片，可使用「同步」功能一键扫描并建立索引，无需重新上传。仅管理员可执行此操作。

### 6. 用户管理（管理员）

管理员可在用户管理页面：

- 查看所有用户
- 创建新用户
- 删除用户
- 重置用户密码

## 静态文件访问

上传图片后，通过以下格式获取可直接使用的 URL：

```
https://your-domain/static/<md5哈希值>
```

- 自动根据文件类型设置 `Content-Type`
- 响应头包含 `Cache-Control: public, max-age=31536000, immutable`
- 无需认证即可访问

## API 接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/auth/login` | 登录 | 公开 |
| GET | `/api/auth/me` | 获取当前用户 | 登录 |
| GET | `/api/images` | 图片列表 | 登录 |
| POST | `/api/images/upload` | 上传图片 | 登录 |
| GET | `/api/images/:id` | 图片详情 | 登录 |
| PUT | `/api/images/:id` | 更新元数据 | 登录 |
| DELETE | `/api/images/:id` | 删除图片 | 管理员 |
| GET | `/api/images/:id/presign` | 获取预签名 URL | 登录 |
| POST | `/api/sync` | 同步 S3 文件 | 管理员 |
| GET | `/api/auth/users` | 用户列表 | 管理员 |
| POST | `/api/auth/users` | 创建用户 | 管理员 |
| DELETE | `/api/auth/users/:id` | 删除用户 | 管理员 |
| PUT | `/api/auth/users/:id/password` | 重置密码 | 管理员 |
| GET | `/static/:md5` | 静态文件访问 | 公开 |

## 项目结构

```
s3-image-hub/
├── public/
│   ├── index.html          # 前端入口
│   ├── css/style.css       # 样式
│   └── js/
│       ├── vue.global.prod.js
│       ├── naive-ui.dist.js
│       ├── i18n.js          # 国际化
│       └── app.js           # Vue 应用
├── src/
│   ├── server.js            # Express 入口
│   ├── config.js            # 配置加载
│   ├── models/
│   │   ├── Image.js         # 图片模型
│   │   └── User.js          # 用户模型
│   ├── routes/
│   │   ├── api.js           # API 路由
│   │   ├── auth.js          # 认证路由
│   │   └── static.js        # 静态文件路由
│   ├── services/
│   │   └── s3.js            # S3 操作封装
│   └── middleware/
│       ├── auth.js          # JWT 鉴权
│       └── error.js         # 错误处理
├── .env.example
└── package.json
```

## 许可证

MIT
