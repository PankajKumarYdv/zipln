import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: {
      type: String,
      enum: ['free', 'pro'],
    },
    phone: { type: String, default: '', trim: true, maxlength: 32 },
    country: { type: String, default: '', trim: true, maxlength: 80 },
    avatarUrl: { type: String, default: '', maxlength: 512 },
    /** Simulated Pro subscription (no real payment) */
    proTier: {
      type: String,
      enum: ['none', '1m', '6m', '12m'],
      default: 'none',
    },
    proExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.pre('validate', function defaultRole(next) {
  if (this.role == null || this.role === '') {
    this.role = 'free';
  }
  next();
});

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model('User', userSchema);
