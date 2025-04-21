"use client";

import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ChevronLeft, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSound from "use-sound";

interface EnhanceData {
  level: number;
  exp: number;
  failCount: number;
  successRate: number;
}

export default function EnhancePage() {
  const { status } = useSession();
  const router = useRouter();
  const [enhanceData, setEnhanceData] = useState<EnhanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceResult, setEnhanceResult] = useState<'success' | 'fail' | null>(null);
  const [resultMessage, setResultMessage] = useState("");
  const [hammerAnimation, setHammerAnimation] = useState(false);
  
  // 효과음 추가
  const [playSuccess] = useSound('/sounds/success.mp3', { volume: 0.5 });
  const [playFail] = useSound('/sounds/fail.mp3', { volume: 0.5 });
  const [playEnhance] = useSound('/sounds/enhance.mp3', { volume: 0.4 });
  
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated") {
      fetchEnhanceData();
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
  
  const handleEnhance = async () => {
    if (isEnhancing || !enhanceData) return;
    
    setIsEnhancing(true);
    setEnhanceResult(null);
    setResultMessage("");
    
    // 강화 시작 효과음 재생
    playEnhance();
    
    // 망치 애니메이션 시작
    setHammerAnimation(true);
    
    try {
      const response = await axios.post("/api/enhance");
      
      // 애니메이션 효과를 위한 타이밍
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 망치 애니메이션 종료
      setHammerAnimation(false);
      
      if (response.data.success) {
        setEnhanceResult("success");
        setResultMessage(`강화 성공! 요루가 레벨 ${response.data.level}로 강화되었습니다!`);
        // 성공 효과음 재생
        playSuccess();
      } else {
        setEnhanceResult("fail");
        setResultMessage("강화 실패... 하지만 요루는 괜찮아요!");
        // 실패 효과음 재생
        playFail();
      }
      
      setEnhanceData(response.data);
    } catch (error) {
      console.error("Error enhancing:", error);
      setResultMessage("오류가 발생했습니다. 다시 시도해주세요.");
      // 실패 효과음 재생
      playFail();
      setHammerAnimation(false);
    } finally {
      setTimeout(() => {
        setIsEnhancing(false);
      }, 500);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="animate-pulse">강화 데이터를 불러오는 중...</div>
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
                    src="/yoru.png"
                    alt="Yoru"
                    width={120}
                    height={120}
                    className={`
                      transition-all duration-300 rounded-full
                      ${isEnhancing ? 'animate-pulse scale-105' : ''}
                      ${enhanceResult === 'success' ? 'scale-110' : ''}
                      ${enhanceResult === 'fail' ? 'scale-95' : ''}
                    `}
                  />
                  
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
                    {enhanceResult === 'success' && (
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
                    {enhanceResult === 'fail' && (
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
                            className="absolute inset-0 bg-red-400 rounded-full"
                          ></motion.div>
                          <motion.div 
                            animate={{ scale: [1, 1.2, 0.9, 1] }}
                            transition={{ duration: 0.5 }}
                            className="text-4xl"
                          >
                            💔
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              {/* 해머 애니메이션 - 위에서 좌측으로 기울이는 애니메이션으로 수정 */}
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
              
              {/* 강화 시 모루에서 나오는 불꽃 효과 */}
            </div>
            
            {/* 레벨 정보 */}
            <div className="text-center mb-4 mt-16">
              <div className="text-2xl font-bold text-purple-700">
                Lv. {enhanceData?.level || 1}
              </div>
              <div className="text-sm text-gray-600">
                경험치: {enhanceData?.exp || 0} / {(enhanceData?.level || 1) * 100}
              </div>
            </div>
            
            {/* 강화 정보 */}
            <div className="w-full bg-white/60 rounded-lg p-3 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">현재 강화 확률:</span>
                <span className="font-semibold text-purple-700">{enhanceData?.successRate || 90}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">실패 횟수:</span>
                <span className="font-semibold text-purple-700">{enhanceData?.failCount || 0}회</span>
              </div>
            </div>
            
            {/* 결과 메시지 */}
            {resultMessage && (
              <div className={`mb-4 text-center p-3 rounded-lg ${
                enhanceResult === 'success' ? 'bg-green-100 text-green-700' : 
                enhanceResult === 'fail' ? 'bg-red-100 text-red-700' : 
                'bg-gray-100 text-gray-700'
              }`}>
                {resultMessage}
              </div>
            )}
            
            {enhanceData && enhanceData.level >= 10 && (
              <div className="flex items-center text-amber-600 mb-4">
                <AlertTriangle className="w-5 h-5 mr-1" />
                <span className="text-sm">레벨이 높아질수록 강화 확률이 낮아집니다!</span>
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
            <p>❤️ 강화 레벨이 높을수록 더 멋진 효과를 볼 수 있어요!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
