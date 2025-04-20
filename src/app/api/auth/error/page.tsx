// src/app/auth/error/page.tsx
"use client";

import { Suspense } from 'react';
import ErrorComponent from './error-component';

export default function ErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 flex items-center justify-center p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <ErrorComponent />
      </Suspense>
    </div>
  );
}
