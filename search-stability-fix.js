(() => {
  if (document.body.dataset.page !== "category") return;

  const urlParams = new URLSearchParams(location.search);
  const query = (urlParams.get("q") || "").trim();
  const mode = urlParams.get("mode") || "";
  if (!query || mode === "official" || mode === "news") return;

  window.GG24_SEARCH_STABILITY_FIX_VERSION = "3";

  let stableSearchDone = false;
  let stableSearchStarted = false;
  const cacheParams = new URLSearchParams();
  ["q", "type", "region", "age", "target", "deadline", "mode"].forEach((key) => {
    const value = urlParams.get(key);
    if (value) cacheParams.set(key, value);
  });
  const cacheKey = `GG24_SEARCH_CACHE::${location.pathname}::${cacheParams.toString()}`;
  const regionNames = ["서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];
  const regionAliases = {
    서울특별시: "서울",
    경기도: "경기",
    인천광역시: "인천",
    부산광역시: "부산",
    대구광역시: "대구",
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

  function compact(value) {
    return String(value || "").trim().replace(/[·ㆍ・\s_-]/g, "").toLowerCase();
  }

  function normalizeRegion(value) {
    const raw = String(value || "").trim().replace(/\s+/g, "");
    return regionAliases[raw] || raw;
  }

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

  function currentFilters() {
    return typeof readCategoryFilters === "function" ? readCategoryFilters(new URLSearchParams(location.search)) : {
      region: urlParams.get("region") || "전체지역",
      query,
    };
  }

  function detectedRegions() {
    const filters = currentFilters();
    const found = new Set();
    const selectedRegion = normalizeRegion(filters.region);
    if (selectedRegion && selectedRegion !== "전체지역" && selectedRegion !== "전국") found.add(selectedRegion);

    const compactQuery = compact(query);
    Object.entries(regionAliases).forEach(([alias, region]) => {
      if (compactQuery.includes(compact(alias))) found.add(region);
    });
    regionNames.forEach((region) => {
      const token = compact(region);
      if (compactQuery.includes(token)) found.add(region);
    });
    return [...found];
  }

  function hasVisibleResults() {
    return document.querySelectorAll("#policyList .policy-card").length > 0;
  }

  function showSearchLoading() {
    const count = document.querySelector("#categoryCount");
    const list = document.querySelector("#policyList");
    const notice = document.querySelector("#resultNotice");
    if (count) count.textContent = "검색 중";
    if (notice) notice.textContent = "";
    if (list && !hasVisibleResults()) {
      list.innerHTML = `<div class="empty-card">검색 결과를 불러오고 있습니다.</div>`;
    }
  }

  function saveCache() {
    try {
      const list = typeof filteredPolicies === "function" ? filteredPolicies() : [];
      if (Array.isArray(list) && list.length) {
        sessionStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), policies: list.slice(0, 300) }));
      }
    } catch {
      // Cache is best-effort only.
    }
  }

  function restoreCache() {
    try {
      const cached = JSON.parse(sessionStorage.getItem(cacheKey) || "null");
      if (!cached || !Array.isArray(cached.policies) || !cached.policies.length) return false;
      policies = mergePolicies(cached.policies, Array.isArray(policies) ? policies : []);
      return true;
    } catch {
      return false;
    }
  }

  async function fetchJsonWithRetry(url, attempts = 3, timeoutMs = 5500) {
    let lastError;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store", signal: controller.signal });
        clearTimeout(timer);
        if (response.ok) return await response.json();
        lastError = new Error(`HTTP ${response.status}`);
      } catch (error) {
        clearTimeout(timer);
        lastError = error;
      }
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    }
    throw lastError;
  }

  function applyPayload(payload) {
    if (Array.isArray(payload?.policies) && payload.policies.length) {
      policies = mergePolicies(payload.policies, Array.isArray(policies) ? policies : []);
      return true;
    }
    return false;
  }

  function finishSearch() {
    stableSearchDone = true;
    window.GG24_CATEGORY_FULL_LOAD_DONE = true;
    if (typeof renderCategory === "function") renderCategory();
    saveCache();
  }

  function fallbackUrls() {
    const urls = [];
    detectedRegions().forEach((region) => {
      urls.push(`/api/policies?region=${encodeURIComponent(region)}&pages=40&perPage=500&maxItems=2500&stable=${Date.now()}`);
    });
    [1, 6, 11, 16, 21, 26, 31, 36].forEach((startPage) => {
      urls.push(`/api/policies?startPage=${startPage}&pages=5&perPage=500&maxItems=2500&stable=${Date.now()}`);
    });
    return [...new Set(urls)];
  }

  async function stabilizeSearch() {
    if (stableSearchStarted) return;
    stableSearchStarted = true;
    window.GG24_CATEGORY_FULL_LOAD_DONE = false;
    showSearchLoading();

    if (restoreCache() && typeof renderCategory === "function") {
      renderCategory();
      if (hasVisibleResults()) {
        finishSearch();
        return;
      }
    }

    const regions = detectedRegions();
    const quickParams = new URLSearchParams({ q: query, limit: "80", fast: String(Date.now()) });
    if (regions[0]) quickParams.set("region", regions[0]);
    const quickPayload = await fetchJsonWithRetry(`/api/search?${quickParams.toString()}`, 2, 4500).catch(() => null);
    if (applyPayload(quickPayload)) {
      if (typeof renderCategory === "function") renderCategory();
      if (hasVisibleResults()) {
        finishSearch();
        return;
      }
    }

    for (const url of fallbackUrls()) {
      const payload = await fetchJsonWithRetry(url, 2, 5000).catch(() => null);
      applyPayload(payload);
      if (typeof renderCategory === "function") renderCategory();
      if (hasVisibleResults()) {
        finishSearch();
        return;
      }
      showSearchLoading();
    }

    finishSearch();
  }

  if (typeof renderCategory === "function" && !window.GG24_SEARCH_STABILITY_RENDER_PATCHED) {
    const previousRenderCategory = renderCategory;
    renderCategory = function renderCategoryWithStableSearch(...args) {
      const result = previousRenderCategory(...args);
      if (!stableSearchDone && !hasVisibleResults()) showSearchLoading();
      return result;
    };
    window.renderCategory = renderCategory;
    window.GG24_SEARCH_STABILITY_RENDER_PATCHED = true;
  }

  stabilizeSearch().catch(() => {
    const restored = restoreCache();
    stableSearchDone = true;
    window.GG24_CATEGORY_FULL_LOAD_DONE = true;
    if (typeof renderCategory === "function") renderCategory();
    if (!restored && !hasVisibleResults()) {
      const list = document.querySelector("#policyList");
      if (list) list.innerHTML = `<div class="empty-card">검색 결과를 불러오지 못했습니다. 잠시 후 다시 검색해 주세요.</div>`;
    }
  });
})();
