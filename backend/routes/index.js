const express = require('express');
const router = express.Router();

// Placeholder route
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to FastPost API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health'
    }
  });
});

module.exports = router;
