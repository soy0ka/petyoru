import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 사용자의 디스코드 계정 정보 가져오기
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: "discord"
      }
    });

    if (!account?.providerAccountId) {
      return NextResponse.json(
        { error: "디스코드 계정 연결이 필요합니다." },
        { status: 400 }
      );
    }

    const discordId = account.providerAccountId;
    
    try {
      // Discord 공개 API 호출 (토큰 불필요)
      const discordResponse = await fetch(`https://discord.com/api/users/${discordId}`, {
        headers: {
          'Authorization': `Bot ${process.env.DISCORD_TOKEN}`,
        }
      });
      
      if (!discordResponse.ok) {
        throw new Error(`Discord API 오류: ${discordResponse.status}`);
      }
      
      const discordUser = await discordResponse.json();
      console.log("Discord 사용자 정보:", discordUser);
      
      // 아바타 URL 생성
      let avatarUrl;
      if (discordUser.avatar) {
        const extension = discordUser.avatar.startsWith('a_') ? 'gif' : 'png';
        avatarUrl = `https://cdn.discordapp.com/avatars/${discordId}/${discordUser.avatar}.${extension}?size=512`;
        console.log("생성된 아바타 URL:", avatarUrl);
      } else {
        // 기본 아바타 사용
        const defaultAvatarNum = (parseInt(discordId) >> 22) % 6;
        avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNum}.png`;
        console.log("기본 아바타 URL:", avatarUrl);
      }
      
      console.log("업데이트할 데이터:", {
        image: avatarUrl,
        name: discordUser.global_name || discordUser.username || session.user.name,
      });
      
      // 데이터베이스에서 사용자 정보 업데이트
      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: {
          image: avatarUrl,
          name: discordUser.global_name || discordUser.username || session.user.name,
        },
      });

      console.log("업데이트된 사용자 정보:", updatedUser);

      return NextResponse.json({
        success: true,
        message: "프로필이 성공적으로 동기화되었습니다.",
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          image: updatedUser.image,
        },
        debug: {
          originalAvatar: discordUser.avatar,
          generatedUrl: avatarUrl,
          discordName: discordUser.global_name || discordUser.username,
        }
      });
      
    } catch (discordError) {
      console.error("Discord API 오류:", discordError);
      
      // Discord API 실패시 캐시 버스터만 추가
      let fallbackUrl = session.user.image;
      if (fallbackUrl && fallbackUrl.includes('cdn.discordapp.com')) {
        fallbackUrl = fallbackUrl.split('?')[0] + `?v=${Date.now()}`;
      } else {
        const defaultAvatarNum = (parseInt(discordId) >> 22) % 6;
        fallbackUrl = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNum}.png?v=${Date.now()}`;
      }
      
      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: { image: fallbackUrl },
      });

      return NextResponse.json({
        success: true,
        message: "프로필 사진이 새로고침되었습니다.",
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          image: updatedUser.image,
        },
      });
    }

  } catch (error) {
    console.error("프로필 업데이트 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
