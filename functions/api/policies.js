const ENDPOINT = "https://api.odcloud.kr/api/gov24/v3/serviceList";

const fallbackPolicies = [
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
    method: "정부24에서 본인 확인 후 조회",
    summary: "각 기관에 흩어진 미환급금 조회 경로를 한 번에 확인할 수 있는 정부24 서비스입니다.",
    tags: ["환급금", "정부24", "전국"],
    sourceUrl: "https://www.gov.kr/portal/service/serviceInfo/174100000054",
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
];

const regionPatterns = [
  ["서울", /서울/],
  ["부산", /부산|해운대구|해운대/],
  ["대구", /대구광역시|대구시|(^|[^가-힣])대구($|[^가-힣])/],
  ["인천", /인천/],
  ["대전", /대전/],
  ["울산", /울산/],
  ["세종", /세종/],
  ["경기", /경기|수원|성남|고양|용인|부천|화성|남양주|안양|평택|파주|김포|광명|광주시/],
  ["광주", /광주광역시|(^|[^가-힣])광주($|[^가-힣])/],
  ["강원", /강원|춘천|원주|강릉|동해|속초|삼척/],
  ["충북", /충북|충청북도|청주|충주|제천/],
  ["충남", /충남|충청남도|천안|공주|아산|서산|논산|계룡|당진|태안|홍성/],
  ["전북", /전북|전라북도|전주|군산|익산|정읍|남원|김제/],
  ["전남", /전남|전라남도|목포|여수|순천|나주|광양/],
  ["경북", /경북|경상북도|포항|경주|김천|안동|구미|영주|영천|상주|문경|경산/],
  ["경남", /경남|경상남도|창원|진주|통영|사천|김해|밀양|거제|양산/],
  ["제주", /제주/],
];

function value(record, key, fallback = "") {
  const text = String(record?.[key] ?? fallback).replace(/\s+/g, " ").trim();
  return text || fallback;
}

function clip(text, max = 120) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function numberParam(searchParams, name, fallback, min, max) {
  const raw = searchParams.get(name);
  const number = raw ? Number(raw) : fallback;
  return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.floor(number))) : fallback;
}

function inferType(record) {
  const source = [
    value(record, "서비스명"),
    value(record, "서비스목적요약"),
    value(record, "지원내용"),
    value(record, "지원유형"),
    value(record, "서비스분야"),
  ].join(" ");
  if (/대출|융자|보증|자금|금융|이자|저리/.test(source)) return "대출";
  if (/환급|공제|감면|세액|세금|지방세|국세|요금|보험료/.test(source)) return "환급금";
  return "지원금";
}

function inferRegion(record) {
  const source = `${value(record, "소관기관명")} ${value(record, "접수기관")}`;
  return regionPatterns.find(([, pattern]) => pattern.test(source))?.[0] || "전국";
}

function inferBenefit(record) {
  const support = value(record, "지원내용");
  const match = support.match(/(?:최대|월|연|분기|인당|가구당|회당)?\s*[0-9][0-9,.]*\s*(?:만원|천원|억원|원|%)/);
  return match ? clip(match[0].replace(/\s+/g, " "), 26) : clip(value(record, "지원유형", "혜택 제공"), 26);
}

function inferIncome(record) {
  const source = `${value(record, "선정기준")} ${value(record, "지원대상")}`;
  if (/무관|제한 없음|소득 무관/.test(source)) return "무관";
  if (/중위소득|소득|연소득|월소득|재산|건강보험료/.test(source)) return clip(source, 42);
  return "공고 확인";
}

function normalizeDeadline(text) {
  const deadline = value({ text }, "text", "상시 또는 기관 문의");
  if (/상시/.test(deadline)) return "상시";
  const date = deadline.match(/\d{4}[-.]\d{1,2}[-.]\d{1,2}/);
  if (!date) return clip(deadline, 24);
  const [year, month, day] = date[0].split(/[-.]/);
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function safeUrl(rawUrl, serviceId) {
  try {
    const url = new URL(value({ rawUrl }, "rawUrl"));
    if (url.protocol === "http:" || url.protocol === "https:") return url.href;
  } catch {}
  return serviceId ? `https://www.gov.kr/portal/rcvfvrSvc/dtlEx/${encodeURIComponent(serviceId)}` : "";
}

function policyFromRecord(record, index) {
  const serviceId = value(record, "서비스ID", String(index + 1));
  const type = inferType(record);
  const region = inferRegion(record);
  const summary = value(record, "서비스목적요약", value(record, "지원내용", "공식 공고에서 상세 조건을 확인하세요."));

  return {
    id: `gov24-${serviceId.replace(/[^a-zA-Z0-9_-]/g, "-")}`,
    title: value(record, "서비스명", "공공서비스 혜택"),
    type,
    institution: value(record, "소관기관명", value(record, "부서명", "공공기관")),
    deadline: normalizeDeadline(value(record, "신청기한")),
    views: Number.parseInt(String(record["조회수"] ?? "0").replace(/,/g, ""), 10) || 0,
    maxBenefit: inferBenefit(record),
    region,
    income: inferIncome(record),
    target: clip(value(record, "지원대상", "공식 공고 확인"), 110),
    method: clip(value(record, "신청방법", value(record, "접수기관", "공식 페이지에서 확인")), 90),
    summary: clip(summary.split(/(?<=[.!?。])\s+|(?:\s*-\s*)/)[0] || summary, 120),
    tags: [type, value(record, "서비스분야", "공공서비스"), region, value(record, "소관기관유형")].filter(Boolean).slice(0, 4),
    sourceUrl: safeUrl(record["상세조회URL"], serviceId),
    featured: false,
  };
}

function dedupe(policies) {
  const seen = new Set();
  return policies.filter((policy) => {
    const key = `${policy.title}-${policy.institution}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeRegion(value) {
  const compact = String(value || "").trim().replace(/\s+/g, "");
  const aliases = {
    광주광역시: "광주",
    서울특별시: "서울",
    부산광역시: "부산",
    대구광역시: "대구",
    인천광역시: "인천",
    대전광역시: "대전",
    울산광역시: "울산",
    세종특별자치시: "세종",
    강원특별자치도: "강원",
    충청북도: "충북",
    충청남도: "충남",
    전라북도: "전북",
    전북특별자치도: "전북",
    전라남도: "전남",
    경상북도: "경북",
    경상남도: "경남",
    제주특별자치도: "제주",
  };
  return aliases[compact] || compact;
}

function policyRegionText(policy) {
  return [
    policy?.region,
    policy?.institution,
    policy?.target,
    policy?.summary,
    policy?.method,
    (policy?.tags || []).join(" "),
  ]
    .filter(Boolean)
    .join(" ");
}

function isGyeonggiGwangjuPolicy(policy) {
  return /경기도\s*광주시|경기도광주시/.test(policyRegionText(policy));
}

function isGwangjuMetroPolicy(policy) {
  const source = policyRegionText(policy);
  return /광주광역시|광주광역시교육청/.test(source) || ((policy?.tags || []).includes("광역시도") && /광주/.test(source));
}

function isRequestedRegionPolicy(policy, requestedRegion) {
  const region = normalizeRegion(requestedRegion);
  if (!region || region === "전체지역") return true;
  if (region === "전국") return String(policy?.region || "").includes("전국");

  if (region === "광주") {
    return isGwangjuMetroPolicy(policy) && !isGyeonggiGwangjuPolicy(policy);
  }
  if (region === "경기" && isGyeonggiGwangjuPolicy(policy)) return true;
  return policy.region === region;
}

function sortRegionFirst(policies, requestedRegion) {
  const region = normalizeRegion(requestedRegion);
  return [...policies].sort((a, b) => {
    const aLocal = isRequestedRegionPolicy(a, region) && !String(a.region || "").includes("전국");
    const bLocal = isRequestedRegionPolicy(b, region) && !String(b.region || "").includes("전국");
    if (aLocal !== bLocal) return aLocal ? -1 : 1;
    return (Number(b.views) || 0) - (Number(a.views) || 0);
  });
}

async function fetchPage(serviceKey, page, perPage, extraParams = {}) {
  const url = new URL(ENDPOINT);
  url.searchParams.set("page", String(page));
  url.searchParams.set("perPage", String(perPage));
  url.searchParams.set("serviceKey", serviceKey);
  Object.entries(extraParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  });

  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { Accept: "application/json" } });
      if (response.ok) return response.json();
      lastError = new Error(`Gov24 API request failed: ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
  }
  throw lastError;
}

async function fetchFirstPage(serviceKey, perPage, extraParams = {}) {
  const candidates = [...new Set([perPage, 500, 300, 200, 100, 50].filter((item) => item <= perPage))];
  let lastError;

  for (const candidate of candidates) {
    try {
      return {
        body: await fetchPage(serviceKey, 1, candidate, extraParams),
        perPage: candidate,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

function regionApiKeyword(region) {
  const keywords = {
    서울: "서울",
    부산: "부산",
    대구: "대구",
    인천: "인천",
    광주: "광주광역시",
    대전: "대전",
    울산: "울산",
    세종: "세종",
    경기: "경기",
    강원: "강원",
    충북: "충청북도",
    충남: "충청남도",
    전북: "전북",
    전남: "전라남도",
    경북: "경상북도",
    경남: "경상남도",
    제주: "제주",
  };
  return keywords[normalizeRegion(region)] || "";
}

function regionApiParams(region) {
  const keyword = regionApiKeyword(region);
  return keyword ? { "cond[소관기관명::LIKE]": keyword } : {};
}

async function fetchPolicies(serviceKey, pages, perPage, maxItems, startPage = 1, extraParams = {}) {
  const firstPage = await fetchFirstPage(serviceKey, perPage, extraParams);
  const first = firstPage.body;
  const actualPerPage = firstPage.perPage;
  const totalCount = Number(first.totalCount || first.matchCount || 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / actualPerPage));
  const safeStartPage = Math.max(1, Math.min(startPage, totalPages));
  const endPage = Math.min(totalPages, safeStartPage + pages - 1);
  const records = safeStartPage === 1 ? [...(Array.isArray(first.data) ? first.data : [])] : [];
  const failedPages = [];

  for (let start = safeStartPage === 1 ? 2 : safeStartPage; start <= endPage; start += 2) {
    const batch = [];
    for (let page = start; page < start + 2 && page <= endPage; page += 1) {
      batch.push(fetchPage(serviceKey, page, actualPerPage, extraParams).then((body) => ({ body, page })).catch(() => ({ body: null, page })));
    }
    const bodies = await Promise.all(batch);
    bodies.forEach(({ body, page }) => {
      if (body?.data && Array.isArray(body.data)) records.push(...body.data);
      else failedPages.push(page);
    });
  }

  const apiPolicies = records
    .sort((a, b) => Number(b["조회수"] || 0) - Number(a["조회수"] || 0))
    .map(policyFromRecord)
    .filter((policy) => policy.title && policy.sourceUrl);
  const policies = dedupe([...fallbackPolicies, ...apiPolicies]).slice(0, maxItems).map((policy, index) => ({
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
      startPage: safeStartPage,
      pageCount: endPage - safeStartPage + 1,
      fetchedRecords: records.length,
      failedPages,
    },
    policies,
  };
}

async function fetchPolicyById(serviceKey, requestedId) {
  const fallback = fallbackPolicies.find((policy) => policy.id === requestedId);
  if (fallback) return fallback;

  const serviceId = String(requestedId || "").replace(/^gov24-/, "");
  if (!serviceId) return null;

  try {
    const exact = await fetchPage(serviceKey, 1, 20, { "cond[서비스ID::EQ]": serviceId });
    const exactRecord = Array.isArray(exact.data)
      ? exact.data.find((record, index) => policyFromRecord(record, index).id === requestedId || value(record, "서비스ID") === serviceId)
      : null;
    if (exactRecord) return policyFromRecord(exactRecord, 0);
  } catch {
    // Some upstream mirrors may not support cond filters. Fall back to a bounded page scan.
  }

  const firstPage = await fetchFirstPage(serviceKey, 1000);
  const first = firstPage.body;
  const actualPerPage = firstPage.perPage;
  const totalCount = Number(first.totalCount || first.matchCount || 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / actualPerPage));
  const firstRecords = Array.isArray(first.data) ? first.data : [];

  for (const [index, record] of firstRecords.entries()) {
    const policy = policyFromRecord(record, index);
    if (policy.id === requestedId || value(record, "서비스ID") === serviceId) return policy;
  }

  for (let page = 2; page <= totalPages; page += 1) {
    const body = await fetchPage(serviceKey, page, actualPerPage).catch(() => null);
    if (!Array.isArray(body?.data)) continue;
    for (const [index, record] of body.data.entries()) {
      const policy = policyFromRecord(record, index);
      if (policy.id === requestedId || value(record, "서비스ID") === serviceId) return policy;
    }
  }

  return null;
}

export async function onRequestGet({ request, env }) {
  const serviceKey = value(env, "DATA_GO_KR_KEY", value(env, "DATA_GO_KR_SERVICE_KEY"));
  if (!serviceKey) return Response.json({ ok: false, message: "DATA_GO_KR_KEY is missing" }, { status: 500 });

  const url = new URL(request.url);
  const requestedId = (url.searchParams.get("id") || "").trim();
  const pages = numberParam(url.searchParams, "pages", 8, 1, 40);
  const perPage = numberParam(url.searchParams, "perPage", 300, 50, 1000);
  const maxItems = numberParam(url.searchParams, "maxItems", 2400, 100, 12000);
  const startPage = numberParam(url.searchParams, "startPage", 1, 1, 40);
  const requestedRegion = normalizeRegion(url.searchParams.get("region"));

  try {
    if (requestedId) {
      const policy = await fetchPolicyById(serviceKey, requestedId);
      return Response.json(
        {
          generatedAt: new Date().toISOString(),
          source: {
            name: "행정안전부_대한민국 공공서비스(혜택) 정보",
            provider: "공공데이터포털",
            url: "https://www.data.go.kr/data/15113968/openapi.do",
            endpoint: ENDPOINT,
            id: requestedId,
          },
          policies: policy ? [policy] : [],
          policy,
        },
        {
          headers: {
            "Cache-Control": "public, max-age=0, s-maxage=1800, stale-while-revalidate=3600",
          },
        },
      );
    }

    const payload = await fetchPolicies(
      serviceKey,
      requestedRegion && requestedRegion !== "전체지역" ? Math.min(pages, 12) : pages,
      requestedRegion && requestedRegion !== "전체지역" ? Math.min(perPage, 100) : perPage,
      requestedRegion && requestedRegion !== "전체지역" ? 12000 : maxItems,
      requestedRegion && requestedRegion !== "전체지역" ? 1 : startPage,
      requestedRegion && requestedRegion !== "전체지역" ? regionApiParams(requestedRegion) : {},
    );
    if (requestedRegion && requestedRegion !== "전체지역") {
      payload.source.region = requestedRegion;
      payload.policies = sortRegionFirst(
        payload.policies.filter((policy) => isRequestedRegionPolicy(policy, requestedRegion)),
        requestedRegion,
      ).slice(0, maxItems);
    }
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
        policies: fallbackPolicies,
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
