import { PrismaClient } from "@prisma/client";

// Prisma 클라이언트 생성 함수 (확장 없이 기본 설정만)
const prismaClientSingleton = () => {
  return new PrismaClient({
    // 로그 설정 (개발 환경에서만 자세한 로그)
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    
    // 데이터소스 연결 설정
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
};

// 전역 변수로 PrismaClient 인스턴스 관리
const globalForPrisma = globalThis as unknown as { prisma: ReturnType<typeof prismaClientSingleton> };
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// 개발 환경이 아닐 때만 싱글톤으로 설정
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// 어플리케이션 종료 시 연결 정리
if (typeof window === "undefined") {
  process.on("beforeExit", async () => {
    await prisma.$disconnect();
  });
}

export default prisma;
