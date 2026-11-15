"use client";

import Link from "next/link";
import { AISearchDomain } from "@/types/api";

interface AISearchErrorBannerProps {
  code: string;
  message: string;
  details?: Record<string, unknown> | null;
  domain: AISearchDomain;
  onRetry?: () => void;
  onResetConversation?: () => void;
}

export default function AISearchErrorBanner({
  code,
  message,
  details,
  domain,
  onRetry,
  onResetConversation,
}: AISearchErrorBannerProps) {
  const isInvalidRequest = code === "INVALID_AI_REQUEST";
  const isModelOutputOrProviderError =
    code === "AI_OUTPUT_INVALID" || code === "AI_MODEL_ERROR";
  const isModelUnavailable = code === "AI_MODEL_UNAVAILABLE";
  const isDbOrNetworkError =
    code === "DB_UNAVAILABLE" || code === "NETWORK_ERROR";

  const title = isInvalidRequest
    ? "입력 문장 또는 대화 검색 조건을 확인해 주세요 (INVALID_AI_REQUEST)"
    : isModelOutputOrProviderError
    ? `AI 모델 응답 처리 또는 호출에 실패했습니다 (${code})`
    : isModelUnavailable
    ? "백엔드 AI 모델 설정/인증이 준비되지 않았습니다 (AI_MODEL_UNAVAILABLE)"
    : isDbOrNetworkError
    ? `백엔드 서버 또는 데이터베이스 연결을 확인해 주세요 (${code})`
    : `AI 검색 요청 처리 중 오류가 발생했습니다 (${code})`;

  const guideMessage = isInvalidRequest
    ? "입력 문장이 비어 있거나 2,000자를 초과했거나, 이전 대화 조건과 현재 선택한 도메인이 맞지 않을 수 있습니다. 대화를 초기화한 뒤 다시 질문해 보세요."
    : isModelOutputOrProviderError
    ? "AI 모델이 일시적으로 응답하지 못했거나 정형 필터 형식으로 변환하는 데 실패했습니다. 잠시 후 다시 시도하거나 문장을 조금 더 명확하게 입력해 보세요."
    : isModelUnavailable
    ? "현재 FastAPI 백엔드에 Gemini Vertex AI 모델 설정 또는 ADC 인증이 준비되지 않았습니다. 아래 링크를 통해 일반 정형 조건 검색 화면을 바로 이용하실 수 있습니다."
    : isDbOrNetworkError
    ? "FastAPI 백엔드 서버(http://localhost:8000) 또는 PostgreSQL 데이터베이스 연결 상태를 확인한 뒤 다시 시도해 주세요."
    : "잠시 후 다시 시도하거나 대화를 초기화해 주세요.";

  const fieldDetail =
    details && typeof details.field === "string" ? details.field : null;
  const reasonDetail =
    details && typeof details.reason === "string" ? details.reason : null;

  const conditionSearchHref = domain === "notebooks" ? "/notebooks" : "/cars";
  const conditionSearchLabel =
    domain === "notebooks" ? "노트북 일반 조건 검색" : "자동차 일반 조건 검색";

  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50/90 p-5 text-slate-900 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center rounded-md bg-red-100 px-2.5 py-0.5 font-mono text-xs font-bold text-red-800">
          오류 코드: {code}
        </span>
        <span className="text-xs font-medium text-red-700">
          Mock 폴백 미적용 · 실제 백엔드/모델 상태 표시
        </span>
      </div>

      <h3 className="mt-2.5 text-base font-bold text-red-950">{title}</h3>
      <p className="mt-1 text-sm font-medium text-red-900">{message}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-red-800/90">
        {guideMessage}
      </p>

      {(fieldDetail || reasonDetail) && (
        <div className="mt-3 rounded-lg border border-red-200 bg-white/80 px-3 py-2 text-xs text-slate-700">
          {fieldDetail && (
            <div>
              <span className="font-semibold text-slate-900">검증 항목: </span>
              <code className="font-mono text-red-700">{fieldDetail}</code>
            </div>
          )}
          {reasonDetail && (
            <div className="mt-0.5">
              <span className="font-semibold text-slate-900">상세 사유: </span>
              <span>{reasonDetail}</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700"
          >
            다시 시도
          </button>
        )}

        {onResetConversation && (
          <button
            type="button"
            onClick={onResetConversation}
            className="rounded-lg border border-red-300 bg-white px-3.5 py-2 text-xs font-semibold text-red-800 transition hover:bg-red-100"
          >
            대화 초기화 후 다시 시작
          </button>
        )}

        <Link
          href={conditionSearchHref}
          className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          {conditionSearchLabel}으로 이동 →
        </Link>
      </div>
    </div>
  );
}
