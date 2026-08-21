import mongoose from 'mongoose';
import crypto from 'crypto';

const apiKeySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: { type: String, trim: true, maxlength: 80, default: 'Default' },
    /** SHA-256 hex of full raw key — indexed for O(1) lookup */
    keyHash: { type: String, required: true, unique: true },
    keyPrefix: { type: String, required: true },
    lastUsedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

apiKeySchema.index({ userId: 1, createdAt: -1 });

export function hashApiKey(rawKey) {
  return crypto.createHash('sha256').update(rawKey, 'utf8').digest('hex');
}

apiKeySchema.statics.generateRawKey = function generateRawKey() {
  return `usk_${crypto.randomBytes(24).toString('base64url')}`;
};

export const ApiKey = mongoose.model('ApiKey', apiKeySchema);
