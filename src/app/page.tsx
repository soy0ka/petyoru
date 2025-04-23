"use client";

import YoruSpecialEffect from "@/components/YoruSpecialEffect";
import axios from "axios";
import { Anvil, Award, Backpack, Heart, Lock, ShoppingBag, Star } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

// 착용 아이템 인터페이스
interface EquippedItem {
  id: string;
  name: string;
  category: string;
  image: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [isRealYoru, setIsRealYoru] = useState(false);
  const [showSpecialEffect, setShowSpecialEffect] = useState(false);
  const [, setIsLoading] = useState(false);
  const [equippedItems, setEquippedItems] = useState<{
    accessory?: EquippedItem,
    background?: EquippedItem
  }>({});

  // 특별한 요루 계정 확인
  useEffect(() => {
    if (session?.user?.name === "rihayoru") {
      setIsRealYoru(true);
      setTimeout(() => {
        setShowSpecialEffect(true);
      }, 500);
    } else {
      setIsRealYoru(false);
      setShowSpecialEffect(false);
    }
  }, [session]);

  // 착용 아이템 정보를 가져오는 함수 - useCallback으로 래핑
  const fetchEquippedItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/user/equipped');
      
      const items = response.data;
      const equipped: { accessory?: EquippedItem, background?: EquippedItem } = {};
      
      items.forEach((item: EquippedItem) => {
        if (item.category === 'accessory') {
          equipped.accessory = item;
        } else if (item.category === 'background') {
          equipped.background = item;
        }
      });
      
      setEquippedItems(equipped);
    } catch (error) {
      console.error("Failed to fetch equipped items:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 로그인 상태일 때 착용한 아이템 정보 가져오기
  useEffect(() => {
    if (status === "authenticated") {
      fetchEquippedItems();
    }
  }, [status, fetchEquippedItems]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 relative overflow-hidden">
      {/* 배경 이미지 표시 */}
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

      {/* 특별 효과 - 진짜 요루 */}
      {showSpecialEffect && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <YoruSpecialEffect intensity="none" />
        </div>
      )}

      <main className="container mx-auto px-4 py-16 relative">
        {/* 헤더 섹션 */}
        <div className="flex flex-col items-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-purple-800 mb-2 text-center">
            요루의 아틀리에
          </h1>
          <p className="text-lg text-gray-700 text-center max-w-md">
            요루와 함께하는 특별한 공간에 오신 것을 환영합니다
          </p>
        </div>

        {/* 로그인 상태 */}
        <div className="mb-12 flex flex-col items-center">
          {session ? (
            <div className={`flex flex-col items-center bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg 
                          ${isRealYoru ? 'ring-4 ring-pink-400' : ''}`}>
              <div className="flex items-center gap-4 mb-4">
                {session.user?.image && (
                  <div className="relative">
                    <Image
                      src={session.user.image}
                      alt="Profile"
                      width={60}
                      height={60}
                      className={`rounded-full border-2 ${isRealYoru ? 'border-pink-500' : 'border-purple-400'}`}
                    />
                    {isRealYoru && (
                      <div className="absolute -top-2 -right-2">
                        <div className="relative">
                          <div className="absolute inset-0 animate-ping bg-yellow-400 rounded-full p-2"></div>
                          <div className="relative bg-yellow-300 rounded-full p-1">
                            <Star className="w-4 h-4 text-yellow-600" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <h2 className={`text-xl font-bold ${isRealYoru ? 'text-pink-600' : 'text-gray-800'}`}>
                    안녕하세요, {session.user?.name}님!
                    {isRealYoru && <span className="ml-2">✨</span>}
                  </h2>
                  <p className="text-gray-600">
                    {isRealYoru 
                      ? "사랑스러운 우리 요루 세상에서 가장 소중한 너 오늘도 잘하고 있어!" 
                      : "요루의 아틀리에에 오신 것을 환영합니다"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg">
              <div className="mb-4 text-center">
                <h2 className="text-xl font-bold text-gray-800 mb-2">로그인이 필요해요</h2>
                <p className="text-gray-600">요루와 더 많은 활동을 하려면 로그인해주세요</p>
              </div>
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
            </div>
          )}
        </div>

        {/* 요루 이미지 */}
        <div className="flex justify-center mb-12">
          <div className="relative w-64 h-64 md:w-80 md:h-80">
            <div className={`absolute inset-0 rounded-full bg-gradient-to-b 
              ${isRealYoru 
                ? 'from-pink-300/70 to-purple-300/70 animate-pulse' 
                : 'from-pink-200/60 to-purple-200/60'} blur-md`}>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              {/* 요루 이미지 - 배경 착용 아이템이 있으면 해당 이미지로 변경 */}
              <Image
                src={equippedItems.background ? equippedItems.background.image : "/yoru.png"}
                alt="Yoru"
                width={280}
                height={280}
                className={`rounded-full shadow-lg transition-all duration-300 
                  ${isRealYoru ? 'scale-105' : ''}`}
              />
              
              {/* 요루에게 액세서리 착용 */}
              {equippedItems.accessory && (
                <div className="absolute inset-0 z-10">
                  <Image
                    src={equippedItems.accessory.image}
                    alt={equippedItems.accessory.name}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              
              {isRealYoru && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute w-full h-full animate-spin-slow rounded-full border-4 border-transparent border-t-pink-400 border-r-purple-400 opacity-20"></div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 활동 메뉴 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
          {/* 쓰다듬기 */}
          <div className="relative">
            <Link href={session ? "/pat" : "#"} className="block">
              <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg hover:shadow-xl transition group">
                <div className="flex items-start mb-4 gap-4">
                  <div className="bg-pink-100 p-3 rounded-lg">
                    <Heart className="w-8 h-8 text-pink-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-purple-800 mb-2 group-hover:text-pink-600 transition-colors">요루 쓰다듬기</h3>
                    <p className="text-gray-600">요루를 쓰다듬으며 함께 행복한 시간을 보내세요</p>
                  </div>
                </div>
                <div className="bg-pink-50/80 rounded-lg p-3 mt-2">
                  <p className="text-sm text-pink-700">💕 지금까지 많은 사람들이 요루를 쓰다듬었어요!</p>
                </div>
              </div>
            </Link>
            {!session && (
              <div className="absolute inset-0 bg-gray-500/30 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-xl">
                <Lock className="w-10 h-10 text-white mb-2" />
                <p className="text-white font-medium bg-gray-700/70 px-4 py-1 rounded-lg">로그인 필요</p>
              </div>
            )}
          </div>
          
          {/* 강화하기 */}
          <div className="relative">
            <Link href={session ? "/enhance" : "#"} className="block">
              <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg hover:shadow-xl transition group">
                <div className="flex items-start mb-4 gap-4">
                  <div className="bg-amber-100 p-3 rounded-lg">
                    <Anvil className="w-8 h-8 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-purple-800 mb-2 group-hover:text-amber-600 transition-colors">요루 강화하기</h3>
                    <p className="text-gray-600">요루를 강화하여 더 특별한 능력을 깨워보세요</p>
                  </div>
                </div>
                <div className="bg-amber-50/80 rounded-lg p-3 mt-2">
                  <p className="text-sm text-amber-700">✨ 강화를 통해 요루의 새로운 모습을 발견해보세요!</p>
                </div>
              </div>
            </Link>
            {!session && (
              <div className="absolute inset-0 bg-gray-500/30 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-xl">
                <Lock className="w-10 h-10 text-white mb-2" />
                <p className="text-white font-medium bg-gray-700/70 px-4 py-1 rounded-lg">로그인 필요</p>
              </div>
            )}
          </div>
          
          {/* 상점 추가 */}
          <div className="relative">
            <Link href={session ? "/shop" : "#"} className="block">
              <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg hover:shadow-xl transition group">
                <div className="flex items-start mb-4 gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <ShoppingBag className="w-8 h-8 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-purple-800 mb-2 group-hover:text-blue-600 transition-colors">요루 상점</h3>
                    <p className="text-gray-600">쓰다듬기로 모은 포인트로 특별한 아이템을 구매하세요</p>
                  </div>
                </div>
                <div className="bg-blue-50/80 rounded-lg p-3 mt-2">
                  <p className="text-sm text-blue-700">🛍️ 당신의 쓰다듬으로 요루에게 선물을 줄 수 있어요!</p>
                </div>
              </div>
            </Link>
            {!session && (
              <div className="absolute inset-0 bg-gray-500/30 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-xl">
                <Lock className="w-10 h-10 text-white mb-2" />
                <p className="text-white font-medium bg-gray-700/70 px-4 py-1 rounded-lg">로그인 필요</p>
              </div>
            )}
          </div>

          {/* 인벤토리 링크 추가 */}
          <div className="relative">
            <Link href={session ? "/inventory" : "#"} className="block">
              <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg hover:shadow-xl transition group">
                <div className="flex items-start mb-4 gap-4">
                  <div className="bg-indigo-100 p-3 rounded-lg">
                    <Backpack className="w-8 h-8 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-purple-800 mb-2 group-hover:text-indigo-600 transition-colors">요루 인벤토리</h3>
                    <p className="text-gray-600">구매한 아이템과 수집품을 확인하세요</p>
                  </div>
                </div>
                <div className="bg-indigo-50/80 rounded-lg p-3 mt-2">
                  <p className="text-sm text-indigo-700">🎒 인벤토리에서 요루의 특별한 아이템을 관리하세요!</p>
                </div>
              </div>
            </Link>
            {!session && (
              <div className="absolute inset-0 bg-gray-500/30 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-xl">
                <Lock className="w-10 h-10 text-white mb-2" />
                <p className="text-white font-medium bg-gray-700/70 px-4 py-1 rounded-lg">로그인 필요</p>
              </div>
            )}
          </div>
        </div>
        
        {/* 명예의 전당 */}
        <div className="max-w-4xl mx-auto">
          <Link href="/ranking" className="block">
            <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg hover:shadow-xl transition group">
              <div className="flex items-start mb-4 gap-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Award className="w-8 h-8 text-purple-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-purple-800 mb-2 group-hover:text-purple-600 transition-colors">명예의 전당</h3>
                  <p className="text-gray-600">요루를 가장 많이 쓰다듬은 헌신적인 분들을 만나보세요</p>
                </div>
              </div>
              <div className="bg-purple-50/80 rounded-lg p-3 mt-2">
                <p className="text-sm text-purple-700">👑 당신도 명예의 전당에 오를 수 있어요!</p>
              </div>
            </div>
          </Link>
        </div>
      </main>

      <footer className="py-6 text-center text-gray-500 relative">
        <p>요루의 아틀리에 © 2025</p>
      </footer>
    </div>
  );
}
