"use client";

import Link from "next/link";
import AppliedFiltersChips from "@/components/ai-search/AppliedFiltersChips";
import CarCard from "@/components/cars/CarCard";
import NotebookCard from "@/components/notebooks/NotebookCard";
import { buildConditionSearchUrl } from "@/lib/api";
import {
  AISearchDomain,
  AISearchResponse,
  CarItem,
  NotebookItem,
} from "@/types/api";

interface AISearchResultViewProps {
  response: AISearchResponse;
  fallbackDomain: AISearchDomain;
  showCards: boolean;
  onToggleShowCards?: () => void;
  onSelectFollowUpPrompt?: (prompt: string) => void;
  onSubmitFollowUpPrompt?: (prompt: string) => void;
  onResetConversation?: () => void;
}

const NOTEBOOK_REFINEMENT_SUGGESTIONS = [
  "여기서 무게 1.5kg 이하만",
  "가격 낮은 순으로 정렬해줘",
  "RAM 32GB 이상으로 좁혀줘",
];

const CAR_REFINEMENT_SUGGESTIONS = [
  "주행거리 3만 km 이하로 좁혀줘",
  "가격 낮은 순으로 정렬해줘",
  "2023년 이후 등록 매물만 보여줘",
];

const NOTEBOOK_CLARIFICATION_SUGGESTIONS = [
  "150만 원 이하 RAM 16GB 이상 노트북 찾아줘",
  "무게 1.5kg 이하인 LG전자 노트북 보여줘",
];

const CAR_CLARIFICATION_SUGGESTIONS = [
  "현대 3천만 원 이하 매물 찾아줘",
  "주행거리 5만 km 이하 매물 보여줘",
];

export default function AISearchResultView({
  response,
  fallbackDomain,
  showCards,
  onToggleShowCards,
  onSelectFollowUpPrompt,
  onSubmitFollowUpPrompt,
  onResetConversation,
}: AISearchResultViewProps) {
  const effectiveDomain: AISearchDomain = response.domain ?? fallbackDomain;
  const isNotebook = effectiveDomain === "notebooks";

  if (response.clarification_required) {
    const questionText =
      response.clarification_question ||
      response.answer ||
      "검색할 조건을 조금 더 구체적으로 입력해 주세요.";
    const suggestions = isNotebook
      ? NOTEBOOK_CLARIFICATION_SUGGESTIONS
      : CAR_CLARIFICATION_SUGGESTIONS;

    return (
      <div className="space-y-3 rounded-2xl border border-amber-300 bg-amber-50/90 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-200/80 px-3 py-0.5 text-xs font-bold text-amber-950">
            <span>추가 조건 확인 필요 (Clarification)</span>
          </span>
          <span className="text-xs font-medium text-amber-900">
            정형 필터 변환 전 구체적인 조건을 요청합니다
          </span>
        </div>

        <p className="text-sm font-bold leading-relaxed text-amber-950 sm:text-base">
          {questionText}
        </p>

        <p className="text-xs leading-relaxed text-amber-900/90">
          ‘가성비’, ‘배터리 오래가는 제품’ 등 정형 컬럼으로 직접 변환할 수 없는 표현이거나
          구체적인 수치 조건이 부족할 때 표시됩니다. 이전에 성공한 검색 조건이 있다면 그대로
          유지되므로 아래처럼 구체적인 조건을 입력해 주세요.
        </p>

        <div className="pt-1">
          <span className="block text-xs font-semibold text-amber-900">
            구체적인 질문 예시 (클릭 시 입력창에 채움):
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion}
                className="inline-flex items-center rounded-lg border border-amber-300 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => onSelectFollowUpPrompt?.(suggestion)}
                  className="px-3 py-1.5 text-left text-xs font-medium text-slate-800 transition hover:bg-amber-100/60"
                >
                  {suggestion}
                </button>
                {onSubmitFollowUpPrompt && (
                  <button
                    type="button"
                    onClick={() => onSubmitFollowUpPrompt(suggestion)}
                    title="이 예시로 바로 검색"
                    className="border-l border-amber-200 px-2.5 py-1.5 text-xs font-bold text-amber-800 transition hover:bg-amber-100"
                  >
                    바로 검색 ↵
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {response.data_notice && (
          <p className="border-t border-amber-200/80 pt-2.5 text-[11px] text-amber-800">
            데이터 안내: {response.data_notice}
          </p>
        )}
      </div>
    );
  }

  const totalCount = response.total ?? 0;
  const displayedCount = response.items.length;
  const conditionSearchHref = buildConditionSearchUrl(
    effectiveDomain,
    response.applied_filters
  );
  const refinementSuggestions = isNotebook
    ? NOTEBOOK_REFINEMENT_SUGGESTIONS
    : CAR_REFINEMENT_SUGGESTIONS;

  if (totalCount === 0) {
    return (
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-0.5 text-xs font-bold text-slate-700">
            검색 결과 0건 · 조건 자동 완화 안 함
          </span>
          <span className="text-xs text-slate-500">
            도메인: {isNotebook ? "노트북" : "중고 전기차"}
          </span>
        </div>

        <p className="text-sm font-bold leading-relaxed text-slate-900 sm:text-base">
          {response.answer}
        </p>

        <AppliedFiltersChips
          domain={effectiveDomain}
          appliedFilters={response.applied_filters}
          showConditionSearchLink={true}
        />

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
          <p className="font-semibold text-slate-800">
            조건에 일치하는 데이터가 없습니다 (0건)
          </p>
          <p className="mt-1">
            SpecFinder AI는 검색 결과가 0건일 때 임의로 조건을 완화하거나 다른 상품을
            추천하지 않습니다. 가격·무게·주행거리 등 조건을 넓혀서 다시 질문하거나 대화를
            초기화해 보세요.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {onResetConversation && (
              <button
                type="button"
                onClick={onResetConversation}
                className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                대화 초기화
              </button>
            )}
            <Link
              href={conditionSearchHref}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              일반 조건 검색 화면에서 확인 →
            </Link>
          </div>
        </div>

        {response.data_notice && (
          <p className="text-[11px] text-slate-500">
            데이터 안내: {response.data_notice}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold ${
                isNotebook
                  ? "bg-blue-100 text-blue-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {isNotebook ? "노트북 AI 검색 결과" : "자동차 AI 검색 결과"}
            </span>
            <span className="text-xs font-semibold text-slate-700">
              전체{" "}
              <strong
                className={
                  isNotebook
                    ? "font-extrabold text-blue-600"
                    : "font-extrabold text-emerald-700"
                }
              >
                {totalCount.toLocaleString("ko-KR")}
              </strong>
              건 중 현재{" "}
              <strong className="font-bold text-slate-900">
                {displayedCount.toLocaleString("ko-KR")}
              </strong>
              건 표시
            </span>
          </div>

          <span className="text-xs text-slate-500">
            가격 기준:{" "}
            <strong className="font-semibold text-slate-700">
              {isNotebook ? "관측 최저가" : "수집 당시 판매 희망가"}
            </strong>
          </span>
        </div>

        <p className="text-sm font-bold leading-relaxed text-slate-900 sm:text-base">
          {response.answer}
        </p>

        <AppliedFiltersChips
          domain={effectiveDomain}
          appliedFilters={response.applied_filters}
          showConditionSearchLink={true}
        />

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600">
              후속 대화로 조건 좁히기:
            </span>
            {refinementSuggestions.map((suggestion) => (
              <div
                key={suggestion}
                className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50"
              >
                <button
                  type="button"
                  onClick={() => onSelectFollowUpPrompt?.(suggestion)}
                  className="px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  {suggestion}
                </button>
                {onSubmitFollowUpPrompt && (
                  <button
                    type="button"
                    onClick={() => onSubmitFollowUpPrompt(suggestion)}
                    title="이 조건으로 바로 후속 검색"
                    className={`border-l border-slate-200 px-2 py-1 text-xs font-bold transition ${
                      isNotebook
                        ? "text-blue-700 hover:bg-blue-50"
                        : "text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    ↵
                  </button>
                )}
              </div>
            ))}
          </div>

          {onToggleShowCards && (
            <button
              type="button"
              onClick={onToggleShowCards}
              className="text-xs font-semibold text-slate-600 underline hover:text-slate-900"
            >
              {showCards
                ? `결과 카드 접기 (${displayedCount}개)`
                : `결과 카드 펼치기 (${displayedCount}개)`}
            </button>
          )}
        </div>

        {response.data_notice && (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
            데이터 안내: {response.data_notice}
          </p>
        )}
      </div>

      {showCards && displayedCount > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {isNotebook
              ? (response.items as NotebookItem[]).map((item) => (
                  <NotebookCard key={item.id} item={item} />
                ))
              : (response.items as CarItem[]).map((item) => (
                  <CarCard key={item.id} item={item} />
                ))}
          </div>

          {totalCount > displayedCount && (
            <div className="flex flex-col items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 sm:flex-row">
              <span>
                현재 AI 검색 화면에는 상위 {displayedCount}건이 표시되어 있습니다. 전체{" "}
                <strong className="font-bold text-slate-900">
                  {totalCount.toLocaleString("ko-KR")}건
                </strong>
                의 페이지네이션 탐색은 일반 조건 검색 화면에서 이어서 확인하실 수 있습니다.
              </span>
              <Link
                href={conditionSearchHref}
                className={`shrink-0 rounded-lg px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition ${
                  isNotebook
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                조건 검색에서 전체 {totalCount.toLocaleString("ko-KR")}건 보기 →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
