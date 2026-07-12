import { Router } from 'express';
import Image from '../models/Image.js';
import { getS3Object } from '../services/s3.js';

const router = Router();

// GET /static/:md5 - serve file directly by md5 hash
router.get('/:md5', async (req, res, next) => {
  try {
    const { md5 } = req.params;
    const image = await Image.findOne({ md5 });
    if (!image) {
      return res.status(404).json({ error: 'File not found' });
    }

    const s3Res = await getS3Object(image.s3Key);

    res.setHeader('Content-Type', image.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Length', image.size);

    s3Res.Body.pipe(res);
  } catch (err) {
    next(err);
  }
});

export default router;
