# SpecFinder AI — 프로젝트 폴더 구조 및 협업 환경

> GitHub: https://github.com/yungoonkim/specfinder-ai  
> 저장소: **하나**. UI와 백엔드는 **별도 브랜치/작업 폴더**에서 작업하고 `main`에 병합한다.

## 1. 권장 저장소 구조 (MVP)

```text
specfinder-ai/
├── frontend/                        # Gemini: Next.js / React / TypeScript
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # 홈: 노트북/자동차 탭 안내
│   │   ├── notebooks/
│   │   │   ├── page.tsx              # 노트북 목록 + 필터
│   │   │   └── [productCode]/page.tsx # 상품 상세
│   │   └── cars/
│   │       ├── page.tsx              # 자동차 목록 + 필터
│   │       └── [listingId]/page.tsx  # 매물 상세
│   ├── components/
│   │   ├── filters/                  # 제조사·가격·RAM·주행거리 입력
│   │   ├── notebooks/               # 노트북 카드/필터
│   │   ├── cars/                    # 자동차 카드/필터
│   │   └── common/                  # 로딩·오류·빈 결과·페이지네이션
│   ├── lib/
│   │   └── api.ts                   # FastAPI 요청 함수
│   ├── types/
│   │   └── api.ts                   # API 계약에 대응하는 TS 타입
│   ├── public/
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── backend/                         # Codex: FastAPI / Python
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI 앱 / CORS
│   │   ├── database.py              # SQLAlchemy 엔진 / 세션
│   │   ├── models.py                # notebooks, cars 두 테이블
│   │   ├── schemas.py               # 필터 및 응답 Pydantic 모델
│   │   ├── routers/
│   │   │   ├── notebooks.py          # 검색/상세/facets
│   │   │   └── cars.py               # 검색/상세/facets
│   │   └── services/
│   │       ├── notebook_search.py    # SQL 검색 함수
│   │       └── car_search.py         # SQL 검색 함수
│   ├── sql/
│   │   └── schema.sql               # 두 테이블 CREATE TABLE/INDEX
│   ├── .env.example
│   └── requirements.txt
├── data/
│   ├── raw/                         # CSV 원본 (수정 금지)
│   │   ├── danawa_notebook.csv
│   │   └── kcar_ev_all.csv
│   └── scripts/                     # Codex: 전처리·적재
│       ├── import_notebooks.py
│       └── import_cars.py
├── tests/
│   ├── backend/                     # API/ETL 기본 점검
│   └── e2e/                         # 병합 후 통합 테스트
├── docs/
│   ├── PRD.md                       # 기획안 v1.1
│   ├── TECH_STACK.md                # 기술 스택 선정 근거 v1.1
│   ├── API_CONTRACT.md              # 필터, 응답, 오류 규칙
│   ├── DATA_DICTIONARY.md           # CSV 컬럼과 전처리 규칙
│   └── PROJECT_STRUCTURE.md         # 이 문서
├── AGENTS.md                        # 각 AI 공통 규칙
├── .gitignore
└── README.md
```

`frontend/`와 `backend/`는 **한 Git 저장소**에 공존하는 별도 애플리케이션이다. Next.js에서 PostgreSQL을 직접 조회하지 않는다. **Next.js → HTTP/JSON → FastAPI → SQLAlchemy → PostgreSQL** 구조로 통신한다.

## 2. 구조를 단순하게 유지하는 이유

- 초기 DB는 `notebooks`, `cars` 두 테이블만 필요하며 별도 가격 이력·유저·챗 기록 테이블을 만들지 않는다.
- 기본 검색 기능부터 구현하고 MVP 전체가 연결되면 통합 테스트한다.
- FastAPI의 `services/` 검색 함수를 나중에 `backend/app/agents/`의 LangGraph가 재사용한다.
- 중간 단계에서 큐, 캐시 서버, 독립 에이전트 서버, 패키지 모노레포 도구 등을 도입하지 않는다.

## 3. 브랜치 구조

```text
main                 # 공통 문서, 병합 완료된 안정된 코드
├── feature/ui        # Gemini 작업 (frontend/)
└── feature/backend   # Codex 작업 (backend/, data/scripts/)
```

- 저장소의 **기준 문서**는 `main`에 먼저 커밋한다.
- `feature/ui`와 `feature/backend`는 그 커밋을 기준으로 생성한다.
- 공통 API 계약을 변경해야 한다면 양쪽 브랜치에서 각자 변경하지 말고, 협의 후 `main`에 한 번 반영한다.
- 브랜치별 구현이 끝나면 PR로 `main`에 병합하고 `tests/e2e/`에서 통합 검증한다.

## 4. 로컬 Git worktree 예시

한 PC에서 Gemini와 Codex를 동시에 실행할 때 추천한다.

```text
Development/
├── specfinder-ai/                 # main
├── specfinder-ui/                 # feature/ui
└── specfinder-backend/            # feature/backend
```

`specfinder-ui/`와 `specfinder-backend/`는 **독립적인 GitHub 레포 복제본이 아니라** 같은 Git 저장소에 연결된 worktree다. 세 폴더 모두 프로젝트 전체를 포함하지만, 각각의 체크아웃된 브랜치와 수정 내역이 분리되어 있다.

기준 저장소 디렉터리 안에서 시작할 때:

```bash
# 1) 메인 저장소의 docs/ 및 AGENTS.md를 커밋한 뒤
#    feature 브랜치를 생성한다.
git switch main
git branch feature/ui
git branch feature/backend

# 2) 별도 작업 폴더 생성 (main 폴더의 형제 위치)
git worktree add ../specfinder-ui feature/ui
git worktree add ../specfinder-backend feature/backend

# 3) 연결 상태 확인
git worktree list
```

이미 브랜치가 있다면 `git branch ...` 줄은 생략한다. 저장소를 아직 clone하지 않았다면 먼저 clone한 뒤 진행한다. **명령은 예시이며 아직 GitHub에 실행된 상태가 아니다.**

## 5. 실행 환경

| 대상 | 로컬 기본 주소 | 비고 |
|---|---|---|
| Next.js | `http://localhost:3000` | `frontend/`에서 실행 |
| FastAPI | `http://localhost:8000` | `backend/`에서 실행 |
| PostgreSQL | `localhost:5432` | 로컬/컨테이너/관리형 중 선택 가능 |

프론트 `.env.example` 예시:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

백엔드 `.env.example` 예시(비밀값 아님):

```dotenv
DATABASE_URL=postgresql+psycopg://USERNAME:PASSWORD@localhost:5432/specfinder_db
CORS_ORIGINS=http://localhost:3000
```

실제 `.env` 파일은 Git에 커밋하지 않는다. 백엔드 CORS는 개발 프론트 주소만 허용한다. 노트북과 전기차 원본 CSV는 `data/raw/`의 문서상 이름으로 복사하되 원본 내용은 바꾸지 않는다.

## 6. 개발 및 병합 절차

1. `main`에 `docs/PRD.md`, `docs/TECH_STACK.md`, `docs/API_CONTRACT.md`, `docs/DATA_DICTIONARY.md`, `docs/PROJECT_STRUCTURE.md`, `AGENTS.md`를 등록한다.
2. `feature/ui`와 `feature/backend` 브랜치·worktree를 만든다.
3. Codex가 `backend/`, `data/scripts/`에서 DB·검색 API를 구현하고 Gemini가 `frontend/`에서 **같은 API 계약** 기반으로 UI를 구현한다. Mock 데이터는 UI 브랜치 내부 개발용으로만 사용한다.
4. 구현 중에는 기본 서버 기동/CSV 적재/간단한 호출만 확인한다.
5. 두 PR을 검토하고 `main`에 순차적으로 병합한다. 프론트 API URL·CORS·nullable 타입 차이를 해결한다.
6. **전체 MVP 통합 테스트 → 문제 수정 → 안정화** 후 배포 여부를 결정한다.
7. LangGraph·AI 채팅/RAG는 후속 브랜치에서 별도 개발한다.

## 7. 병렬 작업 충돌 방지

- UI와 백엔드에서 같은 문서나 루트 파일을 임의로 변경하지 않는다.
- `docs/API_CONTRACT.md`가 API 필드명과 JSON 구조의 단일 기준이다.
- `docs/DATA_DICTIONARY.md`가 CSV·DB 데이터 의미의 단일 기준이다.
- `.env`, DB 패스워드, OpenRouter 키 등은 Git에 저장하지 않는다.
- `.gitignore`에는 `node_modules/`, `.next/`, `__pycache__/`, `.venv/`, `.env`, `.env.*.local`, 로그, 테스트 캐시 등을 포함한다. 단 `.env.example`은 추적한다.
- CSV 원본은 데이터 변경 없이 취급하고, GitHub 업로드·재배포 가능 여부는 데이터 출처의 정책을 확인한다. 제한이 있다면 원본 CSV는 로컬에만 보관하고 README에 준비 방법을 기록한다.

## 8. 처음 작성할 파일과 우선순위

1. **공통 문서/폴더 골격**: `docs/`, `AGENTS.md`, `.gitignore`, `README.md`
2. **백엔드**: `models.py`, `database.py`, CSV 적재 스크립트, `schemas.py`, 검색 서비스, 라우터
3. **프론트엔드**: API 타입, `lib/api.ts`, 두 탭, 필터와 카드, 상세 페이지
4. **병합 후**: `tests/e2e/`와 실제 데이터 기반 통합 시나리오

MVP에서는 폴더를 미리 과도하게 세분화하지 않는다. 필요해질 때만 분리한다.
