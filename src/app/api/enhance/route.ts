import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

interface EnhanceResponse {
  success: boolean;
  result: 'success' | 'fail' | 'decrease' | 'destroy';
  level: number;
  exp: number;
  failCount: number;
  successRate: number;
  message?: string;
}

// 강화 확률 계산 함수
function calculateEnhanceRates(level: number, failCount: number): {
  successRate: number;
  decreaseRate: number;
  destroyRate: number;
} {
  // 기본 확률
  let baseSuccessRate = 90;  // 기본 성공 확률
  
  // 레벨에 따른 성공 확률 감소 (레벨이 높을수록 더 빠르게 감소)
  if (level < 10) {
    baseSuccessRate -= level * 2;  // 1~9레벨: 레벨당 2% 감소
  } else if (level < 20) {
    baseSuccessRate = 70 - (level - 10) * 3;  // 10~19레벨: 레벨당 3% 감소
  } else if (level < 30) {
    baseSuccessRate = 40 - (level - 20) * 2;  // 20~29레벨: 레벨당 2% 감소
  } else {
    baseSuccessRate = 20;  // 30레벨 이상: 고정 20%
  }
  
  // 실패 횟수에 따른 보정 (실패할수록 약간 확률 증가)
  const successRate = Math.min(95, baseSuccessRate + failCount);
  
  // 레벨에 따른 하락 확률 (10레벨부터 적용)
  let decreaseRate = 0;
  if (level >= 10 && level < 20) {
    decreaseRate = 10;  // 10~19레벨: 10% 하락 확률
  } else if (level >= 20) {
    decreaseRate = 20;  // 20레벨 이상: 20% 하락 확률
  }
  
  // 레벨에 따른 파괴 확률 (15레벨부터 적용)
  let destroyRate = 0;
  if (level >= 15 && level < 25) {
    destroyRate = 5;  // 15~24레벨: 5% 파괴 확률
  } else if (level >= 25) {
    destroyRate = 10;  // 25레벨 이상: 10% 파괴 확률
  }
  
  return { successRate, decreaseRate, destroyRate };
}

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    // 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { yoruEnhance: true }
    });
    
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    
    // 강화 데이터가 없는 경우 생성
    if (!user.yoruEnhance) {
      const newEnhance = await prisma.yoruEnhance.create({
        data: {
          userId: user.id,
          level: 1,
          exp: 0,
          failCount: 0,
          successRate: 90
        }
      });
      
      return NextResponse.json({
        level: newEnhance.level,
        exp: newEnhance.exp,
        failCount: newEnhance.failCount,
        successRate: newEnhance.successRate
      });
    }
    
    // 현재 확률 계산
    const { successRate, decreaseRate, destroyRate } = calculateEnhanceRates(
      user.yoruEnhance.level,
      user.yoruEnhance.failCount
    );
    
    // 응답에 하락 및 파괴 확률 포함
    return NextResponse.json({
      level: user.yoruEnhance.level,
      exp: user.yoruEnhance.exp,
      failCount: user.yoruEnhance.failCount,
      successRate,
      decreaseRate,
      destroyRate
    });
    
  } catch (error) {
    console.error("Error fetching enhance data:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(): Promise<NextResponse<EnhanceResponse>> {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { 
          success: false, 
          result: 'fail',
          level: 0, 
          exp: 0, 
          failCount: 0, 
          successRate: 0,
          message: "Unauthorized" 
        }, 
        { status: 401 }
      );
    }
    
    // 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { yoruEnhance: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          result: 'fail',
          level: 0, 
          exp: 0, 
          failCount: 0, 
          successRate: 0, 
          message: "User not found" 
        }, 
        { status: 404 }
      );
    }
    
    // 강화 데이터가 없는 경우 생성
    if (!user.yoruEnhance) {
      const newEnhance = await prisma.yoruEnhance.create({
        data: {
          userId: user.id,
          level: 1,
          exp: 0,
          failCount: 0,
          successRate: 90
        }
      });
      
      // 첫 번째 강화는 항상 성공
      const updatedEnhance = await prisma.yoruEnhance.update({
        where: { id: newEnhance.id },
        data: {
          level: 2,
          exp: 0,
          failCount: 0
        }
      });
      
      return NextResponse.json({
        success: true,
        result: 'success',
        level: updatedEnhance.level,
        exp: updatedEnhance.exp,
        failCount: updatedEnhance.failCount,
        successRate: 88, // 2레벨의 성공률
        message: "첫 강화 성공! 레벨이 올랐습니다."
      });
    }
    
    // 현재 레벨과 실패 횟수를 기준으로 확률 계산
    const { successRate, decreaseRate, destroyRate } = calculateEnhanceRates(
      user.yoruEnhance.level,
      user.yoruEnhance.failCount
    );
    
    // 강화 결과 확률 계산
    const randNum = Math.random() * 100; // 0-100 랜덤값
    
    // 강화 결과 판정
    let result: 'success' | 'fail' | 'decrease' | 'destroy';
    let newLevel = user.yoruEnhance.level;
    let newExp = user.yoruEnhance.exp;
    let newFailCount = user.yoruEnhance.failCount;
    let message = "";
    
    // 성공 구간 (0 ~ successRate)
    if (randNum < successRate) {
      // 경험치를 얻고 레벨업 확인
      newExp += Math.floor(25 + Math.random() * 25); // 25-50 랜덤 경험치
      
      // 레벨업 조건 확인
      if (newExp >= newLevel * 100) {
        newExp = 0;
        newLevel += 1;
        message = `강화 대성공! 레벨이 ${newLevel}로 올랐습니다!`;
      } else {
        message = "강화 성공! 경험치가 증가했습니다.";
      }
      
      // 성공 시 실패 카운트 초기화
      newFailCount = 0;
      result = 'success';
    }
    // 하락 구간 (successRate ~ successRate+decreaseRate)
    else if (randNum < successRate + decreaseRate) {
      newLevel = Math.max(1, newLevel - 1); // 최소 레벨 1
      newExp = 0;
      newFailCount += 1;
      message = "강화 실패! 요루의 레벨이 하락했습니다...";
      result = 'decrease';
    }
    // 파괴 구간 (successRate+decreaseRate ~ successRate+decreaseRate+destroyRate)
    else if (randNum < successRate + decreaseRate + destroyRate) {
      newLevel = 1; // 레벨 1로 초기화
      newExp = 0;
      newFailCount = 0; // 파괴 후 실패 카운트 초기화
      message = "강화 대실패! 요루가 파괴되어 레벨 1로 돌아갔습니다!";
      result = 'destroy';
    }
    // 일반 실패 구간 (나머지)
    else {
      newFailCount += 1;
      message = "강화 실패! 하지만 레벨은 유지됩니다.";
      result = 'fail';
    }
    
    // 업데이트된 강화 정보 저장
    const updatedEnhance = await prisma.yoruEnhance.update({
      where: { id: user.yoruEnhance.id },
      data: {
        level: newLevel,
        exp: newExp,
        failCount: newFailCount
      }
    });
    
    // 새로운 확률 계산 (UI 표시용)
    const newRates = calculateEnhanceRates(newLevel, newFailCount);
    
    return NextResponse.json({
      success: result === 'success',
      result,
      level: updatedEnhance.level,
      exp: updatedEnhance.exp,
      failCount: updatedEnhance.failCount,
      successRate: newRates.successRate,
      decreaseRate: newRates.decreaseRate,
      destroyRate: newRates.destroyRate,
      message
    });
    
  } catch (error) {
    console.error("Error enhancing:", error);
    return NextResponse.json(
      { 
        success: false,
        result: 'fail',
        level: 0,
        exp: 0,
        failCount: 0,
        successRate: 0,
        message: "Internal server error" 
      }, 
      { status: 500 }
    );
  }
}
