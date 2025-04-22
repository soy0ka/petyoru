import { PrismaClient } from "@prisma/client";

// 환경 변수에서 연결 풀 크기 설정 가져오기 (기본값: 5)
const CONNECTION_LIMIT = process.env.DATABASE_CONNECTION_LIMIT 
  ? parseInt(process.env.DATABASE_CONNECTION_LIMIT, 10) 
  : 5;

// Prisma 클라이언트 생성 함수 (연결 제한 설정 추가)
const prismaClientSingleton = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
  });

  // 개발 환경에서 연결 상태 로깅
  if (process.env.NODE_ENV === "development") {
    console.log(`🔌 Prisma Client initialized with connection limit: ${CONNECTION_LIMIT}`);
  }

  return client;
};

// 전역 변수로 PrismaClient 인스턴스 관리
const globalForPrisma = globalThis as unknown as { 
  prisma: PrismaClient | undefined;
  _connCount: number;
};

// 연결 카운터 초기화
if (!globalForPrisma._connCount) {
  globalForPrisma._connCount = 0;
}

// 싱글톤 인스턴스가 없으면 생성
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prismaClientSingleton();
  globalForPrisma._connCount = 1;
} else if (process.env.NODE_ENV !== "production") {
  globalForPrisma._connCount++;
  console.log(`♻️ Reusing Prisma client instance (${globalForPrisma._connCount} references)`);
}

// 클라이언트 인스턴스 내보내기
export const prisma = globalForPrisma.prisma;

// 어플리케이션 종료 시 연결 정리
if (typeof window === "undefined") {
  // Node.js 환경
  process.on("beforeExit", async () => {
    if (globalForPrisma.prisma) {
      console.log("🔌 Disconnecting Prisma Client on exit");
      await globalForPrisma.prisma.$disconnect();
    }
  });
  
  // 예상치 못한 종료 시에도 연결 정리
  ["SIGINT", "SIGTERM"].forEach(signal => {
    process.on(signal, async () => {
      if (globalForPrisma.prisma) {
        console.log(`🔌 Disconnecting Prisma Client on ${signal}`);
        await globalForPrisma.prisma.$disconnect();
        process.exit(0);
      }
    });
  });
}

export default prisma;
