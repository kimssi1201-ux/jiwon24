(() => {
  if (document.body.dataset.page !== "category") return;

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

  function queryTokens(query) {
    const compactQuery = compactSearchValue(query);
    const spacedTokens = String(query || "")
      .split(/[\s,./|]+/)
      .map(compactSearchValue)
      .filter((token) => token && !genericSearchTokens.has(token));
    const knownTokens = [
      ...regionOptions,
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

  window.policyMatchesQuery = function policyMatchesQuery(policy, query) {
    const rawQuery = String(query || "").trim();
    if (!rawQuery) return true;

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
  };
})();
