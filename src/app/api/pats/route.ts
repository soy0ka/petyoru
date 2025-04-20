// src/app/api/pats/route.ts
import { PrismaClient } from "@prisma/client";
import { DefaultSession, getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// Extend the DefaultSession type to include 'id'
declare module "next-auth" {
  interface Session {
    user?: {
      id?: string;
    } & DefaultSession["user"];
  }
}

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession();

  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // 사용자 데이터 찾기 또는 생성
    let userPats = await prisma.userPats.findUnique({
      where: { userId },
    });

    if (!userId) {
      return NextResponse.json({ message: "User ID is missing" }, { status: 400 });
    }
  
    // 사용자 데이터가 없으면 생성
    if (!userPats) {
      userPats = await prisma.userPats.create({
        data: { userId, count: 0 },
      });
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
  const session = await getServerSession();

  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  if (!userId) {
    return NextResponse.json({ message: "User ID is missing" }, { status: 400 });
  }

  try {
    // 사용자 데이터 업데이트 (없으면 생성)
    const userPats = await prisma.userPats.upsert({
      where: { userId },
      update: { count: { increment: 1 } },
      create: { userId, count: 1 },
    });

    return NextResponse.json({ count: userPats.count });
  } catch (error) {
    console.error("Error updating pat count:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
