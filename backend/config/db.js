import mongoose from "mongoose";
import pkg from "pg";
import logger from "./logger.js";
const { Pool } = pkg;

let pgPool;

const connectDB = async () => {
  try {
    // MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("MongoDB connected");

    // PostgreSQL
    pgPool = new Pool({
  connectionString: process.env.POSTGRES_URI,
  ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false
});

    const pgClient = await pgPool.connect();
    logger.info("PostgreSQL connected");
    pgClient.release();
  } catch (error) {
    logger.error({ err: error }, "Database connection error");
    process.exit(1);
  }
};

export const getPG = () => pgPool;

export default connectDB;
