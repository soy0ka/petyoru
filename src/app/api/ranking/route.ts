import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const topPatters = await prisma.user.findMany({
      take: 10,
      orderBy: {
        userPats: {
          count: 'desc'
        }
      },
      where: {
        userPats: {
          isNot: null
        }
      },
      select: {
        name: true,
        image: true,
        userPats: {
          select: {
            count: true
          }
        }
      }
    });

    // 응답 형식 변환
    const formattedUsers = topPatters.map((user: {
      name: string | null;
      image: string | null;
      userPats: { count: number } | null;
    }) => ({
      name: user.name,
      image: user.image,
      patCount: user.userPats?.count ?? 0
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch {
    return NextResponse.json(
      { message: "Error fetching rankings" },
      { status: 500 }
    );
  }
}
