# SpecFinder AI — 노트북 CSV 컬럼 사전 및 웹 결측치 보완 규칙

작성 근거: 실제 `notebooks_main.csv`(2,181행 × 43컬럼), `notebook_attributes.csv`(629행 × 5컬럼), `notebook_attribute_catalog.csv`(35속성 × 4컬럼), `MIGRATION_GUIDE.md`, 변환 스크립트를 점검함.

**주의:** 이 자료는 새로운 CSV의 컬럼 의미를 설명하며, 데이터베이스에 적용되었다는 뜻이 아님. 원본 42컬럼 CSV는 그대로 보존함.

## 1. 파일 역할

- `notebooks_main.csv`: 각 제품에 1행, `product_code`가 유일키; 자주 쓰는 기본 검색 사양 및 가격·수집 메타데이터.
- `notebook_attributes.csv`: 일부 제품에서만 관측된 사양, `(product_code, attribute_name)` 1행; `value_number`, `value_boolean`, `value_text` 중 한 칸만 사용.
- `notebook_attribute_catalog.csv`: 허용된 희소 사양 35개에 대한 속성명, 타입, 현재 보유 건수, 저장 위치를 정의한 사전.
- `MIGRATION_GUIDE.md`: 새 스키마·적재기·API·AI 필터·테스트 변경 방향 문서.
- `split_validation_report.json`: 78컬럼 원본 정형 파일과 분할 결과의 검증 해시·건수.
- `split_notebook_csv.py`: 78컬럼 정형 파일에서 분할 CSV들을 재생성하는 스크립트.

## 2. notebooks_main.csv — 43개 컬럼

| 컬럼 | 의미 | 값 존재 | 결측 |
|---|---|---:|---:|
| `product_code` | 다나와 제품 고유 식별자. 두 데이터 테이블을 연결하는 키 | 2,181/2,181 | 0.0% |
| `name` | 제조사·제품군·세부 모델명이 포함된 상품명 | 2,181/2,181 | 0.0% |
| `own_configuration_price_krw` | 이 행이 대표하는 특정 구성의 관측 가격(원, 수집 당시) | 2,179/2,181 | 0.1% |
| `min_observed_configuration_price_krw` | 수집 과정에서 관측한 여러 구성 중 최저 가격(원, 현 서비스 검색·정렬 기준) | 2,179/2,181 | 0.1% |
| `observed_configuration_count` | 동일 제품에서 관측한 구성(configuration)의 개수 | 2,181/2,181 | 0.0% |
| `additional_collapsed_configurations` | 병합·축약된 추가 구성의 개수(수집 메타데이터) | 2,181/2,181 | 0.0% |
| `manufacturer` | 노트북 제조사 | 2,181/2,181 | 0.0% |
| `product_type` | 일반 노트북/AI노트북 등 상품 분류 | 2,181/2,181 | 0.0% |
| `screen_inches` | 화면 대각선 크기(인치) | 2,181/2,181 | 0.0% |
| `weight_kg` | 제품 무게(kg) | 2,177/2,181 | 0.2% |
| `os` | 운영체제 또는 프리도스 표기 | 2,181/2,181 | 0.0% |
| `max_battery_hours` | 원본에 명시된 최대 사용 시간(시간; 제조사/판매처 주장, 실측 아님) | 453/2,181 | 79.2% |
| `refresh_hz` | 디스플레이 주사율(Hz) | 1,604/2,181 | 26.5% |
| `brightness_nit` | 디스플레이 첫 번째/대표 밝기 값(nit) | 1,989/2,181 | 8.8% |
| `cpu_vendor` | CPU 제조사 | 2,181/2,181 | 0.0% |
| `cpu_series` | CPU 제품 계열·시리즈 | 2,181/2,181 | 0.0% |
| `npu_tops` | NPU AI 연산 성능(TOPS; 명시된 경우에만) | 1,199/2,181 | 45.0% |
| `gpu_type` | 그래픽 유형(내장/외장) | 2,181/2,181 | 0.0% |
| `gpu_model` | GPU 모델명 | 2,172/2,181 | 0.4% |
| `gpu_core_count` | GPU 코어 수(원본 표기 기준) | 528/2,181 | 75.8% |
| `vram_gb` | 그래픽 전용 메모리 크기(GB) | 1,124/2,181 | 48.5% |
| `tgp_w` | GPU 전력 예산(TGP, W) | 784/2,181 | 64.1% |
| `ram_gb` | RAM 용량(GB) | 2,180/2,181 | 0.0% |
| `battery_wh` | 배터리 에너지 용량(Wh; W와 혼동 금지) | 2,172/2,181 | 0.4% |
| `registered_month` | 원본 상품 등록 월 표기(예: 26.04) | 2,181/2,181 | 0.0% |
| `source_url` | 다나와 원본 제품 상세 주소 | 2,181/2,181 | 0.0% |
| `first_page` | 수집할 때 처음 등장한 목록 페이지(수집 메타데이터) | 2,181/2,181 | 0.0% |
| `last_page` | 수집할 때 마지막 등장한 목록 페이지(수집 메타데이터) | 2,181/2,181 | 0.0% |
| `captured_at` | 원본 정보가 수집된 날짜·시각(UTC 타임스탬프) | 2,181/2,181 | 0.0% |
| `cpu_model` | CPU 세부 모델명(클럭 표기와 분리) | 2,172/2,181 | 0.4% |
| `cpu_clock_ghz` | 원본 CPU 모델 표기에 적힌 클럭 수치(GHz; 기본/최대 여부 단정 금지) | 2,117/2,181 | 2.9% |
| `resolution_width_px` | 화면 가로 해상도(픽셀) | 2,180/2,181 | 0.0% |
| `resolution_height_px` | 화면 세로 해상도(픽셀) | 2,180/2,181 | 0.0% |
| `resolution_label` | 화면 해상도 표기 명칭(WUXGA 등) | 2,143/2,181 | 1.7% |
| `screen_diagonal_cm` | 화면 대각선 크기(cm) | 2,181/2,181 | 0.0% |
| `srgb_percent` | sRGB 색역 커버리지(%) | 529/2,181 | 75.7% |
| `dci_p3_percent` | DCI-P3 색역 커버리지(%) | 825/2,181 | 62.2% |
| `ram_replaceable` | RAM 교체 가능 여부(1 가능, 0 불가능, 빈칸 미확인) | 2,165/2,181 | 0.7% |
| `storage_capacity_gb` | 저장장치 용량(GB; 1TB→1000GB 표준화) | 2,180/2,181 | 0.0% |
| `usb_pd_supported` | 원본 USB-PD 표시 여부(1 명시, 0 DC만 표기한 경우; 물리적 미지원 확정 아님) | 2,181/2,181 | 0.0% |
| `dc_input_listed` | 원본에 DC 입력/어댑터 표기가 있는지(1 명시, 빈칸 미확인) | 1,170/2,181 | 46.4% |
| `shop_review_rating` | 원본 판매점 리뷰 평균 평점(수집 당시) | 663/2,181 | 69.6% |
| `shop_review_count` | 원본 판매점 리뷰 수(수집 당시, + 표기는 별도 속성) | 663/2,181 | 69.6% |

## 3. notebook_attributes.csv — 5개 컬럼

| 컬럼 | 의미 |
|---|---|
| `product_code` | 해당 속성이 속한 노트북의 식별자(`notebooks_main.product_code`와 연결) |
| `attribute_name` | 어떤 특수 사양인지 나타내는 정해진 속성 이름 |
| `value_number` | 숫자 사양의 값(단위는 속성 이름/카탈로그 정의에 따름) |
| `value_boolean` | 원본에 확인된 참/거짓(`true`/`false`); **공란은 false가 아님** |
| `value_text` | 문자·주석 등 텍스트 속성 값 |

**각 행에서 세 값 컬럼 중 정확히 하나만 채워지는 것이 정상**이며 나머지 두 칸은 결측이 아니라 자료형 분리 설계의 결과임. 특정 제품+속성 행 자체가 없으면 원본에서 값이 관측되지 않았다는 뜻.

## 4. notebook_attribute_catalog.csv — 4개 컬럼

| 컬럼 | 의미 |
|---|---|
| `attribute_name` | 특수 사양의 코드/필드명 |
| `value_type` | `number`, `boolean`, `text` 중 한 가지 자료형 |
| `non_null_count` | 해당 사양을 가진 속성 행 수(분리 당시 데이터 기준) |
| `stored_in` | 실제 속성 행이 저장된 곳 또는 현재 데이터에 없는 상태 |

### 카탈로그에 정의된 35개 속성별 의미

| 속성명 | 자료형 | 값 있는 제품 수 | 뜻 |
|---|---|---:|---|
| `cpu_pelop` | number | 14 | CPU·AI 성능의 원본 PELOP 값; TOPS로 변환하지 않음 |
| `gpu_max_q_listed` | boolean | 9 | GPU MAX-Q 표기가 원본에 존재함 |
| `display_ppi` | number | 12 | 화면 화소 밀도(PPI) |
| `two_in_one_listed` | boolean | 48 | 2-in-1 형태라고 원본에 명시됨 |
| `screen_response_time_ms` | number | 130 | 화면 응답속도(ms) |
| `secondary_brightness_nit` | number | 26 | 화면에 두 번째로 기재된 밝기값(nit; 피크 밝기라고 단정하지 않음) |
| `battery_runtime_claim_hours` | number | 2 | 최대 표기가 아닌 원본 사용 시간 주장(시간) |
| `battery_runtime_approximate` | boolean | 1 | 사용 시간이 약/대략이라고 표시됨 |
| `battery_runtime_estimated` | boolean | 1 | 사용 시간이 예상치라고 표시됨 |
| `srgb_support` | text | 6 | sRGB에 대한 정성적 지원 문구(수치 아님) |
| `dci_p3_support` | text | 8 | DCI-P3에 대한 정성적 지원 문구(수치 아님) |
| `ntsc_percent` | number | 121 | NTSC 색역 커버리지(%) |
| `ntsc_support` | text | 0 | NTSC의 정성적 지원 표기(현재 데이터 0건) |
| `adobe_rgb_percent` | number | 17 | Adobe RGB 색역 커버리지(%) |
| `adobe_rgb_support` | text | 0 | Adobe RGB 정성적 지원 표기(현재 데이터 0건) |
| `ram_replaceable_slots` | number | 60 | RAM 교체 가능한 슬롯의 표기 수 |
| `storage_type` | text | 1 | 별도로 기재된 저장장치 유형(예: UFS) |
| `battery_unverified_value` | number | 1 | 배터리 항목에 있으나 단위 오류 등으로 확정 불가한 원본 숫자 |
| `battery_unverified_unit` | text | 1 | 확정 불가 배터리 수치의 원본 단위(예: W) |
| `gpu_tgp_unverified_label` | text | 1 | 수치 대신 쓰인 미확인 GPU TGP 문자열 |
| `usb_c_adapter_w` | number | 19 | USB-C 어댑터의 정격 출력(W) |
| `apple_intelligence_listed` | boolean | 9 | Apple Intelligence 표기가 존재함 |
| `dual_display_listed` | boolean | 5 | 듀얼 디스플레이 특성이 명시됨 |
| `folio_stand_included` | boolean | 1 | 폴리오 스탠드가 포함된다고 표기됨 |
| `bluetooth_mouse_included` | boolean | 1 | 블루투스 마우스가 포함된다고 표기됨 |
| `office_2024_included` | boolean | 1 | Office 2024 포함 문구가 존재함 |
| `color` | text | 9 | 원본에 따로 명시된 제품 색상 |
| `virtual_keyboard_points` | number | 3 | 가상 키보드 포인트 수(원본 특수 사양) |
| `virtual_touchpad_points` | number | 3 | 가상 터치패드 포인트 수(원본 특수 사양) |
| `bluetooth_version_note` | text | 1 | 블루투스 버전 관련 원본 주의 문장 |
| `display_revision_note` | text | 1 | 화면 사양 변경 이력에 관한 원본 주석 |
| `shop_review_count_is_lower_bound` | boolean | 9 | 리뷰 수가 999+ 등 이상/하한값으로 표시됨 |
| `danawa_review_count` | number | 104 | 다나와 의견(댓글) 수(수집 당시) |
| `specs_text_exception` | text | 2 | 원본 전체 사양 문자열에 별도로 있던 예외 구성 정보 |
| `specs_text_format_variant` | text | 2 | 원본 전체 사양 문자열의 구분자/표기 방식 예외 기록 |

## 5. 웹 검색(MCP) 결측치 보완 원칙

1. 먼저 `product_code`와 `source_url`로 **정확히 같은 판매 구성/SKU**를 식별한다. 같은 제품군의 다른 옵션을 복사하지 않는다.
2. 공식 제조사 제품 스펙 및 신뢰 가능한 제품 페이지 등 **근거 URL**을 기록한다. 수집 당시 스냅샷과 현재 웹 정보를 구분하고, 가격·리뷰 수 등 변동값을 원본 시점 값으로 덮어쓰지 않는다.
3. 빈칸을 `0`·`false`·추정치로 일괄 채우지 않는다. 정보가 없는 경우는 `unknown/not_found/not_applicable`처럼 **확인 상태를 별도 기록**하고 기본 CSV를 그대로 둔다.
4. 데이터가 복수 구성/지역/연식에 따라 다를 수 있으면 값을 자동 확정하지 않고 검토 대상으로 남긴다.
5. `usb_pd_supported=0`은 원본에 DC만 표시된 경우이므로 **USB-PD 미지원의 공식 증명이 아니다**. `cpu_clock_ghz`는 기본/부스트 여부를 원본만으로 단정하지 않는다. `battery_unverified_value=61.2`, `battery_unverified_unit=W`를 61.2Wh로 무단 보정하지 않는다.
6. 메인 43개 사양의 누락값을 채울 때는 `product_code` 매핑과 필드별 자료형/단위 검증을 한다. 특수 사양은 결측 셀을 추가하는 게 아니라 해당 모델에 **새 `notebook_attributes` 행**을 추가한다.
7. 조사 결과는 `product_code, attribute_name, candidate_value, source_url, checked_at, confidence, status` 등 **별도 검증 후보 파일**로 먼저 저장한 뒤 승인된 값만 메인/속성 CSV에 반영한다.
8. `notebook_attribute_catalog.csv`의 `non_null_count`는 속성 CSV를 갱신할 때 재계산한다. 새로운 속성명은 카탈로그/검증 로직을 수정한 뒤 추가한다.
9. 제품 2,181개 유지, 속성 FK 일치, 중복 `(product_code, attribute_name)` 없음, 각 속성 행에서 타입 값 하나만 채움, 기존 비결측값 임의 변경 없음, 전후 SHA/통계 검사를 실시한다.

## 6. 우선 보완할 만한 메인 필드(현재 관측 커버리지)

| 검색 가치가 높은 항목 | 값 있는 제품 | 결측 건수 | 주의 |
|---|---:|---:|---|
| `refresh_hz` | 1,604 | 577 | 제품 옵션의 패널 종류 확인 |
| `npu_tops` | 1,199 | 982 | NPU가 없거나 공개하지 않은 경우 구분 |
| `vram_gb` | 1,124 | 1,057 | 내장 GPU에는 전용 VRAM 개념이 다를 수 있음 |
| `tgp_w` | 784 | 1,397 | 외장 GPU 중심; 내장 GPU는 해당없음일 수 있음 |
| `max_battery_hours` | 453 | 1,728 | 측정 방식이 다르므로 출처·측정 기준 명시 |
| `srgb_percent` | 529 | 1,652 | 측정 수치가 명시된 경우에만 |
| `dci_p3_percent` | 825 | 1,356 | 측정 수치가 명시된 경우에만 |

## 7. 마이그레이션 시 전달할 자료

LLM 개발 에이전트에는 `MIGRATION_GUIDE.md` **하나만** 전달하기보다 원본 CSV, 새 3 CSV, 분할 검증 보고서, 변환 스크립트, 이 컬럼 사전, 최신 GitHub 리포지토리 상태 및 Phase 2 병합 여부를 함께 제공한다. 새 DB 적용 전 반드시 백업, 신규 마이그레이션, 테스트 및 롤백 계획을 준비한다.

검증 범위: `split_validation_report.json`은 이전 78컬럼 정형 CSV의 **셀 단위 정확한 재구성**을 보장한다. 원본 42컬럼 CSV의 문자열/서식을 바이트 단위로 재구성하는 검증은 아니다.
