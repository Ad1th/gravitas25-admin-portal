const app = require('./app');
const logger = require('./utils/logger');
const dotenv = require('dotenv');

// Load env from root
dotenv.config();

const express = require("express");

app.use(express.json()); 

const PORT = 4000;

app.listen(PORT, () => {
  logger.info(`Server running at http://localhost:${PORT}`);
});
