const express = require('express');
const dotenv = require('dotenv');
const pinoHttp = require('pino-http');

dotenv.config();

const app = express();

// Enable CORS for all routes
app.use(require('cors')({
  origin: ['*'], // adjust if you want strict frontend URLs
  credentials: true
}));

app.use(pinoHttp());
app.use(express.json());

// Routes
app.use('/auth', require('./routes/auth.route.js'));
app.use('/users', require('./routes/userRoute.js'));
app.use('/events', require('./routes/event.route.js'));
app.use('/submissions', require('./routes/submission.route.js'));
app.use('/scores', require('./routes/score.route.js'));

// Static frontend (optional)
app.use('/frontend', express.static('frontend'));

module.exports = app;
