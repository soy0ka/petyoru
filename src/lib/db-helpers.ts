import { PrismaClient } from "@prisma/client";
import prisma from "./prisma";

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
    return await prisma.$transaction(async (tx) => {
      return await fn(tx);
    }, {
      maxWait: 5000, // 최대 대기 시간
      timeout: 10000, // 트랜잭션 타임아웃
      isolationLevel: "ReadCommitted", // 격리 수준
    });
  });
}
