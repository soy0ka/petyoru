import prisma from "@/lib/prisma";
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // DB에서 상품 정보 조회
    const dbItems = await prisma.shopItem.findMany();
    
    // DB에 상품이 없으면 기본 상품 정보 생성
    if (dbItems.length === 0) {
      const defaultItems = [
        {
          name: "귀여운 모자",
          description: "요루에게 씌워줄 수 있는 귀여운 모자",
          price: 50,
          image: "/items/hat.png",
          effect: "요루가 모자를 쓰고 더 귀여워집니다",
          category: "accessory",
          reusable: false // 중복 구매 불가능
        },
        {
          name: "반짝이는 목걸이",
          description: "요루의 목에 걸어줄 수 있는 반짝이는 목걸이",
          price: 100,
          image: "/items/necklace.png",
          effect: "요루의 특별 효과가 더 화려해집니다",
          category: "accessory",
          reusable: false // 중복 구매 불가능
        },
        {
          name: "고급 사료",
          description: "최고급 영양소가 들어간 특별한 사료",
          price: 30,
          image: "/items/food.png",
          effect: "요루의 체력이 회복됩니다",
          category: "food",
          reusable: true // 중복 구매 가능
        },
        {
          name: "특별한 배경",
          description: "요루가 있는 공간의 배경을 변경합니다",
          price: 200,
          image: "/items/background.png",
          effect: "메인 화면의 배경이 변경됩니다",
          category: "background",
          reusable: false // 중복 구매 불가능
        },
        {
          name: "강화의 축복",
          description: "요루 강화 확률을 일시적으로 높여줍니다",
          price: 150,
          image: "/items/blessing.png",
          effect: "다음 강화 시도 시 성공 확률 +10%",
          category: "buff",
          reusable: true // 중복 구매 가능
        },
      ];
      
      // 기본 상품 데이터 일괄 생성
      await prisma.shopItem.createMany({
        data: defaultItems,
      });
      
      // 생성된 상품 조회
      return NextResponse.json(await prisma.shopItem.findMany());
    }
    
    return NextResponse.json(dbItems);
  } catch (error) {
    console.error("Shop data fetch error:", error);
    return NextResponse.json({ error: "상점 데이터를 불러오는 중 오류가 발생했습니다." }, { status: 500 });
  }
}
