import dns from "node:dns";
import { setServers } from "node:dns/promises";
import mongoose from "mongoose";

// Workaround for Node.js ECONNREFUSED querySrv issue on Windows/local networks
dns.setServers(["8.8.8.8", "8.8.4.4"]);
setServers(["8.8.8.8", "8.8.4.4"]);

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI missing");
}

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);

    console.log("MongoDB Connected");
  } catch (error) {
    console.error(error);

    process.exit(1);
  }
}
