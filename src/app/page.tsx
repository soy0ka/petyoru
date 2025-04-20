// src/app/page.tsx
"use client";

import { RankingUser } from "@/types/ranking";
import axios from "axios";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Home() {
  const { data: session } = useSession();
  const [patCount, setPatCount] = useState(0);
  const [isPatting, setIsPatting] = useState(false);
  const [message, setMessage] = useState("");
  const [rankings, setRankings] = useState<RankingUser[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (session) {
      // 로그인 됐을 때 사용자의 쓰다듬기 횟수 불러오기
      fetchPatCount();
    }
  }, [session]);

  const fetchRankings = async () => {
    try {
      const response = await axios.get("/api/ranking");
      setRankings(response.data.users as RankingUser[]);
    } catch (error) {
      console.error("Error fetching rankings:", error);
    }
  };

  useEffect(() => {
    // 랭킹 데이터 초기 로드만 수행
    fetchRankings();
  }, []);

  const fetchPatCount = async () => {
    try {
      const response = await axios.get("/api/pats");
      setPatCount(response.data.count);
    } catch (error) {
      console.error("Error fetching pat count:", error);
    }
  };

  const handlePat = async () => {
    if (!session || isPatting) {
      setMessage(isPatting ? "쓰다듬는 중이에요!" : "로그인 후 쓰다듬을 수 있어요!");
      return;
    }

    setIsPatting(true);
    setMessage("요루를 쓰다듬었어요! ✨");

    try {
      const response = await axios.post("/api/pats");
      setPatCount(response.data.count);
      fetchRankings(); // 쓰다듬기 후에만 랭킹 업데이트

      setTimeout(() => {
        setIsPatting(false);
        setMessage("");
      }, 1500); // 애니메이션 시간 증가
    } catch (error) {
      console.error("Error updating pat count:", error);
      setIsPatting(false);
      setMessage("오류가 발생했어요. 다시 시도해주세요.");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchRankings();
    setTimeout(() => setIsRefreshing(false), 1000); // 애니메이션을 위한 지연
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100">
      <main className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-purple-800 mb-4">
            요루 쓰다듬기
          </h1>
          <p className="text-lg text-gray-700">
            요루를 쓰다듬고 기록을 남겨보세요!
          </p>
        </div>

        {/* 로그인 상태 표시 및 버튼 */}
        <div className="mb-8 text-center">
            {session ? (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-3 mb-4">
              {session.user?.image && (
                <Image
                src={session.user.image}
                alt="Profile"
                width={40}
                height={40}
                className="rounded-full border-2 border-purple-400"
                />
              )}
              <p className="text-gray-700">
                안녕하세요, <span className="font-bold">{session.user?.name}</span>님!
              </p>
              </div>
              <button
              onClick={() => signOut()}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
              >
              로그아웃
              </button>
            </div>
            ) : (
            <button
              onClick={() => signIn("discord")}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg flex items-center hover:bg-indigo-700 transition"
            >
              <svg
                className="w-6 h-6 mr-2"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.39-.444.885-.608 1.283a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.283.077.077 0 0 0-.079-.036c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.202 13.202 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z" />
              </svg>
              Discord로 로그인
            </button>
          )}
        </div>

        {/* 요루 쓰다듬기 영역 */}
        <div className="w-72 h-72 relative mb-8">
          <div
            className={`w-full h-full bg-white/90 backdrop-blur-md rounded-full shadow-lg overflow-hidden 
            flex items-center justify-center transition-all duration-300
            ${isPatting ? 'cursor-not-allowed opacity-90' : 'cursor-pointer hover:shadow-xl hover:bg-white/95'}`}
            onClick={handlePat}
          >
            <div className="relative w-64 h-64">
              {/* 배경 효과 */}
              <div className="absolute inset-0 bg-gradient-to-b" />
              
              {/* 요루 이미지 컨테이너 */}
              <div className="absolute inset-0 flex items-center justify-center rounded-full">
                <div className="w-60 h-60 bg-transparent rounded-full 
                              flex items-center justify-center overflow-hidden">
                  <Image 
                    src="/yoru.png"
                    alt="Yoru"
                    width={200}
                    height={200}
                    className={`transition-all duration-300 transfor
                      ${isPatting ? 'scale-105 animate-pulse' : 'hover:scale-102'}`}
                  />
                </div>
              </div>

              {/* 쓰다듬기 효과 */}
              {isPatting && (
                <>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-56 h-56 animate-ping opacity-10 bg-pink-300 rounded-full" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-60 h-60 animate-pulse opacity-20 bg-purple-200 rounded-full" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="heart-particles">
                      <span>💖</span>
                      <span>💖</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* 쓰다듬기 안내 텍스트 */}
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-full text-center">
            <p className={`text-sm text-purple-600/90 transition-opacity duration-300
              ${!session && !isPatting && 'animate-bounce'}`}>
              {isPatting ? '쓰다듬는 중...' : 
              session ? '클릭해서 쓰다듬기' : '로그인하고 쓰다듬어보세요!'}
            </p>
          </div>
        </div>

        {/* 쓰다듬기 카운터 */}
        <div className="text-center mb-6">
          <p className={`text-2xl font-bold bg-clip-text text-transparent 
            bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300
            ${isPatting ? 'scale-110' : ''}`}>
            {session
              ? `총 ${patCount}번 쓰다듬었어요!`
              : "로그인하여 쓰다듬기 기록을 확인하세요"}
          </p>
          {message && (
            <p className="mt-2 text-lg text-green-600 animate-bounce font-medium">
              {message}
            </p>
          )}
        </div>

        {/* 명예의 전당 */}
        <div className="w-full max-w-md mt-12 bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-purple-800">
              명예의 전당 👑
            </h2>
            <button
              onClick={handleRefresh}
              className={`p-2 text-purple-600 hover:text-purple-800 transition-all
                ${isRefreshing ? 'animate-spin' : ''}`}
              disabled={isRefreshing}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
            </button>
          </div>
          <div className="space-y-4">
            {rankings.map((user, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white/60 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-purple-600 w-8">
                    {index + 1}
                  </span>
                  {user.image && (
                    <Image
                      src={user.image}
                      alt={user.name || "User"}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  )}
                  <span className="font-medium text-gray-700">{user.name}</span>
                </div>
                <span className="text-pink-600 font-bold">
                  {user.patCount}번
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-gray-500">
        <p>요루 쓰다듬기 © 2025</p>
      </footer>
    </div>
  );
}
