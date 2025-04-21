import prisma from "@/lib/prisma";
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  try {
    // 세션 확인
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 });
    }
    
    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        userPats: true,
        yoruEnhance: true,
        userItems: {
          include: {
            item: true
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }
    
    // UserPats가 없으면 생성
    let patCount = 0;
    let totalPatCount = 0;
    if (!user.userPats) {
      await prisma.userPats.create({
        data: {
          userId: user.id,
          count: 0,
          totalPatCount: 0
        }
      });
    } else {
      patCount = user.userPats.count;
      totalPatCount = user.userPats.totalPatCount;
    }
    
    // YoruEnhance가 없으면 생성
    let enhanceData = {
      level: 1,
      exp: 0,
      failCount: 0,
      successRate: 90
    };
    
    if (!user.yoruEnhance) {
      await prisma.yoruEnhance.create({
        data: {
          userId: user.id,
          ...enhanceData
        }
      });
    } else {
      enhanceData = {
        level: user.yoruEnhance.level,
        exp: user.yoruEnhance.exp,
        failCount: user.yoruEnhance.failCount,
        successRate: user.yoruEnhance.successRate
      };
    }
    
    // 사용자의 구매한 아이템 정보 가공
    const inventory = user.userItems.map(userItem => ({
      id: userItem.item.id,
      name: userItem.item.name,
      image: userItem.item.image,
      category: userItem.item.category,
      isEquipped: userItem.isEquipped,
      purchasedAt: userItem.purchasedAt
    }));
    
    // 응답 데이터
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      patCount,
      totalPatCount,
      enhanceData,
      inventory
    };
    
    return NextResponse.json(userData);
    
  } catch (error) {
    console.error("User data fetch error:", error);
    return NextResponse.json({ error: "사용자 데이터를 불러오는 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// 사용자 정보 업데이트 (예: 아이템 장착 상태 변경)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 });
    }
    
    const body = await request.json();
    const { itemId, isEquipped } = body;
    
    if (!itemId) {
      return NextResponse.json({ error: "아이템 ID가 필요합니다." }, { status: 400 });
    }
    
    // 사용자 정보 확인
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    
    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }
    
    // 사용자가 해당 아이템을 소유하고 있는지 확인
    const userItem = await prisma.userItem.findUnique({
      where: {
        userId_itemId: {
          userId: user.id,
          itemId
        }
      }
    });
    
    if (!userItem) {
      return NextResponse.json({ error: "소유하지 않은 아이템입니다." }, { status: 404 });
    }
    
    // 아이템 장착 상태 업데이트
    const updatedUserItem = await prisma.userItem.update({
      where: {
        id: userItem.id
      },
      data: {
        isEquipped: isEquipped === undefined ? !userItem.isEquipped : isEquipped
      }
    });
    
    return NextResponse.json({
      success: true,
      isEquipped: updatedUserItem.isEquipped
    });
    
  } catch (error) {
    console.error("User data update error:", error);
    return NextResponse.json({ error: "사용자 데이터 업데이트 중 오류가 발생했습니다." }, { status: 500 });
  }
}
