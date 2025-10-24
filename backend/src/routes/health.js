const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    ok: true,
    env: process.env.NODE_ENV,
    db: mongoose.connection.readyState
  });
});

module.exports = router;


