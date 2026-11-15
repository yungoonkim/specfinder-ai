# SpecFinder AI — 바이브 코딩 진행 가시성 문서 패키지

GitHub 저장소: https://github.com/yungoonkim/specfinder-ai
작성 기준: 2026-11-15, GitHub `main` 공통 문서.

## 적용할 파일

- `AGENTS.md` — 기존 파일을 **전체 교체**. 원래 1~8장 규칙을 유지하면서 보고 양식과 공통 문서 갱신 책임을 추가했습니다.
- `docs/PROGRESS.md` — 현재 기능별 상태를 한눈에 확인하는 문서 (초기 구현 여부는 미확인으로 표기).
- `docs/CHANGELOG.md` — 기능·사용자 경험의 의미 있는 변화를 기록.
- `docs/ARCHITECTURE.md` — 화면에서 DB까지의 동작 흐름 설명 (현재는 설계, 실제 파일은 구현 후 확정).
- `.github/pull_request_template.md` — Gemini/Codex가 PR을 만들 때 작업 보고 양식 제공.

## 적용 순서

1. 이 ZIP을 풀고 저장소 루트에 내용 그대로 복사합니다. `AGENTS.md`는 기존 파일을 덮어씁니다.
2. `git diff -- AGENTS.md docs .github` 로 변경 내용을 확인합니다.
3. `main`에서 문서를 먼저 커밋 및 Push합니다.
4. 생성된 `feature/ui`, `feature/backend` 브랜치가 있으면 최신 `main`의 공통 지침을 각 브랜치로 가져옵니다.
5. Gemini와 Codex는 작업 후 **한국어 결과 보고 + PR 본문**을 작성하고, 통합 담당자는 병합 후 `PROGRESS.md`를 갱신합니다.

```bash
git add AGENTS.md docs/PROGRESS.md docs/CHANGELOG.md docs/ARCHITECTURE.md .github/pull_request_template.md
git commit -m "docs: add vibe coding progress and reporting workflow"
git push origin main
```

> 기존 브랜치가 있으면 `main`에 문서를 등록한 후 각 작업 브랜치에 안전하게 병합/리베이스하세요. 로컬 변경 사항이 있으면 먼저 확인하고 무리하게 덮어쓰지 마세요.

## 추가 자료가 필요할까요?

추가 업로드는 필요하지 않습니다. GitHub의 `docs/PRD.md`, `docs/API_CONTRACT.md`, `docs/DATA_DICTIONARY.md`, `docs/PROJECT_STRUCTURE.md`, `docs/TECH_STACK.md`, `AGENTS.md`를 확인하여 만들었습니다.

**작업 실행 정보는 GitHub 문서만으로 알 수 없습니다.** 나중에 사용 중인 PC의 로그, 실패 메시지, 동작 영상/스크린샷 등은 문제가 발생할 때만 제공하면 됩니다.
