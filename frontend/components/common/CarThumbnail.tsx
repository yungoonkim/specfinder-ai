"use client";

import { useEffect, useState } from "react";

interface CarThumbnailProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
}

export default function CarThumbnail({
  src,
  alt,
  className = "h-44 w-full",
}: CarThumbnailProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const trimmedSrc = src?.trim() ?? "";

  if (!trimmedSrc || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-100 p-4 text-center text-slate-500 ${className}`}
      >
        <svg
          aria-hidden="true"
          className="mb-1.5 h-8 w-8 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
          />
        </svg>
        <span className="text-xs font-medium text-slate-600">
          {trimmedSrc ? "외부 이미지 로드 실패 (대체 화면)" : "등록된 이미지 없음"}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-lg border border-slate-200 bg-slate-100 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={trimmedSrc}
        alt={alt}
        loading="lazy"
        onError={() => setHasError(true)}
        className="h-full w-full object-cover transition duration-200 hover:scale-[1.02]"
      />
    </div>
  );
}
