import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

// ========================================
// Workspace Presence Store (Future Use)
// ========================================

const workspacePresence = new Map();

// ========================================
// Socket Connection
// ========================================

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  // ========================================
  // Notifications
  // ========================================

  socket.on(
    "join_notifications",
    (userId) => {
      if (!userId) return;

      const roomName = `user:${userId}`;

      socket.join(roomName);

      console.log(
        `User ${userId} joined notification room`
      );
    }
  );

  // ========================================
  // Chat Channels (Future Reuse)
  // ========================================

  socket.on(
    "join_channel",
    (channelId) => {
      socket.join(channelId);
    }
  );

  // ========================================
  // Workspace Presence (NSH Pattern)
  // ========================================

  socket.on(
    "join_workspace_presence",
    ({ workspaceId, userId }) => {
      socket.join(workspaceId);

      if (
        !workspacePresence.has(
          workspaceId
        )
      ) {
        workspacePresence.set(
          workspaceId,
          new Map()
        );
      }

      const workspaceUsers =
        workspacePresence.get(
          workspaceId
        );

      workspaceUsers.set(
        userId,
        socket.id
      );

      socket.data.workspaceId =
        workspaceId;

      socket.data.userId =
        userId;

      io.to(workspaceId).emit(
        "workspace_online_users",
        Array.from(
          workspaceUsers.keys()
        )
      );

      console.log(
        `User ${userId} joined workspace ${workspaceId}`
      );
    }
  );

  // ========================================
  // Typing Events
  // ========================================

  socket.on(
    "typing_start",
    ({ channelId, user }) => {
      socket
        .to(channelId)
        .emit(
          "user_typing",
          {
            user,
            channelId,
          }
        );
    }
  );

  socket.on(
    "typing_stop",
    ({ channelId, user }) => {
      socket
        .to(channelId)
        .emit(
          "user_stop_typing",
          {
            user,
            channelId,
          }
        );
    }
  );

  // ========================================
  // Admin Global
  // ========================================

  socket.on(
    "join_admin_global",
    () => {
      socket.join(
        "admin_global"
      );
    }
  );

  // ========================================
  // Disconnect
  // ========================================

  socket.on(
    "disconnect",
    () => {
      console.log(
        "Disconnected:",
        socket.id
      );

      const workspaceId =
        socket.data.workspaceId;

      const userId =
        socket.data.userId;

      if (
        !workspaceId ||
        !userId
      )
        return;

      const workspaceUsers =
        workspacePresence.get(
          workspaceId
        );

      if (!workspaceUsers)
        return;

      workspaceUsers.delete(
        userId
      );

      if (
        workspaceUsers.size === 0
      ) {
        workspacePresence.delete(
          workspaceId
        );
      }

      io.to(workspaceId).emit(
        "workspace_online_users",
        Array.from(
          workspaceUsers.keys()
        )
      );

      console.log(
        `User ${userId} left workspace ${workspaceId}`
      );
    }
  );
});

// ========================================
// Internal Emit API
// ========================================

app.post(
  "/emit",
  (req, res) => {
    const {
      channelId,
      event,
      data,
      message,
    } = req.body;

    if (!channelId) {
      return res
        .status(400)
        .json({
          error:
            "channelId required",
        });
    }

    if (event) {
      io.to(channelId).emit(
        event,
        data
      );
    }

    if (message) {
      io.to(channelId).emit(
        "receive_message",
        message
      );
    }

    return res.json({
      success: true,
    });
  }
);

// ========================================
// Health Check
// ========================================

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message:
      "Socket server running",
  });
});

// ========================================
// Start Server
// ========================================

const PORT =
  process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(
    `Socket server running on port ${PORT}`
  );
});