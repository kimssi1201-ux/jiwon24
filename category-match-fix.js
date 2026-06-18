(() => {
  if (document.body.dataset.page !== "category") return;
  window.GG24_MATCH_FIX_VERSION = "11";

  const directSmallBusinessPattern =
    /소상공인|소공인|전통시장|시장상인|상인회|개인사업자|자영업|가맹점|상권|점포/;
  const agriculturalBusinessPattern = /귀농|귀산촌|농업창업|농식품|농업인|농어업/;
  const strictSmallBusinessPattern = /소상공인|소공인|전통시장|시장상인|상인회|개인사업자|자영업|가맹점|상권|점포/;
  const genericTeenAgePattern = /(?:만\s*)?(?:[6-9]|1[0-7])세\s*이상/;
  const genericUsePattern = /누구든지|가입 가능|발급 가능|소비자|사용자|지역제한 없음/;
  const childSignalPattern = /아동|어린이|청소년|초등|중등|고등|입학|학습|교복/;
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

  function groupsFromCodes(codes, labels) {
    if (!Array.isArray(codes)) return null;
    return [...new Set(codes.map((code) => labels[code]).filter(Boolean))];
  }

  const previousTargetGroups = policyTargetGroups;
  policyTargetGroups = function policyTargetGroupsWithTighterBusiness(policy) {
    let groups = groupsFromCodes(policy?.targetCodes, targetCodeLabels);
    if (!groups) groups = previousTargetGroups(policy);
    if (groups.includes("소상공인")) {
      const source = policySearchText(policy);
      if (!directSmallBusinessPattern.test(source)) {
        groups = groups.filter((group) => group !== "소상공인");
      }
      if (agriculturalBusinessPattern.test(source) && !strictSmallBusinessPattern.test(source)) {
        groups = groups.filter((group) => group !== "소상공인");
      }
    }
    return groups;
  };

  const previousAgeGroups = policyAgeGroups;
  policyAgeGroups = function policyAgeGroupsWithGenericAgeGuard(policy) {
    let groups = groupsFromCodes(policy?.ageCodes, ageCodeLabels);
    if (!groups) groups = previousAgeGroups(policy);
    const source = policySearchText(policy);
    const headline = [policy.title, policy.summary].join(" ");
    if (
      groups.includes("아동·청소년") &&
      genericTeenAgePattern.test(source) &&
      genericUsePattern.test(source) &&
      !childSignalPattern.test(headline)
    ) {
      groups = groups.filter((group) => group !== "아동·청소년");
    }
    return groups;
  };

  const previousReadCategoryFilters = readCategoryFilters;
  readCategoryFilters = function readCategoryFiltersWithoutNationalDuplicate(sourceParams = params) {
    const filters = previousReadCategoryFilters(sourceParams);
    filters.region = normalizeRegionFilter(filters.region);
    return filters;
  };

  const previousCategoryUrl = categoryUrl;
  categoryUrl = function categoryUrlWithoutNationalDuplicate(filters = {}) {
    const nextFilters = { ...filters };
    nextFilters.region = normalizeRegionFilter(nextFilters.region);
    return previousCategoryUrl(nextFilters);
  };

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

  function removeNationalRegionButton() {
    document.querySelector('[data-region-filter="전국"]')?.remove();
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

  function isNationalPolicy(policy) {
    return String(policy?.region || "").includes("전국");
  }

  function isGyeonggiGwangjuPolicy(policy) {
    return /경기도\s*광주시|경기도광주시/.test(regionSource(policy));
  }

  function isGwangjuMetroPolicy(policy) {
    const source = regionSource(policy);
    return /광주광역시|광주광역시교육청/.test(source) || ((policy?.tags || []).includes("광역시도") && /광주/.test(source));
  }

  function isLocalPolicyForRegion(policy, region) {
    if (!policy || isNationalPolicy(policy)) return false;
    const source = regionSource(policy);
    if (region === "광주") return isGwangjuMetroPolicy(policy) && !isGyeonggiGwangjuPolicy(policy);
    if (region === "경기" && isGyeonggiGwangjuPolicy(policy)) return true;
    return String(policy.region || "").trim() === region || source.includes(region);
  }

  function showRegionalLoading() {
    const count = document.querySelector("#categoryCount");
    const list = document.querySelector("#policyList");
    const notice = document.querySelector("#resultNotice");
    if (count) count.textContent = "불러오는 중";
    if (notice) notice.textContent = "";
    if (list) list.innerHTML = `<div class="empty-card">조건에 맞는 정책을 불러오고 있습니다.</div>`;
  }

  function shouldHoldRegionalLoading() {
    const filters = readCategoryFilters();
    if (window.GG24_CATEGORY_FULL_LOAD_DONE) return false;
    if (filters.region === "전체지역" || filters.region === "전국") return false;
    return !filteredPolicies().some((policy) => isLocalPolicyForRegion(policy, filters.region));
  }

  const previousRenderCategory = renderCategory;
  renderCategory = function renderCategoryWithMatchCleanup(...args) {
    const result = previousRenderCategory(...args);
    removeNationalRegionButton();
    if (shouldHoldRegionalLoading()) showRegionalLoading();
    return result;
  };

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

  async function loadPriorityChunks() {
    if (window.GG24_MATCH_FIX_LOADING) return;
    window.GG24_MATCH_FIX_LOADING = true;
    const filters = readCategoryFilters();
    if (filters.region !== "전체지역" && filters.region !== "전국") {
      showRegionalLoading();
      const regionalData = await fetchRegionPolicies(filters.region);
      if (Array.isArray(regionalData?.policies) && regionalData.policies.length) {
        policies = mergePolicies(regionalData.policies, policies);
        window.GG24_CATEGORY_FULL_LOAD_DONE = true;
        renderCategory();
        return;
      }
    }

    const starts = [1, 16, 6, 21, 11, 26, 31, 36];
    let livePolicies = [];

    for (let index = 0; index < starts.length; index += 2) {
      const chunks = await Promise.all(starts.slice(index, index + 2).map(fetchPolicyChunk));
      chunks.forEach((liveData) => {
        if (Array.isArray(liveData?.policies) && liveData.policies.length) {
          livePolicies = mergePolicies(livePolicies, liveData.policies);
        }
      });
      if (livePolicies.length) {
        policies = mergePolicies(livePolicies, policies);
        renderCategory();
      }
    }

    window.GG24_CATEGORY_FULL_LOAD_DONE = true;
    renderCategory();
  }

  if (params.get("region") === "전국") {
    history.replaceState(null, "", categoryUrl({ region: "전체지역" }));
  }

  renderCategory();
  [300, 1200, 3500].forEach((delay) => setTimeout(renderCategory, delay));
  if (!window.GG24_REGION_FIX_VERSION) {
    loadPriorityChunks().catch(() => {
      window.GG24_CATEGORY_FULL_LOAD_DONE = true;
      renderCategory();
    });
  }
})();
