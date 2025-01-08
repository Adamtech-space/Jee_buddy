const app = require("./app");
const config = require("./src/config/config");
const logger = require("./src/config/logger");
const supabase = require("./src/config/supabaseClient");

let server;

// Start the server
async function startServer() {
  try {
    // Supabase connection is tested in supabaseClient.js
    server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
    });
  } catch (error) {
    logger.error('Error starting server:', error);
    process.exit(1);
  }
}

startServer();

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info("Server closed");
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);

process.on("SIGTERM", () => {
  logger.info("SIGTERM received");
  if (server) {
    server.close();
  }
});
