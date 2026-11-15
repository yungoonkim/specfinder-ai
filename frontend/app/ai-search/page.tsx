"use client";

import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import AISearchErrorBanner from "@/components/ai-search/AISearchErrorBanner";
import AISearchResultView from "@/components/ai-search/AISearchResultView";
import AppliedFiltersChips from "@/components/ai-search/AppliedFiltersChips";
import {
  ApiClientError,
  sanitizeAIConversationFilters,
  searchAI,
} from "@/lib/api";
import {
  AIConversationContext,
  AISearchDomain,
  AISearchResponse,
} from "@/types/api";

interface ChatTurn {
  id: string;
  domain: AISearchDomain;
  userMessage: string;
  sentContext: AIConversationContext | null;
  status: "loading" | "success" | "error";
  response?: AISearchResponse;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown> | null;
  };
}

const NOTEBOOK_SAMPLE_PROMPTS = [
  "150만 원 이하 RAM 16GB 이상 노트북",
  "무게 1.5kg 이하인 노트북",
  "LG전자 인텔 노트북 가격 낮은 순으로 보여줘",
];

const CAR_SAMPLE_PROMPTS = [
  "현대 3천만 원 이하 매물 보여줘",
  "주행거리 5만 km 이하 매물 찾아줘",
  "기아 EV6 2023년 이후 등록 매물 찾아줘",
];

const MAX_MESSAGE_LENGTH = 2000;

export default function AISearchPage() {
  const [selectedDomain, setSelectedDomain] =
    useState<AISearchDomain>("notebooks");
  const [inputMessage, setInputMessage] = useState<string>("");
  const [conversationContext, setConversationContext] =
    useState<AIConversationContext | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [expandedCardTurnIds, setExpandedCardTurnIds] = useState<
    Record<string, boolean>
  >({});
  const [clientValidationMessage, setClientValidationMessage] = useState<
    string | null
  >(null);

  const inFlightControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const turnEndRef = useRef<HTMLDivElement | null>(null);

  const isSubmitting = useMemo(
    () => turns.some((turn) => turn.status === "loading"),
    [turns]
  );

  useEffect(() => {
    return () => {
      inFlightControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (turns.length > 0) {
      turnEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [turns.length]);

  const latestSuccessfulSearchTurnId = useMemo(() => {
    for (let i = turns.length - 1; i >= 0; i -= 1) {
      const turn = turns[i];
      if (
        turn.status === "success" &&
        turn.response &&
        !turn.response.clarification_required &&
        (turn.response.total ?? 0) > 0
      ) {
        return turn.id;
      }
    }
    return null;
  }, [turns]);

  const handleResetConversation = useCallback(() => {
    inFlightControllerRef.current?.abort();
    inFlightControllerRef.current = null;
    setTurns([]);
    setConversationContext(null);
    setExpandedCardTurnIds({});
    setClientValidationMessage(null);
  }, []);

  const handleDomainChange = useCallback((nextDomain: AISearchDomain) => {
    inFlightControllerRef.current?.abort();
    inFlightControllerRef.current = null;
    setSelectedDomain(nextDomain);
    // 도메인 전환 시 이전 도메인의 conversation_context를 초기화해 422 불일치 방지
    setConversationContext(null);
    setTurns([]);
    setExpandedCardTurnIds({});
    setClientValidationMessage(null);
  }, []);

  const executeSearch = useCallback(
    async (
      rawMessage: string,
      domainToUse: AISearchDomain,
      contextToUse: AIConversationContext | null
    ) => {
      if (isSubmitting) {
        return;
      }

      const trimmed = rawMessage.trim();
      if (!trimmed) {
        setClientValidationMessage("검색할 질문 문장을 입력해 주세요.");
        return;
      }
      if (trimmed.length > MAX_MESSAGE_LENGTH) {
        setClientValidationMessage(
          `질문은 최대 ${MAX_MESSAGE_LENGTH.toLocaleString("ko-KR")}자까지 입력할 수 있습니다.`
        );
        return;
      }

      setClientValidationMessage(null);

      // 도메인 일치 여부를 한 번 더 검증하여 안전하게 문맥 전달
      const safeContext: AIConversationContext | null =
        contextToUse && contextToUse.domain === domainToUse
          ? {
              domain: domainToUse,
              filters: sanitizeAIConversationFilters(
                domainToUse,
                contextToUse.filters
              ),
            }
          : null;

      const turnId = `turn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const controller = new AbortController();
      inFlightControllerRef.current = controller;

      setTurns((prev) => [
        ...prev,
        {
          id: turnId,
          domain: domainToUse,
          userMessage: trimmed,
          sentContext: safeContext,
          status: "loading",
        },
      ]);
      setInputMessage("");

      try {
        const response = await searchAI(
          {
            domain: domainToUse,
            message: trimmed,
            conversation_context: safeContext,
          },
          { signal: controller.signal }
        );

        setTurns((prev) =>
          prev.map((turn) =>
            turn.id === turnId
              ? {
                  ...turn,
                  status: "success",
                  response,
                }
              : turn
          )
        );

        // clarification_required === false 인 정상 검색 성공 시에만 conversation_context 갱신
        if (!response.clarification_required) {
          const resolvedDomain = response.domain ?? domainToUse;
          const nextFilters = sanitizeAIConversationFilters(
            resolvedDomain,
            response.applied_filters
          );
          setConversationContext({
            domain: resolvedDomain,
            filters: nextFilters,
          });
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        const apiError =
          err instanceof ApiClientError
            ? {
                code: err.code,
                message: err.message,
                details: err.details,
              }
            : {
                code: "INTERNAL_ERROR",
                message:
                  err instanceof Error
                    ? err.message
                    : "AI 검색 처리 중 알 수 없는 오류가 발생했습니다.",
                details: null,
              };

        setTurns((prev) =>
          prev.map((turn) =>
            turn.id === turnId
              ? {
                  ...turn,
                  status: "error",
                  error: apiError,
                }
              : turn
          )
        );
      } finally {
        if (inFlightControllerRef.current === controller) {
          inFlightControllerRef.current = null;
        }
      }
    },
    [isSubmitting]
  );

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void executeSearch(inputMessage, selectedDomain, conversationContext);
  };

  const handleTextareaKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      !e.nativeEvent.isComposing
    ) {
      e.preventDefault();
      if (
        !isSubmitting &&
        inputMessage.trim().length > 0 &&
        inputMessage.trim().length <= MAX_MESSAGE_LENGTH
      ) {
        void executeSearch(inputMessage, selectedDomain, conversationContext);
      }
    }
  };

  const handleFillPrompt = useCallback((promptText: string) => {
    setInputMessage(promptText);
    setClientValidationMessage(null);
    textareaRef.current?.focus();
  }, []);

  const handleQuickExecutePrompt = useCallback(
    (promptText: string) => {
      void executeSearch(promptText, selectedDomain, conversationContext);
    },
    [conversationContext, executeSearch, selectedDomain]
  );

  const handleToggleCardsForTurn = useCallback(
    (turnId: string, currentlyVisible: boolean) => {
      setExpandedCardTurnIds((prev) => ({
        ...prev,
        [turnId]: !currentlyVisible,
      }));
    },
    []
  );

  const isNotebookDomain = selectedDomain === "notebooks";
  const samplePrompts = isNotebookDomain
    ? NOTEBOOK_SAMPLE_PROMPTS
    : CAR_SAMPLE_PROMPTS;

  return (
    <div className="space-y-6">
      {/* 1. 상단 AI 검색 제목 및 사용 안내 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-bold text-indigo-800">
                Phase 2 · AI 자연어 검색
              </span>
              <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                POST /api/ai/search · PostgreSQL 실데이터 연동
              </span>
            </div>
            <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-slate-900">
              AI 자연어 스펙 · 매물 대화형 검색
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              원하는 노트북 스펙이나 중고 전기차 매물 조건을 일상적인 문장으로 입력해 보세요.
              AI가 정형 필터로 변환해 DB를 정확히 조회하며, 후속 질문으로 조건을 이어서 수정할 수 있습니다.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              href={isNotebookDomain ? "/notebooks" : "/cars"}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              {isNotebookDomain ? "노트북 수동 필터 검색 →" : "자동차 수동 필터 검색 →"}
            </Link>
            <button
              type="button"
              onClick={handleResetConversation}
              disabled={turns.length === 0 && !conversationContext}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              대화 초기화
            </button>
          </div>
        </div>

        {/* 2. 도메인 선택기 (노트북 / 자동차) */}
        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700">
                검색 도메인 선택:
              </span>
              <div
                role="group"
                aria-label="검색 도메인 선택"
                className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1"
              >
                <button
                  type="button"
                  onClick={() => handleDomainChange("notebooks")}
                  aria-pressed={selectedDomain === "notebooks"}
                  className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
                    selectedDomain === "notebooks"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-700 hover:text-slate-900"
                  }`}
                >
                  노트북 (관측 최저가 기준)
                </button>
                <button
                  type="button"
                  onClick={() => handleDomainChange("cars")}
                  aria-pressed={selectedDomain === "cars"}
                  className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
                    selectedDomain === "cars"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-700 hover:text-slate-900"
                  }`}
                >
                  중고 전기차 (수집 당시 희망가 기준)
                </button>
              </div>
            </div>

            <span className="text-xs text-slate-500">
              도메인을 전환하면 이전 대화 조건(문맥)이 새 도메인 기준으로 자동 초기화됩니다.
            </span>
          </div>

          {/* 현재 유지 중인 대화 문맥(conversation_context) 상태 표시 */}
          <div className="mt-3">
            {conversationContext ? (
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-indigo-800">
                    유지 중인 대화 문맥 (후속 질문 시 이 조건을 기반으로 수정·정렬합니다)
                  </span>
                  <button
                    type="button"
                    onClick={handleResetConversation}
                    className="font-semibold text-slate-600 underline hover:text-slate-900"
                  >
                    문맥 초기화
                  </button>
                </div>
                <AppliedFiltersChips
                  domain={conversationContext.domain}
                  appliedFilters={conversationContext.filters ?? {}}
                  showConditionSearchLink={true}
                  title="현재 누적된 문맥 조건"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-600">
                현재 유지 중인 이전 검색 조건이 없습니다. 첫 질문을 입력하거나 아래 예시 질문을 선택해 보세요.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. 초기 안내 및 샘플 질문 버튼 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900">
            {isNotebookDomain ? "노트북 추천 예시 질문" : "중고 전기차 추천 예시 질문"}
          </h2>
          <span className="text-xs text-slate-500">
            문장을 클릭하면 입력창에 채워지며, <strong className="font-semibold text-slate-700">바로 검색 ↵</strong>을 누르면 즉시 조회합니다.
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {samplePrompts.map((prompt) => (
            <div
              key={prompt}
              className={`inline-flex items-center rounded-xl border bg-slate-50/80 shadow-sm ${
                isNotebookDomain ? "border-blue-200" : "border-emerald-200"
              }`}
            >
              <button
                type="button"
                onClick={() => handleFillPrompt(prompt)}
                className="px-3.5 py-2 text-left text-xs font-semibold text-slate-800 transition hover:bg-white rounded-l-xl"
              >
                “{prompt}”
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleQuickExecutePrompt(prompt)}
                className={`border-l px-3 py-2 text-xs font-bold transition rounded-r-xl disabled:opacity-50 ${
                  isNotebookDomain
                    ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                바로 검색 ↵
              </button>
            </div>
          ))}
        </div>

        {turns.length === 0 && (
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 text-xs text-slate-600 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-3.5">
              <p className="font-bold text-slate-800">1. 첫 자연어 조건 검색</p>
              <p className="mt-1">
                예: “{samplePrompts[0]}”처럼 제조사·가격·사양 범위를 자연어로 질문합니다.
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3.5">
              <p className="font-bold text-slate-800">2. 후속 대화로 조건 좁히기</p>
              <p className="mt-1">
                검색 결과 확인 후 “여기서 무게 1.5kg 이하만”, “가격 낮은 순으로 정렬해줘”처럼 이어서 질문할 수 있습니다.
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3.5">
              <p className="font-bold text-slate-800">3. 정직한 스냅샷 결과 제공</p>
              <p className="mt-1">
                결과가 0건일 때 임의로 조건을 완화하지 않으며, 모호한 표현은 명확화 질문으로 되묻습니다.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 4. 대화 메시지 및 검색 결과 목록 */}
      {turns.length > 0 && (
        <section
          aria-label="AI 검색 대화 및 결과 목록"
          aria-live="polite"
          className="space-y-6"
        >
          {turns.map((turn, index) => {
            const isLatestSuccessfulTurn =
              turn.id === latestSuccessfulSearchTurnId;
            const showCards =
              expandedCardTurnIds[turn.id] !== undefined
                ? expandedCardTurnIds[turn.id]
                : isLatestSuccessfulTurn;

            return (
              <div
                key={turn.id}
                className="space-y-3 rounded-2xl border border-slate-200/90 bg-slate-100/70 p-4 sm:p-5"
              >
                {/* 사용자 질문 말풍선 */}
                <div className="flex justify-end">
                  <div className="max-w-2xl rounded-2xl rounded-tr-sm bg-slate-900 px-4 py-3 text-white shadow-sm">
                    <div className="mb-1 flex items-center justify-between gap-3 text-[11px] text-slate-300">
                      <span>
                        질문 #{index + 1} ·{" "}
                        {turn.domain === "notebooks" ? "노트북" : "중고 전기차"}
                      </span>
                      {turn.sentContext && (
                        <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-200">
                          이전 문맥 반영
                        </span>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed">
                      {turn.userMessage}
                    </p>
                  </div>
                </div>

                {/* AI 응답 영역 */}
                {turn.status === "loading" && (
                  <div
                    role="status"
                    className="flex items-center gap-3 rounded-2xl border border-indigo-200 bg-white p-5 text-sm text-slate-700 shadow-sm"
                  >
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                    <div>
                      <p className="font-bold text-slate-900">
                        AI가 질문 조건을 분석하고 PostgreSQL 데이터를 조회하고 있습니다...
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        의도 분류 → 정형 필터 추출 → 범위 검증 → 데이터베이스 조회 중
                      </p>
                    </div>
                  </div>
                )}

                {turn.status === "error" && turn.error && (
                  <AISearchErrorBanner
                    code={turn.error.code}
                    message={turn.error.message}
                    details={turn.error.details}
                    domain={turn.domain}
                    onRetry={() => {
                      if (!isSubmitting) {
                        void executeSearch(
                          turn.userMessage,
                          turn.domain,
                          turn.sentContext
                        );
                      }
                    }}
                    onResetConversation={handleResetConversation}
                  />
                )}

                {turn.status === "success" && turn.response && (
                  <AISearchResultView
                    response={turn.response}
                    fallbackDomain={turn.domain}
                    showCards={showCards}
                    onToggleShowCards={
                      !turn.response.clarification_required &&
                      turn.response.items.length > 0
                        ? () => handleToggleCardsForTurn(turn.id, showCards)
                        : undefined
                    }
                    onSelectFollowUpPrompt={handleFillPrompt}
                    onSubmitFollowUpPrompt={
                      !isSubmitting ? handleQuickExecutePrompt : undefined
                    }
                    onResetConversation={handleResetConversation}
                  />
                )}
              </div>
            );
          })}
          <div ref={turnEndRef} />
        </section>
      )}

      {/* 5. 하단 자연어 입력창 및 전송 폼 */}
      <section className="sticky bottom-3 z-20 rounded-2xl border border-slate-300 bg-white/95 p-4 shadow-lg backdrop-blur sm:p-5">
        <form onSubmit={handleFormSubmit} className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="ai-search-input"
              className="text-xs font-bold text-slate-800"
            >
              자연어 검색 질문 입력 ({isNotebookDomain ? "노트북" : "중고 전기차"})
            </label>
            <span
              className={`text-xs font-medium ${
                inputMessage.length > MAX_MESSAGE_LENGTH
                  ? "font-bold text-red-600"
                  : "text-slate-500"
              }`}
            >
              {inputMessage.length.toLocaleString("ko-KR")} /{" "}
              {MAX_MESSAGE_LENGTH.toLocaleString("ko-KR")}자 · Enter 전송, Shift+Enter 줄바꿈
            </span>
          </div>

          {clientValidationMessage && (
            <p role="alert" className="text-xs font-semibold text-red-600">
              {clientValidationMessage}
            </p>
          )}

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end">
            <textarea
              ref={textareaRef}
              id="ai-search-input"
              rows={2}
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value);
                if (clientValidationMessage) {
                  setClientValidationMessage(null);
                }
              }}
              onKeyDown={handleTextareaKeyDown}
              disabled={isSubmitting}
              placeholder={
                conversationContext
                  ? isNotebookDomain
                    ? "이전 검색 결과에서 이어서 질문해 보세요 (예: 여기서 무게 1.5kg 이하만, 가격 낮은 순으로 정렬해줘)"
                    : "이전 검색 결과에서 이어서 질문해 보세요 (예: 주행거리 3만 km 이하만, 가격 낮은 순으로 정렬해줘)"
                  : isNotebookDomain
                  ? "찾으시는 노트북 조건을 입력해 주세요 (예: 150만 원 이하 RAM 16GB 이상 노트북)"
                  : "찾으시는 중고 전기차 조건을 입력해 주세요 (예: 현대 전기차 3천만 원 이하)"
              }
              className="w-full flex-1 resize-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
            />

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  inputMessage.trim().length === 0 ||
                  inputMessage.trim().length > MAX_MESSAGE_LENGTH
                }
                className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-sm transition sm:w-auto ${
                  isNotebookDomain
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>AI 분석 중...</span>
                  </>
                ) : (
                  <span>AI 검색 전송</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
