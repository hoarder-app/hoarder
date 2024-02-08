import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// For some weird reason accessing @prisma/client from any package is causing problems (specially in error handling).
// Re export them here instead.
export * from "@prisma/client";

export default prisma;
