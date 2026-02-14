import { Router } from 'express';
import { User } from '../models/User.js';
import { Event } from '../models/Event.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireAdmin);

// List all organizers (for verification)
router.get('/organizers', async (req, res) => {
  try {
    const organizers = await User.find({ role: 'organizer' })
      .select('name email isVerifiedOrganizer createdAt')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: organizers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch organizers' });
  }
});

// Set organizer verification
router.patch('/organizers/:id/verify', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    if (user.role !== 'organizer') return res.status(400).json({ success: false, error: 'User is not an organizer' });
    user.isVerifiedOrganizer = req.body.isVerifiedOrganizer !== false;
    await user.save();
    const u = user.toObject();
    delete u.password;
    res.json({ success: true, data: u });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Failed to update organizer' });
  }
});

// List all events (including blocked) for admin
router.get('/events', async (req, res) => {
  try {
    const events = await Event.find()
      .populate('organizer', 'name email isVerifiedOrganizer')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch events' });
  }
});

export default router;
