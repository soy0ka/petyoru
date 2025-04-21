import prisma from "@/lib/prisma";
import { NextResponse } from 'next/server';

// 랭킹 타입 파라미터 추가 (pat: 쓰다듬기, enhance: 강화)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'pat'; // 기본값은 쓰다듬기 랭킹
    
    if (type === 'enhance') {
      // 강화 레벨 랭킹 조회
      const enhanceRanking = await prisma.user.findMany({
        where: {
          yoruEnhance: {
            level: {
              gt: 1 // 레벨 1 이상인 사용자만 (기본값이 1이므로 2 이상으로 설정)
            }
          }
        },
        select: {
          id: true,
          name: true,
          image: true,
          yoruEnhance: {
            select: {
              level: true,
              exp: true
            }
          }
        },
        orderBy: [
          {
            yoruEnhance: {
              level: 'desc'
            }
          },
          {
            yoruEnhance: {
              exp: 'desc'
            }
          }
        ],
        take: 15 // 상위 15명만
      });
      
      // 응답 데이터 형식 변환
      const formattedEnhanceRanking = enhanceRanking.map(user => ({
        id: user.id,
        name: user.name,
        image: user.image,
        level: user.yoruEnhance?.level || 1,
        exp: user.yoruEnhance?.exp || 0
      }));
      
      return NextResponse.json(formattedEnhanceRanking);
    } else {
      // 기존 쓰다듬기 랭킹 조회
      const topUsers = await prisma.user.findMany({
        where: {
          userPats: {
            totalPatCount: {
              gt: 50  // 50회 이상 쓰다듬은 사용자만
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
        take: 15 // 상위 15명만
      });
      
      // 응답 데이터 형식 변환
      const formattedUsers = topUsers.map(user => ({
        id: user.id,
        name: user.name,
        image: user.image,
        totalPatCount: user.userPats?.totalPatCount || 0
      }));
      
      return NextResponse.json(formattedUsers);
    }
    
  } catch (error) {
    console.error("Ranking fetch error:", error);
    return NextResponse.json({ error: "랭킹 정보를 불러오는 중 오류가 발생했습니다." }, { status: 500 });
  }
}
