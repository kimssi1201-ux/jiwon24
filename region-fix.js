(() => {
  if (document.body.dataset.page !== "category") return;
  window.GG24_REGION_FIX_VERSION = "21";

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

  const staticPolicies = Array.isArray(window.GG24_DATA?.policies) ? window.GG24_DATA.policies : [];
  let fullPolicyLoadFinished = false;
  window.GG24_CATEGORY_FULL_LOAD_DONE = false;

  function keyFor(policy) {
    return policy?.id || `${policy?.title || ""}-${policy?.institution || ""}`;
  }

  function mergePolicies(...lists) {
    const seen = new Set();
    return lists.flat().filter((policy) => {
      if (!policy) return false;
      const key = keyFor(policy);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
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

  function aliasesFor(region) {
    return regionAliases[region] || [region];
  }

  function isNationalPolicy(policy) {
    return String(policy?.region || "").includes("전국");
  }

  function policyRegion(policy) {
    return String(policy?.region || "").trim();
  }

  function isGyeonggiGwangjuPolicy(policy) {
    const source = regionSource(policy);
    return /경기도\s*광주시|경기도광주시/.test(source);
  }

  function isGwangjuMetroPolicy(policy) {
    const source = regionSource(policy);
    return /광주광역시|광주광역시교육청/.test(source) || ((policy?.tags || []).includes("광역시도") && /광주/.test(source));
  }

  function preciseAliasMatch(source, alias) {
    const text = String(source || "");
    if (!alias) return false;
    if (alias.length >= 4) return text.includes(alias);

    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(^|[^가-힣])${escaped}($|[^가-힣])|${escaped}(광역시|특별시|특별자치시|특별자치도|자치도|도|시|군|구)`);
    return pattern.test(text);
  }

  function hasConflictingLocalRegion(policy, selectedRegion) {
    const source = regionSource(policy);
    return Object.keys(regionAliases).some((region) => {
      if (region === selectedRegion) return false;
      return aliasesFor(region).some((alias) => preciseAliasMatch(source, alias));
    });
  }

  function compactFilterValue(value) {
    return String(value || "").trim().replace(/[·\s_-]/g, "");
  }

  function ageFilterFrom(value) {
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
    return aliases[compactFilterValue(value)] || "";
  }

  function targetFilterFrom(value) {
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
    return aliases[compactFilterValue(value)] || "";
  }

  function fallbackCategoryFilters(liveParams) {
    const rawAge = liveParams.get("age") || "";
    const rawTarget = liveParams.get("target") || "";
    let age = ageFilterFrom(rawAge) || "전체연령";
    let target = targetFilterFrom(rawTarget) || "전체대상";
    const targetAsAge = ageFilterFrom(rawTarget);
    if (targetAsAge && age === "전체연령") {
      age = targetAsAge;
      target = "전체대상";
    }

    return {
      type: liveParams.get("type") || "전체",
      region: normalizeRegionFilter(liveParams.get("region") || "전체지역"),
      age,
      target,
      query: (liveParams.get("q") || "").trim(),
    };
  }

  function normalizeRegionFilter(value) {
    const compact = String(value || "").trim().replace(/\s+/g, "");
    const aliases = {
      전국: "전체지역",
      전체: "전체지역",
      전체지역: "전체지역",
      서울특별시: "서울",
      부산광역시: "부산",
      대구광역시: "대구",
      인천광역시: "인천",
      광주광역시: "광주",
      대전광역시: "대전",
      울산광역시: "울산",
      세종특별자치시: "세종",
      강원특별자치도: "강원",
      충청북도: "충북",
      충청남도: "충남",
      전라북도: "전북",
      전북특별자치도: "전북",
      전라남도: "전남",
      경상북도: "경북",
      경상남도: "경남",
      제주특별자치도: "제주",
    };
    return aliases[compact] || compact;
  }

  function apiRegionFor(region) {
    return region === "광주" ? "광주광역시" : region;
  }

  function currentFilters() {
    const liveParams = new URLSearchParams(location.search);
    const filters = typeof readCategoryFilters === "function"
      ? readCategoryFilters(liveParams)
      : fallbackCategoryFilters(liveParams);
    return { ...filters, region: normalizeRegionFilter(filters.region) };
  }

  function isFocusedFilter(filters) {
    return (
      filters.type !== "전체" ||
      filters.region !== "전체지역" ||
      filters.age !== "전체연령" ||
      filters.target !== "전체대상" ||
      Boolean(filters.query)
    );
  }

  function showMergedLoading() {
    const count = document.querySelector("#categoryCount");
    const list = document.querySelector("#policyList");
    const notice = document.querySelector("#resultNotice");
    if (count) count.textContent = "불러오는 중";
    if (notice) notice.textContent = "";
    if (list) list.innerHTML = `<div class="empty-card">조건에 맞는 정책을 불러오고 있습니다.</div>`;
  }

  function matchesRegion(policy, region) {
    if (region === "전체지역") return true;
    if (region === "전국") return isNationalPolicy(policy);
    if (region === "광주") return isGwangjuMetroPolicy(policy) && !isGyeonggiGwangjuPolicy(policy);
    if (region === "경기" && isGyeonggiGwangjuPolicy(policy)) return true;

    const explicitRegion = policyRegion(policy);
    const aliases = aliasesFor(region);
    if (explicitRegion) {
      return explicitRegion === region || aliases.some((alias) => preciseAliasMatch(explicitRegion, alias));
    }
    if (hasConflictingLocalRegion(policy, region)) return false;
    const source = regionSource(policy);
    return aliases.some((alias) => preciseAliasMatch(source, alias));
  }

  function regionPriority(policy, region) {
    if (region === "전체지역" || region === "전국") return 0;
    if (isNationalPolicy(policy)) return 1;
    if (region === "광주" && isGyeonggiGwangjuPolicy(policy)) return 2;
    if (region === "광주" && isGwangjuMetroPolicy(policy)) return 0;
    if (region === "경기" && isGyeonggiGwangjuPolicy(policy)) return 0;
    const source = regionSource(policy);
    const explicitRegion = policyRegion(policy);
    const aliases = aliasesFor(region);
    if (
      explicitRegion === region ||
      aliases.some((alias) => preciseAliasMatch(explicitRegion, alias)) ||
      aliases.some((alias) => preciseAliasMatch(source, alias))
    ) {
      return 0;
    }
    return 2;
  }

  function hasLocalRegionResult(list, region) {
    if (region === "전체지역" || region === "전국") return true;
    return list.some((policy) => !isNationalPolicy(policy) && regionPriority(policy, region) === 0);
  }

  function shouldKeepRegionalLoading(filters, list) {
    return !fullPolicyLoadFinished && filters.region !== "전체지역" && filters.region !== "전국" && !hasLocalRegionResult(list, filters.region);
  }

  filteredPolicies = function filteredPoliciesWithRegionFallback() {
    const filters = currentFilters();
    const { type, region, age, target } = filters;
    const query = filters.query.toLowerCase();

    const list = policies.filter((policy) => {
      const typeMatch = type === "전체" || policy.type === type;
      const regionMatch = matchesRegion(policy, region);
      const ageMatch = age === "전체연령" || policyAgeGroups(policy).includes(age);
      const targetMatch = target === "전체대상" || policyTargetGroups(policy).includes(target);
      const queryMatch =
        !query ||
        (typeof policyMatchesQuery === "function"
          ? policyMatchesQuery(policy, filters.query)
          : policySearchText(policy).includes(query));
      return typeMatch && regionMatch && ageMatch && targetMatch && queryMatch;
    });

    if (region !== "전체지역") {
      list.sort(
        (a, b) =>
          regionPriority(a, region) - regionPriority(b, region) ||
          (Number(b.views) || 0) - (Number(a.views) || 0),
      );
    }

    return list;
  };

  function renderMergedStaticPolicies() {
    policies = mergePolicies(policies, staticPolicies);
    const filters = currentFilters();
    const list = filteredPolicies();
    if (!fullPolicyLoadFinished && isFocusedFilter(filters) && (!list.length || shouldKeepRegionalLoading(filters, list))) {
      showMergedLoading();
      return;
    }
    renderCategory();
  }

  renderMergedStaticPolicies();
  [1200, 3500, 6500].forEach((delay) => {
    setTimeout(renderMergedStaticPolicies, delay);
  });

  async function fetchPolicyChunk(startPage) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    try {
      const response = await fetch(`/api/policies?startPage=${startPage}&pages=5&perPage=500&maxItems=2500`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      });
      return response.ok ? response.json() : null;
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function fetchRegionPolicies(region) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch(
        `/api/policies?region=${encodeURIComponent(apiRegionFor(region))}&pages=40&perPage=500&maxItems=2500`,
        {
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: controller.signal,
        },
      );
      return response.ok ? response.json() : null;
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function loadPolicyChunks() {
    const initialFilters = currentFilters();
    if (initialFilters.region !== "전체지역" && initialFilters.region !== "전국") {
      showMergedLoading();
      const regionalData = await fetchRegionPolicies(initialFilters.region);
      if (Array.isArray(regionalData?.policies) && regionalData.policies.length) {
        policies = mergePolicies(regionalData.policies, policies, staticPolicies);
        fullPolicyLoadFinished = true;
        window.GG24_CATEGORY_FULL_LOAD_DONE = true;
        renderCategory();
        return;
      }
    }

    const chunkStarts = [1, 16, 6, 21, 11, 26, 31, 36];
    let livePolicies = [];

    for (let index = 0; index < chunkStarts.length; index += 2) {
      const batch = chunkStarts.slice(index, index + 2).map(fetchPolicyChunk);
      const chunks = await Promise.all(batch);
      chunks.forEach((liveData) => {
        if (Array.isArray(liveData?.policies) && liveData.policies.length) {
          livePolicies = mergePolicies(livePolicies, liveData.policies);
        }
      });

      if (livePolicies.length) {
        policies = mergePolicies(livePolicies, staticPolicies);
        const filters = currentFilters();
        const list = filteredPolicies();
        if (isFocusedFilter(filters) && (!list.length || shouldKeepRegionalLoading(filters, list))) {
          showMergedLoading();
        } else {
          renderCategory();
        }
      }
    }

    fullPolicyLoadFinished = true;
    window.GG24_CATEGORY_FULL_LOAD_DONE = true;
    renderCategory();
  }

  loadPolicyChunks().catch(() => {
    fullPolicyLoadFinished = true;
    window.GG24_CATEGORY_FULL_LOAD_DONE = true;
    renderCategory();
  });
})();
