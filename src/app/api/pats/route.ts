// src/app/api/pats/route.ts
import { safeTransaction, withRetry } from "@/lib/db-helpers";
import prisma from "@/lib/prisma";
import { rateLimiter } from "@/lib/rate-limiter";
import { DefaultSession, getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// Extend the DefaultSession type to include 'id'
declare module "next-auth" {
interface Session {
    user?: {
      id: string;
    } & DefaultSession["user"];
  }
}

export async function GET() {
  const session = await getServerSession();

  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // 이메일로 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const userPats = await prisma.userPats.findUnique({
      where: { userId: user.id }
    });

    if (!userPats) {
      const newUserPats = await prisma.userPats.create({
        data: {
          userId: user.id,
          count: 0,
        },
      });
      return NextResponse.json({ count: newUserPats.count });
    }

    return NextResponse.json({ count: userPats.count });
  } catch (error) {
    console.error("Error fetching pat count:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const isAllowed = await rateLimiter.isAllowed(session.user.email);
    if (!isAllowed) {
      return NextResponse.json(
        { message: "너무 빠른 쓰다듬기예요! 잠시 후 다시 시도해주세요. (30초마다 가능)" },
        { status: 429 }
      );
    }

    // 사용자 조회 - 재시도 로직 적용
    const user = await withRetry(async () => {
      if (!session.user?.email) throw new Error("User email not found");
      return prisma.user.findUnique({
        where: { email: session.user.email },
      });
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // 안전한 트랜잭션 실행 - tx 변수명 일관성 유지
    const result = await safeTransaction(async (tx) => {
      // 트랜잭션 내에서 최신 상태의 UserPats 조회
      const existingUserPats = await tx.userPats.findUnique({
        where: { userId: user.id },
      });

      if (!existingUserPats) {
        // 사용자의 UserPats가 없으면 새로 생성
        return await tx.userPats.create({
          data: {
            userId: user.id,
            count: 1,
            totalPatCount: 1,
            lastPatAt: new Date()
          },
        });
      } else {
        // 이미 존재하면 업데이트
        return await tx.userPats.update({
          where: { userId: user.id },
          data: {
            count: { increment: 1 },
            totalPatCount: { increment: 1 },
            lastPatAt: new Date()
          },
        });
      }
    });

    return NextResponse.json({
      count: result.count,
      totalPatCount: result.totalPatCount,
      success: true
    });
  } catch (error) {
    console.error("Error updating pat count:", error);
    
    // 사용자에게 더 명확한 오류 메시지 제공
    let errorMessage = "요청 처리 중 오류가 발생했어요.";
    let statusCode = 500;
    
    // Edge 환경에서 발생할 수 있는 다양한 에러 처리
    if (error instanceof Error) {
      if (error.message.includes('Record has changed')) {
        errorMessage = "요청이 너무 많아 처리할 수 없어요. 잠시 후 다시 시도해주세요.";
        statusCode = 429;
      } else if (error.message.includes('Connection pool')) {
        errorMessage = "서버가 현재 바쁩니다. 잠시 후 다시 시도해주세요.";
        statusCode = 503;
      }
    }
    
    return NextResponse.json(
      { message: errorMessage, success: false },
      { status: statusCode }
    );
  }
}

