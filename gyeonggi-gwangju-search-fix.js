(() => {
  if (document.body.dataset.page !== "category") return;

  const version = "6";
  document.documentElement.dataset.gg24GyeonggiGwangjuFix = version;

  const ageCodeLabels = {
    INFANT_BIRTH: "영유아·출산",
    CHILD_TEEN: "아동·청소년",
    YOUTH: "청년",
    MIDDLE_SENIOR: "중장년·어르신",
  };
  const targetCodeLabels = {
    VETERAN: "국가유공자·보훈",
    DISABLED: "장애인",
    SMALL_BUSINESS: "소상공인",
    FARM_FISHERY: "농어업인",
    LOW_INCOME: "저소득층",
    NEWLYWED: "신혼부부",
    FOREIGNER_MULTICULTURAL: "외국인·다문화",
  };
  const genericTokens = new Set(["정보", "정책", "혜택", "지원", "지원금", "전체"]);
  let cachedMatches = [];

  function setState(value) {
    document.documentElement.dataset.gg24GyeonggiGwangjuState = value;
  }

  function compact(value) {
    return String(value || "").toLowerCase().replace(/\s+/g, "");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function safeUrl(value) {
    try {
      const url = new URL(String(value || ""), location.href);
      return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  }

  function readFilters() {
    const params = new URLSearchParams(location.search);
    return {
      type: params.get("type") || "전체",
      region: params.get("region") || "전체지역",
      age: params.get("age") || "전체연령",
      target: params.get("target") || "전체대상",
      query: params.get("q") || "",
    };
  }

  function categoryHref(nextFilters = {}) {
    const filters = { ...readFilters(), ...nextFilters };
    const params = new URLSearchParams();
    if (filters.type && filters.type !== "전체") params.set("type", filters.type);
    if (filters.region && filters.region !== "전체지역") params.set("region", filters.region);
    if (filters.age && filters.age !== "전체연령") params.set("age", filters.age);
    if (filters.target && filters.target !== "전체대상") params.set("target", filters.target);
    if (filters.query) params.set("q", filters.query);
    const queryString = params.toString();
    return `category.html${queryString ? `?${queryString}` : ""}`;
  }

  function queryTokens(query) {
    return String(query || "")
      .split(/[\s,./|]+/)
      .map(compact)
      .filter(Boolean);
  }

  function isGyeonggiGwangjuSearch({ region, query }) {
    const tokens = queryTokens(query);
    const hasGyeonggi = compact(region) === "경기" || tokens.includes("경기") || tokens.includes("경기도");
    const hasGwangju = tokens.includes("광주") || tokens.includes("광주시");
    return /경기도?광주시?/.test(compact(query)) || (hasGyeonggi && hasGwangju);
  }

  function sameNamePlaceChoices({ region, query }) {
    const tokens = queryTokens(query);
    const compactQuery = compact(query);
    const hasGwangju = tokens.includes("광주") || tokens.includes("광주시") || compactQuery === "광주";
    const hasQualifier =
      compact(region) === "경기" ||
      compact(region) === "광주" ||
      tokens.includes("경기") ||
      tokens.includes("경기도") ||
      tokens.includes("광주광역시") ||
      /경기도?광주시?/.test(compactQuery);

    if (!hasGwangju || hasQualifier) return null;

    return {
      label: "광주",
      message: "광주는 같은 이름의 지역이 있어요. 찾는 지역을 선택하면 결과가 정확해집니다.",
      choices: [
        { label: "광주광역시", href: categoryHref({ region: "광주", query: "" }) },
        { label: "경기 광주시", href: categoryHref({ region: "경기", query: "경기 광주" }) },
      ],
    };
  }

  function showSameNamePlaceNotice() {
    const notice = document.querySelector("#resultNotice");
    if (!notice) return;
    const place = sameNamePlaceChoices(readFilters());
    if (!place) return;
    notice.innerHTML = `
      <span>${escapeHtml(place.message)}</span>
      <span class="filter-row same-name-options">
        ${place.choices.map((choice) => `<a href="${escapeHtml(choice.href)}">${escapeHtml(choice.label)}</a>`).join("")}
      </span>
    `;
  }

  if (typeof renderCategory === "function") {
    const previousRenderCategory = renderCategory;
    renderCategory = function renderCategoryWithSameNameNotice(...args) {
      const result = previousRenderCategory(...args);
      showSameNamePlaceNotice();
      return result;
    };
  }

  function sourceText(policy) {
    return [
      policy?.region,
      policy?.institution,
      policy?.title,
      policy?.target,
      policy?.summary,
      policy?.method,
      (policy?.tags || []).join(" "),
    ]
      .filter(Boolean)
      .join(" ");
  }

  function groupsFromCodes(policy, key, labels) {
    return [...new Set((policy?.[key] || []).map((code) => labels[code]).filter(Boolean))];
  }

  function ageGroups(policy) {
    const groups = new Set(groupsFromCodes(policy, "ageCodes", ageCodeLabels));
    const source = sourceText(policy);
    if (/영유아|신생아|출산|임산부|산모|육아|보육|다자녀|양육/.test(source)) groups.add("영유아·출산");
    if (/아동|어린이|청소년|초등|중등|고등|입학|학습|교복/.test(source)) groups.add("아동·청소년");
    if (/청년|대학생|취업준비|구직/.test(source)) groups.add("청년");
    if (/중장년|노인|어르신|고령|시니어/.test(source)) groups.add("중장년·어르신");
    return [...groups];
  }

  function targetGroups(policy) {
    const groups = new Set(groupsFromCodes(policy, "targetCodes", targetCodeLabels));
    const source = sourceText(policy);
    if (/국가유공자|보훈/.test(source)) groups.add("국가유공자·보훈");
    if (/장애인|장애/.test(source)) groups.add("장애인");
    if (/소상공인|소공인|전통시장|자영업|개인사업자/.test(source)) groups.add("소상공인");
    if (/농업|어업|농어업|귀농|귀어/.test(source)) groups.add("농어업인");
    if (/저소득|기초생활|차상위|취약계층/.test(source)) groups.add("저소득층");
    if (/신혼|신혼부부|예비부부/.test(source)) groups.add("신혼부부");
    if (/외국인|다문화|이주민/.test(source)) groups.add("외국인·다문화");
    return [...groups];
  }

  function isGyeonggiGwangjuPolicy(policy) {
    const source = sourceText(policy);
    return (
      String(policy?.region || "").trim() === "경기" &&
      !/광주광역시/.test(source) &&
      /경기도\s*광주시|경기도광주시|광주시/.test(source)
    );
  }

  function extraTokens(query) {
    return String(query || "")
      .split(/[\s,./|]+/)
      .map(compact)
      .filter(Boolean)
      .filter((token) => !["경기", "경기도", "광주", "광주시"].includes(token))
      .filter((token) => !genericTokens.has(token));
  }

  function matchesFilters(policy, filters) {
    const compactSource = compact([sourceText(policy), policy.type, ageGroups(policy).join(" "), targetGroups(policy).join(" ")].join(" "));
    return (
      (filters.type === "전체" || policy.type === filters.type) &&
      (filters.age === "전체연령" || ageGroups(policy).includes(filters.age)) &&
      (filters.target === "전체대상" || targetGroups(policy).includes(filters.target)) &&
      extraTokens(filters.query).every((token) => compactSource.includes(token))
    );
  }

  function daysLeft(deadline) {
    if (!deadline) return "기관 문의";
    if (deadline === "상시" || deadline.includes("상시") || deadline.includes("예산") || deadline.includes("문의")) return deadline;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return deadline;
    const due = new Date(`${deadline}T23:59:59+09:00`);
    const diff = Math.ceil((due - new Date()) / 86400000);
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
    const detailUrl = `policy.html?id=${encodeURIComponent(policy.id)}`;
    const sourceUrl = safeUrl(policy.sourceUrl);
    const applyHref = sourceUrl || detailUrl;
    const applyTarget = sourceUrl ? ` target="_blank" rel="noopener"` : "";
    const type = escapeHtml(policy.type || "지원금");

    return `
      <article class="policy-card" data-gg24-gyeonggi-gwangju-card="true">
        <a class="policy-thumb ${badgeClass(policy.type) || "support"}" href="${detailUrl}" aria-label="${escapeHtml(policy.title)} 상세 보기">
          <img class="tile-illustration" src="${illustrationForType(policy.type)}" alt="" aria-hidden="true" />
        </a>
        <div class="policy-body">
          <div class="meta-row">
            <span class="badge ${badgeClass(policy.type)}">${type}</span>
            <span class="badge deadline">${escapeHtml(daysLeft(policy.deadline))}</span>
          </div>
          <h3><a href="${detailUrl}">${escapeHtml(policy.title)}</a></h3>
          <p>기관: ${escapeHtml(policy.institution || "공고 확인")}</p>
          <div class="mini-meta">
            <span>${Number(policy.views || 0).toLocaleString("ko-KR")}명 확인</span>
            <span>혜택 ${escapeHtml(policy.maxBenefit || "공고 확인")}</span>
          </div>
          <div class="card-actions">
            <a class="ghost-button" href="${detailUrl}">상세보기</a>
            <a class="apply-link" href="${applyHref}"${applyTarget}>신청하기</a>
          </div>
        </div>
      </article>
    `;
  }

  function rememberSnapshot(event) {
    const link = event.target.closest('a[href*="policy.html?id="]');
    if (!link) return;
    const id = new URL(link.href, location.href).searchParams.get("id");
    const policy = cachedMatches.find((item) => item.id === id);
    if (!policy) return;
    try {
      sessionStorage.setItem("GG24_LAST_POLICY_DETAIL", JSON.stringify({ id, savedAt: Date.now(), policy }));
    } catch {
      // The detail page can still use its API fallback.
    }
  }

  function render(matches) {
    if (!matches.length) return;
    cachedMatches = matches;
    window.GG24_CATEGORY_FULL_LOAD_DONE = true;
    document.documentElement.dataset.gg24GyeonggiGwangjuLoaded = String(matches.length);

    const title = document.querySelector("#categoryTitle");
    const count = document.querySelector("#categoryCount");
    const notice = document.querySelector("#resultNotice");
    const list = document.querySelector("#policyList");
    if (title) title.textContent = "경기 광주 정보";
    if (count) count.textContent = `${matches.length.toLocaleString("ko-KR")}개 결과`;
    if (notice) notice.textContent = "";
    if (list) list.innerHTML = matches.slice(0, 180).map(policyCard).join("");
    list?.removeEventListener("click", rememberSnapshot);
    list?.addEventListener("click", rememberSnapshot);
  }

  async function load() {
    const filters = readFilters();
    if (!isGyeonggiGwangjuSearch(filters)) {
      setState("skip");
      return;
    }
    if (cachedMatches.length) {
      setState(`cached:${cachedMatches.length}`);
      render(cachedMatches);
      return;
    }

    const query = new URLSearchParams({ region: "경기", pages: "40", perPage: "500", maxItems: "12000" });
    setState("fetching");
    const response = await fetch(`/api/policies?${query.toString()}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    }).catch((error) => {
      setState(`fetch-error:${error?.name || "unknown"}`);
      return null;
    });
    if (!response?.ok) {
      setState(`status:${response?.status || "none"}`);
      return;
    }

    const data = await response.json().catch(() => null);
    const matches = (Array.isArray(data?.policies) ? data.policies : [])
      .filter(isGyeonggiGwangjuPolicy)
      .filter((policy) => matchesFilters(policy, filters));
    setState(`policies:${Array.isArray(data?.policies) ? data.policies.length : 0};matches:${matches.length}`);
    render(matches);
  }

  load();
  showSameNamePlaceNotice();
  [600, 1400, 2600, 4200, 6500].forEach((delay) => setTimeout(load, delay));
  [300, 1200, 3500, 6500, 10000, 15000].forEach((delay) => setTimeout(showSameNamePlaceNotice, delay));
})();
