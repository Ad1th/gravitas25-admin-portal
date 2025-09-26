const express = require('express');
const dotenv = require('dotenv');
const pinoHttp = require('pino-http');
// const limiter = require('./utils/rate-limiter');
// const jeopardyadmin = require('../jeopardy/routes/admin.routes.js');
// const jeopardyplayer = require('../jeopardy/routes/player.routes.js');
// const teamRoutes = require('./routes/team.route');

dotenv.config();

const app = express();

// Enable CORS for all routes
app.use(require('cors')({
  origin: 'http://localhost:3001', // Allow requests from frontend
  credentials: true
}));

app.use(pinoHttp());

app.use(express.json());
// app.use(limiter);

// Serve static files from frontend folder
app.use('/frontend', express.static('frontend'));

// app.use('/health', require('./routes/health.route'));
app.use('/auth', require('./routes/auth.route.js'));
app.use('/users', require('./routes/userRoute.js'));
app.use('/events', require('./routes/event.route.js'));
// app.use('/teams', teamRoutes);

// app.use('/jeopardy/admin', jeopardyadmin);
// app.use('/jeopardy/player', jeopardyplayer);

module.exports = app;
