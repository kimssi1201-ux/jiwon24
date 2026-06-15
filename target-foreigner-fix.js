(() => {
  const foreignerTarget = "외국인·다문화";

  function compactTarget(value) {
    return String(value || "").trim().replace(/[·\s_-]/g, "");
  }

  function isForeignerTarget(value) {
    return /^(외국인|외국인주민|등록외국인|다문화|다문화가족|결혼이민자|이주민|난민|중도입국|외국국적동포|거소등록동포|귀화|국적취득|외국인다문화)$/.test(
      compactTarget(value),
    );
  }

  const previousTargetFilterFrom = typeof window.targetFilterFrom === "function" ? window.targetFilterFrom : null;
  window.targetFilterFrom = function targetFilterFromWithForeigner(value) {
    if (isForeignerTarget(value)) return foreignerTarget;
    return previousTargetFilterFrom ? previousTargetFilterFrom(value) : "";
  };

  const previousPolicyTargetGroups = typeof window.policyTargetGroups === "function" ? window.policyTargetGroups : null;
  window.policyTargetGroups = function policyTargetGroupsWithForeigner(policy) {
    const groups = new Set(previousPolicyTargetGroups ? previousPolicyTargetGroups(policy) : []);
    const source = typeof window.policySearchText === "function" ? window.policySearchText(policy) : JSON.stringify(policy || {});

    if (
      /외국인|외국인주민|등록외국인|외국인등록|외국국적동포|거소등록|다문화|결혼이민|이주민|중도입국|난민|귀화|국적취득|새터민|북한이탈주민/.test(
        source,
      )
    ) {
      groups.add(foreignerTarget);
    }

    return [...groups];
  };

  function readActiveTarget() {
    if (typeof window.readCategoryFilters !== "function") return "";
    return window.readCategoryFilters(new URLSearchParams(location.search)).target;
  }

  function targetUrl() {
    const current =
      typeof window.readCategoryFilters === "function"
        ? window.readCategoryFilters(new URLSearchParams(location.search))
        : { type: "전체", region: "전체지역", age: "전체연령", query: "" };

    if (typeof window.categoryUrl === "function") {
      return window.categoryUrl({ ...current, target: foreignerTarget });
    }

    const params = new URLSearchParams();
    params.set("target", foreignerTarget);
    return `category.html?${params.toString()}`;
  }

  function normalizeTargetFilterUi() {
    const targetFilter = document.querySelector("#targetFilter");
    if (!targetFilter) return;

    let link = targetFilter.querySelector(`[data-target-filter="${foreignerTarget}"]`);
    if (!link) {
      link = document.createElement("a");
      link.dataset.targetFilter = foreignerTarget;
      link.textContent = foreignerTarget;
      targetFilter.append(link);
    }

    link.href = targetUrl();
    link.classList.toggle("active", readActiveTarget() === foreignerTarget);
  }

  const previousRenderCategory = typeof window.renderCategory === "function" ? window.renderCategory : null;
  if (previousRenderCategory) {
    window.renderCategory = function renderCategoryWithForeignerTarget(...args) {
      const result = previousRenderCategory.apply(this, args);
      normalizeTargetFilterUi();
      return result;
    };
  }

  normalizeTargetFilterUi();
  if (document.body.dataset.page === "category" && typeof window.renderCategory === "function") {
    window.renderCategory();
  }
})();
