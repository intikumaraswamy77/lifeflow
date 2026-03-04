const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// ===== ROUTES IMPORT =====
const authRoutes = require('./routes/auth');
const searchRoutes = require('./routes/search');
const bloodStockRoutes = require('./routes/bloodstock');
const messageRoutes = require('./routes/messages');
const donationRoutes = require('./routes/donations');
const predictRoutes = require('./routes/predict');
const routeTools = require('./routes/routes');
const pickupRoutes = require('./routes/pickups');

/* ✅ WBC ROUTE */
const wbcRoutes = require('./routes/wbc');

// Utils
const exporter = require('./utils/exporter');

// ===== APP & SERVER SETUP =====
const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// Make io accessible inside routes
app.set('io', io);

// ===== API ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/bloodstock', bloodStockRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/pickups', pickupRoutes);
app.use('/api/routes', routeTools);

/* ✅ WBC IMAGE PREDICTION */
app.use('/api/wbc', wbcRoutes);

// Base API route
app.get('/api', (req, res) => {
  res.json({
    message: 'LifeFlow API is running',
    health: '/api/health'
  });
});

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Blood Donation Platform API is running',
    timestamp: new Date().toISOString()
  });
});

// ===== SOCKET.IO EVENTS =====
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('typing', (data) => {
    socket.to(data.receiverId).emit('userTyping', {
      senderId: data.senderId,
      isTyping: data.isTyping
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// ===== 404 HANDLER =====
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ===== DATABASE CONNECTION =====
mongoose.connect(
  process.env.MONGODB_URI || 'mongodb://localhost:27017/blood-donation',

)
.then(() => {
  console.log('Connected to MongoDB');

  // Ensure export directory exists
  try {
    exporter.ensureDir && exporter.ensureDir();
  } catch (_) {}

  // CSV export job
  const intervalMs = Number(process.env.EXPORT_INTERVAL_MS || 180000);

  const runExport = async () => {
    try {
      await exporter.exportDonationsCsv();
    } catch (e) {}
  };

  runExport();
  const exportTimer = setInterval(runExport, intervalMs);

  // Graceful shutdown
  const cleanup = () => {
    try { clearInterval(exportTimer); } catch (_) {}
  };

  process.on('SIGINT', () => { cleanup(); process.exit(0); });
  process.on('SIGTERM', () => { cleanup(); process.exit(0); });
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
