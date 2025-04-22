import { withRetry } from "@/lib/db-helpers";
import prisma from "@/lib/prisma";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/binary";
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../auth/[...nextauth]/route';

// 데이터베이스 작업 타임아웃 설정 (5초)
const DB_TIMEOUT = 5000;

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 });
    }
    
    // 단일 트랜잭션으로 모든 데이터베이스 작업 처리
    // 최대 3번 재시도, 200ms 간격으로 설정
    const result = await withRetry(
      async () => {
        // 모든 쿼리를 하나의 트랜잭션으로 실행
        return prisma.$transaction(async (tx) => {
          // 1. 사용자 조회 (필요한 필드만 선택)
          const user = await tx.user.findUniqueOrThrow({
            where: { email: session.user.email },
            select: { id: true }
          });

          // 2. 사용자의 쓰다듬기 정보 조회
          const userPats = await tx.userPats.findUnique({
            where: { userId: user.id }
          });

          const now = new Date();
          
          // 3. 쓰다듬기 정보 처리 로직
          if (!userPats) {
            // 새로운 쓰다듬기 정보 생성
            return {
              ...(await tx.userPats.create({
                data: {
                  userId: user.id,
                  count: 1,
                  totalPatCount: 1,
                  lastPatAt: now
                }
              })),
              limited: false
            };
          } else {
            // 시간 간격 검사
            const diffInSeconds = (now.getTime() - userPats.lastPatAt.getTime()) / 1000;
            
            if (diffInSeconds < 2) {
              // 시간 제한에 걸린 경우 - 기존 정보 반환
              return {
                ...userPats,
                limited: true  // 제한 여부 표시
              };
            }
            
            // 업데이트 실행
            return {
              ...(await tx.userPats.update({
                where: { userId: user.id },
                data: {
                  count: { increment: 1 },
                  totalPatCount: { increment: 1 },
                  lastPatAt: now
                }
              })),
              limited: false
            };
          }
        }, {
          // 트랜잭션 타임아웃 설정
          timeout: DB_TIMEOUT,
          // 격리 수준 설정
          isolationLevel: 'ReadCommitted'
        });
      }, 
      3,     // 최대 재시도 횟수
      200    // 재시도 간격 (ms)
    );
    
    // 응답 생성
    return NextResponse.json({
      count: result.count,
      totalPatCount: result.totalPatCount,
      success: !result.limited,
      message: result.limited ? "너무 빠르게 쓰다듬을 수 없어요." : "요루를 쓰다듬었습니다!"
    });
    
  } catch (error) {
    console.error("Pat error:", error);
    
    // 특정 에러에 대한 사용자 친화적 응답
    if (error instanceof PrismaClientKnownRequestError) {
    if (error.name === 'PrismaClientInitializationError') {
      return NextResponse.json(
        { error: "서버가 많이 바쁩니다. 잠시 후 다시 시도해주세요." },
        { status: 503 }  // Service Unavailable
      );
    }
    
    if (error.name === 'NotFoundError') {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }
    
    return NextResponse.json({ error: "쓰다듬기 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
  }
}
