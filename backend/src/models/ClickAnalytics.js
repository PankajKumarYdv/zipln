import mongoose from 'mongoose';

const clickAnalyticsSchema = new mongoose.Schema(
  {
    urlId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Url',
      required: true,
      index: true,
    },
    shortCode: { type: String, required: true, index: true },
    clickedAt: { type: Date, default: Date.now, index: true },
    userAgent: { type: String, default: '' },
    deviceType: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'unknown'],
      default: 'unknown',
    },
    osType: { type: String, default: 'unknown' },
    browserName: { type: String, default: 'unknown' },
    ip: { type: String, default: '' },
    country: { type: String, default: '' },
    location: { type: String, default: '' },
    isp: { type: String, default: '' },
    vpnLikely: { type: Boolean, default: false },
    /** Parsed IP WHOIS / RDAP summary (org, netname, route) */
    whoisSummary: { type: String, default: '', maxlength: 650 },
  },
  { timestamps: false }
);

clickAnalyticsSchema.index({ urlId: 1, clickedAt: -1 });

export const ClickAnalytics = mongoose.model('ClickAnalytics', clickAnalyticsSchema);
