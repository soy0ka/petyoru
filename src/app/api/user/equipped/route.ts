import prisma from "@/lib/prisma";
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../auth/[...nextauth]/route';

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

    // 착용 중인 아이템이 없는 경우
    if (!user.equipped || !user.equipped.items.length) {
      return NextResponse.json([]);
    }
    
    // 착용 중인 아이템 ID 목록
    const equippedItemIds = user.equipped.items.map(item => item.itemId);
    
    // 착용 중인 아이템 상세 정보 가져오기
    const equippedItems = await prisma.shopItem.findMany({
      where: {
        id: {
          in: equippedItemIds
        }
      },
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        effect: true,
        category: true,
        positionX: true,
        positionY: true,
        scale: true,
        zIndex: true
      }
    });
    
    return NextResponse.json(equippedItems);
    
  } catch (error) {
    console.error("Error fetching equipped items:", error);
    return NextResponse.json({ error: "착용 아이템 정보를 불러오는 중 오류가 발생했습니다." }, { status: 500 });
  }
}
