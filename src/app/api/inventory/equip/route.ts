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
    const { itemId, equip } = body; // equip: true(착용), false(해제)
    
    if (!itemId) {
      return NextResponse.json({ error: "아이템 ID가 필요합니다." }, { status: 400 });
    }

    // 사용자 정보 가져오기
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { 
        userItems: true,
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
    
    // 사용자가 해당 아이템을 보유하고 있는지 확인
    const hasItem = user.userItems.some(item => item.itemId === itemId);
    if (!hasItem) {
      return NextResponse.json({ error: "보유하지 않은 아이템입니다." }, { status: 400 });
    }

    // 아이템 정보 가져오기 (카테고리 체크를 위해)
    const shopItem = await prisma.shopItem.findUnique({
      where: { id: itemId }
    });

    if (!shopItem) {
      return NextResponse.json({ error: "존재하지 않는 아이템입니다." }, { status: 404 });
    }
    
    // 현재 착용 중인 아이템 ID 배열 가져오기
    const equippedItems = user.equipped ? 
      user.equipped.items.map(item => item.itemId) : [];
    
    // 해당 아이템이 이미 착용 중인지 확인
    const isAlreadyEquipped = equippedItems.includes(itemId);
    
    if (equip) {
      // 이미 착용 중인 경우 아무것도 하지 않음
      if (isAlreadyEquipped) {
        return NextResponse.json({
          success: true,
          message: "이미 착용 중인 아이템입니다.",
          equippedItems
        });
      }
      
      // 같은 카테고리의 아이템들 가져오기 (배경, 액세서리 등 카테고리별 중복 착용 방지)
      const itemsInSameCategory = await prisma.shopItem.findMany({
        where: { 
          id: { in: equippedItems },
          category: shopItem.category
        }
      });
      
      // 착용 정보 업데이트
      if (!user.equipped) {
        // 착용 정보가 없을 경우 새로 생성
        await prisma.equipped.create({
          data: {
            userId: user.id,
            items: {
              create: [
                { itemId: itemId }
              ]
            }
          }
        });
        
        return NextResponse.json({
          success: true,
          message: "아이템을 착용했습니다.",
          equippedItems: [itemId]
        });
      } else {
        // 같은 카테고리의 이전 아이템 해제 (배경, 액세서리 등)
        if (itemsInSameCategory.length > 0 && 
          (shopItem.category === "accessory" || shopItem.category === "background")) {
          // 같은 카테고리의 아이템 삭제
          await prisma.equippedItem.deleteMany({
            where: {
              equippedId: user.equipped.id,
              itemId: {
                in: itemsInSameCategory.map(item => item.id)
              }
            }
          });
        }
        
        // 새 아이템 착용
        await prisma.equippedItem.create({
          data: {
            equippedId: user.equipped.id,
            itemId: itemId
          }
        });
        
        // 업데이트된 착용 아이템 목록 가져오기
        const updatedEquipped = await prisma.equipped.findUnique({
          where: { id: user.equipped.id },
          include: { items: true }
        });
        
        return NextResponse.json({
          success: true,
          message: "아이템을 착용했습니다.",
          equippedItems: updatedEquipped ? updatedEquipped.items.map(item => item.itemId) : []
        });
      }
    } else {
      // 착용 해제
      if (!isAlreadyEquipped) {
        return NextResponse.json({
          success: true,
          message: "이미 착용 해제된 아이템입니다.",
          equippedItems
        });
      }
      
      if (user.equipped) {
        // 아이템 착용 해제
        await prisma.equippedItem.deleteMany({
          where: {
            equippedId: user.equipped.id,
            itemId: itemId
          }
        });
        
        // 업데이트된 착용 아이템 목록 가져오기
        const updatedEquipped = await prisma.equipped.findUnique({
          where: { id: user.equipped.id },
          include: { items: true }
        });
        
        return NextResponse.json({
          success: true,
          message: "아이템 착용을 해제했습니다.",
          equippedItems: updatedEquipped ? updatedEquipped.items.map(item => item.itemId) : []
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "변경 사항이 없습니다.",
      equippedItems
    });
    
  } catch (error) {
    console.error("Equipment toggle error:", error);
    return NextResponse.json({ error: "아이템 착용/해제 중 오류가 발생했습니다." }, { status: 500 });
  }
}
