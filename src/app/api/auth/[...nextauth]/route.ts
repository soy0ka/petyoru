/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import NextAuth, { DefaultSession } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

// 세션 타입 확장
declare module "next-auth" {
  interface Session {
    user?: {
      id: string;
    } & DefaultSession["user"]
  }
}

const prisma = new PrismaClient();

// ...existing code...

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID || "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
      authorization: { params: { scope: "identify email" } },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }: { token: any; user: any; account: any }) {
      if (account && user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/",
    error: "/"
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
