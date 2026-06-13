import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const endpoint = 'https://api.odcloud.kr/api/gov24/v3/serviceList';
const toolDir = path.dirname(fileURLToPath(import.meta.url));
const siteDir = path.resolve(toolDir, '..');
const outputPath = path.join(siteDir, 'site-data.js');

const regions = [
  ['서울', ['서울']],
  ['부산', ['부산']],
  ['대구', ['대구']],
  ['인천', ['인천']],
  ['광주', ['광주']],
  ['대전', ['대전']],
  ['울산', ['울산']],
  ['세종', ['세종']],
  ['경기', ['경기', '수원', '성남', '고양', '용인', '부천', '화성', '안양', '평택', '시흥', '김포']],
  ['강원', ['강원', '춘천', '원주', '강릉', '동해', '속초']],
  ['충북', ['충북', '충청북도', '청주', '충주', '제천']],
  ['충남', ['충남', '충청남도', '천안', '공주', '보령', '아산', '서산', '논산', '계룡', '당진', '태안']],
  ['전북', ['전북', '전라북도', '전주', '군산', '익산', '정읍', '남원', '김제']],
  ['전남', ['전남', '전라남도', '목포', '여수', '순천', '나주', '광양']],
  ['경북', ['경북', '경상북도', '포항', '경주', '김천', '안동', '구미', '영주', '영천', '문경', '경산']],
  ['경남', ['경남', '경상남도', '창원', '진주', '통영', '사천', '김해', '밀양', '거제', '양산']],
  ['제주', ['제주']],
];

function text(value, fallback = '') {
  const normalized = String(value ?? '').replaceAll(String.fromCharCode(13), ' ').replaceAll(String.fromCharCode(10), ' ').trim();
  return normalized || fallback;
}

function clip(value, max = 120) {
  const normalized = text(value);
  return normalized.length <= max ? normalized : `${normalized.slice(0, max - 1)}…`;
}

function hasAny(source, words) {
  return words.some((word) => source.includes(word));
}

function inferType(record) {
  const source = [record['서비스명'], record['서비스목적요약'], record['지원내용'], record['지원유형'], record['서비스분야']].map((item) => text(item)).join(' ');
  if (hasAny(source, ['대출', '융자', '보증', '자금', '금융', '이자', '금리'])) return '대출';
  if (hasAny(source, ['환급', '공제', '감면', '세액', '세금', '지방세', '국세', '보험료'])) return '환급금';
  return '지원금';
}

function inferRegion(record) {
  const source = `${text(record['소관기관명'])} ${text(record['접수기관'])}`;
  const match = regions.find(([, words]) => hasAny(source, words));
  return match ? match[0] : '전국';
}

function inferIncome(record) {
  const source = `${text(record['선정기준'])} ${text(record['지원대상'])}`;
  if (hasAny(source, ['무관', '제한 없음', '소득 무관'])) return '무관';
  if (hasAny(source, ['소득', '저소득', '중위소득', '차상위', '수급자', '건강보험료'])) return clip(source, 42);
  return '공고 확인';
}

function inferBenefit(record) {
  return clip(text(record['지원유형'], '혜택 제공'), 26);
}

function normalizeDeadline(value) {
  const deadline = text(value, '상시 또는 기관 문의');
  return deadline.includes('상시') ? '상시' : clip(deadline, 24);
}

function safeUrl(value) {
  const normalized = text(value);
  try {
    const url = new URL(normalized);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

function tagsFor(record, type, region) {
  return [type, text(record['서비스분야'], '공공서비스'), region, text(record['소관기관유형'])]
    .filter(Boolean)
    .filter((item, index, items) => items.indexOf(item) === index)
    .slice(0, 4);
}

function policyFromRecord(record, index) {
  const type = inferType(record);
  const region = inferRegion(record);
  const title = text(record['서비스명'], '공공서비스 혜택');
  const summary = clip(text(record['서비스목적요약'], text(record['지원내용'], '공식 공고에서 상세 조건을 확인하세요.')), 120);
  const rawId = text(record['서비스ID'], String(index + 1));

  return {
    id: `gov24-${rawId.replaceAll(' ', '-')}`,
    title,
    type,
    institution: text(record['소관기관명'], text(record['부서명'], '공공기관')),
    deadline: normalizeDeadline(record['신청기한']),
    views: Number.parseInt(String(record['조회수'] ?? '0').replaceAll(',', ''), 10) || 0,
    maxBenefit: inferBenefit(record),
    region,
    income: inferIncome(record),
    target: clip(text(record['지원대상'], '공식 공고 확인'), 110),
    method: clip(text(record['신청방법'], text(record['접수기관'], '공식 페이지에서 확인')), 90),
    summary,
    tags: tagsFor(record, type, region),
    sourceUrl: safeUrl(record['상세조회URL']),
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

async function readEnvFileKey() {
  try {
    const body = await readFile(path.join(siteDir, '.env.local'), 'utf8');
    const line = body.split(String.fromCharCode(10)).find((item) => item.trim().startsWith('DATA_GO_KR_SERVICE_KEY='));
    return line ? line.split('=').slice(1).join('=').trim().replaceAll('"', '').replaceAll("'", '') : '';
  } catch (error) {
    if (error.code === 'ENOENT') return '';
    throw error;
  }
}

async function resolveServiceKey() {
  return text(process.env.DATA_GO_KR_SERVICE_KEY) || (await readEnvFileKey());
}

async function fetchPage(serviceKey, page, perPage) {
  const url = new URL(endpoint);
  url.searchParams.set('page', String(page));
  url.searchParams.set('perPage', String(perPage));
  url.searchParams.set('serviceKey', serviceKey);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Gov24 API request failed: ${response.status} ${response.statusText}`);
  return response.json();
}

async function updateGov24Data() {
  const serviceKey = await resolveServiceKey();
  if (!serviceKey) throw new Error('DATA_GO_KR_SERVICE_KEY is required. Put it in gg24-site/.env.local or environment variables.');

  const pages = Number(process.env.GOV24_PAGES || 120);
  const perPage = Number(process.env.GOV24_PER_PAGE || 100);
  const records = [];
  let totalCount = 0;

  for (let page = 1; page <= pages; page += 1) {
    const body = await fetchPage(serviceKey, page, perPage);
    totalCount = Number(body.totalCount || totalCount);
    records.push(...(Array.isArray(body.data) ? body.data : []));
  }

  const policies = dedupePolicies(records.map(policyFromRecord).filter((policy) => policy.title && policy.sourceUrl))
    .sort((a, b) => b.views - a.views)
    .map((policy, index) => ({ ...policy, featured: index < 6 }));

  const payload = {
    generatedAt: new Date().toISOString(),
    source: {
      name: '행정안전부_대한민국 공공서비스 정보',
      provider: '공공데이터포털',
      url: 'https://www.data.go.kr/data/15113968/openapi.do',
      endpoint,
      totalCount,
      fetchedRecords: records.length,
    },
    policies,
  };

  await writeFile(outputPath, `window.GG24_DATA = ${JSON.stringify(payload, null, 2)};${String.fromCharCode(10)}`, 'utf8');
  console.log(`Wrote ${policies.length} policies to ${outputPath}`);
}

updateGov24Data().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
