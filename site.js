const data = window.GG24_DATA || { policies: [] };
const policies = Array.isArray(data.policies) ? data.policies : [];
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
const ageOptions = ["전체연령", "영유아·출산", "아동·청소년", "청년", "중장년", "어르신"];
const targetOptions = ["전체대상", "국가유공자·보훈", "장애인", "소상공인", "농어업인", "저소득층", "신혼부부"];

const qs = (selector) => document.querySelector(selector);
const qsa = (selector) => [...document.querySelectorAll(selector)];

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

function categoryUrl({
  type = params.get("type") || "전체",
  region = params.get("region") || "전체지역",
  age = params.get("age") || "전체연령",
  target = params.get("target") || "전체대상",
  query = params.get("q") || "",
} = {}) {
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

function policyAgeGroups(policy) {
  const source = policySearchText(policy);
  const groups = new Set();

  if (/영유아|영아|유아|신생아|출산|출생|임산부|임신|산모|육아|보육|어린이집|태아|난임|다자녀|양육/.test(source)) {
    groups.add("영유아·출산");
  }
  if (/아동|어린이|청소년|초등|중등|중학생|고등|고등학생|학생|입학|학습|장학|교복|만\s?(?:6|7|8|9|10|11|12|13|14|15|16|17)세/.test(source)) {
    groups.add("아동·청소년");
  }
  if (/청년|대학생|취업준비|미취업|구직|사회초년|신혼|만\s?(?:18|19|2[0-9]|3[0-9])세/.test(source)) {
    groups.add("청년");
  }
  if (/중장년|중년|장년|신중년|경력단절|재취업|만\s?(?:4[0-9]|5[0-9]|6[0-4])세/.test(source)) {
    groups.add("중장년");
  }
  if (/어르신|노인|고령|경로|독거노인|기초연금|장수|효도|효행|65세|70세|75세|80세|만\s?(?:6[5-9]|[789][0-9])세/.test(source)) {
    groups.add("어르신");
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
  if (/소상공인|자영업|소기업|전통시장|상인|창업|폐업|사업자|중소기업/.test(source)) {
    groups.add("소상공인");
  }
  if (/농업|농가|농민|어업|어민|임업|축산|귀농|귀어|농어업|농촌|어촌|경영체/.test(source)) {
    groups.add("농어업인");
  }
  if (/저소득|기초생활|수급자|차상위|한부모|취약계층|중위소득|생계급여|의료급여|주거급여/.test(source)) {
    groups.add("저소득층");
  }
  if (/신혼|혼인|결혼|예비부부|부부|전세자금|주택자금|임차보증금/.test(source)) {
    groups.add("신혼부부");
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

  qsa("[data-store]").forEach((button) => {
    button.addEventListener("click", () => showToast("앱 스토어 연결 준비 중입니다."));
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

function renderHome() {
  const dateLabel = qs("#dataDateLabel");
  if (dateLabel) dateLabel.textContent = formatDataDate();
  const featured = policies.filter((item) => item.featured).slice(0, 5);
  qs("#featuredPolicies").innerHTML = featured.map(policyCard).join("");
}

function filteredPolicies() {
  const type = params.get("type") || "전체";
  const region = params.get("region") || "전체지역";
  const age = params.get("age") || "전체연령";
  const target = params.get("target") || "전체대상";
  const query = (params.get("q") || "").trim().toLowerCase();
  return policies.filter((policy) => {
    const typeMatch = type === "전체" || policy.type === type;
    const regionMatch = region === "전체지역" || policy.region === region;
    const ageMatch = age === "전체연령" || policyAgeGroups(policy).includes(age);
    const targetMatch = target === "전체대상" || policyTargetGroups(policy).includes(target);
    const queryMatch =
      !query ||
      policySearchText(policy).includes(query);
    return typeMatch && regionMatch && ageMatch && targetMatch && queryMatch;
  });
}

function renderCategory() {
  const type = params.get("type") || "전체";
  const region = params.get("region") || "전체지역";
  const age = params.get("age") || "전체연령";
  const target = params.get("target") || "전체대상";
  const query = params.get("q") || "";
  const list = filteredPolicies();
  const isFocusedSearch = query || region !== "전체지역" || age !== "전체연령" || target !== "전체대상" || type !== "전체";
  const displayLimit = query ? 300 : isFocusedSearch ? 180 : 80;
  const visibleList = list.slice(0, displayLimit);
  const titleParts = [];
  if (region !== "전체지역") titleParts.push(region);
  if (age !== "전체연령") titleParts.push(age);
  if (target !== "전체대상") titleParts.push(target);
  if (type !== "전체") titleParts.push(type);
  qs("#categoryTitle").textContent = titleParts.length ? `${titleParts.join(" ")} 정보` : "정책 전체";
  qs("#categoryCount").textContent = `${money.format(list.length)}개 결과`;
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
      list.length > visibleList.length
        ? `${money.format(list.length)}개 중 ${money.format(visibleList.length)}개를 먼저 보여드려요. 지역명이나 대상 키워드를 더 넣으면 정확해집니다.`
        : "";
  }
  qs("#policyList").innerHTML = visibleList.length
    ? visibleList.map(policyCard).join("")
    : `<div class="empty-card">조건에 맞는 정책이 없습니다. 지역이나 검색어를 넓혀보세요.</div>`;

  qs("#categorySearch").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = qs("#categorySearchInput").value.trim();
    location.href = categoryUrl({ type, region, age, target, query: input });
  });
}

function detailRow(label, value) {
  return `
    <div class="detail-row">
      <dt>${escapeHtml(label)}</dt>
      <dd>${escapeHtml(value)}</dd>
    </div>
  `;
}

function renderPolicyDetail() {
  if (!policies.length) {
    qs("#policyDetail").innerHTML = `<div class="empty-card">표시할 정책 데이터가 없습니다.</div>`;
    return;
  }
  const id = params.get("id") || policies[0].id;
  const policy = policies.find((item) => item.id === id) || policies[0];
  const sourceUrl = safeUrl(policy.sourceUrl);
  const sourceAction = sourceUrl
    ? `<a class="primary-button" href="${sourceUrl}" target="_blank" rel="noopener">신청하기</a>`
    : `<button class="primary-button" type="button" data-apply>지원하기</button>`;
  const tags = Array.isArray(policy.tags) ? policy.tags : [];

  document.title = `${policy.title} - 정부지원금25`;
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

function init() {
  if (page === "home") renderHome();
  if (page === "category") renderCategory();
  if (page === "policy") renderPolicyDetail();
  bindCommonActions();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

init();
