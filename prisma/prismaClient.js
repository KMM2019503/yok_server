// v1/prismaClient.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Verifies the connection to the database.
 */
export const connectToDatabase = async () => {
  try {
    await prisma.$connect(); // Ensures the Prisma client connects to the database
    console.log("✅ Successfully connected to the database.");
  } catch (error) {
    console.error("❌ Failed to connect to the database:", error);
    throw error; // Let the error propagate to stop server startup
  }
};

export default prisma;
