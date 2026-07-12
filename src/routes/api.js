import { Router } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import path from 'node:path';
import Image from '../models/Image.js';
import { putS3Object, deleteS3Object, getS3Object, listS3Objects, getPresignedUrl } from '../services/s3.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

function md5(buffer) {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

// List images (authenticated)
router.get('/images', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 24, folder = '', search = '', tag = '' } = req.query;
    const query = {};
    if (folder) query.folder = folder;
    if (tag) query.tags = tag;
    if (search) query.$text = { $search: search };

    // Non-admin users can only see their own images
    if (req.user.role !== 'admin') {
      query.uploadedBy = req.user.sub;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [images, total] = await Promise.all([
      Image.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Image.countDocuments(query),
    ]);

    res.json({
      images,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
});

// Upload images (authenticated)
router.post('/images/upload', authenticate, upload.array('files', 20), async (req, res, next) => {
  try {
    const folder = req.body.folder || '/';
    const results = [];
    console.log(`[Upload] ${req.files?.length || 0} file(s) received`);

    for (const file of req.files) {
      const hash = md5(file.buffer);
      const ext = path.extname(file.originalname).toLowerCase();
      const s3Key = `images/${hash}${ext}`;
      console.log(`[Upload] ${file.originalname} buffer=${file.buffer.length} bytes`);

      await putS3Object(s3Key, file.buffer, file.mimetype);

      const doc = await Image.findOneAndUpdate(
        { s3Key },
        {
          filename: `${hash}${ext}`,
          originalName: file.originalname,
          s3Key,
          md5: hash,
          mimeType: file.mimetype,
          size: file.size,
          folder,
          uploadedBy: req.user.sub,
          uploadedByName: req.user.username,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      results.push(doc);
    }

    res.json({ success: true, images: results });
  } catch (err) {
    console.error('[Upload] Error:', err.name, err.message, err.$metadata?.httpStatusCode);
    next(err);
  }
});

// Get single image info (authenticated)
router.get('/images/:id', authenticate, async (req, res, next) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) return res.status(404).json({ error: 'Image not found' });
    res.json({ image });
  } catch (err) {
    next(err);
  }
});

// Update image metadata (authenticated)
router.put('/images/:id', authenticate, async (req, res, next) => {
  try {
    const { originalName, tags, folder } = req.body;
    const image = await Image.findByIdAndUpdate(
      req.params.id,
      { $set: { ...(originalName && { originalName }), ...(tags && { tags }), ...(folder && { folder }) } },
      { new: true }
    );
    if (!image) return res.status(404).json({ error: 'Image not found' });
    res.json({ image });
  } catch (err) {
    next(err);
  }
});

// Delete image + S3 source file (admin only)
router.delete('/images/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) return res.status(404).json({ error: 'Image not found' });

    // Delete from S3 first, then from MongoDB
    try {
      await deleteS3Object(image.s3Key);
    } catch (s3Err) {
      console.error('S3 delete failed:', s3Err.message);
      // Still remove from DB even if S3 fails (file may not exist)
    }
    await image.deleteOne();

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Get presigned URL (authenticated)
router.get('/images/:id/presign', authenticate, async (req, res, next) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) return res.status(404).json({ error: 'Image not found' });

    const url = await getPresignedUrl(image.s3Key, parseInt(req.query.expires || '3600'));
    res.json({ url });
  } catch (err) {
    next(err);
  }
});

// Sync from S3 (admin only)
router.post('/sync', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const objects = await listS3Objects('images/');
    let synced = 0;
    let skipped = 0;

    for (const obj of objects) {
      if (obj.Key.endsWith('/')) continue;
      const exists = await Image.findOne({ s3Key: obj.Key });
      if (exists) { skipped++; continue; }

      const filename = path.basename(obj.Key);
      const ext = path.extname(filename).toLowerCase();
      const nameWithoutExt = path.basename(filename, ext);

      await Image.findOneAndUpdate(
        { s3Key: obj.Key },
        {
          filename,
          originalName: filename,
          s3Key: obj.Key,
          md5: nameWithoutExt,
          mimeType: getMimeType(ext),
          size: obj.Size,
          folder: '/',
        },
        { upsert: true, new: true }
      );
      synced++;
    }

    res.json({ success: true, synced, skipped, total: objects.length });
  } catch (err) {
    next(err);
  }
});

function getMimeType(ext) {
  const map = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp', '.ico': 'image/x-icon', '.avif': 'image/avif',
    '.mp4': 'video/mp4', '.webm': 'video/webm',
    '.pdf': 'application/pdf', '.txt': 'text/plain',
  };
  return map[ext] || 'application/octet-stream';
}

export default router;
