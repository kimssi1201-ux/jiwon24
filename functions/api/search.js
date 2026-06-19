const ENDPOINT = "https://api.odcloud.kr/api/gov24/v3/serviceList";

const REGION_ALIASES = {
  서울특별시: "서울",
  경기도: "경기",
  인천광역시: "인천",
  부산광역시: "부산",
  대구광역시: "대구",
  광주광역시: "광주",
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
const REGION_NAMES = ["서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];
const REGION_PATTERNS = [
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

function compact(value) {
  return String(value || "").trim().replace(/[·ㆍ・\s_-]/g, "").toLowerCase();
}

function normalizeRegion(value) {
  const raw = String(value || "").trim().replace(/\s+/g, "");
  return REGION_ALIASES[raw] || raw;
}

function inferRegion(record) {
  const source = `${value(record, "소관기관명")} ${value(record, "접수기관")}`;
  return REGION_PATTERNS.find(([, pattern]) => pattern.test(source))?.[0] || "전국";
}

function inferType(record) {
  const source = ["서비스명", "서비스목적요약", "지원내용", "지원유형", "서비스분야"].map((key) => value(record, key)).join(" ");
  const headline = [value(record, "서비스명"), value(record, "서비스목적요약")].join(" ");
  if (/지역화폐|지역사랑상품권|사랑상품권|지역상품권|페이/.test(value(record, "서비스명"))) return "지원금";
  if (/지원|지급|수당|축하금|장려금|보조금|급여|바우처|이용권|상품권|교통비|월세|주거비|의료비|교육비|장학금|돌봄/.test(headline) && !/환급|공제|감면|세액|세금/.test(headline)) return "지원금";
  if (/환급|공제|감면|세액|지방세|국세|미환급|요금\s*감면/.test(source)) return "환급금";
  if (/대출|융자|신용보증|보증서|보증료|저리|금리|상환|담보|이자|전세자금|구입자금/.test(source)) return "대출";
  return "지원금";
}

function classifyAgeCodes(record) {
  const source = ["서비스명", "서비스목적요약", "지원대상", "선정기준", "지원내용", "서비스분야"].map((key) => value(record, key)).join(" ");
  const codes = new Set();
  if (/영유아|유아|영아|신생아|출산|임산부|산모|난임|산후|어린이집|보육/.test(source)) codes.add("INFANT_BIRTH");
  if (/아동|어린이|청소년|초등|중등|고등|학교밖|결식아동|아이돌봄|아동수당|교복|입학준비|검정고시/.test(source)) codes.add("CHILD_TEEN");
  if (/청년|대학생|취업준비|구직|사회초년생|청년창업|청년월세|만\s*(?:1[9]|2[0-9]|3[0-9])세/.test(source)) codes.add("YOUTH");
  if (/중장년|중년|장년|어르신|노인|고령|경로|노후|기초연금|노인일자리|만\s*(?:4[0-9]|5[0-9]|6[0-9]|[78][0-9])세/.test(source)) codes.add("MIDDLE_SENIOR");
  return [...codes];
}

function classifyTargetCodes(record) {
  const source = ["서비스명", "서비스목적요약", "지원대상", "선정기준", "지원내용", "사용자구분", "서비스분야"].map((key) => value(record, key)).join(" ");
  const codes = new Set();
  if (/국가유공자|보훈|참전|독립유공|상이군경|민주유공|의사상자|유족|재향군인/.test(source)) codes.add("VETERAN");
  if (/장애인|장애 정도|발달장애|중증장애|장애수당|장애연금|장애인복지/.test(source)) codes.add("DISABLED");
  if (/소상공인|소공인|전통시장|시장상인|개인사업자|자영업|상권|점포/.test(source)) codes.add("SMALL_BUSINESS");
  if (/농업|어업|임업|축산|농어업|농업인|어업인|수산|귀농|귀어|귀촌/.test(source)) codes.add("FARM_FISHERY");
  if (/저소득|기초생활|수급자|차상위|중위소득|생계급여|취약계층|한부모|긴급복지/.test(source)) codes.add("LOW_INCOME");
  if (/신혼|예비부부|신혼부부|결혼|혼인|난임부부|청년부부/.test(source)) codes.add("NEWLYWED");
  if (/다문화|결혼이민|이주민|새터민|북한이탈|재한외국인|등록외국인|외국국적동포|외국인/.test(source) && !/외국인[^.\n\r]{0,80}(제외|불가|아님|미포함|제한)/.test(source)) codes.add("FOREIGNER_MULTICULTURAL");
  return [...codes];
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
  return {
    id: `gov24-${serviceId.replace(/[^a-zA-Z0-9_-]/g, "-")}`,
    title: value(record, "서비스명", "공공서비스 혜택"),
    type,
    institution: value(record, "소관기관명", value(record, "부서명", "공공기관")),
    deadline: normalizeDeadline(value(record, "신청기한")),
    views: Number.parseInt(String(record["조회수"] ?? "0").replace(/,/g, ""), 10) || 0,
    maxBenefit: clip(value(record, "지원유형", "혜택 제공"), 26),
    region,
    income: "공고 확인",
    target: clip(value(record, "지원대상", "공식 공고 확인"), 110),
    method: clip(value(record, "신청방법", value(record, "접수기관", "공식 페이지에서 확인")), 90),
    summary: clip(summary.split(/(?<=[.!?。])\s+|(?:\s*-\s*)/)[0] || summary, 120),
    serviceField,
    supportKind: value(record, "지원유형"),
    ageCodes: classifyAgeCodes(record),
    targetCodes: classifyTargetCodes(record),
    tags: [type, serviceField, region, value(record, "소관기관유형")].filter(Boolean).slice(0, 4),
    sourceUrl: safeUrl(record["상세조회URL"], serviceId),
    featured: false,
  };
}

function detectRegion(query, explicitRegion) {
  const selected = normalizeRegion(explicitRegion);
  if (selected && selected !== "전체지역" && selected !== "전국") return selected;
  const compactQuery = compact(query);
  for (const [alias, region] of Object.entries(REGION_ALIASES)) {
    if (compactQuery.includes(compact(alias))) return region;
  }
  return REGION_NAMES.find((region) => compactQuery.includes(compact(region))) || "";
}

function queryTerms(query, region) {
  const terms = new Set();
  const raw = String(query || "").trim();
  if (raw) terms.add(raw);
  let cleaned = raw;
  Object.keys(REGION_ALIASES).forEach((alias) => { cleaned = cleaned.replaceAll(alias, " "); });
  REGION_NAMES.forEach((name) => { cleaned = cleaned.replaceAll(name, " "); });
  if (region) cleaned = cleaned.replaceAll(region, " ");
  cleaned.split(/\s+/).map((token) => token.trim()).filter((token) => token.length >= 2).forEach((token) => terms.add(token));
  const compactCleaned = compact(cleaned);
  if (compactCleaned && compactCleaned.length >= 2) terms.add(compactCleaned);
  return [...terms].slice(0, 6);
}

async function fetchPage(serviceKey, page, perPage, extraParams = {}) {
  const url = new URL(ENDPOINT);
  url.searchParams.set("page", String(page));
  url.searchParams.set("perPage", String(perPage));
  url.searchParams.set("serviceKey", serviceKey);
  Object.entries(extraParams).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") url.searchParams.set(key, String(val));
  });

  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { Accept: "application/json" } });
      if (response.ok) return response.json();
      lastError = new Error(`Gov24 API request failed: ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
  }
  throw lastError;
}

function recordText(record) {
  return ["서비스명", "서비스목적요약", "지원내용", "지원대상", "소관기관명", "접수기관"].map((key) => value(record, key)).join(" ");
}

function regionMatches(record, region) {
  if (!region || region === "전체지역" || region === "전국") return true;
  const text = recordText(record);
  if (region === "광주") return /광주광역시|광주광역시교육청/.test(text) && !/경기도\s*광주시|경기도광주시/.test(text);
  return normalizeRegion(inferRegion(record)) === region || text.includes(region);
}

function dedupeRecords(records) {
  const seen = new Set();
  return records.filter((record) => {
    const key = value(record, "서비스ID", `${value(record, "서비스명")}-${value(record, "소관기관명")}`);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function searchRecords(serviceKey, query, region) {
  const fields = ["서비스명", "서비스목적요약", "지원내용", "지원대상"];
  const terms = queryTerms(query, region);
  const records = [];

  for (const term of terms) {
    for (const field of fields) {
      const body = await fetchPage(serviceKey, 1, 100, { [`cond[${field}::LIKE]`]: term }).catch(() => null);
      if (Array.isArray(body?.data)) records.push(...body.data);
      if (records.length >= 250) return dedupeRecords(records);
    }
  }
  return dedupeRecords(records);
}

function searchMatches(policy, query, region) {
  const terms = queryTerms(query, region).map(compact).filter(Boolean);
  if (!terms.length) return true;
  const text = compact([policy.title, policy.summary, policy.target, policy.institution, policy.region, policy.tags?.join(" ")].filter(Boolean).join(" "));
  return terms.some((term) => text.includes(term));
}

export async function onRequestGet({ request, env }) {
  const serviceKey = value(env, "DATA_GO_KR_KEY", value(env, "DATA_GO_KR_SERVICE_KEY"));
  if (!serviceKey) return Response.json({ ok: false, message: "DATA_GO_KR_KEY is missing" }, { status: 500 });

  const url = new URL(request.url);
  const query = (url.searchParams.get("q") || "").trim();
  const requestedRegion = detectRegion(query, url.searchParams.get("region"));
  const limit = Math.max(1, Math.min(Number(url.searchParams.get("limit") || 80), 120));
  if (!query) return Response.json({ generatedAt: new Date().toISOString(), policies: [] });

  try {
    const records = await searchRecords(serviceKey, query, requestedRegion);
    const policies = dedupeRecords(records)
      .filter((record) => regionMatches(record, requestedRegion))
      .map(policyFromRecord)
      .filter((policy) => policy.title && policy.sourceUrl && searchMatches(policy, query, requestedRegion))
      .sort((a, b) => {
        const aTitle = compact(a.title).includes(compact(query)) ? 1 : 0;
        const bTitle = compact(b.title).includes(compact(query)) ? 1 : 0;
        if (aTitle !== bTitle) return bTitle - aTitle;
        return (Number(b.views) || 0) - (Number(a.views) || 0);
      })
      .slice(0, limit)
      .map((policy, index) => ({ ...policy, featured: index < 6 }));

    return Response.json(
      {
        generatedAt: new Date().toISOString(),
        source: {
          name: "행정안전부_대한민국 공공서비스(혜택) 정보",
          provider: "공공데이터포털",
          query,
          region: requestedRegion,
          endpoint: ENDPOINT,
        },
        policies,
      },
      { headers: { "Cache-Control": "public, max-age=0, s-maxage=900, stale-while-revalidate=1800" } },
    );
  } catch (error) {
    return Response.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Gov24 search failed",
        generatedAt: new Date().toISOString(),
        policies: [],
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
