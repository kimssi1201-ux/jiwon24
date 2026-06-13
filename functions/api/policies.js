const ENDPOINT = "https://api.odcloud.kr/api/gov24/v3/serviceList";

const manualPolicies = [
  {
    id: "gov24-unclaimed-refund",
    title: "정부24 미환급금 찾기",
    type: "환급금",
    institution: "행정안전부",
    deadline: "상시",
    views: 52000,
    maxBenefit: "미환급금 조회",
    region: "전국",
    income: "무관",
    target: "국세, 지방세, 보관금 등 미환급금 여부를 확인하려는 국민",
    method: "정부24 미환급금 찾기 서비스에서 본인 확인 후 조회",
    summary: "각 기관에 흩어진 미환급금 조회 경로를 한 번에 확인할 수 있는 정부24 서비스입니다.",
    tags: ["환급금", "정부24", "전국"],
    sourceUrl: "https://www.gov.kr/portal/service/serviceInfo/174100000054",
    featured: true,
  },
  {
    id: "hometax-national-tax-refund",
    title: "홈택스 국세환급금 찾기",
    type: "환급금",
    institution: "국세청",
    deadline: "상시",
    views: 49500,
    maxBenefit: "국세 환급금",
    region: "전국",
    income: "무관",
    target: "국세 환급금 발생 여부를 확인하려는 납세자",
    method: "홈택스에서 환급금 조회 메뉴 이용",
    summary: "국세청 홈택스에서 소득세, 부가가치세 등 국세 환급금 여부를 확인할 수 있습니다.",
    tags: ["환급금", "국세", "홈택스"],
    sourceUrl: "https://hometax.go.kr/",
    featured: true,
  },
  {
    id: "wetax-local-tax-refund",
    title: "위택스 지방세 환급금 조회",
    type: "환급금",
    institution: "행정안전부",
    deadline: "상시",
    views: 43000,
    maxBenefit: "지방세 환급금",
    region: "전국",
    income: "무관",
    target: "지방세 환급금 발생 여부를 확인하려는 납세자",
    method: "위택스에서 환급금 조회 및 신청",
    summary: "지방세 과오납 등으로 생긴 환급금을 위택스에서 조회하고 신청할 수 있습니다.",
    tags: ["환급금", "지방세", "위택스"],
    sourceUrl: "https://www.wetax.go.kr/",
    featured: true,
  },
  {
    id: "kinfa-loan-products",
    title: "서민금융진흥원 대출상품 한눈에",
    type: "대출",
    institution: "서민금융진흥원",
    deadline: "상시",
    views: 41000,
    maxBenefit: "상품별 상이",
    region: "전국",
    income: "상품별 기준",
    target: "정책서민금융 상품을 비교하려는 이용자",
    method: "서민금융진흥원 상품 비교 후 상담 또는 신청",
    summary: "햇살론, 미소금융 등 서민금융 상품을 조건별로 비교할 수 있는 공식 안내입니다.",
    tags: ["대출", "서민금융", "전국"],
    sourceUrl: "https://www.kinfa.or.kr/financialProduct/loanProductGlance.do",
    featured: true,
  },
  {
    id: "enhuf-housing-loan",
    title: "기금e든든 주택도시기금 대출",
    type: "대출",
    institution: "주택도시보증공사",
    deadline: "상시",
    views: 38800,
    maxBenefit: "상품별 상이",
    region: "전국",
    income: "상품별 기준",
    target: "전세자금, 주택구입자금 등 주거 금융이 필요한 이용자",
    method: "기금e든든에서 자격 확인 후 신청",
    summary: "버팀목전세자금, 디딤돌대출 등 주택도시기금 대출 상품을 확인하고 신청할 수 있습니다.",
    tags: ["대출", "주거", "전국"],
    sourceUrl: "https://enhuf.molit.go.kr/",
    featured: true,
  },
  {
    id: "semas-smallbiz-loan",
    title: "소상공인 정책자금",
    type: "대출",
    institution: "소상공인시장진흥공단",
    deadline: "예산 소진 시",
    views: 36000,
    maxBenefit: "상품별 상이",
    region: "전국",
    income: "사업자 요건",
    target: "정책자금 지원 요건을 충족하는 소상공인",
    method: "소상공인정책자금 누리집에서 온라인 접수",
    summary: "운영자금, 성장기반자금 등 소상공인 대상 정책자금 접수 정보를 확인할 수 있습니다.",
    tags: ["대출", "소상공인", "정책자금"],
    sourceUrl: "https://ols.semas.or.kr/",
    featured: true,
  },
];

const regions = [
  ["서울", /서울/],
  ["부산", /부산/],
  ["대구", /대구/],
  ["인천", /인천/],
  ["광주", /광주/],
  ["대전", /대전/],
  ["울산", /울산/],
  ["세종", /세종/],
  ["경기", /경기|수원|성남|고양|용인|부천|화성|남양주|안양|평택|의정부|파주|김포|광명|군포|하남|오산|이천|안성|구리|의왕|양주|포천|여주|동두천|과천/],
  ["강원", /강원|춘천|원주|강릉|동해|태백|속초|삼척/],
  ["충북", /충청북도|충북|청주|충주|제천/],
  ["충남", /충청남도|충남|천안|공주|아산|서산|논산|계룡|당진|태안|홍성/],
  ["전북", /전라북도|전북|전주|군산|익산|정읍|남원|김제/],
  ["전남", /전라남도|전남|목포|여수|순천|나주|광양/],
  ["경북", /경상북도|경북|포항|경주|김천|안동|구미|영주|영천|상주|문경|경산/],
  ["경남", /경상남도|경남|창원|진주|통영|사천|김해|밀양|거제|양산/],
  ["제주", /제주/],
];

function text(value, fallback = "") {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  return normalized || fallback;
}

function clip(value, max = 120) {
  const normalized = text(value);
  return normalized.length <= max ? normalized : `${normalized.slice(0, max - 1)}…`;
}

function firstSentence(value, fallback, max = 120) {
  const normalized = text(value, fallback);
  const [first] = normalized.split(/(?<=[.!?。])\s+|(?:\s*-\s*)/);
  return clip(first || normalized, max);
}

function safeUrl(value, serviceId = "") {
  const normalized = text(value);
  if (normalized) {
    try {
      const url = new URL(normalized);
      if (url.protocol === "http:" || url.protocol === "https:") return url.href;
    } catch {}
  }
  return serviceId ? `https://www.gov.kr/portal/rcvfvrSvc/dtlEx/${encodeURIComponent(serviceId)}` : "";
}

function inferType(record) {
  const source = [
    record["서비스명"],
    record["서비스목적요약"],
    record["지원내용"],
    record["지원유형"],
    record["서비스분야"],
  ].join(" ");

  if (/대출|융자|보증|자금|금융|이자|저리/.test(source)) return "대출";
  if (/환급|공제|감면|세액|세금|지방세|국세|요금|보험료/.test(source)) return "환급금";
  return "지원금";
}

function inferRegion(record) {
  const source = `${text(record["소관기관명"])} ${text(record["접수기관"])}`;
  const match = regions.find(([, pattern]) => pattern.test(source));
  return match ? match[0] : "전국";
}

function inferIncome(record) {
  const criteria = text(record["선정기준"]);
  const target = text(record["지원대상"]);
  const source = `${criteria} ${target}`;
  if (/무관|제한 없음|소득 무관/.test(source)) return "무관";
  if (/중위소득|소득|연소득|월소득|기준소득|재산|건강보험료/.test(source)) {
    return clip(criteria || target, 42);
  }
  return "공고 확인";
}

function inferBenefit(record) {
  const support = text(record["지원내용"]);
  const match = support.match(/(?:최대|월|연|분기|인당|가구당|회당)?\s*[0-9][0-9,.]*(?:\s*)(?:만원|천원|억원|원|%)/);
  if (match) return clip(match[0].replace(/\s+/g, " "), 26);
  return clip(text(record["지원유형"], "혜택 제공"), 26);
}

function normalizeDeadline(value) {
  const deadline = text(value, "상시 또는 기관 문의");
  if (/상시/.test(deadline)) return "상시";
  const date = deadline.match(/\d{4}[-.]\d{1,2}[-.]\d{1,2}/);
  if (date) {
    const [year, month, day] = date[0].split(/[-.]/);
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return clip(deadline, 24);
}

function tagsFor(record, type, region) {
  return [
    type,
    text(record["서비스분야"], "공공서비스"),
    region,
    text(record["소관기관유형"]),
  ].filter(Boolean).filter((item, index, items) => items.indexOf(item) === index).slice(0, 4);
}

function policyFromRecord(record, index) {
  const serviceId = text(record["서비스ID"], String(index + 1));
  const type = inferType(record);
  const region = inferRegion(record);
  const title = text(record["서비스명"], "공공서비스 혜택");

  return {
    id: `gov24-${serviceId.replace(/[^a-zA-Z0-9_-]/g, "-")}`,
    title,
    type,
    institution: text(record["소관기관명"], text(record["부서명"], "공공기관")),
    deadline: normalizeDeadline(record["신청기한"]),
    views: Number.parseInt(String(record["조회수"] ?? "0").replace(/,/g, ""), 10) || 0,
    maxBenefit: inferBenefit(record),
    region,
    income: inferIncome(record),
    target: clip(text(record["지원대상"], "공식 공고 확인"), 110),
    method: clip(text(record["신청방법"], text(record["접수기관"], "공식 페이지에서 확인")), 90),
    summary: firstSentence(record["서비스목적요약"], text(record["지원내용"], "공식 공고에서 상세 조건을 확인하세요.")),
    tags: tagsFor(record, type, region),
    sourceUrl: safeUrl(record["상세조회URL"], serviceId),
    featured: false,
  };
}

function dedupePolicies(policies) {
  const seen = new Set();
  return policies.filter((policy) => {
    const key = `${policy.title}-${policy.institution}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function selectPolicies(records, maxItems) {
  const normalized = dedupePolicies(
    records
      .sort((a, b) => Number(b["조회수"] || 0) - Number(a["조회수"] || 0))
      .map(policyFromRecord)
      .filter((policy) => policy.title && policy.sourceUrl),
  );
  return normalized.slice(0, maxItems);
}

async function fetchPage({ serviceKey, page, perPage }) {
  const url = new URL(ENDPOINT);
  url.searchParams.set("page", String(page));
  url.searchParams.set("perPage", String(perPage));
  url.searchParams.set("serviceKey", serviceKey);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Gov24 API request failed: ${response.status}`);
  }
  return response.json();
}

async function fetchGov24Policies({ serviceKey, pages, perPage, maxItems }) {
  const first = await fetchPage({ serviceKey, page: 1, perPage });
  const totalCount = Number(first.totalCount || first.matchCount || 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const pageCount = Math.min(pages, totalPages);
  const records = [...(Array.isArray(first.data) ? first.data : [])];

  for (let start = 2; start <= pageCount; start += 4) {
    const batch = [];
    for (let page = start; page < start + 4 && page <= pageCount; page += 1) {
      batch.push(fetchPage({ serviceKey, page, perPage }));
    }
    const bodies = await Promise.all(batch);
    bodies.forEach((body) => records.push(...(Array.isArray(body.data) ? body.data : [])));
  }

  const apiPolicies = selectPolicies(records, maxItems);
  const policies = dedupePolicies([...manualPolicies, ...apiPolicies]).map((policy, index) => ({
    ...policy,
    featured: index < 6,
  }));

  return {
    generatedAt: new Date().toISOString(),
    source: {
      name: "행정안전부_대한민국 공공서비스(혜택) 정보",
      provider: "공공데이터포털",
      url: "https://www.data.go.kr/data/15113968/openapi.do",
      endpoint: ENDPOINT,
      totalCount,
      fetchedRecords: records.length,
    },
    policies,
  };
}

function numberParam(searchParams, name, fallback, min, max) {
  const rawValue = searchParams.get(name);
  if (rawValue === null || rawValue.trim() === "") return fallback;
  const value = Number(rawValue);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

export async function onRequestGet({ request, env }) {
  const serviceKey = text(env.DATA_GO_KR_KEY || env.DATA_GO_KR_SERVICE_KEY);
  if (!serviceKey) {
    return Response.json({ ok: false, message: "DATA_GO_KR_KEY is missing" }, { status: 500 });
  }

  const requestUrl = new URL(request.url);
  const pages = numberParam(requestUrl.searchParams, "pages", 12, 1, 40);
  const perPage = numberParam(requestUrl.searchParams, "perPage", 1000, 50, 1000);
  const maxItems = numberParam(requestUrl.searchParams, "maxItems", 12000, 100, 12000);

  try {
    const payload = await fetchGov24Policies({ serviceKey, pages, perPage, maxItems });
    return Response.json(payload, {
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=1800, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Gov24 API request failed",
        generatedAt: new Date().toISOString(),
        policies: manualPolicies,
      },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
