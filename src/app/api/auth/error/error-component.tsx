'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const getErrorMessage = (error: string | null) => {
  switch (error) {
    case 'Configuration':
      return '서버 설정에 문제가 있습니다.';
    case 'AccessDenied':
      return '접근이 거부되었습니다.';
    case 'Verification':
      return '인증에 실패했습니다.';
    default:
      return '알 수 없는 오류가 발생했습니다.';
  }
};

export default function ErrorComponent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const errorMessage = getErrorMessage(error);

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-xl p-8 shadow-lg max-w-md w-full">
      <h1 className="text-2xl font-bold text-red-600 mb-4">오류가 발생했습니다</h1>
      <p className="text-gray-700 mb-6">{errorMessage}</p>
      <Link 
        href="/"
        className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
