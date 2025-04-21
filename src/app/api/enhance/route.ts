import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

// 강화 정보 가져오기
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { yoruEnhance: true },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // 강화 데이터가 없으면 생성
    if (!user.yoruEnhance) {
      const newEnhance = await prisma.yoruEnhance.create({
        data: {
          userId: user.id,
          level: 1,
          exp: 0,
          failCount: 0,
          successRate: 90,
        },
      });
      
      return NextResponse.json(newEnhance);
    }

    return NextResponse.json(user.yoruEnhance);
  } catch (error) {
    console.error("Error fetching enhance data:", error);
    return NextResponse.json(
      { message: "Error fetching enhance data" },
      { status: 500 }
    );
  }
}

// 강화 시도
export async function POST() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { yoruEnhance: true },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    let enhanceData = user.yoruEnhance;
    
    // 강화 데이터가 없으면 생성
    if (!enhanceData) {
      enhanceData = await prisma.yoruEnhance.create({
        data: {
          userId: user.id,
          level: 1,
          exp: 0,
          failCount: 0,
          successRate: 90,
        },
      });
    }

    // 강화 로직
    const currentLevel = enhanceData.level;
    const currentRate = enhanceData.successRate;
    
    // 레벨이 높아질수록 성공률 감소
    const adjustedRate = Math.max(currentRate - Math.floor(currentLevel / 5) * 5, 40);
    
    // 강화 성공 여부 결정 (0-99 범위의 난수 생성)
    const roll = Math.floor(Math.random() * 100);
    const success = roll < adjustedRate;

    // 결과에 따라 데이터 업데이트
    if (success) {
      // 강화 성공
      enhanceData = await prisma.yoruEnhance.update({
        where: { id: enhanceData.id },
        data: {
          level: enhanceData.level + 1,
          exp: enhanceData.exp + 50,
          successRate: Math.max(adjustedRate - 2, 40), // 성공할수록 확률 감소 (최소 40%)
        },
      });
    } else {
      // 강화 실패
      enhanceData = await prisma.yoruEnhance.update({
        where: { id: enhanceData.id },
        data: {
          failCount: enhanceData.failCount + 1,
          exp: enhanceData.exp + 10, // 실패해도 경험치는 조금 얻음
          successRate: Math.min(adjustedRate + 5, 90), // 실패할수록 확률 증가 (최대 90%)
        },
      });
    }

    return NextResponse.json({
      ...enhanceData,
      success,
    });
  } catch (error) {
    console.error("Error enhancing:", error);
    return NextResponse.json(
      { message: "Error enhancing" },
      { status: 500 }
    );
  }
}
