import mongoose from "mongoose";
import dns from "dns";

// Workaround for Node.js ECONNREFUSED querySrv issue on Windows/local networks
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI missing");
}

export async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);

    console.log("MongoDB Connected");
  } catch (error) {
    console.error(error);

    process.exit(1);
  }
}