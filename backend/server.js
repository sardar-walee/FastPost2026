const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Environment variables
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Basic health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV
  });
});

// API Routes (placeholder)
app.use('/api', require('./routes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    environment: NODE_ENV
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 FastPost Backend Server`);
  console.log(`📍 Running on: http://localhost:${PORT}`);
  console.log(`🔧 Environment: ${NODE_ENV}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}\n`);
});

module.exports = app;
