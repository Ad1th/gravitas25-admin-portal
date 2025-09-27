const app = require('../src/app');
const serverless = require('serverless-http');

module.exports = serverless(app);
