import prisma from "@/lib/prisma";
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 });
    }
    
    // 사용자 정보 가져오기
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { 
        userItems: {
          include: {
            item: true
          }
        },
        equipped: {
          include: {
            items: true
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }
    
    // 현재 착용중인 아이템 ID 목록
    const equippedItemIds = user.equipped 
      ? user.equipped.items.map(item => item.itemId) 
      : [];
    
    // 사용자의 인벤토리 아이템 정보 가공
    const inventoryItems = user.userItems.map(userItem => ({
      id: userItem.id,
      itemId: userItem.itemId,
      name: userItem.item.name,
      description: userItem.item.description,
      image: userItem.item.image,
      effect: userItem.item.effect,
      category: userItem.item.category,
      isEquipped: equippedItemIds.includes(userItem.itemId),
      purchaseDate: userItem.purchasedAt
    }));
    
    return NextResponse.json(inventoryItems);
    
  } catch (error) {
    console.error("Inventory fetch error:", error);
    return NextResponse.json({ error: "인벤토리 정보를 불러오는 중 오류가 발생했습니다." }, { status: 500 });
  }
}
