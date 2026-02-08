const errorHandler = (err, req, res, next) => {
  // Mongoose validation error → 400
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      error: {
        message: messages.join(', '),
        status: 400
      }
    });
  }

  // Mongoose cast error (invalid ObjectId) → 400
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: {
        message: 'Invalid ID format',
        status: 400
      }
    });
  }

  // MongoDB duplicate key error → 409
  if (err.code === 11000) {
    return res.status(409).json({
      error: {
        message: 'Duplicate entry. This record already exists.',
        status: 409
      }
    });
  }

  // Custom errors (thrown with statusCode in controllers)
  const statusCode = err.statusCode || 500;

  console.error(`[ERROR] ${req.method} ${req.originalUrl} - ${err.message}`);

  res.status(statusCode).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: statusCode
    }
  });
};

module.exports = errorHandler;
