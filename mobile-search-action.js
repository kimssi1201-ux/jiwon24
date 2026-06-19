(() => {
  if (document.body.dataset.page !== "category") return;

  function injectStyle() {
    if (document.querySelector("#mobile-search-action-style")) return;
    const style = document.createElement("style");
    style.id = "mobile-search-action-style";
    style.textContent = `
      .mobile-header-search-action { display: none; }
      .mobile-search-panel { display: none; }
      @media (max-width: 759px) {
        .mobile-header-search-action {
          position: absolute;
          left: 6px;
          top: 50%;
          z-index: 5;
          width: 54px;
          height: 54px;
          display: block;
          transform: translateY(-50%);
          border: 0;
          border-radius: 50%;
          background: transparent;
          color: transparent;
        }
        .mobile-search-panel {
          position: fixed;
          left: 14px;
          right: 14px;
          top: 64px;
          z-index: 75;
          min-height: 50px;
          display: none;
          align-items: center;
          gap: 8px;
          border: 1px solid #d8dee8;
          border-radius: 10px;
          background: #ffffff;
          padding: 7px 8px 7px 14px;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.16);
        }
        body[data-page="category"].mobile-search-open .mobile-search-panel { display: flex; }
        .mobile-search-panel input {
          min-width: 0;
          flex: 1 1 auto;
          border: 0;
          outline: 0;
          color: #111827;
          font-size: 16px;
          font-weight: 850;
        }
        .mobile-search-panel input::placeholder { color: #8c95a3; }
        .mobile-search-panel button {
          width: 42px;
          min-height: 38px;
          flex: 0 0 42px;
          border: 0;
          border-radius: 8px;
          background: #111827;
          color: #ffffff;
          font-size: 13px;
          font-weight: 950;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function searchUrl(query) {
    const current = new URLSearchParams(location.search);
    const next = new URLSearchParams();
    ["type", "region", "age", "target", "deadline", "mode"].forEach((key) => {
      const value = current.get(key);
      if (value) next.set(key, value);
    });
    if (query) next.set("q", query);
    const queryString = next.toString();
    return queryString ? `category.html?${queryString}` : "category.html";
  }

  function currentQuery() {
    return (
      new URLSearchParams(location.search).get("q") ||
      document.querySelector("#categorySearchInput")?.value ||
      ""
    ).trim();
  }

  function ensurePanel() {
    let panel = document.querySelector(".mobile-search-panel");
    if (panel) return panel;
    panel = document.createElement("form");
    panel.className = "mobile-search-panel";
    panel.setAttribute("role", "search");

    const label = document.createElement("label");
    label.className = "sr-only";
    label.setAttribute("for", "mobileHeaderSearchInput");
    label.textContent = "정책 검색";

    const input = document.createElement("input");
    input.id = "mobileHeaderSearchInput";
    input.type = "search";
    input.placeholder = "검색어를 입력하세요";
    input.autocomplete = "off";

    const submit = document.createElement("button");
    submit.type = "submit";
    submit.setAttribute("aria-label", "검색");
    submit.textContent = "검색";

    panel.append(label, input, submit);
    panel.addEventListener("submit", (event) => {
      event.preventDefault();
      const query = panel.querySelector("input")?.value.trim() || "";
      location.href = searchUrl(query);
    });
    document.body.appendChild(panel);
    return panel;
  }

  function openMobileSearch() {
    const panel = ensurePanel();
    document.body.classList.add("mobile-search-open");
    const input = panel.querySelector("input");
    if (input && !input.value) input.value = currentQuery();
    window.setTimeout(() => input?.focus({ preventScroll: true }), 60);
  }

  function ensureButton() {
    const header = document.querySelector(".header-inner");
    if (!header || header.querySelector(".mobile-header-search-action")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mobile-header-search-action";
    button.setAttribute("aria-label", "정책 검색 열기");
    button.addEventListener("click", openMobileSearch);
    header.appendChild(button);
  }

  injectStyle();
  ensurePanel();
  ensureButton();

  if (new URLSearchParams(location.search).get("focusSearch") === "1") {
    window.setTimeout(openMobileSearch, 250);
  }
})();

(() => {
  if (document.body.dataset.page !== "category") return;
  if (window.GG24_MOBILE_FILTER_UI_FIX_VERSION) return;
  window.GG24_MOBILE_FILTER_UI_FIX_VERSION = "20260619-4";

  function compact(value) {
    return String(value || "").trim().replace(/[·\s_-]/g, "");
  }

  const typeValues = new Set(["지원금", "환급금", "대출"]);
  const ageValues = new Set(["영유아·출산", "아동·청소년", "청년", "중장년·어르신"]);
  const targetValues = new Set(["국가유공자·보훈", "장애인", "소상공인", "농어업인", "저소득층", "신혼부부", "외국인·다문화"]);

  const ageAliases = {
    "전체연령": "전체연령",
    "영유아출산": "영유아·출산",
    "영유아": "영유아·출산",
    "출산": "영유아·출산",
    "아동청소년": "아동·청소년",
    "아동": "아동·청소년",
    "청소년": "아동·청소년",
    "청년": "청년",
    "중장년": "중장년·어르신",
    "어르신": "중장년·어르신",
    "노인": "중장년·어르신",
    "중장년어르신": "중장년·어르신",
  };

  const targetAliases = {
    "전체대상": "전체대상",
    "국가유공자보훈": "국가유공자·보훈",
    "국가유공자": "국가유공자·보훈",
    "보훈": "국가유공자·보훈",
    "장애인": "장애인",
    "소상공인": "소상공인",
    "농어업인": "농어업인",
    "농업인": "농어업인",
    "어업인": "농어업인",
    "저소득층": "저소득층",
    "저소득": "저소득층",
    "신혼부부": "신혼부부",
    "외국인다문화": "외국인·다문화",
    "외국인": "외국인·다문화",
    "다문화": "외국인·다문화",
  };

  function ageFrom(value) {
    return ageAliases[compact(value)] || "";
  }

  function targetFrom(value) {
    return targetAliases[compact(value)] || "";
  }

  function cleanFilters(filters) {
    const next = { ...filters };
    const regionAsAge = ageFrom(next.region);
    const regionAsTarget = targetFrom(next.region);
    const targetAsAge = ageFrom(next.target);
    const ageAsTarget = targetFrom(next.age);

    if (regionAsAge) {
      next.region = "전체지역";
      if (!next.age || next.age === "전체연령") next.age = regionAsAge;
    } else if (regionAsTarget) {
      next.region = "전체지역";
      if (!next.target || next.target === "전체대상") next.target = regionAsTarget;
    }

    if (targetAsAge) {
      next.age = targetAsAge;
      next.target = "전체대상";
    }

    if (ageAsTarget) {
      next.target = ageAsTarget;
      next.age = "전체연령";
    }

    return next;
  }

  if (typeof readCategoryFilters === "function" && !window.GG24_MOBILE_FILTER_READ_PATCHED) {
    const previousReadCategoryFilters = readCategoryFilters;
    readCategoryFilters = function readCategoryFiltersWithCleanAudience(sourceParams = params) {
      return cleanFilters(previousReadCategoryFilters(sourceParams));
    };
    window.readCategoryFilters = readCategoryFilters;
    window.GG24_MOBILE_FILTER_READ_PATCHED = true;
  }

  if (typeof categoryUrl === "function" && !window.GG24_MOBILE_FILTER_URL_PATCHED) {
    const previousCategoryUrl = categoryUrl;
    categoryUrl = function categoryUrlWithCleanAudience(filters = {}) {
      return previousCategoryUrl(cleanFilters(filters));
    };
    window.categoryUrl = categoryUrl;
    window.GG24_MOBILE_FILTER_URL_PATCHED = true;
  }

  function singleSelectHref(label) {
    const current = typeof readCategoryFilters === "function" ? readCategoryFilters() : {};
    const params = new URLSearchParams();
    if (current.region && current.region !== "전체지역") params.set("region", current.region);
    if (current.query) params.set("q", current.query);
    const raw = new URLSearchParams(location.search);
    if (raw.get("deadline")) params.set("deadline", raw.get("deadline"));
    if (raw.get("mode")) params.set("mode", raw.get("mode"));

    const text = String(label || "").trim();
    if (typeValues.has(text)) params.set("type", text);
    else if (ageValues.has(text)) params.set("age", text);
    else if (targetValues.has(text)) params.set("target", text);
    else if (text !== "연령·대상 전체" && text !== "지원대상 전체") return "";

    const query = params.toString();
    return query ? `category.html?${query}` : "category.html";
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest(".filter-sheet-options a");
    if (!link) return;
    const title = link.closest(".filter-sheet")?.querySelector(".filter-sheet-head h2")?.textContent?.trim() || "";
    if (!title.includes("지원대상") && !title.includes("연령")) return;
    const href = singleSelectHref(link.textContent);
    if (href) link.setAttribute("href", href);
  }, true);

  function regionLabel(filters) {
    if (!filters.region || filters.region === "전체지역") return "지역기관 전체";
    return typeof displayFilterLabel === "function" ? displayFilterLabel(filters.region) : filters.region;
  }

  function audienceLabel(filters) {
    const parts = [];
    if (filters.age && filters.age !== "전체연령") parts.push(filters.age);
    if (filters.target && filters.target !== "전체대상") parts.push(filters.target);
    return parts.length ? parts.join(" · ") : "연령·대상 전체";
  }

  function setButtonLabel(button, iconClass, label) {
    if (!button || button.dataset.filterLabel === label) return;
    button.dataset.filterLabel = label;
    button.innerHTML = `<span class="summary-icon ${iconClass}"></span>${label}`;
  }

  function fixFilterUi() {
    const filters = typeof readCategoryFilters === "function" ? readCategoryFilters() : {};
    const row = document.querySelector(".filter-summary-row");
    if (row) {
      setButtonLabel(row.querySelector('[data-filter-sheet="regionFilter"]'), "map", regionLabel(filters));
      setButtonLabel(row.querySelector('[data-filter-sheet="targetFilter"]'), "user", audienceLabel(filters));
    }

    const title = document.querySelector(".filter-sheet-head h2");
    if (title && title.textContent.trim() === "지원대상 유형 선택") {
      title.textContent = "연령·지원대상 선택";
    }
    const firstChoice = document.querySelector(".filter-sheet-options a");
    if (firstChoice && firstChoice.textContent.trim() === "지원대상 전체") {
      firstChoice.textContent = "연령·대상 전체";
    }
  }

  let uiFixScheduled = false;
  function scheduleFilterUiFix() {
    if (uiFixScheduled) return;
    uiFixScheduled = true;
    window.requestAnimationFrame(() => {
      uiFixScheduled = false;
      fixFilterUi();
    });
  }

  fixFilterUi();
  new MutationObserver(scheduleFilterUiFix).observe(document.body, { childList: true, subtree: true });
  [0, 250, 700, 1500, 3000].forEach((delay) => window.setTimeout(fixFilterUi, delay));

  if (typeof renderCategory === "function") {
    [0, 400].forEach((delay) => window.setTimeout(renderCategory, delay));
  }
})();
