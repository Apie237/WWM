import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();
const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];

// Liveness: the process is up. Always 200, even when the database is down,
// so a platform restart is not triggered by a database outage.
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    db: dbStates[mongoose.connection.readyState] || 'unknown',
    timestamp: new Date().toISOString(),
  });
});

// Readiness: 200 only when MongoDB is connected, else 503. Point uptime
// monitors at this one. Exposes no configuration or error detail.
router.get('/health/ready', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({ status: connected ? 'ready' : 'unavailable' });
});

export default router;
