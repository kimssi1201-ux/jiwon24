const ENDPOINT = "https://apis.data.go.kr/1371000/policyNewsService/policyNewsList";
const SOURCE_URL = "https://www.data.go.kr/data/15095335/openapi.do";
const SOURCE_NAME = "문화체육관광부_정책브리핑_정책뉴스_API";

const SPECIFIC_WELFARE_PATTERN =
  /사회보장|사회서비스|기초생활|생계급여|의료급여|주거급여|교육급여|저소득|차상위|한부모|취약계층|복지위기가구|장애인|장애(?!물)|보훈|돌봄|건강보험|희귀난치|희귀질환|기초연금|국민연금|자살예방|사회복지|정책서민금융|햇살론|바우처/;
const GENERAL_WELFARE_PATTERN = /복지/;
const BENEFIT_PATTERN =
  /지원금|보조금|급여|수당|환급|감면|대출|보험료|의료비|생활비|주거비|장려금|상해보험|국가장학금|지역인재장학금|긴급구호|생필품|기본소득|보장\s*확대|처우개선|지원\s*확대/;
const TARGET_PATTERN =
  /아동|청소년|청년|대학생|노인|어르신|고령|장애인|국가유공자|보훈|소상공인|농민|농업인|어민|농어업|농촌|저소득층|신혼부부|임산부|산모|영유아|다문화|외국인|범죄피해자|피해자|노동자|근로자|군\s*복무\s*청년|취약계층/;
const WELFARE_DEPARTMENT_PATTERN = /보건복지부|고용노동부|여성가족부|국가보훈부|질병관리청|금융위원회|중소벤처기업부/;

function envValue(env, ...keys) {
  for (const key of keys) {
    const value = String(env?.[key] || "").trim();
    if (value) return value;
  }
  return "";
}

function numberParam(searchParams, name, fallback, min, max) {
  const raw = Number(searchParams.get(name));
  if (!Number.isFinite(raw)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(raw)));
}

function koreaDate(daysAgo = 0) {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  now.setUTCDate(now.getUTCDate() - daysAgo);
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function decodeXml(text) {
  return String(text || "")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

function stripCdata(text) {
  return String(text || "")
    .replace(/^<!\[CDATA\[/, "")
    .replace(/\]\]>$/, "");
}

function stripHtml(text) {
  return decodeXml(stripCdata(text))
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extract(block, tag) {
  const match = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i").exec(block);
  return match ? stripCdata(match[1]).trim() : "";
}

function firstField(block, tags) {
  for (const tag of tags) {
    const value = extract(block, tag);
    if (value) return value;
  }
  return "";
}

function parseNewsDate(raw) {
  const text = stripHtml(raw);
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/.exec(text);
  if (match) {
    const [, month, day, year, hour = "0", minute = "0", second = "0"] = match;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)));
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  }

  const compact = /^(\d{4})[-.]?(\d{2})[-.]?(\d{2})/.exec(text);
  if (compact) {
    const [, year, month, day] = compact;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  }

  return "";
}

function normalizeNews(block) {
  const id = stripHtml(firstField(block, ["NewsItemId", "newsItemId", "id"]));
  const title = stripHtml(firstField(block, ["Title", "title"]));
  const subtitle = stripHtml(firstField(block, ["SubTitle1", "SubTitle2", "SubTitle3"]));
  const contents = stripHtml(firstField(block, ["DataContents", "dataContents"]));
  const summary = subtitle || contents;
  const department = stripHtml(firstField(block, ["MinisterCode", "ministerCode"]));
  const date = parseNewsDate(firstField(block, ["ApproveDate", "approveDate", "ModifyDate", "modifyDate"]));
  const imageUrl = stripHtml(firstField(block, ["ThumbnailUrl", "thumbnailUrl", "OriginalimgUrl", "originalimgUrl"]));
  const url = stripHtml(firstField(block, ["OriginalUrl", "originalUrl"]));
  const shortContents = contents.slice(0, 320);
  const haystack = `${title} ${subtitle || shortContents} ${department}`;

  if (!title || !isWelfareNews(haystack, department)) return null;

  return {
    id: id || url || title,
    title,
    summary: summary || contents,
    department,
    date,
    imageUrl,
    url,
    source: "정책브리핑",
  };
}

function isWelfareNews(text, department) {
  const hasSpecificWelfare = SPECIFIC_WELFARE_PATTERN.test(text);
  const hasGeneralWelfare = GENERAL_WELFARE_PATTERN.test(text);
  const hasBenefit = BENEFIT_PATTERN.test(text);
  const hasTarget = TARGET_PATTERN.test(text);
  const hasWelfareDepartment = WELFARE_DEPARTMENT_PATTERN.test(department);

  if (hasSpecificWelfare) return true;
  if (hasBenefit && hasTarget) return true;
  if (hasGeneralWelfare && (hasBenefit || hasTarget || hasWelfareDepartment)) return true;
  return hasWelfareDepartment && (hasBenefit || hasTarget);
}

function parseNewsXml(xml) {
  const source = String(xml || "");
  const newsItemBlocks = [...source.matchAll(/<NewsItem>([\s\S]*?)<\/NewsItem>/gi)].map((match) => match[1]);
  const itemBlocks = [...source.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => match[1]);
  const blocks = newsItemBlocks.length ? newsItemBlocks : itemBlocks;
  const seen = new Set();
  return blocks
    .map(normalizeNews)
    .filter(Boolean)
    .filter((item) => {
      const key = item.id || item.url || item.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
}

async function fetchPolicyNewsRange(serviceKey, startDate, endDate) {
  const url = new URL(ENDPOINT);
  url.searchParams.set("serviceKey", serviceKey);
  url.searchParams.set("startDate", startDate);
  url.searchParams.set("endDate", endDate);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/xml,text/xml,*/*",
    },
  });
  const text = await response.text();

  if (!response.ok) {
    const message = stripHtml(text).slice(0, 180) || `Policy briefing API request failed: ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  const resultCode = stripHtml(extract(text, "resultCode"));
  const resultMsg = stripHtml(extract(text, "resultMsg"));
  if (resultCode && resultCode !== "0") {
    const error = new Error(resultMsg || `Policy briefing API returned ${resultCode}`);
    error.status = 502;
    throw error;
  }

  return parseNewsXml(text);
}

async function fetchPolicyNews(serviceKey, days, limit) {
  const all = [];
  const seen = new Set();

  for (let offset = 0; offset < days && all.length < limit; offset += 3) {
    const endOffset = offset;
    const startOffset = Math.min(days - 1, offset + 2);
    const items = await fetchPolicyNewsRange(serviceKey, koreaDate(startOffset), koreaDate(endOffset));

    for (const item of items) {
      const key = item.id || item.url || item.title;
      if (seen.has(key)) continue;
      seen.add(key);
      all.push(item);
      if (all.length >= limit) break;
    }
  }

  return all.sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).slice(0, limit);
}

export async function onRequestGet({ request, env }) {
  const serviceKey = envValue(env, "POLICY_BRIEFING_KEY", "DATA_GO_KR_KEY", "DATA_GO_KR_SERVICE_KEY");
  if (!serviceKey) {
    return Response.json(
      {
        ok: false,
        message: "POLICY_BRIEFING_KEY or DATA_GO_KR_KEY is missing",
        news: [],
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  const url = new URL(request.url);
  const days = numberParam(url.searchParams, "days", 21, 1, 30);
  const limit = numberParam(url.searchParams, "limit", 40, 1, 100);

  try {
    const news = await fetchPolicyNews(serviceKey, days, limit);
    return Response.json(
      {
        ok: true,
        generatedAt: new Date().toISOString(),
        source: {
          name: SOURCE_NAME,
          provider: "공공데이터포털",
          url: SOURCE_URL,
          endpoint: ENDPOINT,
        },
        news,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=0, s-maxage=1800, stale-while-revalidate=3600",
        },
      },
    );
  } catch (error) {
    const status = error?.status === 403 ? 403 : 502;
    return Response.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Policy briefing API request failed",
        source: {
          name: SOURCE_NAME,
          provider: "공공데이터포털",
          url: SOURCE_URL,
          endpoint: ENDPOINT,
        },
        news: [],
      },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
