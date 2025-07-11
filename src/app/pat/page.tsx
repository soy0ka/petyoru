"use client";

import AnimatedNumber from "@/components/AnimatedNumber";
import axios from "axios";
import { ChevronLeft, HandHeart, Trophy } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

// 착용 아이템 인터페이스 추가
interface EquippedItem {
  id: string;
  name: string;
  category: string;
  image: string;
  positionX: number;
  positionY: number;
  scale: number;
  zIndex: number;
}

export default function PatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [patCount, setPatCount] = useState(0);
  const [isPatting, setIsPatting] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoadingCount, setIsLoadingCount] = useState(true);
  const [showHeartEffect, setShowHeartEffect] = useState(false);
  const [userData, setUserData] = useState<{ patCount: number; rank?: number } | null>(null);
  // 착용 아이템 상태 추가
  const [equippedItems, setEquippedItems] = useState<{
    [key: string]: EquippedItem
  }>({});

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated") {
      fetchPatCount();
      fetchUserData();
      fetchEquippedItems(); // 착용 아이템 정보 가져오기
    }
  }, [status, router]);

  const fetchPatCount = async () => {
    setIsLoadingCount(true);
    try {
      const response = await axios.get("/api/pats");
      setPatCount(response.data.totalPatCount);
    } catch (error) {
      console.error("Error fetching pat count:", error);
    } finally {
      setIsLoadingCount(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await axios.get("/api/user");
      setUserData(response.data);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  // 착용 아이템 정보를 가져오는 함수
  const fetchEquippedItems = useCallback(async () => {
    try {
      const response = await axios.get('/api/user/equipped');
      
      const items = response.data;
      const equipped: { [key: string]: EquippedItem } = {};
      
      items.forEach((item: EquippedItem) => {
        equipped[item.category] = item;
      });
      
      setEquippedItems(equipped);
    } catch (error) {
      console.error("Failed to fetch equipped items:", error);
    }
  }, []);

  const handlePat = async () => {
    if (!session || isPatting) {
      setMessage(isPatting ? "쓰다듬는 중이에요!" : "로그인 후 쓰다듬을 수 있어요!");
      return;
    }

    setIsPatting(true);
    setMessage("요루를 쓰다듬었어요! ✨");
    setShowHeartEffect(true);

    try {
      const response = await axios.post("/api/pats");
      setPatCount(response.data.totalPatCount);
      
      // 쓰다듬기 후 사용자 데이터 업데이트 (포인트 증가 및 랭킹 정보 갱신)
      fetchUserData();

      setTimeout(() => {
        setShowHeartEffect(false);
      }, 3000);

      setTimeout(() => {
        setIsPatting(false);
        setMessage("");
      }, 1500);
    } catch (error) {
      console.error("Error updating pat count:", error);
      setIsPatting(false);
      setShowHeartEffect(false);
      setMessage("오류가 발생했어요. 다시 시도해주세요.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 relative">
      {/* 배경 아이템 적용 */}
      {equippedItems.background && (
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <Image 
            src={equippedItems.background.image}
            alt={equippedItems.background.name}
            fill
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-white/90"></div>
        </div>
      )}

      <div className="container mx-auto px-4 py-10 relative">
        <Link href="/" className="flex items-center text-purple-600 mb-6">
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span>아틀리에로 돌아가기</span>
        </Link>

        <div className="max-w-md mx-auto bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg">
          <h1 className="text-2xl font-bold text-center text-purple-800 mb-4">요루 쓰다듬기</h1>

          <div className="flex justify-center gap-4 mb-6">
            <div className="bg-white/90 backdrop-blur-md rounded-lg px-4 py-2 shadow-md">
              <div className="flex items-center">
                <HandHeart className="w-5 h-5 text-purple-600 mr-2" />
                <span className="font-bold text-purple-800">{userData?.patCount || 0}</span>
                <span className="text-gray-600 ml-1">쓰담쓰담</span>
              </div>
            </div>

            {userData?.rank && (
              <div className="bg-white/90 backdrop-blur-md rounded-lg px-4 py-2 shadow-md">
                <div className="flex items-center">
                  <Trophy className="w-5 h-5 text-amber-500 mr-2" />
                  <span className="font-bold text-purple-800">{userData.rank}등</span>
                </div>
              </div>
            )}
          </div>

          <div className="w-72 h-72 relative mb-8 mx-auto">
            <div
              className={`w-full h-full bg-white/90 backdrop-blur-md rounded-full shadow-lg overflow-hidden 
              flex items-center justify-center transition-all duration-300
              ${isPatting ? 'cursor-not-allowed opacity-90' : 'cursor-pointer hover:shadow-xl hover:bg-white/95'}`}
              onClick={handlePat}
            >
              <div className="relative w-64 h-64">
                <div className="absolute inset-0 bg-gradient-to-b" />

                <div className="absolute inset-0 flex items-center justify-center rounded-full">
                  <div className="w-60 h-60 bg-transparent rounded-full 
                                flex items-center justify-center overflow-hidden">
                    <Image 
                      src={equippedItems.background ? equippedItems.background.image : "/yoru.png"}
                      alt="Yoru"
                      width={200}
                      height={200}
                      className={`transition-all duration-300
                        ${isPatting ? 'scale-105 animate-pulse' : 'hover:scale-102'}`}
                    />
                  </div>
                </div>

                {/* 모든 착용 아이템을 위치에 따라 렌더링 */}
                {Object.values(equippedItems).map((item) => {
                  if (!item || item.category === 'background') return null;
                  
                  return (
                    <div 
                      key={item.id}
                      className="absolute"
                      style={{
                        left: `${item.positionX}%`,
                        top: `${item.positionY}%`,
                        transform: `translate(-50%, -50%) scale(${item.scale})`,
                        zIndex: item.zIndex,
                      }}
                    >
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={200}
                        height={200}
                        className="object-contain"
                      />
                    </div>
                  );
                })}

                {isPatting && showHeartEffect && (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-56 h-56 animate-ping opacity-10 bg-pink-300 rounded-full" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-60 h-60 animate-pulse opacity-20 bg-purple-200 rounded-full" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                      <div className="heart-particles">
                        <span>💖</span>
                        <span>💖</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-full text-center">
              <p className="text-sm text-purple-600/90 transition-opacity duration-300">
                {isPatting ? '쓰다듬는 중...' : '클릭해서 쓰다듬기'}
              </p>
            </div>
          </div>

          <div className="text-center mb-6">
            <p className={`text-2xl font-bold bg-clip-text text-transparent 
              bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300
              ${isPatting ? 'scale-110' : ''}`}>
              <span>
                총{" "}
                <AnimatedNumber
                  value={patCount}
                  className="inline-block"
                  isLoading={isLoadingCount}
                />
                번 쓰다듬었어요!
              </span>
            </p>
            {message && (
              <p className="mt-2 text-lg text-green-600 animate-bounce font-medium">
                {message}
              </p>
            )}
          </div>

          <div className="text-sm text-gray-600 bg-white/50 rounded-lg p-3">
            <p className="mb-2">💖 요루를 쓰다듬으면 요루가 행복해합니다.</p>
            <p>✨ 매일 요루를 쓰다듬어 명예의 전당에 도전해보세요!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
