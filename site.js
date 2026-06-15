let data = window.GG24_DATA || { policies: [] };
let policies = Array.isArray(data.policies) ? data.policies : [];
const page = document.body.dataset.page;
const params = new URLSearchParams(location.search);
const money = new Intl.NumberFormat("ko-KR");
const today = new Date();
const toast = document.querySelector("#toast");
const regionOptions = [
  "전체지역",
  "전국",
  "서울",
  "경기",
  "인천",
  "부산",
  "대구",
  "광주",
  "대전",
  "울산",
  "세종",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
];
const ageOptions = ["전체연령", "영유아·출산", "아동·청소년", "청년", "중장년·어르신"];
const targetOptions = ["전체대상", "국가유공자·보훈", "장애인", "소상공인", "농어업인", "저소득층", "신혼부부", "외국인·다문화"];

const qs = (selector) => document.querySelector(selector);
const qsa = (selector) => [...document.querySelectorAll(selector)];
const policySnapshotKey = "GG24_LAST_POLICY_DETAIL";

function compactFilterValue(value) {
  return String(value || "").trim().replace(/[·\s_-]/g, "");
}

function ageFilterFrom(value) {
  const compact = compactFilterValue(value);
  const aliases = {
    전체연령: "전체연령",
    영유아출산: "영유아·출산",
    영유아: "영유아·출산",
    출산: "영유아·출산",
    아동청소년: "아동·청소년",
    아동: "아동·청소년",
    청소년: "아동·청소년",
    청년: "청년",
    중장년: "중장년·어르신",
    어르신: "중장년·어르신",
    노인: "중장년·어르신",
    중장년어르신: "중장년·어르신",
  };
  return aliases[compact] || "";
}

function targetFilterFrom(value) {
  const raw = String(value || "").trim();
  const compact = compactFilterValue(raw);
  const aliases = {
    전체대상: "전체대상",
    국가유공자보훈: "국가유공자·보훈",
    국가유공자: "국가유공자·보훈",
    보훈: "국가유공자·보훈",
    장애인: "장애인",
    소상공인: "소상공인",
    농어업인: "농어업인",
    농업인: "농어업인",
    어업인: "농어업인",
    저소득층: "저소득층",
    저소득: "저소득층",
    신혼부부: "신혼부부",
    외국인다문화: "외국인·다문화",
    외국인: "외국인·다문화",
    외국인주민: "외국인·다문화",
    등록외국인: "외국인·다문화",
    다문화: "외국인·다문화",
    다문화가족: "외국인·다문화",
    결혼이민자: "외국인·다문화",
    이주민: "외국인·다문화",
    난민: "외국인·다문화",
  };
  return aliases[compact] || (targetOptions.includes(raw) ? raw : "");
}

function readCategoryFilters(sourceParams = params) {
  const type = sourceParams.get("type") || "전체";
  const region = sourceParams.get("region") || "전체지역";
  const rawAge = sourceParams.get("age") || "";
  const rawTarget = sourceParams.get("target") || "";
  let age = ageFilterFrom(rawAge) || "전체연령";
  let target = targetFilterFrom(rawTarget) || "전체대상";

  const targetAsAge = ageFilterFrom(rawTarget);
  if (targetAsAge && age === "전체연령") {
    age = targetAsAge;
    target = "전체대상";
  }

  return {
    type,
    region,
    age,
    target,
    query: (sourceParams.get("q") || "").trim(),
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeUrl(value) {
  try {
    const url = new URL(String(value || ""), location.href || "https://example.com/");
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function policyUrl(policy) {
  return `policy.html?id=${encodeURIComponent(policy.id)}`;
}

function rememberPolicySnapshot(policy) {
  if (!policy?.id) return;
  try {
    sessionStorage.setItem(
      policySnapshotKey,
      JSON.stringify({
        id: policy.id,
        savedAt: Date.now(),
        policy,
      }),
    );
  } catch {
    // Detail pages can still fall back to API lookup.
  }
}

function categoryUrl({
  type,
  region,
  age,
  target,
  query,
} = {}) {
  const current = readCategoryFilters();
  type = type ?? current.type;
  region = region ?? current.region;
  age = age ?? current.age;
  target = target ?? current.target;
  query = query ?? current.query;

  const targetAsAge = ageFilterFrom(target);
  if (targetAsAge && age === "전체연령") {
    age = targetAsAge;
    target = "전체대상";
  }
  age = ageFilterFrom(age) || age;
  target = targetFilterFrom(target) || target;

  const nextParams = new URLSearchParams();
  if (type && type !== "전체") nextParams.set("type", type);
  if (region && region !== "전체지역") nextParams.set("region", region);
  if (age && age !== "전체연령") nextParams.set("age", age);
  if (target && target !== "전체대상") nextParams.set("target", target);
  if (query) nextParams.set("q", query);
  const queryString = nextParams.toString();
  return queryString ? `category.html?${queryString}` : "category.html";
}

function policySearchText(policy) {
  return [
    policy.title,
    policy.institution,
    policy.summary,
    policy.target,
    policy.method,
    policy.income,
    policy.region,
    policy.maxBenefit,
    (policy.tags || []).join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

function compactSearchValue(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[·ㆍ・\s_-]/g, "")
    .replace(/[^0-9a-z가-힣]/g, "");
}

const genericSearchTokens = new Set([
  "정책",
  "정책검색",
  "정책정보",
  "검색",
  "검색결과",
  "정보",
  "관련",
  "보기",
  "찾기",
  "찾아줘",
  "알려줘",
  "보여줘",
]);

const searchRegionAliases = {
  서울: ["서울", "서울특별시"],
  경기: ["경기", "경기도", "수원", "성남", "고양", "용인", "부천", "화성", "남양주", "안양", "평택", "파주", "김포", "광명", "광주시"],
  인천: ["인천", "인천광역시"],
  부산: ["부산", "부산광역시", "해운대", "해운대구"],
  대구: ["대구", "대구광역시"],
  광주: ["광주광역시"],
  대전: ["대전", "대전광역시"],
  울산: ["울산", "울산광역시"],
  세종: ["세종", "세종특별자치시"],
  강원: ["강원", "강원특별자치도", "춘천", "원주", "강릉", "동해", "속초", "삼척"],
  충북: ["충북", "충청북도", "청주", "충주", "제천"],
  충남: ["충남", "충청남도", "천안", "공주", "아산", "서산", "논산", "계룡", "당진", "태안", "홍성"],
  전북: ["전북", "전라북도", "전북특별자치도", "전주", "군산", "익산", "정읍", "남원", "김제"],
  전남: ["전남", "전라남도", "목포", "여수", "순천", "나주", "광양"],
  경북: ["경북", "경상북도", "포항", "경주", "김천", "안동", "구미", "영주", "영천", "상주", "문경", "경산"],
  경남: ["경남", "경상남도", "창원", "진주", "통영", "사천", "김해", "밀양", "거제", "양산"],
  제주: ["제주", "제주특별자치도"],
};

function preciseSearchAliasMatch(source, alias) {
  const text = String(source || "");
  if (!alias) return false;
  if (alias.length >= 4) return text.includes(alias);

  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(^|[^가-힣])${escaped}($|[^가-힣])|${escaped}(광역시|특별시|특별자치시|특별자치도|자치도|도|시|군|구)`);
  return pattern.test(text);
}

function policyRegionSearchText(policy) {
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

function queryRegionHints(query) {
  const compactQuery = compactSearchValue(query);
  const spacedTokens = String(query || "")
    .split(/[\s,./|]+/)
    .map(compactSearchValue)
    .filter(Boolean);

  return regionOptions
    .filter((region) => !region.startsWith("전체"))
    .filter((region) => {
      const compactRegion = compactSearchValue(region);
      return spacedTokens.includes(compactRegion) || compactQuery.startsWith(compactRegion);
    });
}

function policyMatchesRegionHint(policy, region) {
  if (region === "전국") return String(policy?.region || "").includes("전국");
  if (String(policy?.region || "").includes("전국")) return true;
  if (String(policy?.region || "").trim() === region) return true;
  const aliases = searchRegionAliases[region] || [region];
  return aliases.some((alias) => preciseSearchAliasMatch(policyRegionSearchText(policy), alias));
}

function queryTokens(query) {
  const compactQuery = compactSearchValue(query);
  const regionHints = queryRegionHints(query).map(compactSearchValue);
  const spacedTokens = String(query || "")
    .split(/[\s,./|]+/)
    .map(compactSearchValue)
    .filter((token) => token && !genericSearchTokens.has(token) && !regionHints.includes(token));
  const knownTokens = [
    ...ageOptions,
    ...targetOptions,
    "지원금",
    "환급금",
    "대출",
  ]
    .map(compactSearchValue)
    .filter((token) => token && !token.startsWith("전체") && compactQuery.includes(token));
  const tokens = knownTokens.length ? [...spacedTokens, ...knownTokens] : spacedTokens;
  return [...new Set(tokens.filter((token) => token && !genericSearchTokens.has(token)))];
}

function policyMatchesQuery(policy, query) {
  const rawQuery = String(query || "").trim();
  if (!rawQuery) return true;

  const regionHints = queryRegionHints(rawQuery);
  if (regionHints.length && !regionHints.every((region) => policyMatchesRegionHint(policy, region))) {
    return false;
  }

  const source = policySearchText(policy);
  const lowerQuery = rawQuery.toLowerCase();
  if (source.includes(lowerQuery)) return true;

  const enrichedSource = [
    source,
    policy.type,
    policyAgeGroups(policy).join(" "),
    policyTargetGroups(policy).join(" "),
  ].join(" ");
  const compactSource = compactSearchValue(enrichedSource);
  const compactQuery = compactSearchValue(rawQuery);
  if (compactQuery && compactSource.includes(compactQuery)) return true;

  const tokens = queryTokens(rawQuery);
  return tokens.length ? tokens.every((token) => compactSource.includes(token)) : false;
}

function policyAgeGroups(policy) {
  const source = policySearchText(policy);
  const groups = new Set();

  if (/영유아|영아|유아|신생아|출산|출생|임산부|임신|산모|육아|보육|어린이집|태아|난임|다자녀|양육/.test(source)) {
    groups.add("영유아·출산");
  }
  if (/아동|어린이|청소년|초등|초등학생|중등|중학생|고등|고등학생|학교\s?밖|입학준비|입학축하|학습지원|교복|만\s?(?:6|7|8|9|10|11|12|13|14|15|16|17)세/.test(source)) {
    groups.add("아동·청소년");
  }
  if (
    groups.has("아동·청소년") &&
    /제외[^。\n.]{0,100}(청소년쉼터|노숙인 자활시설)/.test(source) &&
    !/아동|어린이|청소년|초등|중등|고등|입학|학습|교복/.test(
      [policy.title, policy.summary].join(" ").toLowerCase(),
    )
  ) {
    groups.delete("아동·청소년");
  }
  if (
    groups.has("아동·청소년") &&
    /대학생|장애대학|대학교|대학원|대학에/.test(source) &&
    !/아동|어린이|청소년|초등|중등|중학생|고등|고등학생|만\s?(?:6|7|8|9|10|11|12|13|14|15|16|17)세/.test(
      source,
    )
  ) {
    groups.delete("아동·청소년");
  }
  if (/청년|대학생|취업준비|미취업|구직|사회초년|만\s?(?:18|19|2[0-9]|3[0-9])세/.test(source)) {
    groups.add("청년");
  }
  if (/중장년|중년|장년|신중년|경력단절|재취업|만\s?(?:4[0-9]|5[0-9]|6[0-4])세/.test(source)) {
    groups.add("중장년·어르신");
  }
  if (/어르신|노인|고령|경로|독거노인|기초연금|장수|효도|효행|65세|70세|75세|80세|만\s?(?:6[5-9]|[789][0-9])세/.test(source)) {
    groups.add("중장년·어르신");
  }

  return [...groups];
}

function policyTargetGroups(policy) {
  const source = policySearchText(policy);
  const groups = new Set();

  if (/국가유공자|보훈|참전|독립유공|상이군경|고엽제|5\.?18|민주유공|보훈대상|유족|순직|의사상자|전몰|전상|무공수훈|참전유공/.test(source)) {
    groups.add("국가유공자·보훈");
  }
  if (/장애인|장애아|장애정도|발달장애|중증장애|장애수당|장애연금|장애인복지/.test(source)) {
    groups.add("장애인");
  }
  if (/소상공인|소공인|전통시장|시장상인|상인회|폐업|개인사업자|예비창업자|창업자금|창업지원금|사업화 자금/.test(source)) {
    groups.add("소상공인");
  }
  if (/농업|농가|농민|어업|어민|임업|축산|귀농|귀어|농어업|농촌|어촌|경영체/.test(source)) {
    groups.add("농어업인");
  }
  if (/저소득|기초생활|수급자|차상위|한부모|취약계층|중위소득|생계급여|의료급여|주거급여/.test(source)) {
    groups.add("저소득층");
  }
  if (/신혼|혼인|결혼|예비부부/.test(source)) {
    groups.add("신혼부부");
  }
  const hasForeignerPositiveSignal =
    /다문화|결혼이민|이주민|중도입국|난민|귀화|국적취득|새터민|북한이탈주민|외국인주민|외국인 주민|등록외국인|등록 외국인|외국인등록|외국인 등록|외국국적동포|외국 국적 동포|거소등록|거소 등록|내외국인|외국인\s*(?:포함|대상|지원|주민|유아|아동|청소년|근로|산모|임산부)|외국인(?:도|은|을|이)?\s*포함|체류지\s*등록[^。\n.]{0,40}외국인/.test(
      source,
    );
  const hasForeignerExclusionSignal =
    /외국인[^。\n.]{0,80}(제외|불가|아님|지원대상 아님|참여 불가|신청불가)|재외국인[^。\n.]{0,60}(제외|불가|신청불가|아님)|재외국민[^。\n.]{0,60}(제외|불가|신청불가|아님)|제외대상[^。\n.]{0,100}외국인|부부 모두 외국인(?:인 경우)?\s*(?:제외|불가)/.test(
      source,
    );
  if (hasForeignerPositiveSignal || (/외국인/.test(source) && !hasForeignerExclusionSignal)) {
    groups.add("외국인·다문화");
  }
  if (hasForeignerExclusionSignal && !hasForeignerPositiveSignal) {
    groups.delete("외국인·다문화");
  }

  return [...groups];
}

function formatDataDate() {
  if (!data.generatedAt) return "공식 데이터 기준";
  return `${new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(data.generatedAt))} 기준`;
}

function daysLeft(deadline) {
  if (!deadline) return "기관 문의";
  if (deadline === "상시" || deadline.includes("상시") || deadline.includes("예산") || deadline.includes("문의")) {
    return deadline;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return deadline;
  const due = new Date(`${deadline}T23:59:59+09:00`);
  const diff = Math.ceil((due - today) / 86400000);
  if (diff < 0) return "마감";
  if (diff === 0) return "오늘 마감";
  return `${diff}일 남음`;
}

function badgeClass(type) {
  if (type === "환급금") return "refund";
  if (type === "대출") return "loan";
  return "";
}

function illustrationForType(type) {
  if (type === "환급금") return "assets/illustration-refund.svg";
  if (type === "대출") return "assets/illustration-loan.svg";
  return "assets/illustration-support.svg";
}

function policyCard(policy) {
  const title = escapeHtml(policy.title);
  const type = escapeHtml(policy.type);
  const thumbClass = badgeClass(policy.type) || "support";
  const illustration = illustrationForType(policy.type);
  const sourceUrl = safeUrl(policy.sourceUrl);
  const detailUrl = policyUrl(policy);
  const applyHref = sourceUrl || detailUrl;
  const applyTarget = sourceUrl ? ` target="_blank" rel="noopener"` : "";

  return `
    <article class="policy-card" data-type="${type}">
      <a class="policy-thumb ${thumbClass}" href="${detailUrl}" aria-label="${title} 상세 보기">
        <img class="tile-illustration" src="${illustration}" alt="" aria-hidden="true" />
      </a>
      <div class="policy-body">
        <div class="meta-row">
          <span class="badge ${badgeClass(policy.type)}">${type}</span>
          <span class="badge deadline">${escapeHtml(daysLeft(policy.deadline))}</span>
        </div>
        <h3><a href="${detailUrl}">${title}</a></h3>
        <p>기관: ${escapeHtml(policy.institution)}</p>
        <div class="mini-meta">
          <span>${money.format(policy.views)}명 확인</span>
          <span>혜택 ${escapeHtml(policy.maxBenefit)}</span>
        </div>
        <div class="card-actions">
          <a class="ghost-button" href="${detailUrl}">상세보기</a>
          <a class="apply-link" href="${applyHref}"${applyTarget}>신청하기</a>
        </div>
      </div>
    </article>
  `;
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.hidden = true;
  }, 2200);
}

function bindCommonActions() {
  qsa("[data-apply]").forEach((button) => {
    button.addEventListener("click", () => showToast("공식 원문에서 신청 경로를 확인해 주세요."));
  });

  qsa('a[href*="policy.html?id="], a[href*="/policy?id="]').forEach((link) => {
    if (link.dataset.policySnapshotBound) return;
    link.dataset.policySnapshotBound = "true";
    link.addEventListener("click", () => {
      try {
        const id = new URL(link.getAttribute("href"), location.href).searchParams.get("id");
        const policy = policies.find((item) => item.id === id);
        if (policy) rememberPolicySnapshot(policy);
      } catch {
        // The link still navigates normally.
      }
    });
  });

  const search = qs("#siteSearch");
  if (search) {
    search.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = search.querySelector("input");
      location.href = `category.html?q=${encodeURIComponent(input.value.trim())}`;
    });
  }
}

function showCategoryLoading() {
  if (page !== "category") return;
  const count = qs("#categoryCount");
  const list = qs("#policyList");
  const notice = qs("#resultNotice");
  if (count) count.textContent = "불러오는 중";
  if (notice) notice.textContent = "";
  if (list) list.innerHTML = `<div class="empty-card">최신 정책 정보를 불러오고 있습니다.</div>`;
}

async function loadLivePolicies() {
  if (!["home", "category", "policy"].includes(page)) return;
  if (page === "category") return false;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);

  try {
    const response = await fetch("/api/policies?pages=6&perPage=500&maxItems=3000", {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) return;
    const liveData = await response.json();
    if (!Array.isArray(liveData.policies) || !liveData.policies.length) return false;
    data = liveData;
    policies = liveData.policies;
    return true;
  } catch {
    // Local static previews keep using site-data.js when Cloudflare Functions are unavailable.
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function renderHome() {
  const dateLabel = qs("#dataDateLabel");
  if (dateLabel) dateLabel.textContent = formatDataDate();
  const featured = policies.filter((item) => item.featured).slice(0, 5);
  qs("#featuredPolicies").innerHTML = featured.map(policyCard).join("");
}

function filteredPolicies() {
  const { type, region, age, target, query } = readCategoryFilters();
  return policies.filter((policy) => {
    const typeMatch = type === "전체" || policy.type === type;
    const regionMatch = region === "전체지역" || policy.region === region;
    const ageMatch = age === "전체연령" || policyAgeGroups(policy).includes(age);
    const targetMatch = target === "전체대상" || policyTargetGroups(policy).includes(target);
    const queryMatch = policyMatchesQuery(policy, query);
    return typeMatch && regionMatch && ageMatch && targetMatch && queryMatch;
  });
}

function renderCategory() {
  const { type, region, age, target, query } = readCategoryFilters();
  const list = filteredPolicies();
  const isFocusedSearch = query || region !== "전체지역" || age !== "전체연령" || target !== "전체대상" || type !== "전체";
  const isCategoryDataLoading = isFocusedSearch && !list.length && !window.GG24_CATEGORY_FULL_LOAD_DONE;
  const displayLimit = query ? 300 : isFocusedSearch ? 180 : 80;
  const visibleList = list.slice(0, displayLimit);
  const titleParts = [];
  if (region !== "전체지역") titleParts.push(region);
  if (age !== "전체연령") titleParts.push(age);
  if (target !== "전체대상") titleParts.push(target);
  if (type !== "전체") titleParts.push(type);
  qs("#categoryTitle").textContent = titleParts.length ? `${titleParts.join(" ")} 정보` : "정책 전체";
  qs("#categoryCount").textContent = isCategoryDataLoading ? "불러오는 중" : `${money.format(list.length)}개 결과`;
  qs("#categorySearchInput").value = query;
  qsa("[data-type-filter]").forEach((link) => {
    link.classList.toggle("active", link.dataset.typeFilter === type);
    link.href = categoryUrl({ type: link.dataset.typeFilter, region, age, target, query });
  });
  qs("#regionFilter").innerHTML = regionOptions
    .map((item) => {
      const active = item === region ? " active" : "";
      return `<a class="${active}" href="${categoryUrl({ type, region: item, age, target, query })}" data-region-filter="${escapeHtml(item)}">${escapeHtml(item)}</a>`;
    })
    .join("");
  qs("#ageFilter").innerHTML = ageOptions
    .map((item) => {
      const active = item === age ? " active" : "";
      return `<a class="${active}" href="${categoryUrl({ type, region, age: item, target, query })}" data-age-filter="${escapeHtml(item)}">${escapeHtml(item)}</a>`;
    })
    .join("");
  qs("#targetFilter").innerHTML = targetOptions
    .map((item) => {
      const active = item === target ? " active" : "";
      return `<a class="${active}" href="${categoryUrl({ type, region, age, target: item, query })}" data-target-filter="${escapeHtml(item)}">${escapeHtml(item)}</a>`;
    })
    .join("");
  const notice = qs("#resultNotice");
  if (notice) {
    notice.textContent =
      !isCategoryDataLoading && list.length > visibleList.length
        ? `${money.format(list.length)}개 중 ${money.format(visibleList.length)}개를 먼저 보여드려요. 지역명이나 대상 키워드를 더 넣으면 정확해집니다.`
        : "";
  }
  qs("#policyList").innerHTML = isCategoryDataLoading
    ? `<div class="empty-card">조건에 맞는 정책을 불러오고 있습니다.</div>`
    : visibleList.length
    ? visibleList.map(policyCard).join("")
    : `<div class="empty-card">조건에 맞는 정책이 없습니다. 지역이나 검색어를 넓혀보세요.</div>`;

  qs("#categorySearch").onsubmit = (event) => {
    event.preventDefault();
    const input = qs("#categorySearchInput").value.trim();
    location.href = categoryUrl({ type, region, age, target, query: input });
  };
}

function detailRow(label, value) {
  return `
    <div class="detail-row">
      <dt>${escapeHtml(label)}</dt>
      <dd>${escapeHtml(value)}</dd>
    </div>
  `;
}

function renderPolicyDetail({ allowFallback = true, missingText = "정책 정보를 불러오는 중입니다." } = {}) {
  if (!policies.length) {
    qs("#policyDetail").innerHTML = `<div class="empty-card">표시할 정책 데이터가 없습니다.</div>`;
    return;
  }
  const requestedId = params.get("id");
  const id = requestedId || policies[0].id;
  const matchedPolicy = policies.find((item) => item.id === id);
  const policy = matchedPolicy || (allowFallback ? policies[0] : null);
  if (!policy) {
    qs("#policyDetail").innerHTML = `<div class="empty-card">${escapeHtml(missingText)}</div>`;
    return;
  }
  const sourceUrl = safeUrl(policy.sourceUrl);
  const sourceAction = sourceUrl
    ? `<a class="primary-button" href="${sourceUrl}" target="_blank" rel="noopener">신청하기</a>`
    : `<button class="primary-button" type="button" data-apply>지원하기</button>`;
  const tags = Array.isArray(policy.tags) ? policy.tags : [];

  document.title = `${policy.title} - 지원금 올데이`;
  qs("#policyDetail").innerHTML = `
    <div class="detail-head">
      <div class="meta-row">
        <span class="badge ${badgeClass(policy.type)}">${escapeHtml(policy.type)}</span>
        <span class="badge deadline">${escapeHtml(daysLeft(policy.deadline))}</span>
      </div>
      <h1>${escapeHtml(policy.title)}</h1>
      <p>${escapeHtml(policy.summary)}</p>
      <div class="detail-actions">
        ${sourceAction}
        <a class="ghost-button" href="category.html">목록 보기</a>
      </div>
    </div>

    <aside class="benefit-summary">
      <span>혜택 요약</span>
      <strong>${escapeHtml(policy.maxBenefit)}</strong>
      <p>내가 지원 받을 수 있는 최대 혜택이에요</p>
    </aside>

    <section class="detail-section">
      <h2>사업내용</h2>
      <dl class="detail-grid">
        ${detailRow("지원기관", policy.institution)}
        ${detailRow("신청 마감일", policy.deadline)}
        ${detailRow("지원 형태", policy.type)}
        ${detailRow("지원 방법", policy.method)}
      </dl>
    </section>

    <section class="detail-section">
      <h2>지원대상</h2>
      <dl class="detail-grid">
        ${detailRow("지원대상", policy.target)}
        ${detailRow("대상 거주지", policy.region)}
        ${detailRow("소득 제한", policy.income)}
        ${detailRow("기타 사항", tags.join(", "))}
      </dl>
    </section>

    <section class="detail-section">
      <h2>접수 방법 및 상세 설명</h2>
      <p>${escapeHtml(policy.summary)} 신청 전에는 관할 기관 공고와 실제 신청 페이지의 최신 조건을 함께 확인해야 합니다.</p>
    </section>
  `;
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

async function init() {
  if (page === "category") {
    renderCategory();
    bindCommonActions();
    loadLivePolicies().then((updated) => {
      if (updated) renderCategory();
    });
    registerServiceWorker();
    return;
  }

  if (page === "home") {
    renderHome();
    bindCommonActions();
    loadLivePolicies().then((updated) => {
      if (updated) renderHome();
    });
    registerServiceWorker();
    return;
  }

  if (page === "policy") {
    const hasRequestedId = Boolean(params.get("id"));
    renderPolicyDetail({ allowFallback: !hasRequestedId });
    bindCommonActions();
    loadLivePolicies().then((updated) => {
      if (updated) {
        renderPolicyDetail({
          allowFallback: !hasRequestedId,
          missingText: "정책 정보를 찾을 수 없습니다. 목록에서 다시 검색해 주세요.",
        });
        bindCommonActions();
      } else if (hasRequestedId) {
        renderPolicyDetail({
          allowFallback: false,
          missingText: "정책 정보를 찾을 수 없습니다. 목록에서 다시 검색해 주세요.",
        });
      }
    });
    registerServiceWorker();
    return;
  }

  await loadLivePolicies();
  bindCommonActions();
  registerServiceWorker();
}

init();
