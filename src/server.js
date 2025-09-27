const app = require('./app');
const logger = require('./utils/logger');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  logger.info(`Server running at http://localhost:${PORT}`);
});
