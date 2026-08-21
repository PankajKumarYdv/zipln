import mongoose from 'mongoose';
import { Url } from '../models/Url.js';
import { ClickAnalytics } from '../models/ClickAnalytics.js';
import { isProUser } from '../utils/plan.js';

function startOfUtcDay(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function startOfUtcMonth(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function startOfUtcYear(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
}

function daysBetween(a, b) {
  const ms = Math.abs(b - a);
  return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

async function assertUrlOwner(urlId, userId) {
  if (!mongoose.Types.ObjectId.isValid(urlId)) return null;
  const doc = await Url.findById(urlId);
  if (!doc?.userId) return null;
  const owner = userId?.toString?.() ?? String(userId);
  if (doc.userId.toString() !== owner) return null;
  return doc;
}

export async function analyticsSummary(req, res) {
  try {
    const { id } = req.params;
    const urlDoc = await assertUrlOwner(id, req.user._id);
    if (!urlDoc) {
      return res.status(404).json({ message: 'URL not found' });
    }

    const now = new Date();
    const dayStart = startOfUtcDay(now);
    const monthStart = startOfUtcMonth(now);
    const yearStart = startOfUtcYear(now);

    const [totalRecorded, clicksDay, clicksMonth, clicksYear] = await Promise.all([
      ClickAnalytics.countDocuments({ urlId: urlDoc._id }),
      ClickAnalytics.countDocuments({
        urlId: urlDoc._id,
        clickedAt: { $gte: dayStart },
      }),
      ClickAnalytics.countDocuments({
        urlId: urlDoc._id,
        clickedAt: { $gte: monthStart },
      }),
      ClickAnalytics.countDocuments({
        urlId: urlDoc._id,
        clickedAt: { $gte: yearStart },
      }),
    ]);

    const totalClicks = urlDoc.clickCount ?? 0;
    const created = urlDoc.createdAt ? new Date(urlDoc.createdAt) : now;
    const linkAgeDays = daysBetween(created, now);
    const clickRate = Math.round((totalClicks / linkAgeDays) * 100) / 100;

    return res.json({
      shortCode: urlDoc.shortCode,
      totalClicks,
      totalRecordedClicks: totalRecorded,
      clickRate: Number.isFinite(clickRate) ? clickRate : 0,
      clicksPerPeriod: {
        day: clicksDay,
        month: clicksMonth,
        year: clicksYear,
      },
      tier: isProUser(req.user) ? 'pro' : 'free',
      previewUnblurredRows: isProUser(req.user) ? null : 5,
    });
  } catch (e) {
    console.error('analyticsSummary', e);
    return res.status(500).json({ message: 'Failed to load analytics' });
  }
}

export async function analyticsEvents(req, res) {
  try {
    const { id } = req.params;
    const urlDoc = await assertUrlOwner(id, req.user._id);
    if (!urlDoc) {
      return res.status(404).json({ message: 'URL not found' });
    }

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const [total, rows] = await Promise.all([
      ClickAnalytics.countDocuments({ urlId: urlDoc._id }),
      ClickAnalytics.find({ urlId: urlDoc._id })
        .sort({ clickedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(
          'clickedAt deviceType osType browserName isp location country vpnLikely ip userAgent whoisSummary'
        )
        .lean(),
    ]);

  const events = rows.map((r) => ({
    id: String(r._id),
    clickedAt: r.clickedAt,
    deviceType: r.deviceType || 'unknown',
    osType: r.osType || 'unknown',
    browserName: r.browserName || 'unknown',
    isp: r.isp || '—',
    location: r.location || r.country || '—',
    country: r.country || '—',
    vpnLikely: Boolean(r.vpnLikely),
    ip: r.ip || '—',
    userAgent: r.userAgent || '',
    whoisSummary: r.whoisSummary || '',
  }));

    return res.json({
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: skip + events.length < total,
        hasPrev: page > 1,
      },
      tier: isProUser(req.user) ? 'pro' : 'free',
      previewUnblurredRows: isProUser(req.user) ? null : 5,
    });
  } catch (e) {
    console.error('analyticsEvents', e);
    return res.status(500).json({ message: 'Failed to load events' });
  }
}

const CHART_PERIODS = new Set(['day', 'week', 'month', 'year', 'all']);

export async function analyticsChart(req, res) {
  try {
    const { id } = req.params;
    if (!isProUser(req.user)) {
      return res.status(403).json({
        message: 'Charts are available on the Pro plan',
        code: 'PRO_REQUIRED',
      });
    }

    const period = req.query.period || 'month';
    if (!CHART_PERIODS.has(period)) {
      return res.status(400).json({ message: 'Invalid period' });
    }

    const urlDoc = await assertUrlOwner(id, req.user._id);
    if (!urlDoc) {
      return res.status(404).json({ message: 'URL not found' });
    }

    const now = new Date();
    let start;
    let dateFormat;

    if (period === 'day') {
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      dateFormat = '%Y-%m-%d-%H';
    } else if (period === 'week') {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFormat = '%Y-%m-%d';
    } else if (period === 'month') {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFormat = '%Y-%m-%d';
    } else if (period === 'year') {
      start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      dateFormat = '%Y-%m';
    } else {
      start = new Date(0);
      dateFormat = '%Y-%m';
    }

    const pipeline = [
      {
        $match: {
          urlId: urlDoc._id,
          clickedAt: { $gte: start },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: dateFormat, date: '$clickedAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const buckets = await ClickAnalytics.aggregate(pipeline);
    return res.json({
      period,
      points: buckets.map((b) => ({ label: b._id, clicks: b.count })),
    });
  } catch (e) {
    console.error('analyticsChart', e);
    return res.status(500).json({ message: 'Failed to load chart data' });
  }
}
