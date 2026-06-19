(() => {
  const mergedAge = "중장년·어르신";
  const mergedAgeCompact = "중장년어르신";
  window.GG24_AGE_MERGE_FIX_VERSION = "20260619-2";

  function compactAge(value) {
    return String(value || "").trim().replace(/[·\s_-]/g, "");
  }

  function isMergedAgeValue(value) {
    const compact = compactAge(value);
    return compact === "중장년" || compact === "어르신" || compact === "노인" || compact === mergedAgeCompact;
  }

  function normalizeUrlAge() {
    const url = new URL(location.href);
    const rawAge = url.searchParams.get("age");
    if (!rawAge || !isMergedAgeValue(rawAge) || rawAge === mergedAge) return;
    url.searchParams.set("age", mergedAge);
    history.replaceState(history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }

  const previousAgeFilterFrom = typeof window.ageFilterFrom === "function" ? window.ageFilterFrom : null;
  window.ageFilterFrom = function ageFilterFromMerged(value) {
    if (isMergedAgeValue(value)) return mergedAge;
    return previousAgeFilterFrom ? previousAgeFilterFrom(value) : "";
  };

  const previousPolicyAgeGroups = typeof window.policyAgeGroups === "function" ? window.policyAgeGroups : null;
  window.policyAgeGroups = function policyAgeGroupsMerged(policy) {
    const groups = new Set(previousPolicyAgeGroups ? previousPolicyAgeGroups(policy) : []);
    const source = typeof window.policySearchText === "function" ? window.policySearchText(policy) : JSON.stringify(policy || {});

    if (groups.has("중장년") || groups.has("어르신")) {
      groups.delete("중장년");
      groups.delete("어르신");
      groups.add(mergedAge);
    }

    if (/중장년|중년|장년|신중년|경력단절|재취업|어르신|노인|고령|경로|독거노인|기초연금|장수|효도|효행|65세|70세|75세|80세|만\s?(?:4[0-9]|5[0-9]|6[0-4]|6[5-9]|[789][0-9])세/.test(source)) {
      groups.add(mergedAge);
    }

    return [...groups].filter((group) => group !== "중장년" && group !== "어르신");
  };

  function hrefWithMergedAge(anchor) {
    const href = anchor.getAttribute("href");
    if (!href) return "";
    try {
      const url = new URL(href, location.href);
      url.searchParams.set("age", mergedAge);
      return `${url.pathname.split("/").pop() || "category.html"}${url.search}`;
    } catch {
      return "category.html?age=%EC%A4%91%EC%9E%A5%EB%85%84%C2%B7%EC%96%B4%EB%A5%B4%EC%8B%A0";
    }
  }

  function normalizeAgeFilterUi() {
    const activeAge =
      typeof window.readCategoryFilters === "function"
        ? window.readCategoryFilters(new URLSearchParams(location.search)).age
        : "";
    const ageLinks = [...document.querySelectorAll("#ageFilter [data-age-filter]")];
    ageLinks.forEach((link) => {
      const raw = link.dataset.ageFilter || link.textContent;
      if (!isMergedAgeValue(raw)) return;
      link.textContent = mergedAge;
      link.dataset.ageFilter = mergedAge;
      link.href = hrefWithMergedAge(link);
      link.classList.toggle("active", activeAge === mergedAge);
    });

    const seenByParent = new WeakMap();
    [...document.querySelectorAll("#ageFilter [data-age-filter]")].forEach((link) => {
      if (link.textContent.trim() !== mergedAge) return;
      const parent = link.parentElement || document.body;
      if (seenByParent.get(parent)) link.remove();
      seenByParent.set(parent, true);
    });
  }

  normalizeUrlAge();
  const previousRenderCategory = typeof window.renderCategory === "function" ? window.renderCategory : null;
  if (previousRenderCategory) {
    window.renderCategory = function renderCategoryWithMergedAge(...args) {
      const result = previousRenderCategory.apply(this, args);
      normalizeAgeFilterUi();
      return result;
    };
  }

  normalizeAgeFilterUi();
  if (document.body.dataset.page === "category" && typeof window.renderCategory === "function") {
    window.renderCategory();
  }
})();
