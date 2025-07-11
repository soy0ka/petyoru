import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // rihayoru 유저만 접근 가능
    if (session.user.name !== "rihayoru") {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }

    // 모든 사용자 가져오기
    const users = await prisma.user.findMany({
      where: {
        accounts: {
          some: {
            provider: "discord"
          }
        }
      },
      include: {
        accounts: {
          where: {
            provider: "discord"
          }
        }
      }
    });

    let updatedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const user of users) {
      try {
        const discordAccount = user.accounts[0];
        if (!discordAccount?.access_token) {
          continue;
        }

        // Discord API에서 사용자 정보 가져오기
        const discordResponse = await fetch("https://discord.com/api/users/@me", {
          headers: {
            Authorization: `Bearer ${discordAccount.access_token}`,
          },
        });

        if (!discordResponse.ok) {
          errors.push(`User ${user.name}: Discord API error`);
          errorCount++;
          continue;
        }

        const discordUser = await discordResponse.json();
        
        // 프로필 사진 URL 생성
        const avatarUrl = discordUser.avatar
          ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=512`
          : `https://cdn.discordapp.com/embed/avatars/${discordUser.discriminator % 5}.png`;

        // 사용자 정보 업데이트
        await prisma.user.update({
          where: { id: user.id },
          data: {
            name: discordUser.global_name || discordUser.username,
            image: avatarUrl,
          },
        });

        updatedCount++;
      } catch (error) {
        console.error(`Error updating user ${user.name}:`, error);
        errors.push(`User ${user.name}: ${error}`);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `프로필 동기화 완료`,
      updatedCount,
      errorCount,
      totalUsers: users.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error("Error syncing all profiles:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}
