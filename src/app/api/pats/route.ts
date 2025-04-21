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
      include: { userPats: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const updatedPats = await prisma.userPats.upsert({
      where: { userId: user.id },
      create: { 
        userId: user.id, 
        count: 1,
        totalPatCount: 1 
      },
      update: { 
        count: { increment: 1 },
        totalPatCount: { increment: 1 } 
      },
    });

    return NextResponse.json({ 
      count: updatedPats.count,
      totalPatCount: updatedPats.totalPatCount 
    });
  } catch (error) {
    console.error("Error updating pat count:", error);
    return NextResponse.json(
      { message: "요청 처리 중 오류가 발생했어요." },
      { status: 500 }
    );
  }
}

