const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const requestLogger = require('./middleware/requestLogger');
const { errorHandler, unhandledRejectionHandler, uncaughtExceptionHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Handle uncaught exceptions
process.on('uncaughtException', uncaughtExceptionHandler);

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express
const app = express();

// Security middleware
app.use(helmet()); // Set security HTTP headers

// Compression middleware
app.use(compression()); // Compress all responses

// Body parser with size limit (multer handles multipart — keep JSON limit small)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Serve uploaded hostel images publicly
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Data sanitization against XSS (Cross-Site Scripting)
const xssClean = require('xss-clean');
app.use(xssClean());

// Prevent HTTP Parameter Pollution
const hpp = require('hpp');
app.use(hpp());

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : 'http://localhost:5173',
  credentials: true
};
app.use(cors(corsOptions));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}
app.use(requestLogger); // Attach req.id + structured per-request logging

// Rate limiting (Global)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per 15 min
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Stricter rate limit for auth routes (brute-force prevention)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Strict limit for auth attempts
  message: 'Too many authentication attempts, please try again later.'
});

// Superadmin routes (kept as const because it's registered at two prefixes)
const superadminRoutes = require('./routes/superadmin.js');

// Use Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/hostels', require('./routes/hostel'));
app.use('/api/rooms', require('./routes/room'));
app.use('/api/bookings', require('./routes/booking'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/bills', require('./routes/bill'));
app.use('/api/owner', require('./routes/owner'));
app.use('/api/admin/audit-logs', require('./routes/auditLog'));
app.use('/api/admin/analytics', require('./routes/analytics'));
app.use('/api/admin', superadminRoutes);
// New marketplace routes
app.use('/api/marketplace', require('./routes/marketplace'));
app.use('/api/reviews', require('./routes/review'));
app.use('/api/gatepass', require('./routes/gatePass'));

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server running!',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Cannot ${req.method} ${req.originalUrl}` }
  });
});

// Centralized error handling middleware
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', unhandledRejectionHandler);

// Start the server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Graceful shutdown — closes HTTP server then Mongo connection
process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down gracefully');
  server.close(() => {
    logger.info('HTTP server closed');
    mongoose.connection.close(false).then(() => {
      logger.info('MongoDB connection closed — process terminated');
      process.exit(0);
    });
  });
});

module.exports = app;
