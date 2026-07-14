# S3 Image Hub

> A lightweight image hosting and management system built with Vue 3, Naive UI, Express, and S3-compatible storage. Supports image upload, browsing, search, and static file distribution.

**中文文档**: [README.md](./README.md)

---

## Features

- **Image Management** — Upload, browse, search, delete with drag-and-drop and batch support
- **Static File Serving** — `/static/<md5>` returns raw files with auto Content-Type and 1-year cache
- **S3 Sync** — One-click scan and index existing files in your S3 bucket
- **User System** — JWT authentication with admin/user roles; admins manage all users
- **Permission Isolation** — Non-admin users can only view and manage their own uploads
- **Bilingual UI** — Chinese/English language switching
- **Dark Theme** — Carefully designed dark UI with responsive layout

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vue 3 + Naive UI (CDN) |
| Backend | Node.js + Express |
| Database | MongoDB (Mongoose) |
| Storage | S3-compatible API (AWS SDK v3) |
| Auth | JWT + bcrypt |

## Quick Deployment

### Requirements

- Node.js >= 18
- MongoDB instance
- S3-compatible bucket (Backblaze B2 / MinIO / AWS S3, etc.)

### Clone from GitHub

```bash
git clone https://github.com/hreign/s3-image-hub
cd s3-image-hub
```

### Install Dependencies

```bash
pnpm install
```

### Configure Environment

```bash
cp .env.example .env
```

Edit the `.env` file with your S3, MongoDB, and auth settings (see comments in `.env.example` for details):

```env
# S3 Configuration
S3_ENDPOINT=https://s3.example.com
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY_ID=your-access-key-id
S3_SECRET_ACCESS_KEY=your-secret-access-key
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true

# MongoDB
MONGODB_URI=mongodb://localhost:27017/s3-image-hub

# Auth
JWT_SECRET=replace-with-a-random-secret-string
ADMIN_USERNAME=admin
ADMIN_PASSWORD=replace-with-a-strong-password

# Server
PORT=3000
BASE_URL=http://localhost:3000
```

> **Note:** S3-compatible services like Backblaze B2 and MinIO require `S3_FORCE_PATH_STYLE=true`.

### Start the Server

```bash
# Development mode (auto-restart on file changes)
pnpm dev

# Production mode
pnpm start
```

Open `http://localhost:3000` and log in with the admin credentials from your `.env`.

## Getting Started

### 1. Log In

Open `http://localhost:3000` and log in with the `ADMIN_USERNAME` and `ADMIN_PASSWORD` from your `.env`. The admin account is created automatically on first launch.

### 2. Upload Images

- Go to the image management page and click the upload button, or drag images directly into the upload area
- Batch selection of multiple images is supported
- Uploaded images appear in the list automatically

### 3. Get Image URLs

After uploading, each image gets a static access URL named after its MD5 hash:

```
https://your-domain/static/<md5-hash>
```

Use it directly in an `<img>` tag:

```html
<img src="https://your-domain/static/d41d8cd98f00b204e9800998ecf8427e">
```

Features:

- Auto `Content-Type` based on file extension
- `Cache-Control: public, max-age=31536000, immutable` header
- No authentication required — ideal for use as an image host

### 4. Browse & Manage

- **Search**: Enter keywords in the search box to filter by filename, tags, etc.
- **View Details**: Click an image to view its metadata (size, type, upload time, etc.)
- **Delete**: Admins can delete any image; regular users can only delete their own uploads

### 5. Sync Existing S3 Files

If your S3 bucket already contains images, use the "Sync" feature to scan and index them in one click — no need to re-upload. Admin only.

### 6. User Management (Admin)

Admins can manage users from the user management page:

- View all users
- Create new users
- Delete users
- Reset user passwords

## Static File Access

After uploading, use this format to get a directly usable URL:

```
https://your-domain/static/<md5-hash>
```

- Auto `Content-Type` based on file extension
- `Cache-Control: public, max-age=31536000, immutable`
- No authentication required

## API Reference

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/login` | Login | Public |
| GET | `/api/auth/me` | Current user | Logged in |
| GET | `/api/images` | List images | Logged in |
| POST | `/api/images/upload` | Upload images | Logged in |
| GET | `/api/images/:id` | Image detail | Logged in |
| PUT | `/api/images/:id` | Update metadata | Logged in |
| DELETE | `/api/images/:id` | Delete image | Admin |
| GET | `/api/images/:id/presign` | Presigned URL | Logged in |
| POST | `/api/sync` | Sync from S3 | Admin |
| GET | `/api/auth/users` | List users | Admin |
| POST | `/api/auth/users` | Create user | Admin |
| DELETE | `/api/auth/users/:id` | Delete user | Admin |
| PUT | `/api/auth/users/:id/password` | Reset password | Admin |
| GET | `/static/:md5` | Static file access | Public |

## Project Structure

```
s3-image-hub/
├── public/
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── vue.global.prod.js
│       ├── naive-ui.dist.js
│       ├── i18n.js
│       └── app.js
├── src/
│   ├── server.js
│   ├── config.js
│   ├── models/
│   │   ├── Image.js
│   │   └── User.js
│   ├── routes/
│   │   ├── api.js
│   │   ├── auth.js
│   │   └── static.js
│   ├── services/
│   │   └── s3.js
│   └── middleware/
│       ├── auth.js
│       └── error.js
├── .env.example
└── package.json
```

## License

MIT
