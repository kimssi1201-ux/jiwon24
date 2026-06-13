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

  const regionAliases = {
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

  function preciseAliasMatch(source, alias) {
    const text = String(source || "");
    if (!alias) return false;
    if (alias.length >= 4) return text.includes(alias);

    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(^|[^가-힣])${escaped}($|[^가-힣])|${escaped}(광역시|특별시|특별자치시|특별자치도|자치도|도|시|군|구)`);
    return pattern.test(text);
  }

  function regionSource(policy) {
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
    const aliases = regionAliases[region] || [region];
    return aliases.some((alias) => preciseAliasMatch(regionSource(policy), alias));
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

  window.policyMatchesQuery = function policyMatchesQuery(policy, query) {
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
  };
})();
