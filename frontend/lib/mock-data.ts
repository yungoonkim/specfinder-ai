import {
  CarDetail,
  CarFacetsResponse,
  CarFilterParams,
  CarItem,
  CarSearchResponse,
  FacetOption,
  NotebookDetail,
  NotebookFacetsResponse,
  NotebookFilterParams,
  NotebookItem,
  NotebookSearchResponse,
} from "@/types/api";

export const MOCK_NOTEBOOK_DETAILS: NotebookDetail[] = [
  {
    id: "122624573",
    name: "LG전자 그램북 16U55U-GSOWK",
    manufacturer: "LG전자",
    product_type: "AI노트북",
    cpu_vendor: "AMD",
    cpu_series: "라이젠AI 5",
    cpu_model: "430 (4.5GHz)",
    gpu_type: "내장그래픽",
    gpu_model: "Radeon 840M",
    ram_gb: 16,
    screen_inches: 16,
    weight_kg: 1.74,
    price_krw: 1218890,
    price_basis: "min_observed_configuration_price_krw",
    own_configuration_price_krw: 1218890,
    base_storage_text: "256GB",
    os: "윈도우11홈",
    source_url: "https://prod.danawa.com/info/?pcode=122624573&cate=112758",
    captured_at: "2026-10-30T08:06:03.274Z",
    registered_month: "26.04",
    observed_configuration_count: 4,
    specs_text:
      "AI노트북 / 40.6cm(16인치) / 1.74kg / 최대 30시간 / 윈도우11홈 / [화면] 1920x1200(WUXGA) / [CPU] AMD / 라이젠AI 5 / 430 (4.5GHz) / 50TOPS / [그래픽] 내장그래픽 / Radeon 840M / 4코어 / [구성] 16GB / 램 교체: 불가능 / 용량: 256GB / USB-PD / 77Wh",
  },
  {
    id: "103453760",
    name: "LG전자 2026 그램 프로16 16Z90U-KU7WK",
    manufacturer: "LG전자",
    product_type: "AI노트북",
    cpu_vendor: "인텔",
    cpu_series: "코어 울트라X7(S3)",
    cpu_model: "358H (4.8GHz)",
    gpu_type: "내장그래픽",
    gpu_model: "Arc B390",
    ram_gb: 32,
    screen_inches: 16,
    weight_kg: 1.19,
    price_krw: 3385490,
    price_basis: "min_observed_configuration_price_krw",
    own_configuration_price_krw: 3385490,
    base_storage_text: "1TB",
    os: "윈도우11홈",
    source_url: "https://prod.danawa.com/info/?pcode=103453760&cate=112758",
    captured_at: "2026-10-30T08:06:03.274Z",
    registered_month: "26.01",
    observed_configuration_count: 3,
    specs_text:
      "AI노트북 / 40.6cm(16인치) / 1.19kg / 윈도우11홈 / [화면] 2880x1800(WQXGA+) / 120Hz / [CPU] 인텔 / 코어 울트라X7(S3) / 358H (4.8GHz) / 47TOPS / [그래픽] 내장그래픽 / Arc B390 / 12코어 / [구성] 32GB / 램 교체: 불가능 / 용량: 1TB / USB-PD / 77Wh",
  },
  {
    id: "124012178",
    name: "삼성전자 갤럭시북6 NT740VJQ-A58A",
    manufacturer: "삼성전자",
    product_type: "노트북",
    cpu_vendor: "인텔",
    cpu_series: "코어5",
    cpu_model: "315 (4.4GHz)",
    gpu_type: "내장그래픽",
    gpu_model: "Intel Graphics",
    ram_gb: 8,
    screen_inches: 14,
    weight_kg: 1.35,
    price_krw: 1340000,
    price_basis: "min_observed_configuration_price_krw",
    own_configuration_price_krw: 1340000,
    base_storage_text: "256GB",
    os: "OS미포함(프리도스)",
    source_url: "https://prod.danawa.com/info/?pcode=124012178&cate=112758",
    captured_at: "2026-10-30T08:06:03.274Z",
    registered_month: "26.08",
    observed_configuration_count: 3,
    specs_text:
      "노트북 / 35.6cm(14인치) / 1.35kg / 최대 25시간 / OS미포함(프리도스) / [화면] 1920x1200(WUXGA) / 300nit / [CPU] 인텔 / 코어5 / 315 (4.4GHz) / 15TOPS / [그래픽] 내장그래픽 / Intel Graphics / [구성] 8GB / 램 교체: 불가능 / 용량: 256GB / USB-PD / 61.2Wh",
  },
  {
    id: "122626964",
    name: "MSI 펄스 A17 AI+ C3HWFKG-R7 QHD+",
    manufacturer: "MSI",
    product_type: "AI노트북",
    cpu_vendor: "AMD",
    cpu_series: "라이젠AI 7",
    cpu_model: "350 (5.0GHz)",
    gpu_type: "외장그래픽",
    gpu_model: "RTX5060",
    ram_gb: 16,
    screen_inches: 17,
    weight_kg: 2.8,
    price_krw: 2288360,
    price_basis: "min_observed_configuration_price_krw",
    own_configuration_price_krw: 2399000,
    base_storage_text: "512GB",
    os: "OS미포함(프리도스)",
    source_url: "https://prod.danawa.com/info/?pcode=122626964&cate=112758",
    captured_at: "2026-10-30T08:06:03.274Z",
    registered_month: "26.04",
    observed_configuration_count: 3,
    specs_text:
      "AI노트북 / 43.1cm(17인치) / 2.8kg / OS미포함(프리도스) / [화면] 2560x1600(WQXGA) / DCI-P3: 100% / 240Hz / 400nit / [CPU] AMD / 라이젠AI 7 / 350 (5.0GHz) / 50TOPS / [그래픽] 외장그래픽 / RTX5060 / VRAM: 8GB / TGP: 115W / [구성] 16GB / 램 교체: 가능 / 용량: 512GB / USB-PD(+DC) / 90Wh",
  },
  {
    id: "44762513",
    name: "삼성전자 갤럭시북4 NT750XGR-A51A WIN11",
    manufacturer: "삼성전자",
    product_type: "노트북",
    cpu_vendor: "인텔",
    cpu_series: "코어i5-13세대",
    cpu_model: "i5-1335U (1.3GHz)",
    gpu_type: "내장그래픽",
    gpu_model: "Iris Xe",
    ram_gb: 16,
    screen_inches: 15.6,
    weight_kg: 1.55,
    price_krw: 1288420,
    price_basis: "min_observed_configuration_price_krw",
    own_configuration_price_krw: 1288420,
    base_storage_text: "256GB",
    os: "윈도우11(설치)",
    source_url: "https://prod.danawa.com/info/?pcode=44762513&cate=112758",
    captured_at: "2026-10-30T08:06:03.274Z",
    registered_month: "24.03",
    observed_configuration_count: 5,
    specs_text:
      "노트북 / 39.6cm(15.6인치) / 1.55kg / 윈도우11(설치) / [화면] 1920x1080(FHD) / [CPU] 인텔 / 코어i5-13세대 / i5-1335U (1.3GHz) / [그래픽] 내장그래픽 / Iris Xe / [구성] 16GB / 램 교체: 불가능 / 용량: 256GB / USB-PD / 54Wh",
  },
  {
    id: "124434009",
    name: "ASUS ProArt P16 H7607BA-SE469W",
    manufacturer: "ASUS",
    product_type: "AI노트북",
    cpu_vendor: "엔비디아",
    cpu_series: "RTX Spark",
    cpu_model: "N1X",
    gpu_type: "내장그래픽",
    gpu_model: "Blackwell RTX",
    ram_gb: 24,
    screen_inches: 16,
    weight_kg: 1.77,
    price_krw: 5058710,
    price_basis: "min_observed_configuration_price_krw",
    own_configuration_price_krw: 5058710,
    base_storage_text: "1TB",
    os: "윈도우11홈",
    source_url: "https://prod.danawa.com/info/?pcode=124434009&cate=112758",
    captured_at: "2026-10-30T08:06:03.274Z",
    registered_month: "26.10",
    observed_configuration_count: 3,
    specs_text:
      "AI노트북 / 40.6cm(16인치) / 1.77kg / 윈도우11홈 / [화면] 3840x2400(WQUXGA) / DCI-P3: 100% / 120Hz / 700nit / [CPU] 엔비디아 / RTX Spark / N1X / [그래픽] 내장그래픽 / Blackwell RTX / 6144코어 / [구성] 24GB / 램 교체: 불가능 / 용량: 1TB / USB-PD / 99.9Wh",
  },
  {
    id: "122656006",
    name: "MSI 크로스헤어 16 Max HX E2WGXK-U9+ QHD+ OLED",
    manufacturer: "MSI",
    product_type: "노트북",
    cpu_vendor: "인텔",
    cpu_series: "코어 울트라9(S2)",
    cpu_model: "290HX Plus (5.5GHz)",
    gpu_type: "외장그래픽",
    gpu_model: "RTX5070",
    ram_gb: 16,
    screen_inches: 16,
    weight_kg: null,
    price_krw: null,
    price_basis: "min_observed_configuration_price_krw",
    own_configuration_price_krw: null,
    base_storage_text: "1TB",
    os: "OS미포함(프리도스)",
    source_url: "https://prod.danawa.com/info/?pcode=122656006&cate=112758",
    captured_at: "2026-10-30T08:06:03.274Z",
    registered_month: "26.05",
    observed_configuration_count: 3,
    specs_text:
      "노트북 / 40.6cm(16인치) / OS미포함(프리도스) / [화면] 2560x1600(WQXGA) / 165Hz / [CPU] 인텔 / 코어 울트라9(S2) / 290HX Plus / [그래픽] 외장그래픽 / RTX5070 / [구성] 16GB / 용량: 1TB (결측값 NULL 표기 확인용 샘플)",
  },
];

export const MOCK_CAR_DETAILS: CarDetail[] = [
  {
    id: "direct:61386067",
    title: "현대 아이오닉 5 롱레인지 AWD 프레스티지",
    manufacturer: "현대",
    model: "아이오닉 5",
    trim: "롱레인지 AWD 프레스티지",
    registration_year: 2022,
    registration_month: 12,
    mileage_km: 27795,
    price_krw: 38000000,
    price_basis: "asking_price_krw",
    branch_or_region: "천안",
    status_label: "상태표시없음",
    drive_text_explicit: "AWD",
    flag_extreme_mileage: false,
    thumbnail_url:
      "https://img.kcar.com/carpicture/carpicture08/pic6138/kcarM_61386067_045.jpg",
    source_url: "https://www.kcar.com/bc/search",
    captured_at: "2026-09-21T16:50:45.337+09:00",
    description: "★추가옵션 多★빌트인 캠★짧은 주행거리★테라브라운 실내",
    registration_text: "22년 12월식(23년형)",
    tags: ["KW6무료", "특옵션", "1인소유", "4WD"],
    flag_future_registration: false,
    first_captured_at: "2026-09-21T16:46:48.235+09:00",
  },
  {
    id: "direct:61386293",
    title: "현대 아이오닉 5 롱레인지 AWD 익스클루시브",
    manufacturer: "현대",
    model: "아이오닉 5",
    trim: "롱레인지 AWD 익스클루시브",
    registration_year: 2023,
    registration_month: 5,
    mileage_km: 24258,
    price_krw: 34900000,
    price_basis: "asking_price_krw",
    branch_or_region: "홈서비스 메가센터",
    status_label: "상태표시없음",
    drive_text_explicit: "AWD",
    flag_extreme_mileage: false,
    thumbnail_url:
      "https://img.kcar.com/3dcarpicture/2026/09/173/61386293_1/main/main780.jpg",
    source_url: "https://www.kcar.com/bc/search",
    captured_at: "2026-09-21T16:50:45.337+09:00",
    description: "소유주변경X★롱레인지★듀얼모터★컴포트★스센★내외관우수",
    registration_text: "23년 5월식",
    tags: ["KW6무료", "짧은 Km", "4WD", "제조사AS"],
    flag_future_registration: false,
    first_captured_at: "2026-09-21T16:46:37.412+09:00",
  },
  {
    id: "direct:61386802",
    title: "기아 EV6 롱 레인지 4WD 에어",
    manufacturer: "기아",
    model: "EV6",
    trim: "롱 레인지 4WD 에어",
    registration_year: 2021,
    registration_month: 12,
    mileage_km: 33158,
    price_krw: 30400000,
    price_basis: "asking_price_krw",
    branch_or_region: "장한평",
    status_label: "상태표시없음",
    drive_text_explicit: "4WD",
    flag_extreme_mileage: false,
    thumbnail_url:
      "https://img.kcar.com/3dcarpicture/2026/08/095/61386802_1/main/main780.jpg",
    source_url: "https://www.kcar.com/bc/search",
    captured_at: "2026-09-21T16:50:45.337+09:00",
    description: "＃ 배터리 잔존 98.96% ＃ 비흡연 ＃ 무사고 ＃ 짧은주행거리",
    registration_text: "21년 12월식(22년형)",
    tags: ["KW6무료", "짧은 Km", "신차급"],
    flag_future_registration: false,
    first_captured_at: "2026-09-21T16:46:48.235+09:00",
  },
  {
    id: "direct:61387985",
    title: "현대 아이오닉 6 롱레인지 2WD 익스클루시브",
    manufacturer: "현대",
    model: "아이오닉 6",
    trim: "롱레인지 2WD 익스클루시브",
    registration_year: 2023,
    registration_month: 5,
    mileage_km: 26297,
    price_krw: 31500000,
    price_basis: "asking_price_krw",
    branch_or_region: "청주",
    status_label: "상담중",
    drive_text_explicit: "2WD",
    flag_extreme_mileage: false,
    thumbnail_url:
      "https://img.kcar.com/3dcarpicture/2026/09/114/61387985_1/main/main780.jpg",
    source_url: "https://www.kcar.com/bc/search",
    captured_at: "2026-09-21T16:50:45.337+09:00",
    description: "#비흡연차량 #차량컨디션우수 #즉시출고가능 #가성비전기차",
    registration_text: "23년 5월식",
    tags: ["KW6무료", "짧은 Km", "보험이력없음"],
    flag_future_registration: false,
    first_captured_at: "2026-09-21T16:46:48.235+09:00",
  },
  {
    id: "direct:61388681",
    title: "쉐보레(GM대우) 볼트 EUV 전기 2WD 프리미어",
    manufacturer: "쉐보레(GM대우)",
    model: "볼트 EUV",
    trim: "전기 2WD 프리미어",
    registration_year: 2022,
    registration_month: 12,
    mileage_km: 90359,
    price_krw: 22400000,
    price_basis: "asking_price_krw",
    branch_or_region: "김포",
    status_label: "상태표시없음",
    drive_text_explicit: "2WD",
    flag_extreme_mileage: false,
    thumbnail_url:
      "https://img.kcar.com/3dcarpicture/2026/09/087/61388681_2/main/main780.jpg",
    source_url: "https://www.kcar.com/bc/search",
    captured_at: "2026-09-21T16:50:45.337+09:00",
    description: "●무사고●풀옵션●보증잔존●밸류플러스●고전압배터리리콜완●",
    registration_text: "22년 12월식",
    tags: ["KW6무료", "특옵션", "제조사AS", "세제혜택"],
    flag_future_registration: false,
    first_captured_at: "2026-09-21T16:46:37.412+09:00",
  },
  {
    id: "marketplace:CC00001038",
    title: "현대 아이오닉 5 롱레인지 프레스티지",
    manufacturer: "현대",
    model: "아이오닉 5",
    trim: "롱레인지 프레스티지",
    registration_year: 2022,
    registration_month: 4,
    mileage_km: 999000,
    price_krw: 34500000,
    price_basis: "asking_price_krw",
    branch_or_region: "분당용인",
    status_label: "상태표시없음",
    drive_text_explicit: null,
    flag_extreme_mileage: true,
    thumbnail_url: null,
    source_url: "https://www.kcar.com/bc/search",
    captured_at: "2026-09-21T16:50:45.337+09:00",
    description: null,
    registration_text: "22년 4월식",
    tags: ["KW6무료", "특옵션", "1인소유"],
    flag_future_registration: false,
    first_captured_at: "2026-09-21T16:46:48.235+09:00",
  },
];

function uniqueSortedOptions(values: Array<string | null | undefined>): FacetOption[] {
  const unique = Array.from(
    new Set(
      values
        .map((val) => (val ? val.trim() : ""))
        .filter((val) => val.length > 0)
    )
  ).sort((a, b) => a.localeCompare(b, "ko"));
  return unique.map((value) => ({ value, label: value }));
}

export function getMockNotebookFacets(): NotebookFacetsResponse {
  return {
    manufacturer: uniqueSortedOptions(MOCK_NOTEBOOK_DETAILS.map((n) => n.manufacturer)),
    cpu_vendor: uniqueSortedOptions(MOCK_NOTEBOOK_DETAILS.map((n) => n.cpu_vendor)),
    cpu_series: uniqueSortedOptions(MOCK_NOTEBOOK_DETAILS.map((n) => n.cpu_series)),
    gpu_type: uniqueSortedOptions(MOCK_NOTEBOOK_DETAILS.map((n) => n.gpu_type)),
  };
}

export function getMockCarFacets(): CarFacetsResponse {
  return {
    manufacturer: uniqueSortedOptions(MOCK_CAR_DETAILS.map((c) => c.manufacturer)),
    model: uniqueSortedOptions(MOCK_CAR_DETAILS.map((c) => c.model)),
    branch_or_region: uniqueSortedOptions(MOCK_CAR_DETAILS.map((c) => c.branch_or_region)),
  };
}

function stripNotebookDetail(detail: NotebookDetail): NotebookItem {
  const {
    specs_text: _specs,
    registered_month: _regMonth,
    observed_configuration_count: _obsCount,
    ...item
  } = detail;
  return item;
}

function stripCarDetail(detail: CarDetail): CarItem {
  const {
    description: _desc,
    registration_text: _regText,
    tags: _tags,
    flag_future_registration: _future,
    first_captured_at: _firstCap,
    ...item
  } = detail;
  return item;
}

export function searchMockNotebooks(params: NotebookFilterParams): NotebookSearchResponse {
  const page = params.page && params.page >= 1 ? params.page : 1;
  const pageSize =
    params.page_size && params.page_size >= 1 && params.page_size <= 100
      ? params.page_size
      : 20;
  const sort = params.sort ?? "id_asc";

  const filtered = MOCK_NOTEBOOK_DETAILS.filter((item) => {
    if (params.manufacturer && item.manufacturer !== params.manufacturer) return false;
    if (params.cpu_vendor && item.cpu_vendor !== params.cpu_vendor) return false;
    if (params.cpu_series && item.cpu_series !== params.cpu_series) return false;
    if (params.gpu_type && item.gpu_type !== params.gpu_type) return false;

    if (params.min_ram_gb !== undefined) {
      if (item.ram_gb === null || item.ram_gb < params.min_ram_gb) return false;
    }
    if (params.max_ram_gb !== undefined) {
      if (item.ram_gb === null || item.ram_gb > params.max_ram_gb) return false;
    }
    if (params.min_price_krw !== undefined) {
      if (item.price_krw === null || item.price_krw < params.min_price_krw) return false;
    }
    if (params.max_price_krw !== undefined) {
      if (item.price_krw === null || item.price_krw > params.max_price_krw) return false;
    }
    if (params.min_weight_kg !== undefined) {
      if (item.weight_kg === null || item.weight_kg < params.min_weight_kg) return false;
    }
    if (params.max_weight_kg !== undefined) {
      if (item.weight_kg === null || item.weight_kg > params.max_weight_kg) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const compareId = Number(a.id) - Number(b.id);
    if (sort === "price_asc") {
      if (a.price_krw === null && b.price_krw === null) return compareId;
      if (a.price_krw === null) return 1;
      if (b.price_krw === null) return -1;
      return a.price_krw !== b.price_krw ? a.price_krw - b.price_krw : compareId;
    }
    if (sort === "price_desc") {
      if (a.price_krw === null && b.price_krw === null) return compareId;
      if (a.price_krw === null) return 1;
      if (b.price_krw === null) return -1;
      return a.price_krw !== b.price_krw ? b.price_krw - a.price_krw : compareId;
    }
    if (sort === "ram_desc") {
      if (a.ram_gb === null && b.ram_gb === null) return compareId;
      if (a.ram_gb === null) return 1;
      if (b.ram_gb === null) return -1;
      return a.ram_gb !== b.ram_gb ? b.ram_gb - a.ram_gb : compareId;
    }
    if (sort === "weight_asc") {
      if (a.weight_kg === null && b.weight_kg === null) return compareId;
      if (a.weight_kg === null) return 1;
      if (b.weight_kg === null) return -1;
      return a.weight_kg !== b.weight_kg ? a.weight_kg - b.weight_kg : compareId;
    }
    if (sort === "newest_capture") {
      const timeA = a.captured_at ? new Date(a.captured_at).getTime() : 0;
      const timeB = b.captured_at ? new Date(b.captured_at).getTime() : 0;
      return timeA !== timeB ? timeB - timeA : compareId;
    }
    return compareId;
  });

  const total = sorted.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const items = sorted.slice(start, start + pageSize).map(stripNotebookDetail);

  return {
    items,
    total,
    page,
    page_size: pageSize,
    total_pages: totalPages,
  };
}

export function searchMockCars(params: CarFilterParams): CarSearchResponse {
  const page = params.page && params.page >= 1 ? params.page : 1;
  const pageSize =
    params.page_size && params.page_size >= 1 && params.page_size <= 100
      ? params.page_size
      : 20;
  const sort = params.sort ?? "id_asc";

  const filtered = MOCK_CAR_DETAILS.filter((item) => {
    if (params.manufacturer && item.manufacturer !== params.manufacturer) return false;
    if (params.model && item.model !== params.model) return false;
    if (params.branch_or_region && item.branch_or_region !== params.branch_or_region) {
      return false;
    }

    if (params.registration_year_min !== undefined) {
      if (
        item.registration_year === null ||
        item.registration_year < params.registration_year_min
      ) {
        return false;
      }
    }
    if (params.registration_year_max !== undefined) {
      if (
        item.registration_year === null ||
        item.registration_year > params.registration_year_max
      ) {
        return false;
      }
    }
    if (params.min_mileage_km !== undefined) {
      if (item.mileage_km === null || item.mileage_km < params.min_mileage_km) {
        return false;
      }
    }
    if (params.max_mileage_km !== undefined) {
      if (item.mileage_km === null || item.mileage_km > params.max_mileage_km) {
        return false;
      }
    }
    if (params.min_price_krw !== undefined) {
      if (item.price_krw === null || item.price_krw < params.min_price_krw) return false;
    }
    if (params.max_price_krw !== undefined) {
      if (item.price_krw === null || item.price_krw > params.max_price_krw) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const compareId = a.id.localeCompare(b.id, "en");
    if (sort === "price_asc") {
      if (a.price_krw === null && b.price_krw === null) return compareId;
      if (a.price_krw === null) return 1;
      if (b.price_krw === null) return -1;
      return a.price_krw !== b.price_krw ? a.price_krw - b.price_krw : compareId;
    }
    if (sort === "price_desc") {
      if (a.price_krw === null && b.price_krw === null) return compareId;
      if (a.price_krw === null) return 1;
      if (b.price_krw === null) return -1;
      return a.price_krw !== b.price_krw ? b.price_krw - a.price_krw : compareId;
    }
    if (sort === "mileage_asc") {
      if (a.mileage_km === null && b.mileage_km === null) return compareId;
      if (a.mileage_km === null) return 1;
      if (b.mileage_km === null) return -1;
      return a.mileage_km !== b.mileage_km ? a.mileage_km - b.mileage_km : compareId;
    }
    if (sort === "year_desc") {
      if (a.registration_year === null && b.registration_year === null) return compareId;
      if (a.registration_year === null) return 1;
      if (b.registration_year === null) return -1;
      return a.registration_year !== b.registration_year
        ? b.registration_year - a.registration_year
        : compareId;
    }
    if (sort === "newest_capture") {
      const timeA = a.captured_at ? new Date(a.captured_at).getTime() : 0;
      const timeB = b.captured_at ? new Date(b.captured_at).getTime() : 0;
      return timeA !== timeB ? timeB - timeA : compareId;
    }
    return compareId;
  });

  const total = sorted.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const items = sorted.slice(start, start + pageSize).map(stripCarDetail);

  return {
    items,
    total,
    page,
    page_size: pageSize,
    total_pages: totalPages,
  };
}
