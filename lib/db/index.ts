import { PrismaClient } from "@prisma/client";

// Singleton pattern: next.js hot-reload creates new module instances, so we stash
// the client on globalThis to avoid exhausting connection limits in dev.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Singleton PrismaClient instance. Reuses the client in development
 * to avoid exhausting connection limits during hot reload.
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
