import prisma from "@/lib/prisma";
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 });
    }
    
    const body = await request.json();
    const { itemId } = body;
    
    if (!itemId) {
      return NextResponse.json({ error: "아이템 ID가 필요합니다." }, { status: 400 });
    }
    
    // 아이템 정보 가져오기
    const shopItem = await prisma.shopItem.findUnique({
      where: { id: itemId }
    });
    
    if (!shopItem) {
      return NextResponse.json({ error: "존재하지 않는 아이템입니다." }, { status: 404 });
    }
    
    // 사용자 정보 가져오기
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { userPats: true, userItems: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }
    
    if (!user.userPats) {
      return NextResponse.json({ error: "사용자 포인트 정보를 찾을 수 없습니다." }, { status: 404 });
    }
    
    // 이미 구매한 아이템인지 확인
    const alreadyPurchased = user.userItems.some(item => item.itemId === itemId);
    if (alreadyPurchased) {
      return NextResponse.json({ error: "이미 구매한 아이템입니다." }, { status: 400 });
    }
    
    // 포인트가 충분한지 확인
    if (user.userPats.count < shopItem.price) {
      return NextResponse.json({ error: "포인트가 부족합니다." }, { status: 400 });
    }
    
    // 트랜잭션으로 구매 처리
    const purchase = await prisma.$transaction([
      // 포인트 차감 (누적 쓰다듬기는 변경하지 않음)
      prisma.userPats.update({
        where: { userId: user.id },
        data: { count: { decrement: shopItem.price } }
      }),
      // 구매 이력 추가
      prisma.userItem.create({
        data: {
          userId: user.id,
          itemId: itemId,
        }
      })
    ]);
    
    return NextResponse.json({ 
      success: true,
      message: "아이템 구매에 성공했습니다.",
      patCount: user.userPats.count - shopItem.price
    });
    
  } catch (error) {
    console.error("Purchase error:", error);
    return NextResponse.json({ error: "아이템 구매 중 오류가 발생했습니다." }, { status: 500 });
  }
}
