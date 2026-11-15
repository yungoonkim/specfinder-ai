# SpecFinder AI — QA 증거 자료 목록

> 기준일 2026-11-15 (KST) · 실데이터 브라우저 QA 증거. 원본 ZIP은 사용자 로컬에 별도 보존한다.

## 저장된 증거

- 상세 보고서: [`FINAL_REGRESSION_REPORT_2026-11-15.md`](FINAL_REGRESSION_REPORT_2026-11-15.md)
- 역전 범위 6종 HTTP 422 및 Decimal 값 JSON 기록: [`logs/pr3_before_after_verification.json`](logs/pr3_before_after_verification.json)
- Gemini Computer Use 스크린샷 **9개 고유 파일** (원본 ZIP에는 10개 항목이 있지만 01과 06이 동일 이미지)

| 스크린샷 파일 | 내용 |
|---|---|
| `01_notebooks_all_2181.png` | 원본 Browser QA 스크린샷 |
| `02_cars_all_302.png` | 원본 Browser QA 스크린샷 |
| `03_notebooks_composite_45.png` | 원본 Browser QA 스크린샷 |
| `04_cars_composite_30.png` | 원본 Browser QA 스크린샷 |
| `05_inverted_range_422_ui.png` | 원본 Browser QA 스크린샷 |
| `07_notebook_detail_122624573.png` | 원본 Browser QA 스크린샷 |
| `08_car_detail_direct_61386067.png` | 원본 Browser QA 스크린샷 |
| `09_mobile_390px_cars.png` | 원본 Browser QA 스크린샷 |
| `10_mobile_390px_notebooks.png` | 원본 Browser QA 스크린샷 |

## 집계와 주의점

- **최종 QA 보고서:** A(3) + B(8) + C(10) + D(11개 보고서 행) + E(4) = **36 PASS / 0 FAIL**.
- **S-1/S-2:** 실제 PostgreSQL 또는 FastAPI 종료가 필요한 장애 테스트 **2 BLOCKED**. 실시 여부를 PASS로 오기하지 않는다.
- 원본의 `D-10 & 11`은 한 행에 묶여 있다. 따라서 항목 번호 수와 보고서 행 개수는 일치하지 않을 수 있다.
- 원본의 `06_decimal_json_number_cards.png`는 `01_notebooks_all_2181.png`와 동일한 이미지(바이트 중복). 숫자 타입의 독립 검증 증거는 브라우저 화면만이 아니라 JSON 로그에 있다.
- 응답 데이터는 실시간 매물 정보가 아니라 CSV 수집 스냅샷이다.

## 근거 링크

- 최초 UI MVP: https://github.com/yungoonkim/specfinder-ai/pull/1
- 최초 백엔드 MVP: https://github.com/yungoonkim/specfinder-ai/pull/2
- 안정화 수정: https://github.com/yungoonkim/specfinder-ai/pull/3
- 로컬 원본 아카이브: `specfinder-integration-report.zip` 및 `specfinder-qa-final-regression-20261115.zip` (사용자 Downloads에 별도 보관)
