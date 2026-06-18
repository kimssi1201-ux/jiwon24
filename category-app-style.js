(() => {
  if (document.body.dataset.page !== "category") return;

  const urlParams = new URLSearchParams(location.search);
  const isDeadlineSoon = urlParams.get("deadline") === "soon";
  const sheetLabels = {
    regionFilter: "지역기관 선택",
    targetFilter: "지원대상 유형 선택",
    ageFilter: "연령·생애주기 선택",
  };

  function isWithinThreeDays(policy) {
    const deadline = String(policy?.deadline || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return false;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const due = new Date(`${deadline}T23:59:59+09:00`);
    const daysLeft = Math.ceil((due - today) / 86400000);
    return daysLeft >= 0 && daysLeft <= 3;
  }

  function selectedText(container) {
    const active = container?.querySelector("a.active");
    return active?.textContent?.trim() || "전체";
  }

  function ensureSummaryRow() {
    const hero = document.querySelector(".category-hero");
    const typeRow = hero?.querySelector(".filter-row[aria-label='정책 유형']");
    if (!hero || !typeRow) return null;

    let row = document.querySelector(".filter-summary-row");
    if (!row) {
      row = document.createElement("div");
      row.className = "filter-summary-row";
      typeRow.insertAdjacentElement("afterend", row);
    }

    const regionText = selectedText(document.querySelector("#regionFilter"));
    const targetText = selectedText(document.querySelector("#targetFilter"));
    const ageText = selectedText(document.querySelector("#ageFilter"));
    row.innerHTML = `
      <button type="button" data-filter-sheet="regionFilter"><span class="summary-icon map"></span>${regionText === "전체지역" ? "지역기관 전체" : regionText}</button>
      <button type="button" data-filter-sheet="targetFilter"><span class="summary-icon user"></span>${targetText === "전체대상" ? "지원대상 전체" : targetText}</button>
      <button type="button" data-filter-sheet="ageFilter"><span class="summary-icon bars"></span>${ageText === "전체연령" ? "연령 전체" : ageText}</button>
    `;
    return row;
  }

  function closeSheet() {
    document.querySelector(".filter-sheet-backdrop")?.remove();
    document.body.classList.remove("filter-sheet-open");
  }

  function openSheet(sourceId) {
    const source = document.querySelector(`#${sourceId}`);
    if (!source) return;

    closeSheet();
    const backdrop = document.createElement("div");
    backdrop.className = "filter-sheet-backdrop";
    const choices = [...source.querySelectorAll("a")]
      .map((link) => {
        const active = link.classList.contains("active") ? " active" : "";
        return `<a class="${active}" href="${link.getAttribute("href")}">${link.textContent.trim()}</a>`;
      })
      .join("");

    backdrop.innerHTML = `
      <section class="filter-sheet" role="dialog" aria-modal="true" aria-label="${sheetLabels[sourceId] || "필터 선택"}">
        <div class="filter-sheet-head">
          <h2>${sheetLabels[sourceId] || "필터 선택"}</h2>
          <button type="button" class="filter-sheet-close" aria-label="닫기"></button>
        </div>
        <div class="filter-sheet-options">${choices}</div>
      </section>
    `;
    document.body.appendChild(backdrop);
    document.body.classList.add("filter-sheet-open");
  }

  function bindSummaryRow() {
    const row = ensureSummaryRow();
    if (!row || row.dataset.bound) return;
    row.dataset.bound = "true";
    row.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter-sheet]");
      if (!button) return;
      openSheet(button.dataset.filterSheet);
    });
  }

  function withDeadlineParam(href) {
    if (!isDeadlineSoon || !href || href.startsWith("http")) return href;
    const url = new URL(href, location.href);
    url.searchParams.set("deadline", "soon");
    return `${url.pathname.split("/").pop() || "category.html"}${url.search}`;
  }

  function syncCategoryTabs() {
    const filters = typeof readCategoryFilters === "function" ? readCategoryFilters() : {};
    document.querySelectorAll(".category-tabs a").forEach((link) => link.classList.remove("active"));
    const activeHref = isDeadlineSoon
      ? "deadline=soon"
      : filters.region && filters.region !== "전체지역"
          ? "region="
          : filters.target && filters.target !== "전체대상"
            ? "target="
            : "";
    const activeLink = activeHref
      ? [...document.querySelectorAll(".category-tabs a")].find((link) => link.href.includes(activeHref))
      : document.querySelector(".category-tabs a:first-child");
    activeLink?.classList.add("active");
  }

  function syncDeadlineState() {
    syncCategoryTabs();
    if (!isDeadlineSoon) return;
    const title = document.querySelector("#categoryTitle");
    const filters = typeof readCategoryFilters === "function" ? readCategoryFilters() : {};
    const parts = [];
    if (filters.region && filters.region !== "전체지역") parts.push(typeof displayFilterLabel === "function" ? displayFilterLabel(filters.region) : filters.region);
    if (filters.age && filters.age !== "전체연령") parts.push(filters.age);
    if (filters.target && filters.target !== "전체대상") parts.push(filters.target);
    parts.push("마감임박 지원금");
    if (title) title.textContent = `${parts.join(" ")} 정보`;
    document.querySelectorAll(".category-hero a[href^='category.html']").forEach((link) => {
      link.href = withDeadlineParam(link.getAttribute("href"));
    });
  }

  document.addEventListener("click", (event) => {
    if (event.target.closest(".filter-sheet-close")) {
      closeSheet();
      return;
    }
    if (event.target.classList.contains("filter-sheet-backdrop")) closeSheet();
  });

  if (typeof filteredPolicies === "function") {
    const previousFilteredPolicies = filteredPolicies;
    filteredPolicies = function filteredPoliciesWithDeadline(...args) {
      const list = previousFilteredPolicies(...args);
      return isDeadlineSoon ? list.filter(isWithinThreeDays) : list;
    };
  }

  if (typeof renderCategory === "function") {
    const previousRenderCategory = renderCategory;
    renderCategory = function renderCategoryWithAppStyle(...args) {
      const result = previousRenderCategory(...args);
      bindSummaryRow();
      syncDeadlineState();
      return result;
    };
  }

  bindSummaryRow();
  syncDeadlineState();
  if (isDeadlineSoon && typeof renderCategory === "function") renderCategory();
  [400, 1200, 3000, 6500].forEach((delay) => setTimeout(bindSummaryRow, delay));
})();
