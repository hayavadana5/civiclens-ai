import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/civiclens";

  try {
    await mongoose.connect(uri);
    console.log(`[DB] Connected to MongoDB at ${uri}`);
  } catch (error) {
    console.error("[DB] MongoDB connection error:", error);
    console.error(
      "[DB] The server will continue running, but database operations will fail until MongoDB is reachable."
    );
  }

  mongoose.connection.on("disconnected", () => {
    console.warn("[DB] MongoDB disconnected");
  });

  mongoose.connection.on("error", (err) => {
    console.error("[DB] MongoDB runtime error:", err);
  });
};

export default connectDB;
