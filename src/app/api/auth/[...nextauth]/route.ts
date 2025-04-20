/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/auth/[...nextauth]/route.ts 파일 수정
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

const prisma = new PrismaClient();

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID || "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
      authorization: { params: { scope: "identify email" } },
    }),
  ],
  callbacks: {
    session: async ({ session, user }: any) => {
      session.user.id = user.id;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  
  // App Router에서는 pages 지정 방식이 다릅니다
  // 상대 경로 대신 절대 경로를 사용해야 합니다
  pages: {
    signIn: "/",
    error: "/" // 에러 페이지를 메인 페이지로 리다이렉트
  },
});

export { handler as GET, handler as POST };
