// src/app/auth/error/page.tsx
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function ErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    // 5초 후 홈으로 리다이렉트
    const redirectTimer = setTimeout(() => {
      router.push("/");
    }, 5000);

    return () => clearTimeout(redirectTimer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">로그인 오류</h1>
        
        <p className="mb-4 text-gray-700">
          {error === "AccessDenied" 
            ? "로그인 권한이 거부되었습니다."
            : "로그인 과정에서 오류가 발생했습니다."}
        </p>
        
        <div className="mt-6">
          <Link 
            href="/"
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
          >
            홈으로 돌아가기
          </Link>
        </div>
        
        <p className="mt-4 text-sm text-gray-500">5초 후 자동으로 홈으로 이동합니다.</p>
      </div>
    </div>
  );
}
