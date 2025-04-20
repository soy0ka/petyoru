// src/app/api/pats/route.ts
import { PrismaClient } from "@prisma/client";
import { DefaultSession, getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";


// Extend the DefaultSession type to include 'id'
declare module "next-auth" {
interface Session {
    user?: {
      id: string;
    } & DefaultSession["user"];
  }
}

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);

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
  const session = await getServerSession(authOptions);

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

    // 사용자 데이터 업데이트 (없으면 생성)
    const userPats = await prisma.userPats.upsert({
      where: { userId: user.id },
      update: { count: { increment: 1 } },
      create: { userId: user.id, count: 1 },
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
