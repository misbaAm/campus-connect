import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    User.findById(decoded.userId)
      .then((user) => {
        if (!user) return res.status(401).json({ success: false, error: 'User not found' });
        req.user = user;
        next();
      })
      .catch(() => res.status(401).json({ success: false, error: 'Invalid token' }));
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

export function requireOrganizer(req, res, next) {
  if (req.user.role !== 'organizer' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Organizer access required' });
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
}

export function signToken(userId, role) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
}
