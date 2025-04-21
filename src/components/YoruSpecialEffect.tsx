import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface YoruSpecialEffectProps {
  intensity?: "low" | "medium" | "high" | "none";
}

export default function YoruSpecialEffect({ intensity = "medium" }: YoruSpecialEffectProps) {
  // 화면 크기 상태 관리
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1000,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  // 이펙트 표시 여부 상태
  const [showEffects, setShowEffects] = useState(true);

  // 크기 변경 감지
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // 3초 후에 이펙트 숨기기
  useEffect(() => {
    if (intensity !== "none") {
      const timer = setTimeout(() => {
        setShowEffects(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [intensity]);
  
  // 강도에 따라 파티클 개수 조정
  const particleCount = useMemo(() => {
    switch(intensity) {
      case "low": return 10;
      case "medium": return 20;
      case "high": return 30;
      case "none": return 0;
      default: return 0;
    }
  }, [intensity]);

  // 파티클 초기 위치 미리 계산
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }).map(() => ({
      id: Math.random(),
      x: Math.random() * windowSize.width,
      y: -30 - Math.random() * 50, // 화면 위에서 시작
      scale: 0.5 + Math.random() * 1.5,
      duration: 5 + Math.random() * 10,
      delay: Math.random() * 5,
      type: Math.random() > 0.7 ? 'star' : 'sparkle'
    }));
  }, [particleCount, windowSize]);

  // 토스트 메시지 표시 상태
  const [showToast, setShowToast] = useState(true);
  
  // 5초 후 토스트 메시지 숨기기
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowToast(false);
    }, 3000); // 3초 후 숨기도록 변경
    
    return () => clearTimeout(timer);
  }, []);

  // 효과가 없거나 표시 시간이 지난 경우 아무것도 렌더링하지 않음
  if (intensity === "none" || !showEffects) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-pink-200/10 to-purple-300/10 animate-pulse" />
      
      {/* 환영 메시지 */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: -50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -30 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="absolute top-[120px] left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-white/90 backdrop-blur-md shadow-lg rounded-xl px-5 py-2 border-2 border-pink-400">
              <div className="flex items-center gap-3">
                <Star className="text-yellow-500 animate-spin" />
                <span className="text-xl font-bold text-pink-600">꺄악! 진짜 요루님이다!</span>
                <Star className="text-yellow-500 animate-spin" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 별 파티클 */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{ 
            x: particle.x,
            y: particle.y,
            scale: particle.scale,
            opacity: 0
          }}
          animate={{ 
            y: windowSize.height + 50,
            opacity: [0, 1, 1, 0],
            rotate: Math.random() * 360
          }}
          transition={{ 
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay
          }}
          style={{ position: 'absolute', left: particle.x, top: particle.y }}
        >
          {particle.type === 'star' ? (
            <Star size={16 + Math.random() * 12} className="text-yellow-400" />
          ) : (
            <Sparkles size={16 + Math.random() * 24} className="text-pink-400" />
          )}
        </motion.div>
      ))}
    </div>
  );
}
