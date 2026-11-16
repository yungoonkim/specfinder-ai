# SpecFinder AI — Ego Browser 기반 노트북 결측치 조사 및 보완 보고서 (1차 파일럿 20개)

> 작성일시: 2026-11-16 (`checked_at`: `2026-11-16T16:30:00+09:00`)  
> 작업 범위: `data/enrichment/input/` 기준 기존 2,181개 제품 중 ASUS·MSI를 제외한 **1차 파일럿 20개 제품** 조사·검증·보완  
> 사용 도구: `ai-browser` MCP (Ego Browser) 순차 탐색 (SerpAPI/Tavily/Vertex AI Search 미사용, 소스코드 및 DB 미수정)

---

## 1. 작업 개요 및 전체 대상 분석

- **원본 데이터 규모**: `notebooks_main.csv` **2,181개 제품 / 40개 컬럼**, `notebook_attributes.csv` **629행**, `notebook_attribute_catalog.csv` **35개 속성** (`dataset_metadata.csv`: `danawa_notebooks, 2026-10-30, 2181`).
- **제조사별 분포 (전체 2,181개)**:
  - **조사 제외 (869개)**: `MSI` 563개, `ASUS` 306개 — 원형 100% 보존 (`eligible_products.csv` 미포함, `notebooks_main_enriched.csv` 및 `notebook_attributes_enriched.csv` 셀 변경 0건).
  - **신규 조사 대상 (`eligible_products.csv`, 1,312개 / 10개 제조사)**:
    `HP` 494개, `LG전자` 328개, `레노버` 215개, `삼성전자` 172개, `에이서` 38개, `DELL` 34개, `GIGABYTE` 12개, `APPLE` 9개, `Microsoft` 5개, `Razer` 5개 (1,312개 모두 우선순위 A/B/C 결측치 1개 이상 보유).
- **1차 파일럿 선정 (20개)**: 10개 대상 제조사를 모두 포함하고 우선순위 A 결측치가 많은 제품 중심으로 선정 (`HP` 3, `LG전자` 3, `삼성전자` 3, `레노버` 2, `DELL` 2, `에이서` 2, `Microsoft` 2, `APPLE` 1, `GIGABYTE` 1, `Razer` 1).

---

## 2. 조사 및 상태 분류 요약

총 20개 제품에 대해 **178건**의 결측·특수 사양 항목을 조사하여 `enrichment_candidates.csv`에 기록했습니다.

| 구분 | 건수 | 반영 여부 | 설명 |
|---|---:|---|---|
| **VERIFIED (기본 테이블 `notebooks_main`)** | **18** | **반영 완료** (8개 제품) | 다나와 공식 상세이미지·제조사 공식 스펙·Intel ARK·Lenovo PSREF·Microsoft Store·Acer 보도자료·iFixit 정품 OEM 부품 등으로 교차 검증 완료 |
| **VERIFIED (특수 속성 `notebook_attributes`)** | **21** | **신규 행 추가** (14개 제품) | 기존 35개 카탈로그 속성 내 (`color`, `usb_c_adapter_w`, `display_ppi`, `srgb_support`, `ram_replaceable_slots`, `ntsc_percent`, `secondary_brightness_nit`, `screen_response_time_ms`) |
| **NOT_APPLICABLE** | **62** | 빈칸 유지 | 내장그래픽의 `vram_gb`·`tgp_w`, NPU 미탑재 CPU의 `npu_tops`, Intel EU 기반 iGPU의 `gpu_core_count`, USB-C 전용 모델의 `dc_input_listed` |
| **UNRESOLVED** | **77** | 빈칸 유지 | 제조사 스펙 미공개, 접근 차단(Akamai/HTTP2), B2B/구성변경 파생 모델 개별 명세 부재, 외장 GPU CUDA 코어 수 기준 상이 등 |
| **CONFLICT** | **0** | 빈칸 유지 | 기존 비결측 셀과의 직접 충돌 없음 (단, `355` CPU 타사 행 2 vs 4 차이는 비고란에 기록) |

---

## 3. 기본 CSV (`notebooks_main_enriched.csv`) 보완 상세 (18셀)

| product_code | 제조사 | 모델명 | 컬럼 | 보완 값 | 근거 요약 및 출처 |
|---|---|---|---|---|---|
| `122631325` | HP | 15-fc0751AU | `cpu_clock_ghz` | `2.0` | Ryzen 7 7730U Base 2.0 GHz (`List_of_AMD_Ryzen_processors`) + 다나와 오타 `2.0Hz` 교차확인 |
| `122631325` | HP | 15-fc0751AU | `gpu_core_count` | `8` | 다나와 상세이미지 공식 사양표 `AMD Radeon Graphics (VEGA8) 8코어` |
| `124423792` | HP | 15-fc0004AU | `gpu_core_count` | `2` | Athlon Silver 7120U 내장 Radeon 610M `2 CU` (`List_of_AMD_Athlon_processors`) |
| `124492454` | LG전자 | 2026 그램 프로17 17Z90U-GZ7HL | `gpu_core_count` | `4` | Intel ARK `245722` (Core Ultra 7 355): `Xe-cores: 4` |
| `124411986` | 삼성전자 | 갤럭시북6 NT740VJQ-A51A | `battery_wh` | `61.2` | 다나와 내 삼성 공식 사양표(`NT740VJQ-A51AG`): `배터리 용량 (Typical)(Wh): 61.2` (`61.2 W` 미확인 이슈 해소) |
| `124411986` | 삼성전자 | 갤럭시북6 NT740VJQ-A51A | `gpu_core_count` | `2` | Intel ARK `246127` (Core 5 315): `Xe-cores: 2` |
| `63479408` | 레노버 | V15 ABP G4 R5 | `refresh_hz` | `60.0` | Lenovo PSREF `Lenovo_V15_G4_ABP`: 15.6" FHD TN/IPS 모두 `60Hz` |
| `63479408` | 레노버 | V15 ABP G4 R5 | `cpu_clock_ghz` | `2.3` | Lenovo PSREF `Lenovo_V15_G4_ABP`: Ryzen 5 7430U Base `2.3GHz` |
| `63479408` | 레노버 | V15 ABP G4 R5 | `gpu_core_count` | `7` | Ryzen 5 7430U Radeon Vega `7 CU` (`List_of_AMD_Ryzen_processors` 및 CSV `56059505` 7코어 일치) |
| `63479408` | 레노버 | V15 ABP G4 R5 | `max_battery_hours` | `12.8` | Lenovo PSREF `45Wh`: `Local video (1080p) playback@150nits: 12.8 hr` (참고: `MobileMark 2018: 8.3 hr`) |
| `122717560` | 레노버 | 아이디어패드 Slim3 16IWC11 Core3 WIN11 16GB램 | `weight_kg` | `1.68` | Lenovo PSREF `IdeaPad_Slim_3_16IWC11`: 50Wh + IPS 구성 `Starting at 1.68 kg` |
| `122717560` | 레노버 | 아이디어패드 Slim3 16IWC11 Core3 WIN11 16GB램 | `gpu_core_count` | `1` | Intel ARK `246020` (Core 3 304): `Xe-cores: 1` |
| `122717560` | 레노버 | 아이디어패드 Slim3 16IWC11 Core3 WIN11 16GB램 | `dc_input_listed` | `1` | Lenovo PSREF: `65W round tip (3-pin) AC adapter` + `1x Round tip power connector` |
| `124469517` | 에이서 | 아스파이어 16 A16-I71M | `resolution_width_px` | `1920` | Acer 공식 보도자료(PR Newswire `A16-I71M/T`) `WUXGA (1920x1200)` + 다나와 `122673612` 교차검증 |
| `124469517` | 에이서 | 아스파이어 16 A16-I71M | `resolution_height_px` | `1200` | 동일 근거 (`1920x1200 WUXGA`) |
| `124469517` | 에이서 | 아스파이어 16 A16-I71M | `resolution_label` | `WUXGA` | 동일 근거 (`WUXGA`) |
| `29376218` | Microsoft | 서피스 고4 기업용 | `battery_wh` | `27.76` | Microsoft 공식 수리 파트너 iFixit 정품 OEM 배터리(`EP2-69319`): `27.76 Wh` |
| `124527411` | Microsoft | 서피스 랩탑 울트라 6144코어 나이트폴 | `battery_wh` | `92.0` | Microsoft Store 공식 Tech Specs: `Battery Capacity Nominal (Wh): 92` (Min 89) |

---

## 4. 특수 속성 CSV (`notebook_attributes_enriched.csv`) 추가 상세 (21행, 629 → 650행)

- `122631325` (`HP 15-fc0751AU`): `color = Natural silver`
- `71906042` (`LG전자 울트라PC 15U50T-GROWK`): `color = 타이탄 실버`
- `13275575` (`LG전자 2021 그램16 16ZD90P-GX76K`): `color = 스노우 화이트`
- `124411986` (`삼성전자 갤럭시북6 NT740VJQ-A51A`): `color = Gray`, `usb_c_adapter_w = 45`
- `98230064` (`삼성전자 갤럭시북4 NT750XGR-A28A`): `color = 그레이`, `usb_c_adapter_w = 45`
- `18936479` (`삼성전자 갤럭시북3 360 NT750QFG-KP51S`): `color = Silver`, `usb_c_adapter_w = 65`
- `63479408` (`레노버 V15 ABP G4 R5`): `ntsc_percent = 45`
- `122717560` (`레노버 아이디어패드 Slim3 16IWC11`): `ram_replaceable_slots = 1`
- `122636523` (`DELL Pro 14 PC14255-WH04KR`): `color = 플래티넘 실버`
- `29376218` (`Microsoft 서피스 고4 기업용`): `display_ppi = 220`, `srgb_support = sRGB and Enhanced`
- `124527411` (`Microsoft 서피스 랩탑 울트라 6144코어 나이트폴`): `display_ppi = 262`, `srgb_support = sRGB and Vivid`, `color = Nightfall`
- `123436188` (`GIGABYTE EAGLE 9MJ`): `ram_replaceable_slots = 2`
- `106764560` (`APPLE 맥북네오`): `usb_c_adapter_w = 20`
- `122721671` (`Razer Blade 16 U9 R5080 32G`): `secondary_brightness_nit = 1100`, `screen_response_time_ms = 0.2`

*(참고: 기존 카탈로그에 없는 `battery_life_test_standard`, `panel_technology` 2건은 `proposed_new_attributes.csv`에 제안으로만 기록했으며 `input/notebook_attribute_catalog.csv`는 수정하지 않았습니다.)*

---

## 5. 미확인 사유, 접근 제한 및 특이사항

1. **제조사 사이트 접근 차단 (우회 미시도)**: `dell.com`, `gigabyte.com`, `aorus.com`, `acer.com`은 Akamai Access Denied 또는 HTTP2 차단으로 접근이 거부되어 우회 없이 `UNRESOLVED` 처리했습니다(단, `122636523` 및 `123436188`은 다나와 상품 상세정보 내 공식 사양 이미지로 일부 확인, `124469517`은 Acer 공식 PR Newswire 보도자료로 해상도 확인).
2. **B2B / 구성변경 파생 모델**: LG `17Z90U-GZ7HL`(`124492454`)는 `lge.co.kr`에서 검색되지 않아 타 옵션(`17Z90U-GS5ZK`)의 밝기·배터리 시간을 무단 복사하지 않고 `UNRESOLVED`로 남겼습니다.
3. **사양 기준 주의**:
   - Apple `MacBook Neo`(`106764560`) 공식 스펙의 `60Hz`는 **외장 디스플레이 최대 주사율**이므로 내장 패널 `refresh_hz`에 반영하지 않았습니다.
   - Surface Laptop Ultra(`124527411`) N1X의 AI 성능 `1 petaflop`은 사전 규칙에 따라 기존 `cpu_pelop=1`로 유지하고 `npu_tops`로 환산하지 않았습니다.
   - `Core Ultra 7 355`(`124492454`)의 Intel ARK 공식 GPU 코어 수는 `Xe-cores: 4`로 확인되어 `4`를 반영했으나, 기존 CSV의 타사(MSI) 일부 행은 `2`로 기록되어 있어 후속 배치 시 교차 점검이 필요합니다.

---

## 6. 데이터 무결성 검증 결과 (전수 통과)

| 검증 항목 | 결과 |
|---|---|
| `notebooks_main_enriched.csv` 행 수 / 컬럼 수 | **2,181행 / 40컬럼** (`captured_at`, `first_page`, `last_page` 미생성) |
| `product_code` 집합 일치 및 중복 | **완전 일치, 중복 0건** |
| 기존 비결측 셀 변경 건수 | **0건** |
| ASUS / MSI 행 및 특수 속성 변경 건수 | **0건** (메인·속성 100% 원형 보존) |
| 신규 반영된 메인 CSV 셀 (`VERIFIED`만) | **18셀** |
| `notebook_attributes_enriched.csv` 행 수 / 키 중복 / 단일 값 컬럼 | **650행 (기존 629행 동일 유지 + 신규 21행) / 중복 0건 / 타입별 1개 컬럼만 채움** |
| UTF-8 BOM (`utf-8-sig`) 인코딩 | **출력 CSV 5종 전체 확인 완료** |

### 입출력 파일 SHA-256 확인
- **입력 파일 (`data/enrichment/input/`, 작업 전후 동일 — 0바이트 변경)**:
  - `danawa_notebook.csv`: `448B72CE733F1A5EE1F81F30C7DE10E7B64B2C054319CDD32A2F7F0E20E8EA50`
  - `dataset_metadata.csv`: `69106C85E88D997DEDDC55EBAB5BA8CA34CE9A3AB0DAA56BAB3DF80B32C505DB`
  - `notebooks_main.csv`: `3087BDE7AF35252E1A06BEA5813E774C299C6B2076BA6CCFC2AECDEA7F12F73E`
  - `notebook_attributes.csv`: `BAA82B47635943582190FC13E674F4DAEB9D05A392427D61D8B39819C0EAB4C0`
  - `notebook_attribute_catalog.csv`: `A6F44609404345E3346B429B180B364399BAA583A99C93B32213FA886CD480E7`
  - `specfinder_notebook_column_dictionary.md`: `0AB78D40055C9B780C28224935AC128CCA8617F2707C218276915590F42F08C9`
- **출력 파일 (`data/enrichment/output/`)**:
  - `eligible_products.csv`: `555351276E74ED4B674D312E5CB8EAD1AA81E27C62D89E2120984282A12CF2B6`
  - `enrichment_candidates.csv`: `4D60863C24B5389AB63387719F18A37A759AEF611BBC93E28AC4B784E6A0FF4D`
  - `notebooks_main_enriched.csv`: `2B2401C72A4C24C6AB74ADC21E3A581633611ECD77C5080E4B49A899B80BD33D`
  - `notebook_attributes_enriched.csv`: `310FD9C4F5A40649CE70E6C535951DE9FEE34181E6DB6F8864B4739ACE6823AC`
  - `proposed_new_attributes.csv`: `2C06178D3D1F66B09BAABC29716C9A0C2A076F9D0C3BA1847E23D27180AF7BB6`
