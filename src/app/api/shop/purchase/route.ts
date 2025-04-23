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
    
    // 이미 구매한 아이템인지 확인 (재사용 가능한 아이템은 중복 구매 허용)
    const alreadyPurchased = user.userItems.some(item => item.itemId === itemId);
    if (alreadyPurchased && !shopItem.reusable) {
      return NextResponse.json({ error: "이미 구매한 아이템입니다." }, { status: 400 });
    }
    
    // 포인트가 충분한지 확인
    if (user.userPats.count < shopItem.price) {
      return NextResponse.json({ error: "포인트가 부족합니다." }, { status: 400 });
    }
    
    // 트랜잭션으로 구매 처리
    await prisma.$transaction(async (prisma) => {
      // 포인트 차감 (누적 쓰다듬기는 변경하지 않음)
      await prisma.userPats.update({
        where: { userId: user.id },
        data: { count: { decrement: shopItem.price } }
      });
      // 구매 이력 추가 (중복 구매의 경우 구매 이력이 중복 추가됨)
      await prisma.userItem.create({
        data: {
          userId: user.id,
          itemId: itemId,
        }
      });
    }).catch((error) => {
      console.error("Transaction failed:", error);
      throw new Error("트랜잭션 처리 중 오류가 발생했습니다.");
    });
    
    // 업데이트된 사용자 정보 조회
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { userPats: true, userItems: true }
    });
    
    if (!updatedUser || !updatedUser.userPats) {
      return NextResponse.json({ error: "사용자 정보를 업데이트하는 중 오류가 발생했습니다." }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: "아이템 구매에 성공했습니다.",
      user: {
        patCount: updatedUser.userPats.count,
        inventory: updatedUser.userItems.map(item => item.itemId)
      }
    });
    
  } catch (error) {
    console.error("Purchase error:", error);
    return NextResponse.json({ error: "아이템 구매 중 오류가 발생했습니다." }, { status: 500 });
  }
}
