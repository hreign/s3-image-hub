import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    s3Key: { type: String, required: true, unique: true },
    md5: { type: String, required: true, unique: true, index: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    width: { type: Number },
    height: { type: Number },
    tags: [{ type: String }],
    folder: { type: String, default: '/' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedByName: { type: String },
  },
  { timestamps: true }
);

imageSchema.index({ filename: 'text', originalName: 'text', tags: 'text' });

export default mongoose.model('Image', imageSchema);
