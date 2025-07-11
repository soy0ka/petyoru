"use client";

import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ChevronDown, ChevronLeft, ChevronUp, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import useSound from "use-sound";

interface EnhanceData {
  level: number;
  exp: number;
  failCount: number;
  successRate: number;
  decreaseRate?: number;
  destroyRate?: number;
}

type EnhanceResult = 'success' | 'fail' | 'decrease' | 'destroy' | null;

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

export default function EnhancePage() {
  const { status } = useSession();
  const router = useRouter();
  const [enhanceData, setEnhanceData] = useState<EnhanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceResult, setEnhanceResult] = useState<EnhanceResult>(null);
  const [resultMessage, setResultMessage] = useState("");
  const [hammerAnimation, setHammerAnimation] = useState(false);
  const [showEffect, setShowEffect] = useState(false);
  const [showProbabilities, setShowProbabilities] = useState(false);

  // 착용 아이템 상태 추가
  const [equippedItems, setEquippedItems] = useState<{
    [key: string]: EquippedItem
  }>({});
  
  // 효과음 추가
  const [playSuccess] = useSound('/sounds/success.mp3', { volume: 1 });
  const [playFail] = useSound('/sounds/fail.mp3', { volume: 1 });
  const [playBreak] = useSound('/sounds/broken.mp3', { volume: 1 });
  const [playLevelDown] = useSound('/sounds/fail.mp3', { volume: 1 });
  
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated") {
      fetchEnhanceData();
      fetchEquippedItems(); // 착용 아이템 정보 가져오기
    }
  }, [status, router]);
  
  const fetchEnhanceData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/enhance");
      setEnhanceData(response.data);
    } catch (error) {
      console.error("Error fetching enhance data:", error);
    } finally {
      setIsLoading(false);
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
  
  const handleEnhance = async () => {
    if (isEnhancing || !enhanceData) return;
    
    setIsEnhancing(true);
    setEnhanceResult(null);
    setResultMessage("");
    setShowEffect(false);

    // 망치 애니메이션 시작
    setHammerAnimation(true);
    
    try {
      const response = await axios.post("/api/enhance");
      
      // 애니메이션 효과를 위한 타이밍
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 망치 애니메이션 종료
      setHammerAnimation(false);
      
      const { result, message } = response.data;
      setEnhanceResult(result);
      setResultMessage(message || "");
      setShowEffect(true);
      
      // 결과에 따른 효과음 재생
      switch (result) {
        case 'success':
          playSuccess();
          break;
        case 'fail':
          playFail();
          break;
        case 'decrease':
          playLevelDown();
          break;
        case 'destroy':
          playBreak();
          break;
      }
      
      // 3초 후에 효과 숨기기
      setTimeout(() => {
        setShowEffect(false);
      }, 3000);
      
      setEnhanceData(response.data);
    } catch (error) {
      console.error("Error enhancing:", error);
      setResultMessage("오류가 발생했습니다. 다시 시도해주세요.");
      playFail();
      setHammerAnimation(false);
    } finally {
      setTimeout(() => {
        setIsEnhancing(false);
      }, 500);
    }
  };

  // 진행 상태 표시 바 계산
  const calculateExpPercentage = () => {
    if (!enhanceData) return 0;
    const { level, exp } = enhanceData;
    const requiredExp = level * 100;
    return (exp / requiredExp) * 100;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="animate-pulse">강화 데이터를 불러오는 중...</div>
      </div>
    );
  }
  
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
      
      <div className="container mx-auto px-4 py-10">
        <Link href="/" className="flex items-center text-purple-600 mb-6">
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span>메인으로 돌아가기</span>
        </Link>
        
        <div className="max-w-md mx-auto bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg">
          <h1 className="text-2xl font-bold text-center text-purple-800">요루 강화하기</h1>
          
          {/* 요루 상태 표시 - 레이아웃 개선 */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-64 h-64 mb-8">
              {/* 모루 먼저 배치 */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-48 h-24 z-10">
                <Image 
                  src="/anvil.png"
                  alt="Anvil"
                  width={192}
                  height={96}
                  className="object-contain"
                />
              </div>
              
              {/* 요루를 모루 중앙에 배치 */}
              <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-32 h-32 z-20">
                <div className="absolute inset-0 rounded-full bg-gradient-to-b from-pink-200 to-purple-200 opacity-40"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image 
                    src={equippedItems.background ? equippedItems.background.image : "/yoru.png"}
                    alt="Yoru"
                    width={120}
                    height={120}
                    className={`
                      transition-all duration-300 rounded-full
                      ${isEnhancing ? 'animate-pulse scale-105' : ''}
                      ${enhanceResult === 'success' ? 'scale-110' : ''}
                      ${enhanceResult === 'fail' ? 'scale-95' : ''}
                      ${enhanceResult === 'decrease' ? 'scale-90 translate-y-1' : ''}
                      ${enhanceResult === 'destroy' ? 'opacity-30 scale-75' : ''}
                    `}
                  />
                  
                  {/* 모든 착용 아이템을 위치에 따라 렌더링 */}
                  {Object.values(equippedItems).map((item) => {
                    if (!item || item.category === 'background') return null;
                    
                    return (
                      <div 
                        key={item.id}
                        className="absolute z-10"
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
                          width={120}
                          height={120}
                          className="object-contain"
                        />
                      </div>
                    );
                  })}
                  
                  {isEnhancing && (
                    <motion.div 
                      animate={hammerAnimation ? 
                        { x: [-2, 2, -2, 0], y: [-2, 2, -2, 0] } : 
                        { x: 0, y: 0 }
                      }
                      transition={{ 
                        duration: 0.2, 
                        repeat: hammerAnimation ? Infinity : 0,
                      }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="absolute w-full h-full animate-spin-slow rounded-full border-4 border-transparent border-t-purple-500 border-r-pink-400 opacity-30"></div>
                      <div className="absolute w-11/12 h-11/12 animate-spin-slow rounded-full border-4 border-transparent border-t-pink-300 border-r-purple-300 opacity-20" style={{ animationDuration: '3s' }}></div>
                    </motion.div>
                  )}
                  
                  {/* 강화 효과 */}
                  <AnimatePresence>
                    {enhanceResult === 'success' && showEffect && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.2 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <div className="relative w-full h-full">
                          <Sparkles className="absolute text-yellow-400 w-10 h-10 top-0 left-1/4 animate-bounce" />
                          <Sparkles className="absolute text-purple-400 w-8 h-8 bottom-10 right-5 animate-pulse" />
                          <Sparkles className="absolute text-pink-400 w-12 h-12 bottom-0 left-10 animate-ping" />
                        </div>
                      </motion.div>
                    )}
                    
                    {/* 실패 효과 */}
                    {(enhanceResult === 'fail' || enhanceResult === 'decrease') && showEffect && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <div className="relative w-full h-full flex items-center justify-center">
                          <motion.div 
                            initial={{ opacity: 0.8 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 1 }}
                            className={`absolute inset-0 rounded-full ${
                              enhanceResult === 'decrease' ? 'bg-orange-400' : 'bg-red-400'
                            }`}
                          ></motion.div>
                          <motion.div 
                            animate={{ scale: [1, 1.2, 0.9, 1] }}
                            transition={{ duration: 0.5 }}
                            className="text-4xl"
                          >
                            {enhanceResult === 'decrease' ? '⬇️' : '💔'}
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                    
                    {/* 파괴 효과 */}
                    {enhanceResult === 'destroy' && showEffect && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <div className="relative w-full h-full flex items-center justify-center">
                          <motion.div 
                            initial={{ opacity: 0.8 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 1.5 }}
                            className="absolute inset-0 bg-red-600 rounded-full"
                          ></motion.div>
                          <motion.div
                            initial={{ scale: 1 }}
                            animate={{ scale: [1, 1.5, 0.7] }}
                            transition={{ duration: 0.8 }}
                          >
                            <motion.div 
                              animate={{ 
                                rotateZ: [0, 20, -20, 10, -10, 0],
                                opacity: [1, 0.8, 0.6, 0.4, 0.2, 0] 
                              }}
                              transition={{ duration: 1.2 }}
                              className="text-5xl"
                            >
                              💥
                            </motion.div>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              {/* 해머 애니메이션 */}
              {isEnhancing && (
                <motion.div
                  initial={{ rotate: 0, y: 0, x: 0 }}
                  animate={hammerAnimation ? {
                    rotate: [0, -40, 0],
                    y: [0, 15, 0],
                    x: [0, -15, 0]
                  } : 
                    { rotate: 0, y: 0, x: 0 }
                  }
                  transition={{ 
                    duration: 0.5, 
                    repeat: hammerAnimation ? 2 : 0,
                    repeatType: "loop"
                  }}
                  className="absolute top-0 right-5 z-30"
                >
                  <Image 
                    src="/mace.webp"
                    alt="Hammer"
                    width={80}
                    height={80}
                    className="object-contain transform origin-bottom"
                  />
                </motion.div>
              )}
            </div>
            
            {/* 레벨 정보 */}
            <div className="text-center mb-4 mt-16">
              <div className="text-2xl font-bold text-purple-700">
                Lv. {enhanceData?.level || 1}
              </div>
              
              {/* 경험치 바 추가 */}
              <div className="w-full bg-gray-200 h-2 rounded-full mt-2 mb-1">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${calculateExpPercentage()}%` }}
                ></div>
              </div>
              
              <div className="text-sm text-gray-600 flex justify-between items-center">
                <span>경험치:</span>
                <span>{enhanceData?.exp || 0} / {(enhanceData?.level || 1) * 100}</span>
              </div>
            </div>
            
            {/* 강화 확률 정보 */}
            <div 
              className="w-full bg-white/60 rounded-lg p-3 mb-4 cursor-pointer"
              onClick={() => setShowProbabilities(!showProbabilities)}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">강화 확률 정보</span>
                {showProbabilities ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </div>
              
              {showProbabilities && (
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-green-600">성공 확률:</span>
                    <span className="font-semibold text-green-600">{enhanceData?.successRate || 90}%</span>
                  </div>
                  
                  {(enhanceData?.decreaseRate ?? 0) > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-orange-500">레벨 하락 확률:</span>
                      <span className="font-semibold text-orange-500">{enhanceData?.decreaseRate || 0}%</span>
                    </div>
                  )}
                  
                  {(enhanceData?.destroyRate ?? 0) > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-red-600">파괴 확률:</span>
                      <span className="font-semibold text-red-600">{enhanceData?.destroyRate || 0}%</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">단순 실패 확률:</span>
                    <span className="font-semibold text-gray-500">
                      {100 - (enhanceData?.successRate || 90) - (enhanceData?.decreaseRate || 0) - (enhanceData?.destroyRate || 0)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-gray-700">연속 실패:</span>
                    <span className="font-semibold text-purple-700">{enhanceData?.failCount || 0}회</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* 결과 메시지 */}
            {resultMessage && (
              <div className={`mb-4 text-center p-3 rounded-lg ${
                enhanceResult === 'success' ? 'bg-green-100 text-green-700' : 
                enhanceResult === 'fail' ? 'bg-red-100 text-red-700' : 
                enhanceResult === 'decrease' ? 'bg-orange-100 text-orange-700' :
                enhanceResult === 'destroy' ? 'bg-red-100 text-red-700 font-bold' :
                'bg-gray-100 text-gray-700'
              }`}>
                {resultMessage}
              </div>
            )}
            
            {enhanceData && enhanceData.level >= 10 && (
              <div className="flex items-center text-amber-600 mb-4 text-sm">
                <AlertTriangle className="w-5 h-5 mr-1 flex-shrink-0" />
                <span>
                  {enhanceData.level >= 15 
                    ? "높은 레벨에서는 강화 실패 시 레벨 하락이나 파괴될 수 있습니다!"
                    : "10레벨 이상부터는 실패 시 레벨이 하락할 수 있습니다!"}
                </span>
              </div>
            )}
            
            {/* 강화 버튼 */}
            <button
              onClick={handleEnhance}
              disabled={isEnhancing}
              className={`
                w-full py-3 px-6 rounded-lg text-white font-semibold 
                transition duration-300
                ${isEnhancing ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg'}
              `}
            >
              {isEnhancing ? '강화 중...' : '요루 강화하기'}
            </button>
          </div>
          
          {/* 강화 설명 */}
          <div className="text-sm text-gray-600 bg-white/50 rounded-lg p-3">
            <p className="mb-2">💫 요루를 강화하면 특별한 효과가 발생합니다.</p>
            <p className="mb-2">✨ 레벨업 시 다양한 보상과 특별한 요루의 모습을 볼 수 있어요!</p>
            <p className="text-red-500 text-xs">⚠️ 주의: 강화는 실패할 수도 있으며, 높은 레벨에서는 하락이나 파괴 위험이 있습니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
