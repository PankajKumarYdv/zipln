import mongoose from 'mongoose';

const urlSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    isAnonymous: { type: Boolean, default: false, index: true },
    shortCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    originalUrl: { type: String, required: true },
    isCustomAlias: { type: Boolean, default: false },
    expiresAt: { type: Date, default: null },
    clickCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

urlSchema.index({ userId: 1, createdAt: -1 });
urlSchema.index({ expiresAt: 1 }, { sparse: true });

export const Url = mongoose.model('Url', urlSchema);
