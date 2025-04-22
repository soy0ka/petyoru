// src/app/api/pats/route.ts
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // 트랜잭션을 사용하여 동시성 문제 해결
    const result = await prisma.$transaction(async (tx) => {
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
            totalPatCount: 1
          },
        });
      } else {
        // 이미 존재하면 업데이트
        return await tx.userPats.update({
          where: { userId: user.id },
          data: {
            count: { increment: 1 },
            totalPatCount: { increment: 1 }
          },
        });
      }
    }, {
      maxWait: 5000, // 최대 대기 시간 5초
      timeout: 10000, // 최대 트랜잭션 실행 시간 10초
      isolationLevel: "ReadCommitted", // 트랜잭션 격리 수준
    });

    return NextResponse.json({
      count: result.count,
      totalPatCount: result.totalPatCount
    });
  } catch (error: unknown) {
    console.error("Error updating pat count:", error);
    
    // 사용자에게 더 명확한 오류 메시지 제공
    let errorMessage = "요청 처리 중 오류가 발생했어요.";
    if (error instanceof Error && 
        (error.name === 'PrismaClientKnownRequestError' || 
        error.name === 'PrismaClientUnknownRequestError')) {
      errorMessage = "요청이 너무 많아 처리할 수 없어요. 잠시 후 다시 시도해주세요.";
    }
    
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}

