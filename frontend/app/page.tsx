import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-8 py-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          SpecFinder AI · 통합 스펙 &amp; 매물 탐색기
        </span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          노트북과 중고 전기차를 정확한 조건 필터로 비교·검색하세요
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
          SpecFinder AI는 수집·정규화된 노트북 스펙 데이터와 중고 전기차 매물 데이터를
          하나의 웹서비스에서 조회할 수 있는 통합 플랫폼입니다. 상단 탭 또는 아래 카드를
          선택해 조건별 검색을 시작하세요.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col justify-between rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/70 to-white p-6 shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                  노트북 탭
                </span>
                <span className="text-xs font-medium text-slate-500">
                  /notebooks
                </span>
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-900">
                노트북 상세 스펙 조건 검색
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                제조사, CPU 제조사·시리즈, GPU 유형, RAM 용량, 무게,{" "}
                <strong className="font-semibold text-slate-800">관측 최저가</strong>{" "}
                범위로 원하는 노트북을 필터링하고 상세 구성을 확인합니다.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-600">
                <li>• 관측 최저가와 대표 구성 가격을 구분하여 투명하게 표시</li>
                <li>• RAM·무게·가격 범위 검색 및 정렬, 페이지네이션 지원</li>
                <li>• 원본 다나와 제품 링크 및 수집 시각 제공</li>
              </ul>
            </div>

            <div className="mt-6">
              <Link
                href="/notebooks"
                className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                노트북 검색 바로가기 →
              </Link>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white p-6 shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                  자동차 탭
                </span>
                <span className="text-xs font-medium text-slate-500">/cars</span>
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-900">
                중고 전기차 매물 조건 검색
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                제조사, 모델, 등록 연도, 주행거리, 판매 지역,{" "}
                <strong className="font-semibold text-slate-800">
                  수집 당시 판매 희망가
                </strong>{" "}
                범위로 중고 전기차 스냅샷 매물을 조회합니다.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-600">
                <li>• 수집 당시 판매 희망가 및 등록연월·주행거리 투명 표시</li>
                <li>• 주행거리 이상치 플래그 경고 및 외부 이미지 대체 처리</li>
                <li>• 매물별 상세 태그·설명·최초 수집 시각 조회</li>
              </ul>
            </div>

            <div className="mt-6">
              <Link
                href="/cars"
                className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                자동차 검색 바로가기 →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
