import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from './config.js';
import apiRoutes from './routes/api.js';
import authRoutes from './routes/auth.js';
import staticRoutes from './routes/static.js';
import { errorHandler } from './middleware/error.js';
import User from './models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public routes
app.get('/api/config', (req, res) => {
  res.json({ baseUrl: config.baseUrl });
});
app.use('/api/auth', authRoutes);
app.use('/static', staticRoutes);

// Protected API routes
app.use('/api', apiRoutes);

// Serve frontend
app.use(express.static(path.join(__dirname, '..', 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.use(errorHandler);

async function seedAdmin() {
  const user = await User.findOne({ username: config.adminUsername });
  if (!user) {
    await User.create({ username: config.adminUsername, password: config.adminPassword, role: 'admin' });
    console.log(`Admin user "${config.adminUsername}" created`);
  } else {
    // Always sync admin password from env so it never goes stale
    const match = await user.comparePassword(config.adminPassword);
    if (!match) {
      user.password = config.adminPassword;
      await user.save();
      console.log(`Admin password updated from env`);
    }
    if (user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }
  }
}

mongoose
  .connect(config.mongodb.uri)
  .then(async () => {
    console.log('MongoDB connected');
    await seedAdmin();
    app.listen(config.port, () => {
      console.log(`Server running at http://localhost:${config.port}`);
    });
  })
  .catch((err) => {
    console.error('Init failed:', err.message);
    process.exit(1);
  });
