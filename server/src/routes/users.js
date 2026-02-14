import { Router } from 'express';
import { User } from '../models/User.js';
import { INTERESTS } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Get current user profile
router.get('/me', requireAuth, (req, res) => {
  const u = req.user.toObject();
  delete u.password;
  res.json({ success: true, data: u });
});

// Update own profile (e.g. interests)
router.patch('/me', requireAuth, async (req, res) => {
  try {
    const { name, interests } = req.body;
    const user = req.user;
    if (name !== undefined) user.name = String(name).trim();
    if (interests !== undefined) {
      user.interests = Array.isArray(interests)
        ? interests.filter((i) => INTERESTS.includes(i))
        : user.interests;
    }
    await user.save();
    const u = user.toObject();
    delete u.password;
    res.json({ success: true, data: u });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Failed to update profile' });
  }
});

export default router;
export { INTERESTS };
