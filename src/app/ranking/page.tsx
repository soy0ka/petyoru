"use client";

import AnimatedNumber from "@/components/AnimatedNumber";
import axios from "axios";
import { Anvil, ChevronLeft, Crown, Medal, Star, Trophy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface PatRankingUser {
  id: string;
  name: string;
  image: string;
  totalPatCount: number;
}

interface EnhanceRankingUser {
  id: string;
  name: string;
  image: string;
  level: number;
  exp: number;
}

type RankingType = "pat" | "enhance";

export default function RankingPage() {
  const [patUsers, setPatUsers] = useState<PatRankingUser[]>([]);
  const [enhanceUsers, setEnhanceUsers] = useState<EnhanceRankingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<RankingType>("pat");

  useEffect(() => {
    fetchRanking();
  }, []);

  const fetchRanking = async () => {
    setIsLoading(true);
    try {
      const [patResponse, enhanceResponse] = await Promise.all([
        axios.get("/api/ranking?type=pat"),
        axios.get("/api/ranking?type=enhance"),
      ]);

      setPatUsers(patResponse.data);
      setEnhanceUsers(enhanceResponse.data);
    } catch (error) {
      console.error("Error fetching ranking:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPatRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-8 h-8 text-yellow-500" />;
      case 1:
        return <Medal className="w-8 h-8 text-gray-400" />;
      case 2:
        return <Medal className="w-8 h-8 text-amber-700" />;
      default:
        return <div className="w-8 h-8 flex items-center justify-center font-bold text-gray-500">{index + 1}</div>;
    }
  };

  const getEnhanceRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Anvil className="w-8 h-8 text-yellow-500" />;
      case 1:
        return <Anvil className="w-8 h-8 text-gray-400" />;
      case 2:
        return <Anvil className="w-8 h-8 text-amber-700" />;
      default:
        return <div className="w-8 h-8 flex items-center justify-center font-bold text-gray-500">{index + 1}</div>;
    }
  };

  const getLevelClass = (level: number) => {
    if (level >= 30) return "text-red-600 font-bold";
    if (level >= 20) return "text-amber-600 font-bold";
    if (level >= 10) return "text-purple-600 font-bold";
    return "text-blue-600";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="animate-pulse">랭킹 정보를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100">
      <div className="container mx-auto px-4 py-10">
        <Link href="/" className="flex items-center text-purple-600 mb-6">
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span>메인으로 돌아가기</span>
        </Link>

        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-8">
            <Trophy className="w-8 h-8 text-amber-500 mr-3" />
            <h1 className="text-3xl font-bold text-purple-800">요루 명예의 전당</h1>
          </div>

          <div className="flex mb-6">
            <button
              onClick={() => setActiveTab("pat")}
              className={`flex-1 py-3 px-4 rounded-t-lg flex items-center justify-center gap-2 transition font-medium
                ${activeTab === "pat" 
                  ? "bg-white/80 text-purple-700 border-b-2 border-purple-500" 
                  : "bg-white/50 text-gray-600 hover:bg-white/60"}`}
            >
              <Heart className="w-5 h-5" />
              쓰다듬기 랭킹
            </button>
            <button
              onClick={() => setActiveTab("enhance")}
              className={`flex-1 py-3 px-4 rounded-t-lg flex items-center justify-center gap-2 transition font-medium
                ${activeTab === "enhance" 
                  ? "bg-white/80 text-amber-700 border-b-2 border-amber-500" 
                  : "bg-white/50 text-gray-600 hover:bg-white/60"}`}
            >
              <Anvil className="w-5 h-5" />
              강화 랭킹
            </button>
          </div>

          {activeTab === "pat" && (
            <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-purple-700 mb-1 text-center">
                요루를 가장 많이 쓰다듬은 분들
              </h2>
              <p className="text-center text-gray-500 mb-4 text-sm">
                50번 이상 쓰다듬은 분들만 표시됩니다.
              </p>

              <div className="space-y-4">
                {patUsers.length === 0 ? (
                  <div className="text-center p-8 text-gray-500">
                    아직 랭킹 정보가 없습니다.
                  </div>
                ) : (
                  patUsers.map((user, index) => (
                    <div
                      key={user.id}
                      className={`flex items-center p-4 rounded-lg ${
                        index < 3 ? "bg-gradient-to-r from-purple-50 to-pink-50" : "bg-white/50"
                      }`}
                    >
                      <div className="mr-4">{getPatRankIcon(index)}</div>

                      <div className="flex-shrink-0 mr-4">
                        <Image
                          src={user.image || "/default-avatar.png"}
                          alt={user.name || "User"}
                          width={50}
                          height={50}
                          className="rounded-full"
                        />
                      </div>

                      <div className="flex-grow">
                        <p className="font-medium text-gray-800">{user.name || "Anonymous User"}</p>
                        <p className="text-sm text-gray-600">
                          총{" "}
                          <AnimatedNumber
                            value={user.totalPatCount}
                            duration={0.8 + index * 0.1}
                            isLoading={isLoading}
                            className={`font-semibold text-purple-700 ${index < 3 ? "text-base" : ""}`}
                          />{" "}
                          번 쓰다듬음
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "enhance" && (
            <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-amber-700 mb-1 text-center">
                요루를 가장 높이 강화한 분들
              </h2>
              <p className="text-center text-gray-500 mb-4 text-sm">
                레벨 2 이상을 달성한 분들만 표시됩니다.
              </p>

              <div className="space-y-4">
                {enhanceUsers.length === 0 ? (
                  <div className="text-center p-8 text-gray-500">
                    아직 랭킹 정보가 없습니다.
                  </div>
                ) : (
                  enhanceUsers.map((user, index) => (
                    <div
                      key={user.id}
                      className={`flex items-center p-4 rounded-lg ${
                        index < 3 ? "bg-gradient-to-r from-amber-50 to-orange-50" : "bg-white/50"
                      }`}
                    >
                      <div className="mr-4">{getEnhanceRankIcon(index)}</div>

                      <div className="flex-shrink-0 mr-4">
                        <Image
                          src={user.image || "/default-avatar.png"}
                          alt={user.name || "User"}
                          width={50}
                          height={50}
                          className="rounded-full"
                        />
                      </div>

                      <div className="flex-grow">
                        <p className="font-medium text-gray-800">{user.name || "Anonymous User"}</p>
                        <div className="flex items-center">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-600 mr-2">레벨</span>
                            <AnimatedNumber
                              value={user.level}
                              duration={0.8 + index * 0.1}
                              isLoading={isLoading}
                              className={`font-semibold ${getLevelClass(user.level)} ${index < 3 ? "text-base" : ""}`}
                            />
                          </div>

                          {/* <div className="flex ml-2">
                            {[...Array(Math.min(Math.floor(user.level / 100), 10))].map((_, i) => (
                              <Star key={i} className="w-4 h-4 text-yellow-500" />
                            ))}
                          </div> */}
                          <div className="flex ml-2 space-x-0.5">
                            {/* 금별: 100레벨 단위 */}
                            {[...Array(Math.floor(user.level / 100))].map((_, i) => (
                              <Star key={`gold-${i}`} className="text-yellow-500" />
                            ))}

                            {/* 은별: 50레벨 단위 (단, 이미 금별로 표현한 것 제외) */}
                            {[...Array(Math.floor((user.level % 100) / 50))].map((_, i) => (
                              <Star key={`silver-${i}`} className="text-gray-400" />
                            ))}

                            {/* 동별: 10레벨 단위 (단, 이미 금+은별로 표현한 것 제외) */}
                            {[...Array(Math.floor((user.level % 50) / 10))].map((_, i) => (
                              <Star key={`bronze-${i}`} className="text-amber-700" />
                            ))}
                          </div>

                          {/* <div className="ml-auto text-xs text-gray-500">
                            EXP: {user.exp}/{user.level * 100}
                          </div> */}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Heart({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  );
}
