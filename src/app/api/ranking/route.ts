import prisma from "@/lib/prisma";
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 누적 쓰다듬기 많은 순으로 상위 사용자 조회
    const topUsers = await prisma.user.findMany({
      where: {
        userPats: {
          totalPatCount: {
            gt: 50  // 1회 이상 쓰다듬은 사용자만
          }
        }
      },
      select: {
        id: true,
        name: true,
        image: true,
        userPats: {
          select: {
            totalPatCount: true
          }
        }
      },
      orderBy: {
        userPats: {
          totalPatCount: 'desc'
        }
      },
      take: 15 // 상위 50명만
    });
    
    // 응답 데이터 형식 변환
    const formattedUsers = topUsers.map(user => ({
      id: user.id,
      name: user.name,
      image: user.image,
      totalPatCount: user.userPats?.totalPatCount || 0
    }));
    
    return NextResponse.json(formattedUsers);
    
  } catch (error) {
    console.error("Ranking fetch error:", error);
    return NextResponse.json({ error: "랭킹 정보를 불러오는 중 오류가 발생했습니다." }, { status: 500 });
  }
}
