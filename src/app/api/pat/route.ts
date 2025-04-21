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
    
    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { userPats: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }
    
    // UserPats가 없으면 생성
    if (!user.userPats) {
      const newUserPats = await prisma.userPats.create({
        data: {
          userId: user.id,
          count: 1,
          totalPatCount: 1,
          lastPatAt: new Date()
        }
      });
      
      return NextResponse.json({
        count: newUserPats.count,
        totalPatCount: newUserPats.totalPatCount,
        success: true,
        message: "요루를 쓰다듬었습니다!"
      });
    }
    
    // 마지막 쓰다듬은 시간과 현재 시간의 차이 확인 (도배 방지)
    const lastPatAt = user.userPats.lastPatAt;
    const now = new Date();
    const diffInSeconds = (now.getTime() - lastPatAt.getTime()) / 1000;
    
    // 3초 이내에 연속 요청 방지
    if (diffInSeconds < 3) {
      return NextResponse.json({
        count: user.userPats.count,
        totalPatCount: user.userPats.totalPatCount,
        success: false,
        message: "너무 빠르게 쓰다듬을 수 없어요."
      });
    }
    
    // UserPats 업데이트 - 포인트와 누적 카운트 모두 증가
    const updatedUserPats = await prisma.userPats.update({
      where: { userId: user.id },
      data: {
        count: { increment: 1 },
        totalPatCount: { increment: 1 },
        lastPatAt: now
      }
    });
    
    return NextResponse.json({
      count: updatedUserPats.count,
      totalPatCount: updatedUserPats.totalPatCount,
      success: true,
      message: "요루를 쓰다듬었습니다!"
    });
    
  } catch (error) {
    console.error("Pat error:", error);
    return NextResponse.json({ error: "쓰다듬기 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
