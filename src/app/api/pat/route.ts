import { withRetry } from "@/lib/db-helpers"; // 재시도 로직 import
import prisma from "@/lib/prisma";
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 });
    }
    
    // 사용자 조회 - 재시도 로직 적용
    const user = await withRetry(async () => {
      return prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, userPats: true } // 필요한 필드만 선택하여 부하 감소
      });
    });
    
    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }
    
    // 안전한 트랜잭션 실행
    const result = await withRetry(async () => {
      return prisma.$transaction(async (tx) => {
        // 트랜잭션 내에서 최신 상태의 UserPats 조회
        const existingUserPats = await tx.userPats.findUnique({
          where: { userId: user.id }
        });
        
        const now = new Date();
        
        if (!existingUserPats) {
          // 사용자의 UserPats가 없으면 새로 생성
          return await tx.userPats.create({
            data: {
              userId: user.id,
              count: 1,
              totalPatCount: 1,
              lastPatAt: now
            }
          });
        } else {
          // 마지막 쓰다듬은 시간과 현재 시간의 차이 확인 (도배 방지)
          const diffInSeconds = (now.getTime() - existingUserPats.lastPatAt.getTime()) / 1000;
          
          // 2초 이내에 연속 요청 방지 (3초에서 2초로 변경)
          if (diffInSeconds < 2) {
            return existingUserPats; // 기존 값을 반환하고 업데이트하지 않음
          }
          
          // 이미 존재하면 업데이트
          return await tx.userPats.update({
            where: { userId: user.id },
            data: {
              count: { increment: 1 },
              totalPatCount: { increment: 1 },
              lastPatAt: now
            }
          });
        }
      });
    });
    
    // 속도 제한에 걸렸는지 확인 (최종 결과의 lastPatAt과 이전에 계산한 시간 비교)
    const now = new Date();
    const diffInSeconds = (now.getTime() - result.lastPatAt.getTime()) / 1000;
    const limited = diffInSeconds < 2 && user.userPats?.lastPatAt && 
                    (now.getTime() - user.userPats.lastPatAt.getTime()) / 1000 < 2;
    
    return NextResponse.json({
      count: result.count,
      totalPatCount: result.totalPatCount,
      success: !limited,
      message: limited ? "너무 빠르게 쓰다듬을 수 없어요." : "요루를 쓰다듬었습니다!"
    });
    
  } catch (error) {
    console.error("Pat error:", error);
    return NextResponse.json({ error: "쓰다듬기 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
