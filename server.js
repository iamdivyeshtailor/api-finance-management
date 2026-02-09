const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDb = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const reportRoutes = require('./routes/reportRoutes');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: false
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);

// Error handler (must be last middleware)
app.use(errorHandler);

const port = process.env.PORT || 5000;

connectDb()
  .then(() => {
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
