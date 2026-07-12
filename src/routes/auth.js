import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import config from '../config.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { sub: user._id, username: user.username, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Current user
router.get('/me', authenticate, async (req, res) => {
  const user = await User.findById(req.user.sub).select('-password');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: { id: user._id, username: user.username, role: user.role } });
});

// ─── Admin: User Management ───

// List users
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json({ users });
});

// Create user
router.post('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const exists = await User.findOne({ username });
    if (exists) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    const user = await User.create({
      username,
      password,
      role: role === 'admin' ? 'admin' : 'user',
    });
    res.status(201).json({ user: { id: user._id, username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user
router.delete('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Cannot delete admin user' });
    }
    await user.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset user password
router.put('/users/:id/password', authenticate, requireAdmin, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.password = password;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
