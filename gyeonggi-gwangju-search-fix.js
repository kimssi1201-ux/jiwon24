(() => {
  if (document.body.dataset.page !== "category") return;
  window.GG24_GYEONGGI_GWANGJU_FIX_VERSION = "2";
  document.documentElement.dataset.gg24GyeonggiGwangjuFix = "2";

  const previousQueryRegionHints = queryRegionHints;
  const previousQueryTokens = queryTokens;

  function isGyeonggiGwangjuSearch(query, selectedRegion = "") {
    const compactQuery = compactSearchValue(query);
    const compactRegion = compactSearchValue(selectedRegion);
    const spacedTokens = String(query || "")
      .split(/[\s,./|]+/)
      .map(compactSearchValue)
      .filter(Boolean);
    const hasGyeonggi = compactRegion === "경기" || spacedTokens.includes("경기") || spacedTokens.includes("경기도");
    const hasGwangju = spacedTokens.includes("광주") || spacedTokens.includes("광주시");

    return /경기도?광주시?/.test(compactQuery) || (hasGyeonggi && hasGwangju);
  }

  queryRegionHints = function queryRegionHintsWithGyeonggiGwangju(query, selectedRegion = "") {
    const hints = previousQueryRegionHints(query);
    return isGyeonggiGwangjuSearch(query, selectedRegion) ? hints.filter((region) => region !== "광주") : hints;
  };

  queryTokens = function queryTokensWithGyeonggiGwangju(query, selectedRegion = "") {
    if (!isGyeonggiGwangjuSearch(query, selectedRegion)) return previousQueryTokens(query);

    const compactQuery = compactSearchValue(query);
    const regionHints = queryRegionHints(query, selectedRegion).map(compactSearchValue);
    const spacedTokens = String(query || "")
      .split(/[\s,./|]+/)
      .map(compactSearchValue)
      .filter((token) => token && !genericSearchTokens.has(token) && !regionHints.includes(token))
      .filter((token) => !/^경기도?광주시?$/.test(token));
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
    if (!tokens.includes("광주")) tokens.push("광주");
    return [...new Set(tokens.filter((token) => token && !genericSearchTokens.has(token)))];
  };

  policyMatchesQuery = function policyMatchesQueryWithSelectedRegion(policy, query, selectedRegion = "") {
    const rawQuery = String(query || "").trim();
    if (!rawQuery) return true;

    const regionHints = queryRegionHints(rawQuery, selectedRegion);
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

    const tokens = queryTokens(rawQuery, selectedRegion);
    return tokens.length ? tokens.every((token) => compactSource.includes(token)) : false;
  };

  filteredPolicies = function filteredPoliciesWithSelectedRegionQuery() {
    const { type, region, age, target, query } = readCategoryFilters();
    return policies.filter((policy) => {
      const typeMatch = type === "전체" || policy.type === type;
      const regionMatch = region === "전체지역" || policy.region === region;
      const ageMatch = age === "전체연령" || policyAgeGroups(policy).includes(age);
      const targetMatch = target === "전체대상" || policyTargetGroups(policy).includes(target);
      const queryMatch = policyMatchesQuery(policy, query, region);
      return typeMatch && regionMatch && ageMatch && targetMatch && queryMatch;
    });
  };

  function policyGyeonggiGwangjuText(policy) {
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

  function isGyeonggiGwangjuPolicy(policy) {
    const source = policyGyeonggiGwangjuText(policy);
    return (
      String(policy?.region || "") === "경기" &&
      !/광주광역시/.test(source) &&
      /경기도\s*광주시|경기도광주시|광주시/.test(source)
    );
  }

  function extraQueryTokens(query) {
    return String(query || "")
      .split(/[\s,./|]+/)
      .map(compactSearchValue)
      .filter(Boolean)
      .filter((token) => !["경기", "경기도", "광주", "광주시"].includes(token))
      .filter((token) => !genericSearchTokens.has(token));
  }

  function mergePolicyLists(primary, secondary) {
    const seen = new Set();
    return [...primary, ...secondary].filter((policy) => {
      const key = policy?.id || `${policy?.title || ""}-${policy?.institution || ""}`;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function gyeonggiGwangjuFilteredPolicies() {
    const { type, region, age, target, query } = readCategoryFilters();
    if (!isGyeonggiGwangjuSearch(query, region)) return [];
    const extraTokens = extraQueryTokens(query);
    return policies.filter((policy) => {
      const compactSource = compactSearchValue([
        policyGyeonggiGwangjuText(policy),
        policy.type,
        policyAgeGroups(policy).join(" "),
        policyTargetGroups(policy).join(" "),
      ].join(" "));
      const typeMatch = type === "전체" || policy.type === type;
      const ageMatch = age === "전체연령" || policyAgeGroups(policy).includes(age);
      const targetMatch = target === "전체대상" || policyTargetGroups(policy).includes(target);
      const queryMatch = extraTokens.every((token) => compactSource.includes(token));
      return typeMatch && ageMatch && targetMatch && queryMatch && isGyeonggiGwangjuPolicy(policy);
    });
  }

  function renderGyeonggiGwangjuResults() {
    const matches = gyeonggiGwangjuFilteredPolicies();
    if (!matches.length) return false;

    const count = document.querySelector("#categoryCount");
    const title = document.querySelector("#categoryTitle");
    const list = document.querySelector("#policyList");
    const notice = document.querySelector("#resultNotice");
    if (title) title.textContent = "경기 광주 정보";
    if (count) count.textContent = `${matches.length.toLocaleString("ko-KR")}개 결과`;
    if (notice) notice.textContent = "";
    if (list) list.innerHTML = matches.slice(0, 180).map(policyCard).join("");
    if (typeof bindCommonActions === "function") bindCommonActions();
    return true;
  }

  async function loadGyeonggiGwangjuPolicies() {
    const filters = readCategoryFilters();
    if (!isGyeonggiGwangjuSearch(filters.query, filters.region)) return;

    const alreadyRendered = renderGyeonggiGwangjuResults();
    if (alreadyRendered) return;

    const query = new URLSearchParams({ region: "경기", pages: "40", perPage: "500", maxItems: "12000" });
    const response = await fetch(`/api/policies?${query.toString()}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    }).catch(() => null);
    if (!response?.ok) return;
    const data = await response.json().catch(() => null);
    if (!Array.isArray(data?.policies)) return;

    policies = mergePolicyLists(data.policies, policies);
    window.GG24_CATEGORY_FULL_LOAD_DONE = true;
    renderCategory();
    renderGyeonggiGwangjuResults();
  }

  renderCategory();
  [0, 600, 1800, 4000].forEach((delay) => setTimeout(() => loadGyeonggiGwangjuPolicies(), delay));
})();
