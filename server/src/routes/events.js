import { Router } from 'express';
import { Event } from '../models/Event.js';
import { CATEGORIES } from '../models/Event.js';
import { requireAuth, requireOrganizer, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public: list events (nearest first), filter by category, date, search
router.get('/', async (req, res) => {
  try {
    const { category, date, search } = req.query;
    const filter = { isBlocked: false };
    if (category && CATEGORIES.includes(category)) filter.category = category;
    if (search?.trim()) {
      filter.$or = [
        { title: new RegExp(search.trim(), 'i') },
        { description: new RegExp(search.trim(), 'i') },
      ];
    }
    if (date) {
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        const start = new Date(d);
        start.setHours(0, 0, 0, 0);
        const end = new Date(d);
        end.setHours(23, 59, 59, 999);
        filter.eventDate = { $gte: start, $lte: end };
      }
    }
    const events = await Event.find(filter)
      .populate('organizer', 'name isVerifiedOrganizer')
      .sort({ eventDate: 1, deadline: 1 })
      .lean();
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch events' });
  }
});

// Recommended for user (by interests) - requires auth (must be before /:id)
router.get('/recommended/me', requireAuth, async (req, res) => {
  try {
    const interests = req.user.interests || [];
    if (interests.length === 0) {
      const events = await Event.find({ isBlocked: false })
        .populate('organizer', 'name isVerifiedOrganizer')
        .sort({ eventDate: 1 })
        .limit(20)
        .lean();
      return res.json({ success: true, data: events });
    }
    const events = await Event.find({
      isBlocked: false,
      $or: [
        { category: { $in: interests } },
        { tags: { $in: interests } },
      ],
    })
      .populate('organizer', 'name isVerifiedOrganizer')
      .sort({ eventDate: 1 })
      .limit(20)
      .lean();
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch recommended events' });
  }
});

// Public: get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name isVerifiedOrganizer')
      .lean();
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
    if (event.isBlocked) return res.status(404).json({ success: false, error: 'Event not found' });
    res.json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch event' });
  }
});

// Organizer: create event
router.post('/', requireAuth, requireOrganizer, async (req, res) => {
  try {
    const { title, description, posterUrl, registrationLink, deadline, eventDate, category, tags } = req.body;
    if (!title?.trim() || !deadline || !eventDate || !category) {
      return res.status(400).json({ success: false, error: 'Title, deadline, eventDate and category are required' });
    }
    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, error: 'Invalid category' });
    }
    const event = await Event.create({
      title: title.trim(),
      description: description?.trim() || '',
      posterUrl: posterUrl?.trim() || '',
      registrationLink: registrationLink?.trim() || '',
      deadline: new Date(deadline),
      eventDate: new Date(eventDate),
      category,
      tags: Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [],
      organizer: req.user._id,
    });
    const populated = await Event.findById(event._id).populate('organizer', 'name isVerifiedOrganizer').lean();
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Failed to create event' });
  }
});

// Organizer: update own event (if not blocked)
router.patch('/:id', requireAuth, requireOrganizer, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
    const isAdmin = req.user.role === 'admin';
    const isOwner = event.organizer.toString() === req.user._id.toString();
    if (!isAdmin && !isOwner) return res.status(403).json({ success: false, error: 'Not allowed to edit this event' });
    if (!isAdmin && event.isBlocked) return res.status(403).json({ success: false, error: 'Event is blocked' });
    const { title, description, posterUrl, registrationLink, deadline, eventDate, category, tags, isBlocked } = req.body;
    if (title !== undefined) event.title = title.trim();
    if (description !== undefined) event.description = description?.trim() || '';
    if (posterUrl !== undefined) event.posterUrl = posterUrl?.trim() || '';
    if (registrationLink !== undefined) event.registrationLink = registrationLink?.trim() || '';
    if (deadline !== undefined) event.deadline = new Date(deadline);
    if (eventDate !== undefined) event.eventDate = new Date(eventDate);
    if (category !== undefined && CATEGORIES.includes(category)) event.category = category;
    if (tags !== undefined) event.tags = Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [];
    if (isAdmin && isBlocked !== undefined) event.isBlocked = Boolean(isBlocked);
    await event.save();
    const populated = await Event.findById(event._id).populate('organizer', 'name isVerifiedOrganizer').lean();
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Failed to update event' });
  }
});

// Admin: delete event
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
    res.json({ success: true, data: { deleted: true } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Failed to delete event' });
  }
});

export default router;
export { CATEGORIES };
