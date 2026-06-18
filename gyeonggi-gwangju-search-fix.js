(() => {
  if (document.body.dataset.page !== "category") return;
  window.GG24_GYEONGGI_GWANGJU_FIX_VERSION = "1";

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

  renderCategory();
})();
