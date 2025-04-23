// src/app/api/pats/route.ts
import { executeDbOperation, safeTransaction } from "@/lib/db-helpers";
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
    const user = await executeDbOperation(async () => {
      if (!session.user) throw new Error("User not found");
      if (!session.user.email) throw new Error("User email not found");
    
      return prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true } // 필요한 필드만 조회하여 부하 감소
      });
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // 필요한 데이터만 조회하도록 최적화
    const userPats = await executeDbOperation(async () => {
      return prisma.userPats.findUnique({
        where: { userId: user.id },
        select: { count: true, totalPatCount: true } // 필요한 필드만 선택
      });
    });

    if (!userPats) {
      const newUserPats = await executeDbOperation(async () => {
        return prisma.userPats.create({
          data: {
            userId: user.id,
            count: 0,
            totalPatCount: 0
          },
          select: { count: true } // 필요한 필드만 선택
        });
      });
      
      return NextResponse.json({ count: newUserPats.count });
    }

    return NextResponse.json({ count: userPats.count });
  } catch (error) {
    console.error("Error fetching pat count:", error);
    
    // 연결 오류 특별 처리
    if (error instanceof Error && 
        (error.message.includes("Too many connections") || 
         error.message.includes("Connection pool"))) {
      return NextResponse.json(
        { message: "서버가 현재 바쁩니다. 잠시 후 다시 시도해주세요." },
        { status: 503 }
      );
    }
    
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
        { message: "너무 빠른 쓰다듬기예요! 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    // 사용자 조회 - executeDbOperation으로 감싸서 연결 관리
    const user = await executeDbOperation(async () => {
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

    // 간소화된 트랜잭션 사용
    // 데이터베이스 연결 시간을 최소화
    const result = await safeTransaction(async (tx) => {
      const userPats = await tx.userPats.findUnique({
        where: { userId: user.id },
        select: { id: true } // 필요한 필드만 선택
      });

      if (!userPats) {
        return await tx.userPats.create({
          data: {
            userId: user.id,
            count: 1,
            totalPatCount: 1,
            lastPatAt: new Date()
          }
        });
      }

      return await tx.userPats.update({
        where: { id: userPats.id }, // userId 대신 id로 빠르게 조회
        data: {
          count: { increment: 1 },
          totalPatCount: { increment: 1 },
          lastPatAt: new Date()
        }
      });
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
    
    if (error instanceof Error) {
      if (error.message.includes('Too many connections')) {
        errorMessage = "현재 서버가 너무 바쁩니다. 잠시 후 다시 시도해주세요.";
        statusCode = 503; // Service Unavailable
      } else if (error.message.includes('Record has changed')) {
        errorMessage = "요청이 너무 많아 처리할 수 없어요. 잠시 후 다시 시도해주세요.";
        statusCode = 429;
      }
    }
    
    return NextResponse.json(
      { message: errorMessage, success: false },
      { status: statusCode }
    );
  }
}

