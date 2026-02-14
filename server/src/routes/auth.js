import { Router } from 'express';
import { User } from '../models/User.js';
import { signToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'student', interests = [] } = req.body;
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ success: false, error: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: ['student', 'organizer', 'admin'].includes(role) ? role : 'student',
      interests: Array.isArray(interests) ? interests : [],
    });
    const token = signToken(user._id, user.role);
    const u = user.toObject();
    delete u.password;
    res.status(201).json({
      success: true,
      data: { user: u, token },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
    const token = signToken(user._id, user.role);
    const u = user.toObject();
    delete u.password;
    res.json({ success: true, data: { user: u, token } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Login failed' });
  }
});

export default router;
