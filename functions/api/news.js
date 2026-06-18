const ENDPOINT = "https://apis.data.go.kr/1371000/policyNewsService/policyNewsList";
const SOURCE_URL = "https://www.data.go.kr/data/15095335/openapi.do";
const SOURCE_NAME = "문화체육관광부_정책브리핑_정책뉴스_API";

const WELFARE_PATTERN =
  /복지|지원|지원금|보조|급여|돌봄|아동|청년|청소년|노인|어르신|장애|보훈|기초생활|저소득|차상위|한부모|주거|의료|건강보험|연금|출산|육아|보육|교육비|장학|일자리|소상공인|서민금융|대출|환급|감면|취약계층|다문화|외국인|바우처/;

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
  const summary = stripHtml(firstField(block, ["SubTitle1", "SubTitle2", "SubTitle3", "DataContents", "dataContents"]));
  const contents = stripHtml(firstField(block, ["DataContents", "dataContents"]));
  const department = stripHtml(firstField(block, ["MinisterCode", "ministerCode"]));
  const date = parseNewsDate(firstField(block, ["ApproveDate", "approveDate", "ModifyDate", "modifyDate"]));
  const imageUrl = stripHtml(firstField(block, ["ThumbnailUrl", "thumbnailUrl", "OriginalimgUrl", "originalimgUrl"]));
  const url = stripHtml(firstField(block, ["OriginalUrl", "originalUrl"]));
  const haystack = `${title} ${summary} ${contents} ${department}`;

  if (!title || !WELFARE_PATTERN.test(haystack)) return null;

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
