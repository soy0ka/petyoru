'use client';
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ChevronLeft, HandHeart, RefreshCw, ShoppingBag, Tag } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSound from "use-sound";

// 아이템 타입 정의
interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  effect: string;
  category: string;
  reusable: boolean; // 중복 구매 가능 여부
}

// 사용자 데이터 타입 정의
interface UserData {
  patCount: number;
  inventory: string[]; // 구매한 아이템 ID 목록
}

export default function ShopPage() {
  const { status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [purchaseStatus, setPurchaseStatus] = useState<{ status: 'success' | 'error' | null; message: string }>({ 
    status: null,
    message: "" 
  });

  // 효과음
  const [playBuy] = useSound('/sounds/buy.mp3', { volume: 0.5 });
  const [playError] = useSound('/sounds/error.mp3', { volume: 0.3 });
  
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated") {
      fetchUserData();
      fetchShopItems();
    }
  }, [status, router]);
  
  const fetchUserData = async () => {
    try {
      const response = await axios.get("/api/user");
      setUserData(response.data);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };
  
  const fetchShopItems = async () => {
    setIsLoading(true);
    try {
      // 실제 API 엔드포인트로 교체 필요
      const response = await axios.get("/api/shop");
      setShopItems(response.data);
    } catch (error) {
      console.error("Error fetching shop items:", error);
      setShopItems([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePurchase = async (item: ShopItem) => {
    if (!userData) return;
    
    // 포인트가 충분한지 확인
    if (userData.patCount < item.price) {
      setPurchaseStatus({
        status: "error",
        message: "쓰다듬기 포인트가 부족합니다"
      });
      playError();
      return;
    }
    
    // 이미 구매한 아이템인지 확인 (재사용 불가능한 아이템만 체크)
    if (!item.reusable && userData.inventory.includes(item.id)) {
      setPurchaseStatus({
        status: "error",
        message: "이미 구매한 아이템입니다"
      });
      playError();
      return;
    }
    
    try {
      // 실제 구매 API 호출
      const response = await axios.post("/api/shop/purchase", { itemId: item.id });
      
      // 응답에서 업데이트된 사용자 데이터 사용
      if (response.data && response.data.success) {
        // 사용자 데이터 업데이트 (새로운 포인트 값과 인벤토리 업데이트)
        fetchUserData(); // 최신 사용자 데이터 가져오기
        
        setPurchaseStatus({
          status: "success",
          message: `${item.name}을(를) 성공적으로 구매했습니다!`
        });
        playBuy();
      }
      
      // 3초 후 메시지 숨기기
      setTimeout(() => {
        setPurchaseStatus({ status: null, message: "" });
      }, 3000);
      
    } catch (error) {
      console.error("Error purchasing item:", error);
      if (error instanceof axios.AxiosError) {
        setPurchaseStatus({
          status: "error",
          message: error.response?.data?.error || "구매 중 오류가 발생했습니다"
        });
        playError();
      }
    }
  };
  
  const filteredItems = selectedCategory === "all" 
    ? shopItems 
    : shopItems.filter(item => item.category === selectedCategory);
    
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100 flex items-center justify-center">
        <div className="animate-pulse flex items-center p-4"> {/* p-4 패딩 추가 */}
          <ShoppingBag className="w-6 h-6 mr-2 text-blue-600" />
          <span className="text-gray-700">상점 정보를 불러오는 중...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100">
      <div className="container mx-auto px-4 py-10">
        <Link href="/" className="flex items-center text-purple-600 mb-6">
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span>메인으로 돌아가기</span>
        </Link>
        
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-center sm:text-left text-purple-800 mb-2">요루 상점</h1>
              <p className="text-gray-600 text-center sm:text-left">쓰다듬기로 모은 포인트로 아이템을 구매하세요</p>
            </div>
            
            <div className="mt-4 sm:mt-0 bg-white/90 backdrop-blur-md rounded-lg px-4 py-2 shadow-md">
              <div className="flex items-center">
                <HandHeart className="w-6 h-6 text-purple-600 mr-2" />

                <span className="font-bold text-purple-800">{userData?.patCount || 0}</span>
                <span className="text-gray-600 ml-1">쓰담쓰담</span>
              </div>
            </div>
          </div>
          
          {/* 카테고리 필터 */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-full ${
                selectedCategory === "all" 
                  ? "bg-purple-600 text-white" 
                  : "bg-white/80 text-gray-700 hover:bg-purple-100"
              } transition`}
            >
              전체
            </button>
            <button
              onClick={() => setSelectedCategory("accessory")}
              className={`px-4 py-2 rounded-full ${
                selectedCategory === "accessory" 
                  ? "bg-pink-500 text-white" 
                  : "bg-white/80 text-gray-700 hover:bg-pink-100"
              } transition`}
            >
              액세서리
            </button>
            <button
              onClick={() => setSelectedCategory("food")}
              className={`px-4 py-2 rounded-full ${
                selectedCategory === "food" 
                  ? "bg-green-500 text-white" 
                  : "bg-white/80 text-gray-700 hover:bg-green-100"
              } transition`}
            >
              음식
            </button>
            <button
              onClick={() => setSelectedCategory("background")}
              className={`px-4 py-2 rounded-full ${
                selectedCategory === "background" 
                  ? "bg-blue-500 text-white" 
                  : "bg-white/80 text-gray-700 hover:bg-blue-100"
              } transition`}
            >
              배경
            </button>
            <button
              onClick={() => setSelectedCategory("buff")}
              className={`px-4 py-2 rounded-full ${
                selectedCategory === "buff" 
                  ? "bg-amber-500 text-white" 
                  : "bg-white/80 text-gray-700 hover:bg-amber-100"
              } transition`}
            >
              버프
            </button>
          </div>
          
          {/* 구매 상태 메시지 */}
          <AnimatePresence>
            {purchaseStatus.status && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mb-6 p-4 rounded-lg ${
                  purchaseStatus.status === "success" 
                    ? "bg-green-100 text-green-800 border-l-4 border-green-500" 
                    : "bg-red-100 text-red-800 border-l-4 border-red-500"
                } flex items-center`}
              >
                {purchaseStatus.status === "success" ? (
                  <ShoppingBag className="w-5 h-5 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 mr-2" />
                )}
                <span>{purchaseStatus.message}</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* 아이템 목록 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-white/90 backdrop-blur-md rounded-lg overflow-hidden shadow-md relative">
                {/* 이미 구매한 아이템인 경우 배지 표시 */}
                {!item.reusable && userData?.inventory.includes(item.id) && (
                  <div className="absolute right-0 top-0 bg-green-500 text-white text-xs px-2 py-1 rounded-bl-md z-10">
                    구매완료
                  </div>
                )}
                
                <div className="p-4">
                  <div className="w-full h-48 bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={120}
                      height={120}
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-purple-800 mb-1 pr-20">
                    {item.name}
                    {item.reusable && (
                      <span className="ml-2 inline-flex items-center text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                        <RefreshCw className="w-3 h-3 mr-1" />재구매 가능
                      </span>
                    )}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                  <div className="flex items-center text-blue-700 mb-3">
                    <Tag className="w-4 h-4 mr-1" />
                    <span className="text-xs">{item.effect}</span>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center">
                      <HandHeart className="w-6 h-6 text-purple-600 mr-2" />
                      <span className="font-bold text-purple-800">{item.price}</span>
                    </div>
                    <button
                      onClick={() => handlePurchase(item)}
                      disabled={
                        !userData || 
                        userData.patCount < item.price || 
                        (!item.reusable && userData.inventory.includes(item.id))
                      }
                      className={`px-3 py-1 rounded-lg text-white text-sm font-medium
                        ${
                          !userData || userData.patCount < item.price
                            ? "bg-gray-400 cursor-not-allowed"
                            : !item.reusable && userData.inventory.includes(item.id)
                              ? "bg-green-500 cursor-not-allowed"
                              : "bg-blue-500 hover:bg-blue-600"
                        }
                      `}
                    >
                      {!item.reusable && userData?.inventory.includes(item.id)
                        ? "구매완료"
                        : "구매하기"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredItems.length === 0 && (
            <div className="bg-white/70 backdrop-blur-md rounded-lg p-8 text-center">
              <p className="text-gray-600">해당 카테고리의 아이템이 없습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
