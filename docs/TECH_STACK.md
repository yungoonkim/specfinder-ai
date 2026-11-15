# SpecFinder AI 기술 스택 선정 근거

**버전:** v1.1 · **작성일:** 2026-11-13  
**목적:** 왜 이 기술들을 사용하며, React·Next.js·Node.js·FastAPI가 각각 어떤 역할을 하는지 이해하기 위한 기술 결정 문서.

> **확정 결론:** SpecFinder AI는 **Next.js(React·TypeScript) 프론트엔드 + FastAPI(Python) 백엔드 + PostgreSQL**로 개발한다. Next.js에도 서버 기능이 있지만, 검색 API와 DB 접근을 Python 백엔드로 모아 **이후 LangGraph를 동일한 검색 로직에 연결**한다.

## 1. 먼저 정확히 구분: React, Next.js, Node.js

| 이름 | 무엇인가? | 프로젝트 내 역할 | 오해하기 쉬운 점 |
|---|---|---|---|
| **React** | **UI 라이브러리** | 필터·탭·결과 카드 등 인터랙티브 컴포넌트 | React 자체가 풀스택 프레임워크는 아님 |
| **Next.js** | **React 기반 풀스택 웹 프레임워크** | 페이지 라우팅, 렌더링, 서버 측 데이터 로딩, API 엔드포인트 | React와 별개의 UI 프레임워크를 하나 더 얹는 것이 아님 |
| **Node.js** | **브라우저 밖에서 JavaScript/TypeScript를 실행하는 런타임** | Next 개발 서버와 서버 측 코드 실행 | Node.js 자체가 FastAPI 같은 웹 프레임워크인 것은 아님 |
| **TypeScript** | JavaScript에 타입 시스템을 더한 언어 | CSV/DB/API 필드 오류를 조기에 줄임 | 브라우저에서는 빌드 후 JavaScript로 동작 |
| **PostgreSQL** | 관계형 데이터베이스 | 노트북·전기차 테이블에서 정형 조건 검색 | Node.js나 Next.js 자체가 DB를 대신하는 것은 아님 |

공식 React 사이트는 React를 “UI를 위한 라이브러리”로 소개한다. Next.js는 공식적으로 “풀스택 웹 애플리케이션을 위한 React 프레임워크”다. Node.js는 서버 전용 제품이 아니라 브라우저 외부의 JavaScript 실행 환경이다.

## 2. React를 왜 사용하나요?

### 2.1 현재 화면에 필요한 기능이 React와 맞다

- CPU 체크박스, 제조사 다중 선택, RAM 최소값, 가격 범위 슬라이더를 **독립적인 컴포넌트**로 만든다.
- 선택 상태가 변경되면 필터 UI와 결과 요약을 자동으로 다시 그릴 수 있다.
- 노트북 탭과 자동차 탭에서 검색 패널·결과 카드·로딩 상태 컴포넌트를 재사용할 수 있다.
- 이후 AI 채팅창을 추가해도 동일한 페이지 구조를 확장할 수 있다.

### 2.2 React가 말하는 ‘동적 페이지’의 의미

React는 컴포넌트의 **상태(state)** 또는 **속성(props)** 이 달라지면 화면을 갱신한다. 예를 들어 `RAM ≥ 16GB` 체크 시 선택 표시와 결과 목록을 갱신한다. 그러나 **데이터베이스에서 SQL을 실행하는 기능**은 React UI 자체의 기능이 아니다. 그 작업은 서버 코드에서 처리한다.

### 2.3 React만 사용하면 무엇이 더 필요한가?

React만으로 웹사이트를 만들 수도 있지만 일반적으로 라우팅, 서버 렌더링, API 엔드포인트, 빌드 구성 등의 선택과 조립이 필요하다. Next.js를 함께 선택하면 이런 작업을 상당 부분 표준화할 수 있다. 즉 **‘React + Next.js’는 React UI를 Next.js 프로젝트 안에서 사용하는 것**이지 두 프레임워크를 따로 설치해 운영하는 뜻은 아니다.

## 3. Next.js를 왜 사용하나요? 프론트엔드와 백엔드를 모두 만들 수 있나요?

**기술적으로는 가능합니다.** Next.js App Router는 React 화면뿐 아니라 서버 컴포넌트와 Route Handlers를 제공한다. 따라서 어떤 프로젝트에서는 자체 API를 만들 수도 있다.

**하지만 SpecFinder AI의 확정 설계는 다르다.** Next.js는 프론트엔드, **FastAPI는 검색 API와 DB 조회를 맡는다.** Next.js의 자체 Route Handler로 SQL 검색 API를 중복 구현하지 않는다.

| 기능 | 이 프로젝트의 위치 | 담당 기술 |
|---|---|---|
| 노트북/자동차 페이지 | `frontend/app/notebooks`, `frontend/app/cars` | Next.js App Router |
| 체크박스·슬라이더·카드 | `frontend/components` | React Client Components |
| 초기 화면 렌더링·라우팅 | `frontend/app` | Next.js Server Components/라우팅 |
| 노트북 SQL 검색 API | `backend/`의 `/api/notebooks` | Python FastAPI |
| 전기차 SQL 검색 API | `backend/`의 `/api/cars` | Python FastAPI |
| DB 연결 및 검색 함수 | `backend/`의 DB·서비스 모듈 | SQLAlchemy + PostgreSQL |
| [2차] 자연어 검색 | `backend/` Agent 모듈 | LangGraph Python |

### 3.1 실제 데이터 흐름

```text
브라우저: React 필터 UI (Next.js)
          │ HTTP 요청 / JSON 응답
          ▼
FastAPI 서버: Pydantic 검증 + 검색 함수 호출
          │ SQLAlchemy 안전한 SELECT
          ▼
PostgreSQL: notebooks / cars
```

**Next.js가 React를 포함하는 방식:** React는 버튼·필터 같은 컴포넌트를 그리는 UI 라이브러리, Next.js는 해당 컴포넌트의 라우팅·서버 렌더링·빌드·배포 구조를 제공하는 프레임워크다. `React + Next.js`는 두 개의 별도 웹앱을 뜻하지 않는다.

### 3.2 실제 검색 화면의 요청 예시

```ts
// frontend/lib/api.ts — 설명용 예시
export async function searchNotebooks(minRamGb: number) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  const query = new URLSearchParams({ min_ram_gb: String(minRamGb) });
  const response = await fetch(`${apiBase}/api/notebooks?${query}`);
  if (!response.ok) throw new Error('노트북 검색 실패');
  return response.json();
}
```

- 위 코드는 요청 흐름을 보여주는 **간단한 예시**다. 실제로는 전체 필터·페이징·정렬·타입·오류 처리를 구현한다.
- 브라우저에서 FastAPI를 직접 호출한다면 개발 중 CORS에 `http://localhost:3000` 등 실제 프론트엔드 Origin을 허용한다. 필요하면 Next.js 프록시를 사용할 수도 있다.
- 브라우저에 DB 접속 정보나 비밀 키를 전달하지 않는다. `NEXT_PUBLIC_` 변수에는 공개 가능한 API 주소만 넣는다.

### 3.3 Server Component와 Client Component는 다른 서버인가요?

아니다. 둘 다 **Next.js에서 React 컴포넌트를 어떻게 실행·렌더링할지 구분하는 개념**이다.

- **Server Component:** 서버에서 렌더링될 컴포넌트. 필요 시 FastAPI로 데이터를 요청할 수 있다.
- **Client Component:** 브라우저 클릭·입력·상태 변경을 처리하는 컴포넌트. 필터 조작에 사용한다.
- Next.js는 초기 페이지 렌더링과 클라이언트 상호작용을 함께 지원한다.
- 단, **DB 접근 및 비즈니스 검색 로직은 FastAPI에 단일화**한다.

### 3.4 Next.js를 프론트엔드에 쓰는 이유

React만 선택하면 라우팅·렌더링·빌드 구조 등을 개별적으로 구성해야 할 수 있다. Next.js는 이를 표준화하여 빠르게 화면을 개발할 수 있다. FastAPI와 역할을 분리해 Gemini는 UI에, Codex는 Python 백엔드에 집중할 수 있다.

## 4. Node.js는 정확히 무엇인가요?

**Node.js는 ‘서버’ 그 자체가 아니라 JavaScript 코드를 실행하는 런타임**이다. Node.js를 이용해 HTTP 서버를 만들 수 있고, Next.js의 개발 서버나 서버 측 기능을 실행할 수 있다.

```text
브라우저: JavaScript 실행 + 화면 상호작용
Node.js: 서버 환경에서 JavaScript 실행 (HTTP, DB, 파일 등)
Next.js: Node.js 등을 활용하는 웹 애플리케이션 프레임워크
PostgreSQL: 데이터를 실제로 저장하는 DB 서버
```

- `npm`은 Node.js 생태계의 **패키지 관리 도구**다. `npm run dev`는 Next 개발 서버 실행 명령이다.
- Next.js의 서버 측 기능은 배포 환경에 따라 Node.js 서버 또는 해당 플랫폼의 서버리스 실행 환경에서 동작할 수 있다.
- 정적 HTML·자산으로 내보내는 배포 방식에서는 실행 서버가 없을 수 있지만, 이 경우 DB 조회 API 같은 **동적 서버 기능은 제약**된다.
- SpecFinder AI에서 DB 접속 비밀번호는 반드시 **서버 쪽에만** 둔다. 브라우저 React 코드에는 넣지 않는다.

## 5. FastAPI를 확정한 이유

**FastAPI는 이번 프로젝트의 확정 백엔드 기술**이다. 단순한 SQL 검색만 고려하면 다른 구현도 가능하지만, 사용자 결정에 따라 Python 검색 서버를 처음부터 유지한다.

1. **CSV 전처리와 DB 검색 코드의 언어 일관성:** Python/Pandas로 CSV를 정제하고 Python/SQLAlchemy로 데이터를 조회한다.
2. **LangGraph 확장에 유리:** 추후 LangGraph Python을 같은 백엔드에 추가하고 기존 검색 함수(`search_notebooks`, `search_cars`)를 도구로 감싼다.
3. **검증과 API 명세:** Pydantic으로 가격·RAM·주행거리 등의 범위를 검증하고 FastAPI 자동 OpenAPI 문서를 활용한다.
4. **역할 분담이 명확:** Next.js는 화면, FastAPI는 비즈니스 로직·DB·향후 Agent를 담당한다.

### 확정 아키텍처

```text
frontend/  Next.js + React + TypeScript
           │ HTTP JSON (필터 및 검색 결과)
           ▼
backend/   FastAPI + Pydantic + SQLAlchemy (Python)
           │ SQL
           ▼
           PostgreSQL (notebooks, cars)

[2차] LangGraph는 backend/에 추가하고 동일한 검색 함수 재사용
```

**운영 시 고려할 점:** Next.js와 FastAPI는 각각 실행·배포할 서버가 있고 CORS(또는 프록시), API 계약, 환경변수를 관리해야 한다. 단기적인 설정 비용보다 향후 Python Agent와 검색 로직의 재사용성을 더 중요하게 판단해 이 구성을 확정했다.

## 6. DB와 데이터 관련 기술을 고른 이유

### 6.1 PostgreSQL: 왜 MongoDB나 벡터 DB가 아닌가?

- 현재 노트북 2,181개, 전기차 302개는 제조사·가격·CPU·RAM·연식·주행거리처럼 **정형화된 필드**가 중심이다.
- `WHERE`, `ORDER BY`, `LIMIT`, 집계로 정확한 조건 검색을 만들 수 있다.
- `notebooks`, `cars` 두 테이블로 관리하기 쉽다.
- 원본 전체 42개/41개 컬럼은 `JSONB`에 함께 보관할 수 있어 처음부터 모든 컬럼을 완벽하게 정규화할 필요가 없다.
- 나중에 벡터 검색이 정말 필요해지면 PostgreSQL을 유지하며 확장할 수 있다.

**선정 이유:** 현재 문제에 필요한 기능을 가장 직접적으로 해결하는 기술이 SQL DB이기 때문이다.

### 6.2 SQLAlchemy: Python 검색 로직

- **FastAPI 백엔드에서 SQLAlchemy를 사용**하여 검색 조건을 안전하게 조합한다.
- 추후 LangGraph가 동일한 Python 검색 함수를 호출해 SQL 동작을 재사용할 수 있다.
- 사용자 입력을 SQL 문자열에 그대로 붙이지 않고 **바인딩 파라미터**를 사용한다.

### 6.3 Python + Pandas: 왜 사용하나요?

CSV에는 `registered_month` 같은 민감한 문자열과 누락값이 많다. Python/Pandas는 컬럼 검사, 문자열 안전 읽기, 결측치 처리, 타입 변환, 적재 검증 스크립트를 작성하기 쉽다. **전처리 스크립트와 검색 백엔드가 Python 언어를 공유하므로 정제 규칙을 재사용하기 좋다.**

## 7. UI 기술 선택 이유

| 도구 | 사용 목적 | 선택 근거 | 초기 전략 |
|---|---|---|---|
| **TypeScript strict** | UI/API 타입 안정성 | 두 데이터셋에서 가격·ID·NULL 타입 혼동 감소 | 사용 |
| **Tailwind CSS** | 빠른 화면·반응형 구성 | 조건 패널과 카드 레이아웃 조립에 유리 | 사용 |
| **shadcn/ui** | 체크박스, 선택창, 슬라이더 | 필요한 컴포넌트 코드만 프로젝트에 포함해 수정 가능 | 꼭 필요한 것만 |
| **TanStack Query** | 서버 상태/캐시 | 검색 캐시·요청 중단·페이징이 복잡해질 때 유용 | MVP에서는 보류 가능 |
| **React 상태 / URL 검색 파라미터** | 현재 필터 상태 보관 | 새로고침·링크 공유 시 필터 재현 가능 | 단순 구현부터 |

**무조건 기술을 많이 사용하지 않는 것이 중요하다.** 특히 상태 관리 라이브러리나 UI 패키지를 처음부터 여러 개 도입하지 않는다.

## 8. LangGraph·DeepSeek·OpenRouter를 왜 나중에 쓰나요?

초기 MVP 검색은 필터 값이 정확하면 SQL만으로 충분하다. LLM을 처음부터 끼워 넣으면 검색 결과 오류 원인이 **DB/필터/API/모델** 중 어디인지 복잡해진다.

**2차 개발에서의 역할:**

1. 사용자가 “150만 원 이하, RAM 16GB 이상, 가벼운 노트북”이라고 입력한다.
2. LLM(예: OpenRouter 경유 DeepSeek)이 자연어를 검증 가능한 **필터 JSON**으로 바꾼다.
3. LangGraph가 도구를 호출한다.
4. 도구가 **기존 `notebooks` 테이블 검색 함수**를 사용한다.
5. 검색 결과에 있는 사실만 설명한다.

LangGraph를 선택하는 이유는 노드, 상태, 분기, 도구 호출, 후속 대화 흐름을 명확히 관리할 수 있기 때문이다. **RAG/pgvector는 리뷰나 설명의 의미 검색이 필요한 시점까지 보류**한다. 모델 API 사용료와 품질은 실제 평가셋으로 비교한다.

## 9. 개발 AI 역할과 코드 공유 기준

- **Codex:** 데이터 적재·DB·검색 API 구현, 통합 책임.
- **Gemini/Antigravity:** 노트북/자동차 탭, 필터 UI, 반응형 화면 구현.
- **DeepSeek:** 통합 테스트 케이스 초안, 예외·데이터 품질 독립 검토.
- **공통 원칙:** 소스는 하나의 Git 저장소가 기준이다. **프로젝트 폴더 안에 복제본 여러 벌을 쌓지 않는다.**
- 동시에 작업한다면 브랜치/별도 Git worktree를 사용한다. 가장 쉬운 시작은 **같은 저장소에서 순차 작업**하는 방식이다.
- 기획안만으로는 부족하다. `docs/API_CONTRACT.md`, `docs/DATA_DICTIONARY.md`, `AGENTS.md` 등 API·데이터·작업 경로 계약을 제공한다.

**확정 역할별 작업 경로:** Codex는 `backend/`, `data/`를 담당하고 Gemini는 `frontend/`를 담당한다. `docs/API_CONTRACT.md`, 공통 환경설정 등 공유 파일은 담당자를 정해 충돌 없이 수정한다.

## 10. 프로젝트의 권장 순서

**MVP 구현:** 테이블 2개 → 두 CSV 적재 → 노트북 검색 화면/서버 → 자동차 검색 화면/서버 → 탭·정렬·페이징 연결.  
**MVP 안정화:** 필수 기능 전체가 연결된 후 통합·시나리오 테스트를 집중 진행.  
**확장:** LangGraph 자연어 검색 → 품질 평가 → 비교·추천 → 필요할 때 RAG.

### 결론

- **React**를 고른 이유: 변화가 많은 필터·검색 화면을 컴포넌트로 쉽게 개발하기 때문.
- **Next.js**를 고른 이유: React UI에 라우팅·렌더링을 제공하여 조건 검색 화면을 빠르게 만들 수 있기 때문. 이번 프로젝트의 업무 검색 API는 FastAPI가 담당한다.
- **Node.js**를 사용하는 이유: Next.js 서버 기능을 실행하는 JavaScript 런타임이기 때문.
- **PostgreSQL**을 고른 이유: 현재 데이터셋의 정확한 SQL 조건 검색이 핵심이기 때문.
- **FastAPI**를 확정한 이유: Python CSV 전처리·SQL 검색·향후 LangGraph를 한 언어와 백엔드에서 재사용하기 위해서.

## 11. 참고: 공식 문서

1. React 공식 소개 — https://react.dev/
2. Next.js 공식 소개 — https://nextjs.org/docs
3. Next.js Server / Client Components — https://nextjs.org/docs/app/getting-started/server-and-client-components
4. Next.js Deploying — https://nextjs.org/docs/app/getting-started/deploying
5. Node.js 소개 — https://nodejs.org/learn/getting-started/introduction-to-nodejs
6. FastAPI 관계형 데이터베이스 — https://fastapi.tiangolo.com/tutorial/sql-databases/
7. FastAPI 공식 튜토리얼 — https://fastapi.tiangolo.com/tutorial/

**참고:** 기술 선택 문서는 현재 MVP의 목적과 사용자가 확정한 아키텍처를 바탕으로 작성했다. 라이브러리 버전과 서비스 요금은 실제 설치·배포 시 다시 확인한다.
