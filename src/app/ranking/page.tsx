"use client";

import AnimatedNumber from "@/components/AnimatedNumber";
import { RankingUser } from "@/types/ranking";
import axios from "axios";
import { Award, ChevronLeft, Medal, RefreshCw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function RankingPage() {
  const [rankings, setRankings] = useState<RankingUser[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // 랭킹 초기 로드
  const fetchRankings = async () => {
    try {
      const response = await axios.get("/api/ranking");
      setRankings(response.data.users as RankingUser[]);
    } catch (error) {
      console.error("Error fetching rankings:", error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  // 새로고침용 함수
  const refreshRankings = async () => {
    setIsRefreshing(true);
    try {
      const response = await axios.get("/api/ranking");
      setRankings(response.data.users as RankingUser[]);
    } catch (error) {
      console.error("Error refreshing rankings:", error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  // 초기 로드
  useEffect(() => {
    fetchRankings();
  }, []);

  const handleRefresh = () => {
    refreshRankings();
  };

  const getMedalColor = (index: number) => {
    switch (index) {
      case 0:
        return "text-yellow-400"; // 금메달
      case 1:
        return "text-gray-400"; // 은메달
      case 2:
        return "text-amber-600"; // 동메달
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100">
      <div className="container mx-auto px-4 py-10">
        <Link href="/" className="flex items-center text-purple-600 mb-6">
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span>아틀리에로 돌아가기</span>
        </Link>

        <div className="max-w-lg mx-auto">
          {/* 헤더 */}
          <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-full">
                  <Award className="w-8 h-8 text-purple-600" />
                </div>
                <h1 className="text-2xl font-bold text-purple-800">
                  명예의 전당
                </h1>
              </div>
              <button
                onClick={handleRefresh}
                className={`p-2 text-purple-600 hover:text-purple-800 transition-all
                  ${isRefreshing ? 'animate-spin' : ''}`}
                disabled={isRefreshing || isInitialLoading}
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mt-3">
              요루를 가장 많이 쓰다듬은 헌신적인 분들입니다
            </p>
          </div>

          {/* 탑 3 특별 표시 */}
          {!isInitialLoading && rankings.length > 0 && (
            <div className="flex justify-center gap-6 my-8">
              {rankings.slice(0, 3).map((user, index) => {
                const sizes = [
                  { size: 120, top: 'top-0', rank: 1 }, 
                  { size: 100, top: 'top-4', rank: 2 }, 
                  { size: 90, top: 'top-8', rank: 3 }
                ];
                const { size, top, rank } = sizes[index];
                
                return (
                  <div key={index} className={`relative ${top}`}>
                    <div className="flex flex-col items-center">
                        <div className={`relative ${getMedalColor(index)}`}>
                        <Medal className="w-10 h-10 mb-1" strokeWidth={1.5} />
                        <span className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-sm font-bold text-white drop-shadow-md">
                          {rank}
                        </span>
                        </div>
                      
                      <div className="relative w-full aspect-square mb-2">
                        {user.image ? (
                          <div className={`w-${size/4} h-${size/4} relative mx-auto overflow-hidden rounded-full border-4 ${
                            index === 0 ? 'border-yellow-400' : 
                            index === 1 ? 'border-gray-300' : 
                            'border-amber-600'
                          }`}>
                            <Image
                              src={user.image}
                              alt={user.name || "User"}
                              width={size}
                              height={size}
                              className="rounded-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className={`w-${size/4} h-${size/4} bg-gray-300 rounded-full mx-auto`} />
                        )}
                      </div>
                      
                      <div className="text-center">
                        <p className="font-semibold text-gray-800 truncate max-w-[100px]">{user.name}</p>
                        <p className="text-pink-600 font-bold">
                          <AnimatedNumber value={user.patCount} /> 번
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 랭킹 리스트 */}
          <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 shadow-lg">
            <h2 className="text-xl font-semibold text-purple-800 mb-4 px-2">전체 순위</h2>
            <div className="space-y-3">
              {isInitialLoading ? (
                // 스켈레톤 UI
                Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="flex items-center justify-between p-3 bg-white/60 rounded-lg animate-pulse"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-200 rounded-full" />
                      <div className="w-32 h-6 bg-purple-200 rounded" />
                    </div>
                    <div className="w-16 h-6 bg-pink-200 rounded" />
                  </div>
                ))
              ) : (
                rankings.map((user, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white/60 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-8 flex items-center justify-center">
                        <span className={`text-lg font-bold ${
                          index < 3 ? 'text-purple-800 relative z-10' : 'text-purple-600'
                        }`}>
                          {index + 1}
                        </span>
                      </div>
                      {user.image && (
                        <Image
                          src={user.image}
                          alt={`${user.name}'s profile picture`}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      )}
                      <span className="font-medium text-gray-700 truncate max-w-[150px]">
                        {user.name}
                      </span>
                    </div>
                    <span className="text-pink-600 font-bold">
                      <AnimatedNumber value={user.patCount} /> 번
                    </span>
                  </div>
                ))
              )}
              
              {!isInitialLoading && rankings.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  아직 기록이 없습니다
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
