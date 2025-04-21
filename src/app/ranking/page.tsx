"use client";

import AnimatedNumber from "@/components/AnimatedNumber";
import axios from "axios";
import { ChevronLeft, Crown, Medal, Trophy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface RankingUser {
  id: string;
  name: string;
  image: string;
  totalPatCount: number;
}

export default function RankingPage() {
  const [users, setUsers] = useState<RankingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRanking();
  }, []);

  const fetchRanking = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/ranking");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching ranking:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Top 3 사용자를 위한 특별한 아이콘 선택
  const getRankIcon = (index: number) => {
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
          
          <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-purple-700 mb-6 text-center">
              요루를 가장 많이 쓰다듬은 분들
            </h2>
            
            <div className="space-y-4">
              {users.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  아직 랭킹 정보가 없습니다.
                </div>
              ) : (
                users.map((user, index) => (
                  <div 
                    key={user.id} 
                    className={`flex items-center p-4 rounded-lg ${
                      index < 3 ? 'bg-gradient-to-r from-purple-50 to-pink-50' : 'bg-white/50'
                    }`}
                  >
                    <div className="mr-4">{getRankIcon(index)}</div>
                    
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
                        총 <AnimatedNumber 
                            value={user.totalPatCount} 
                            duration={0.8 + index * 0.1} 
                            isLoading={isLoading}
                            className={`font-semibold text-purple-700 ${index < 3 ? 'text-base' : ''}`}
                          /> 번 쓰다듬음
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
