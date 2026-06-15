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
    const hasPositiveSignal =
      /다문화|결혼이민|이주민|중도입국|난민|귀화|국적취득|새터민|북한이탈주민|외국인주민|외국인 주민|등록외국인|등록 외국인|외국인등록|외국인 등록|외국국적동포|외국 국적 동포|거소등록|거소 등록|내외국인|외국인\s*(?:포함|대상|지원|주민|유아|아동|청소년|근로|산모|임산부)|외국인(?:도|은|을|이)?\s*포함|체류지\s*등록[^。\n.]{0,40}외국인/.test(
        source,
      );
    const hasExclusionSignal =
      /외국인[^。\n.]{0,80}(제외|불가|아님|지원대상 아님|참여 불가|신청불가)|재외국인[^。\n.]{0,60}(제외|불가|신청불가|아님)|재외국민[^。\n.]{0,60}(제외|불가|신청불가|아님)|제외대상[^。\n.]{0,100}외국인|부부 모두 외국인(?:인 경우)?\s*(?:제외|불가)/.test(
        source,
      );

    if (hasPositiveSignal || (/외국인/.test(source) && !hasExclusionSignal)) {
      groups.add(foreignerTarget);
    }
    if (hasExclusionSignal && !hasPositiveSignal) {
      groups.delete(foreignerTarget);
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
