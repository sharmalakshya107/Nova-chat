import { PrismaClient } from "@prisma/client";
import { logger } from "@shared/utils/logger";

export const prisma = new PrismaClient();

export const connectDatabase = async (): Promise<void> => {
  await prisma.$connect();
  logger.info("Database connected");
};

export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
};

export const isDatabaseReachable = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
};
