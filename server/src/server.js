require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const connectDB = require("./config/db");
const socketHandler = require("./sockets/socketHandler");

const PORT = process.env.PORT || 5000;

connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  },
});

// Make the Socket.IO instance available to REST controllers (e.g. document
// sharing, mentions) so they can push a real-time event without importing
// the socket layer directly and creating a circular dependency.
app.set("io", io);

socketHandler(io);

server.listen(PORT, () => {
  console.log(`SyncSpace server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
});

// --- Process-level safety net -------------------------------------------------
// Previously, an uncaught error inside an async Socket.IO handler (e.g. an
// invalid workspace/user id reaching a Mongoose query) became an unhandled
// promise rejection. Node terminates the process on unhandled rejections by
// default, which is what caused the backend to crash and every subsequent
// REST call (including /api/messages/private/...) to fail with
// ECONNREFUSED until the process was manually restarted.
//
// Every socket handler below is now wrapped in try/catch, so this is a last
// line of defense, not the primary fix — but it ensures a single unexpected
// error can never take the whole server down.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});
