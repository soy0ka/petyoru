'use client';

import axios from "axios";
import { ChevronLeft, Shield, Tag, ToggleLeft, ToggleRight } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSound from "use-sound";

// 아이템 타입 정의
interface InventoryItem {
  id: string;
  itemId: string; 
  name: string;
  description: string;
  image: string;
  effect: string;
  category: string;
  isEquipped: boolean;
  purchaseDate: string;
}

interface CategoryInfo {
  name: string;
  color: string;
  hoverColor: string;
  bgColor: string;
}

export default function InventoryPage() {
  const { status } = useSession();
  const router = useRouter();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error' | null}>({
    text: "",
    type: null
  });
  
  // 효과음
  const [playEquip] = useSound('/sounds/equip.mp3', { volume: 0.5 });
  const [playError] = useSound('/sounds/error.mp3', { volume: 0.3 });
  
  // 카테고리 정보
  const categories: Record<string, CategoryInfo> = {
    all: { name: "전체", color: "bg-purple-600", hoverColor: "hover:bg-purple-100", bgColor: "bg-purple-100" },
    accessory: { name: "액세서리", color: "bg-pink-500", hoverColor: "hover:bg-pink-100", bgColor: "bg-pink-100" },
    food: { name: "음식", color: "bg-green-500", hoverColor: "hover:bg-green-100", bgColor: "bg-green-100" },
    background: { name: "배경", color: "bg-blue-500", hoverColor: "hover:bg-blue-100", bgColor: "bg-blue-100" },
    buff: { name: "버프", color: "bg-amber-500", hoverColor: "hover:bg-amber-100", bgColor: "bg-amber-100" },
  };
  
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated") {
      fetchInventory();
    }
  }, [status, router]);
  
  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/inventory");
      setInventoryItems(response.data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      setInventoryItems([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEquipToggle = async (item: InventoryItem) => {
    try {
      const equip = !item.isEquipped;
      const response = await axios.post("/api/inventory/equip", { 
        itemId: item.itemId, 
        equip 
      });
      
      if (response.data.success) {
        // 아이템 착용 상태 업데이트
        setInventoryItems(items => 
          items.map(i => 
            i.id === item.id 
              ? { ...i, isEquipped: equip } 
              : (i.category === item.category && 
                (i.category === "accessory" || i.category === "background") && 
                equip ? 
                { ...i, isEquipped: false } : i)
          )
        );
        
        setMessage({
          text: equip ? `${item.name}을(를) 착용했습니다.` : `${item.name}을(를) 해제했습니다.`,
          type: 'success'
        });
        playEquip();
        
        // 3초 후 메시지 삭제
        setTimeout(() => {
          setMessage({text: "", type: null});
        }, 3000);
      }
    } catch (error) {
      console.error("Error toggling equipment status:", error);
      setMessage({
        text: "아이템 착용/해제 중 오류가 발생했습니다.",
        type: 'error'
      });
      playError();
      
      setTimeout(() => {
        setMessage({text: "", type: null});
      }, 3000);
    }
  };
  
  const getItemsByCategory = () => {
    if (selectedCategory === "all") {
      return inventoryItems;
    }
    return inventoryItems.filter(item => item.category === selectedCategory);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };
  
  const filteredItems = getItemsByCategory();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100 flex items-center justify-center">
        <div className="animate-pulse flex items-center p-4">
          <span className="text-gray-700">인벤토리를 불러오는 중...</span>
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
              <h1 className="text-3xl font-bold text-center sm:text-left text-purple-800 mb-2">요루 인벤토리</h1>
              <p className="text-gray-600 text-center sm:text-left">구매한 아이템을 확인하고 착용하세요</p>
            </div>
            
            <Link href="/shop" className="mt-4 sm:mt-0 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center transition">
              <span className="mr-2">상점 가기</span>
            </Link>
          </div>
          
          {/* 상태 메시지 표시 */}
          {message.type && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? "bg-green-100 text-green-800 border-l-4 border-green-500" 
                : "bg-red-100 text-red-800 border-l-4 border-red-500"
            } flex items-center`}>
              <Shield className="w-5 h-5 mr-2" />
              <span>{message.text}</span>
            </div>
          )}
          
          {/* 카테고리 필터 */}
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.entries(categories).map(([key, info]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-4 py-2 rounded-full ${
                  selectedCategory === key
                    ? `${info.color} text-white`
                    : `bg-white/80 text-gray-700 ${info.hoverColor}`
                } transition`}
              >
                {info.name}
              </button>
            ))}
          </div>
          
          {/* 인벤토리 아이템 목록 */}
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <div key={item.id} className={`
                  bg-white/90 backdrop-blur-md rounded-lg overflow-hidden shadow-md
                  ${item.isEquipped ? 'ring-2 ring-purple-500' : ''}
                `}>
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
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-purple-800">{item.name}</h3>
                      <span className={`text-xs font-medium text-white px-2 py-1 rounded-full ${categories[item.category || 'all'].color}`}>
                        {categories[item.category || 'all'].name}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                    <div className="flex items-center text-blue-700 mb-3">
                      <Tag className="w-4 h-4 mr-1" />
                      <span className="text-xs">{item.effect}</span>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                      <div className="text-xs text-gray-500">
                        구매일: {formatDate(item.purchaseDate)}
                      </div>
                      
                      {/* 액세서리, 배경 카테고리만 착용 가능 */}
                      {(item.category === "accessory" || item.category === "background") && (
                        <button
                          onClick={() => handleEquipToggle(item)}
                          className={`flex items-center px-3 py-1 rounded-lg text-white text-sm font-medium
                            ${item.isEquipped 
                              ? "bg-purple-600 hover:bg-purple-700" 
                              : "bg-gray-500 hover:bg-gray-600"}
                          `}
                        >
                          {item.isEquipped ? (
                            <>
                              <ToggleRight className="w-4 h-4 mr-1" />
                              착용중
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4 mr-1" />
                              착용하기
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/70 backdrop-blur-md rounded-lg p-8 text-center">
              <p className="text-gray-600">
                {selectedCategory === "all" 
                  ? "구매한 아이템이 없습니다. 상점에서 아이템을 구매해보세요!"
                  : `${categories[selectedCategory].name} 카테고리의 아이템이 없습니다.`
                }
              </p>
              <Link href="/shop" className="text-purple-600 font-medium inline-block mt-4 hover:underline">
                상점으로 이동하기
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
