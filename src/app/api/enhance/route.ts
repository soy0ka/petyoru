// app/api/enhance/route.ts
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

/* ────────────────────────────────────────────────────────── *
 * 타입 정의
 * ────────────────────────────────────────────────────────── */
interface EnhanceResponse {
  success: boolean;
  result: "success" | "fail" | "decrease" | "destroy";
  level: number;
  exp: number;
  failCount: number;
  successRate: number;
  decreaseRate?: number;
  destroyRate?: number;
  message?: string;
}

/* ────────────────────────────────────────────────────────── *
 * 보조 유틸
 * ────────────────────────────────────────────────────────── */
const clamp = (v: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, v));

function calculateEnhanceRates(level: number, fail: number) {
  /* 1) 기본 성공 확률: 계수를 20 → 10 으로 줄여 완만화 */
  const base = 100 - 6 * Math.log(level + 1);      // ln(level+1)
  const successRate = clamp(Math.round(base + fail * 2), 10, 95);
  // ↳ fail 1회당 +2 %p, 최대 95 %

  /* 2) 남은 확률을 파괴·하락에 배분 (비율은 그대로) */
  const remain = 100 - successRate;
  const destroyRate =
    level < 15 ? 0 : clamp(Math.round(remain * 0.3), 0, 20);
  const decreaseRate =
    level < 10 ? 0 : clamp(remain - destroyRate, 0, 90);

  return { successRate, decreaseRate, destroyRate };
}
/* ────────────────────────────────────────────────────────── *
 * GET : 현재 강화 정보 조회
 * ────────────────────────────────────────────────────────── */
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { yoruEnhance: true },
    });
    if (!user)
      return NextResponse.json({ message: "User not found" }, { status: 404 });

    // 강화 정보가 없으면 새로 생성
    if (!user.yoruEnhance) {
      const created = await prisma.yoruEnhance.create({
        data: { userId: user.id, level: 1, exp: 0, failCount: 0 },
      });
      const rates = calculateEnhanceRates(created.level, created.failCount);
      return NextResponse.json({ ...created, ...rates });
    }

    const rates = calculateEnhanceRates(
      user.yoruEnhance.level,
      user.yoruEnhance.failCount,
    );
    return NextResponse.json({ ...user.yoruEnhance, ...rates });
  } catch (err) {
    console.error("GET /enhance error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

/* ────────────────────────────────────────────────────────── *
 * POST : 강화 시도
 * ────────────────────────────────────────────────────────── */
export async function POST(): Promise<NextResponse<EnhanceResponse>> {
  try {
    /* 0. 세션 · 유저 확인 */
    const session = await getServerSession();
    if (!session?.user?.email)
      return NextResponse.json(
        {
          success: false,
          result: "fail",
          level: 0,
          exp: 0,
          failCount: 0,
          successRate: 0,
          message: "Unauthorized",
        },
        { status: 401 },
      );

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { yoruEnhance: true },
    });
    if (!user)
      return NextResponse.json(
        {
          success: false,
          result: "fail",
          level: 0,
          exp: 0,
          failCount: 0,
          successRate: 0,
          message: "User not found",
        },
        { status: 404 },
      );

    /* 1. 최초 강화 데이터 생성 */
    if (!user.yoruEnhance) {
      const yoru = await prisma.yoruEnhance.create({
        data: { userId: user.id, level: 1, exp: 0, failCount: 0 },
      });

      // 첫 강화는 무조건 성공 → 레벨 2
      const upgraded = await prisma.yoruEnhance.update({
        where: { id: yoru.id },
        data: { level: 2, exp: 0, failCount: 0 },
      });
      const rates = calculateEnhanceRates(upgraded.level, 0);

      return NextResponse.json({
        success: true,
        result: "success",
        level: upgraded.level,
        exp: upgraded.exp,
        failCount: upgraded.failCount,
        successRate: rates.successRate,
        decreaseRate: rates.decreaseRate,
        destroyRate: rates.destroyRate,
        message: "첫 강화 성공! 레벨 2 달성!",
      });
    }

    /* 2. 현재 스탯 */
    let { level, exp, failCount } = user.yoruEnhance;
    const { successRate, decreaseRate, destroyRate } = calculateEnhanceRates(
      level,
      failCount,
    );

    /* 3. 강화 결과 결정 */
    const rand = Math.random() * 100;
    let result: EnhanceResponse["result"] = "fail";
    let message = "";

    if (rand < successRate) {
      // ── 성공 ───────────────────────────────
      const needXp = level * 100; // 현 레벨업까지 필요 XP
      exp += needXp - exp; // 잔여 XP 전액 지급 → 레벨업 확정
      level += 1;
      exp = 0; // 레벨업 후 XP 0
      failCount = 0;
      result = "success";
      message = `강화 성공! 레벨 ${level} 달성!`;
    } else if (rand < successRate + decreaseRate) {
      // ── 레벨 하락 ──────────────────────────
      level = Math.max(1, level - 1);
      exp = 0;
      failCount += 1;
      result = "decrease";
      message = "강화 실패! 레벨이 하락했습니다.";
    } else if (rand < successRate + decreaseRate + destroyRate) {
      // ── 파괴 ──────────────────────────────
      level = 1;
      exp = 0;
      failCount = 0;
      result = "destroy";
      message = "강화 대실패! 레벨 1로 초기화되었습니다.";
    } else {
      // ── 일반 실패 ──────────────────────────
      failCount += 1;
      result = "fail";
      message = "강화 실패! 레벨은 유지됩니다.";
    }

    /* 4. DB 업데이트 */
    const updated = await prisma.yoruEnhance.update({
      where: { id: user.yoruEnhance.id },
      data: { level, exp, failCount },
    });
    const newRates = calculateEnhanceRates(level, failCount);

    /* 5. 응답 */
    return NextResponse.json({
      success: result === "success",
      result,
      level: updated.level,
      exp: updated.exp,
      failCount: updated.failCount,
      successRate: newRates.successRate,
      decreaseRate: newRates.decreaseRate,
      destroyRate: newRates.destroyRate,
      message,
    });
  } catch (err) {
    console.error("POST /enhance error:", err);
    return NextResponse.json(
      {
        success: false,
        result: "fail",
        level: 0,
        exp: 0,
        failCount: 0,
        successRate: 0,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}
