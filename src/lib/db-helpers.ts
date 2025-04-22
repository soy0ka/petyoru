import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";

/**
 * 데이터베이스 작업을 재시도하는 헬퍼 함수
 * @param operation 실행할 데이터베이스 작업 함수
 * @param maxRetries 최대 재시도 횟수 (기본값: 3)
 * @param retryDelay 재시도 사이 지연 시간(ms) (기본값: 100)
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  retryDelay = 100
): Promise<T> {
  let retries = 0;
  let lastError: Error | null = null;

  while (retries < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Edge 런타임에서 발생하는 "Record has changed" 에러 처리
      const shouldRetry =
        error instanceof Error &&
        error.message.includes("Record has changed");

      if (shouldRetry && retries < maxRetries - 1) {
        retries++;
        console.log(`Retrying operation, attempt ${retries} of ${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * retries));
      } else {
        throw error;
      }
    }
  }

  throw lastError;
}

// 연결 관리 개선을 위한 새로운 함수 추가
/**
 * 안전한 데이터베이스 작업 처리
 * 연결을 적절히 관리하며 작업을 실행하는 헬퍼 함수
 */
export async function executeDbOperation<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    // 연결 수 초과 오류 체크
    if (error instanceof Error && 
        (error.message.includes("Too many connections") || 
        error.message.includes("Connection pool"))) {
      console.error("Connection pool error detected, trying to recover...");
      
      // 연결 재설정 시도
      try {
        await prisma.$disconnect();
        // 잠시 대기 후 연결 재시도
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 연결 재시도
        return await operation();
      } catch (retryError) {
        console.error("Failed to recover connection:", retryError);
        throw retryError;
      }
    }
    
    // 다른 종류의 오류는 그대로 전달
    throw error;
  } finally {
    // 명시적 연결 해제는 하지 않음 (싱글톤 패턴을 사용하므로)
  }
}

// PrismaClient 타입의 트랜잭션 클라이언트 타입을 정의합니다.
// $transaction에서 사용되는 실제 타입과 일치하도록 합니다.
type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * 안전한 트랜잭션 실행을 위한 헬퍼 함수
 * @param fn 트랜잭션 내에서 실행할 함수
 */
export async function safeTransaction<T>(fn: (tx: TransactionClient) => Promise<T>): Promise<T> {
  return withRetry(async () => {
    return await executeDbOperation(async () => {
      return await prisma.$transaction(async (tx) => {
        // 타입 캐스팅을 통해 트랜잭션 객체를 TransactionClient로 처리
        return await fn(tx as unknown as TransactionClient);
      }, {
        maxWait: 2000,
        timeout: 5000,
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted
      });
    });
  }, 3, 500);
}
