import { PrismaClient } from "@prisma/client";

// Edge런타임과 일반 Node.js 환경에 따른 최적화 처리
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    // Edge 환경에 최적화된 연결 설정
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

// PrismaClient는 전역 싱글톤으로 관리
const globalForPrisma = globalThis as unknown as { prisma: ReturnType<typeof prismaClientSingleton> };

const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
