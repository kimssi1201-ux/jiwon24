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
  const title = value(record, "서비스명");
  const summary = value(record, "서비스목적요약");
  const support = value(record, "지원내용");
  const supportType = value(record, "지원유형");
  const field = value(record, "서비스분야");
  const source = [title, summary, support, supportType, field].join(" ");
  const headline = [title, summary].join(" ");

  const refundPattern = /환급|공제|감면|세액|지방세|국세|미환급|요금\s*감면|보험료\s*(환급|감면|지원)/;
  const loanPattern = /대출|융자|신용보증|보증서|보증료|저리|금리|상환|담보|이자\s*(지원|보전|차액|보조)|자금\s*(대출|융자)|전세자금|구입자금/;
  const supportPattern = /지원|지급|수당|축하금|장려금|보조금|급여|바우처|이용권|상품권|지역화폐|교통비|월세|주거비|의료비|교육비|장학금|급식|돌봄|현금|현물/;
  const localCurrencyPattern = /지역화폐|지역사랑상품권|사랑상품권|지역상품권|페이/;
  const refundHeadlinePattern = /환급|미환급|공제|감면|세액|세금|지방세|국세|요금/;

  if (localCurrencyPattern.test(title)) return "지원금";
  if (supportPattern.test(headline) && !refundHeadlinePattern.test(headline)) return "지원금";
  if (refundPattern.test(source) && !/지원금|보조금|장려금|수당/.test(headline)) return "환급금";
  if (loanPattern.test(source)) return "대출";
  if (supportPattern.test(source)) return "지원금";
  return "지원금";
}

function inferRegion(record) {
  const source = `${value(record, "소관기관명")} ${value(record, "접수기관")}`;
  return regionPatterns.find(([, pattern]) => pattern.test(source))?.[0] || "전국";
}

function classifyAgeCodes(record) {
  const title = value(record, "서비스명");
  const summary = value(record, "서비스목적요약");
  const target = value(record, "지원대상");
  const criteria = value(record, "선정기준");
  const support = value(record, "지원내용");
  const field = value(record, "서비스분야");
  const source = [title, summary, target, criteria, support, field].join(" ");
  const headline = [title, summary].join(" ");
  const codes = new Set();

  if (/임신·출산/.test(field) || /영유아|유아|영아|신생아|출산|임산부|산모|난임|산후|보육|어린이집|누리과정/.test(source)) {
    codes.add("INFANT_BIRTH");
  }
  if (
    /아동|어린이|청소년|초등|중등|고등|초·중·고|학교밖|결식아동|아이돌봄|아동수당|교복|입학준비|검정고시|청소년육성|만\s*(?:[6-9]|1[0-8])세/.test(
      source,
    ) ||
    (/교육비|학습비|장학금|급식/.test(headline) && /학생|아동|청소년|초등|중등|고등|초·중·고|초중고|학교/.test(source))
  ) {
    codes.add("CHILD_TEEN");
  }
  if (/청년|대학생|취업준비|구직|사회초년생|청년창업|청년월세|만\s*(?:1[9]|2[0-9]|3[0-9])세/.test(source)) {
    codes.add("YOUTH");
  }
  if (/중장년|중년|장년|어르신|노인|고령|경로|노후|기초연금|노인일자리|만\s*(?:4[0-9]|5[0-9]|6[0-9]|[78][0-9])세/.test(source)) {
    codes.add("MIDDLE_SENIOR");
  }

  return [...codes];
}

function classifyTargetCodes(record) {
  const title = value(record, "서비스명");
  const summary = value(record, "서비스목적요약");
  const target = value(record, "지원대상");
  const criteria = value(record, "선정기준");
  const support = value(record, "지원내용");
  const userType = value(record, "사용자구분");
  const field = value(record, "서비스분야");
  const source = [title, summary, target, criteria, support, userType, field].join(" ");
  const codes = new Set();

  if (/국가유공자|보훈|참전|독립유공|상이군경|5\.?18|민주유공|의사상자|유족|재향군인/.test(source)) {
    codes.add("VETERAN");
  }
  if (/장애인|장애 정도|발달장애|중증장애|장애수당|장애연금|장애인복지/.test(source)) {
    codes.add("DISABLED");
  }
  if (/소상공인/.test(userType) || /소상공인|소공인|전통시장|시장상인|상인회|개인사업자|자영업|가맹점|상권|점포/.test(source)) {
    codes.add("SMALL_BUSINESS");
  }
  if (/농림축산어업/.test(field) || /농업|어업|임업|축산|농어업|농업인|어업인|어선|수산|귀농|귀어|귀촌/.test(source)) {
    codes.add("FARM_FISHERY");
  }
  if (/저소득|기초생활|수급자|차상위|중위소득|생계급여|의료급여|주거급여|취약계층|한부모|긴급복지/.test(source)) {
    codes.add("LOW_INCOME");
  }
  if (/신혼|예비부부|신혼부부|결혼|혼인|난임부부|청년부부/.test(source)) {
    codes.add("NEWLYWED");
  }
  const hasForeignerPositiveSignal =
    /다문화|결혼이민|이주민|중도입국|새터민|북한이탈|국적취득|재한외국인|등록외국인|외국국적동포|외국인근로자|외국인\s*(주민|아동|청소년|여성|노동자|대상|지원)/.test(
      source,
    );
  const hasForeignerExclusionSignal =
    /외국인[^.\n\r]{0,80}(제외|불가|아님|미포함|제한)|외국국적[^.\n\r]{0,80}(제외|불가|아님)|대한민국\s*국적/.test(source);
  if (hasForeignerPositiveSignal || (/외국인/.test(source) && !hasForeignerExclusionSignal)) {
    codes.add("FOREIGNER_MULTICULTURAL");
  }

  return [...codes];
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
  const serviceField = value(record, "서비스분야", "공공서비스");
  const userType = value(record, "사용자구분");
  const supportKind = value(record, "지원유형");

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
    userType,
    serviceField,
    supportKind,
    ageCodes: classifyAgeCodes(record),
    targetCodes: classifyTargetCodes(record),
    tags: [type, serviceField, region, value(record, "소관기관유형")].filter(Boolean).slice(0, 4),
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
  const hasCondition = Object.keys(extraParams).length > 0;
  const totalCount = Number((hasCondition ? first.matchCount : first.totalCount) || first.matchCount || first.totalCount || 0);
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
