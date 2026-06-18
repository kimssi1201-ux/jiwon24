(() => {
  if (document.body.dataset.page !== "category") return;

  const urlParams = new URLSearchParams(location.search);
  const isDeadlineSoon = urlParams.get("deadline") === "soon";
  const isNewsMode = urlParams.get("mode") === "news";
  document.body.classList.toggle("category-news-mode", isNewsMode);

  const sheetLabels = {
    regionFilter: "지역기관 선택",
    targetFilter: "지원대상 유형 선택",
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

  function escapeText(value) {
    if (typeof escapeHtml === "function") return escapeHtml(value);
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function selectedText(container) {
    const active = container?.querySelector("a.active");
    return active?.textContent?.trim() || "전체";
  }

  function currentTargetSummary() {
    const filters = typeof readCategoryFilters === "function" ? readCategoryFilters() : {};
    if (filters.type && filters.type !== "전체") return filters.type;
    if (filters.target && filters.target !== "전체대상") return filters.target;
    if (filters.age && filters.age !== "전체연령") return filters.age;
    return "지원대상 전체";
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
    row.innerHTML = `
      <button type="button" data-filter-sheet="regionFilter"><span class="summary-icon map"></span>${regionText === "전체지역" ? "지역기관 전체" : regionText}</button>
      <button type="button" data-filter-sheet="targetFilter"><span class="summary-icon user"></span>${currentTargetSummary()}</button>
      <button type="button" class="summary-popular" aria-pressed="true"><span class="summary-icon bars"></span>인기</button>
    `;
    return row;
  }

  function closeSheet() {
    document.querySelector(".filter-sheet-backdrop")?.remove();
    document.body.classList.remove("filter-sheet-open");
  }

  function withDeadlineParam(href) {
    if (!isDeadlineSoon || !href || href.startsWith("http")) return href;
    const url = new URL(href, location.href);
    url.searchParams.set("deadline", "soon");
    return `${url.pathname.split("/").pop() || "category.html"}${url.search}`;
  }

  function choiceHtml({ text, href, active }) {
    const activeClass = active ? " active" : "";
    return `<a class="${activeClass}" href="${escapeText(withDeadlineParam(href))}">${escapeText(text)}</a>`;
  }

  function regionChoices() {
    const source = document.querySelector("#regionFilter");
    if (!source) return "";
    return [...source.querySelectorAll("a")]
      .map((link) =>
        choiceHtml({
          text: link.textContent.trim() === "전체지역" ? "지역기관 전체" : link.textContent.trim(),
          href: link.getAttribute("href"),
          active: link.classList.contains("active"),
        }),
      )
      .join("");
  }

  function targetChoices() {
    const filters = typeof readCategoryFilters === "function" ? readCategoryFilters() : {};
    const choices = [
      {
        text: "지원대상 전체",
        href: typeof categoryUrl === "function" ? categoryUrl({ type: "전체", age: "전체연령", target: "전체대상" }) : "category.html",
        active: filters.type === "전체" && filters.age === "전체연령" && filters.target === "전체대상",
      },
    ];

    document.querySelectorAll(".category-hero > .filter-row[aria-label='정책 유형'] a").forEach((link) => {
      const text = link.textContent.trim();
      if (text === "전체") return;
      choices.push({ text, href: link.getAttribute("href"), active: link.classList.contains("active") });
    });

    document.querySelectorAll("#ageFilter a, #targetFilter a").forEach((link) => {
      const text = link.textContent.trim();
      if (text === "전체연령" || text === "전체대상") return;
      if (choices.some((item) => item.text === text)) return;
      choices.push({ text, href: link.getAttribute("href"), active: link.classList.contains("active") });
    });

    return choices.map(choiceHtml).join("");
  }

  function openSheet(sourceId) {
    if (sourceId !== "regionFilter" && sourceId !== "targetFilter") return;
    closeSheet();
    const backdrop = document.createElement("div");
    backdrop.className = "filter-sheet-backdrop";
    const choices = sourceId === "regionFilter" ? regionChoices() : targetChoices();

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

  function policyFromCard(card) {
    const href = card.querySelector('a[href*="policy.html?id="], a[href*="/policy?id="]')?.getAttribute("href");
    if (!href || typeof policies === "undefined" || !Array.isArray(policies)) return null;
    try {
      const id = new URL(href, location.href).searchParams.get("id");
      return policies.find((item) => item.id === id) || null;
    } catch {
      return null;
    }
  }

  function agencyLabel(policy) {
    if (String(policy?.region || "").includes("전국")) return "국가기관";
    const region = typeof displayFilterLabel === "function" ? displayFilterLabel(policy?.region || "") : policy?.region;
    return region ? `${region}/복지` : "지역기관";
  }

  function audienceLabel(policy) {
    const targets = typeof policyTargetGroups === "function" ? policyTargetGroups(policy) : [];
    const ages = typeof policyAgeGroups === "function" ? policyAgeGroups(policy) : [];
    const groups = [...targets, ...ages];
    if (groups.length) return groups.slice(0, 2).join(" · ");
    return policy?.type || "복지정책";
  }

  function summaryText(policy) {
    const summary = String(policy?.summary || "").replace(/\s+/g, " ").trim();
    return summary.length > 92 ? `${summary.slice(0, 92)}...` : summary;
  }

  function restylePolicyCards() {
    document.querySelectorAll(".policy-card").forEach((card) => {
      if (card.classList.contains("app-list-card")) return;
      const policy = policyFromCard(card);
      if (!policy) return;
      const detailUrl = typeof policyUrl === "function" ? policyUrl(policy) : `policy.html?id=${encodeURIComponent(policy.id)}`;
      const sourceUrl = typeof safeUrl === "function" ? safeUrl(policy.sourceUrl) : "";
      const applyHref = sourceUrl || detailUrl;
      const applyTarget = sourceUrl ? ` target="_blank" rel="noopener"` : "";
      card.classList.add("app-list-card");
      card.dataset.type = policy.type || "";
      card.innerHTML = `
        <div class="policy-body">
          <div class="meta-row">
            <span class="badge agency">${escapeText(agencyLabel(policy))}</span>
            <span class="badge deadline">${escapeText(typeof daysLeft === "function" ? daysLeft(policy.deadline) : policy.deadline || "기관 문의")}</span>
          </div>
          <h3><a href="${detailUrl}">${escapeText(policy.title)}</a></h3>
          <p class="policy-highlight">${escapeText(summaryText(policy))}</p>
          <dl class="policy-facts">
            <dt>신청기간</dt>
            <dd>${escapeText(policy.deadline || "기관 문의")}</dd>
            <dt>지원대상</dt>
            <dd>#${escapeText(audienceLabel(policy))}</dd>
          </dl>
          <div class="card-actions">
            <a class="ghost-button" href="${detailUrl}">상세보기</a>
            <a class="apply-link" href="${applyHref}"${applyTarget}>신청하기</a>
          </div>
        </div>
      `;
    });
    if (typeof bindCommonActions === "function") bindCommonActions();
  }

  function syncCategoryTabs() {
    document.querySelectorAll(".category-tabs a").forEach((link) => link.classList.remove("active"));
    const activeHref = isDeadlineSoon ? "deadline=soon" : isNewsMode ? "mode=news" : "";
    const activeLink = activeHref
      ? [...document.querySelectorAll(".category-tabs a")].find((link) => link.href.includes(activeHref))
      : document.querySelector(".category-tabs a:first-child");
    activeLink?.classList.add("active");
  }

  function syncDeadlineState() {
    syncCategoryTabs();
    if (isNewsMode) {
      const title = document.querySelector("#categoryTitle");
      const count = document.querySelector("#categoryCount");
      if (title) title.textContent = "복지소식";
      if (count) count.textContent = "많이 보는 정책 소식";
      return;
    }
    if (!isDeadlineSoon) return;
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
      if (isNewsMode) return [...list].sort((a, b) => Number(b.views || 0) - Number(a.views || 0)).slice(0, 80);
      return isDeadlineSoon ? list.filter(isWithinThreeDays) : list;
    };
  }

  if (typeof renderCategory === "function") {
    const previousRenderCategory = renderCategory;
    renderCategory = function renderCategoryWithAppStyle(...args) {
      const result = previousRenderCategory(...args);
      restylePolicyCards();
      bindSummaryRow();
      syncDeadlineState();
      return result;
    };
  }

  restylePolicyCards();
  bindSummaryRow();
  syncDeadlineState();
  if ((isDeadlineSoon || isNewsMode) && typeof renderCategory === "function") renderCategory();
  [100, 400, 1200, 3000, 6500].forEach((delay) => setTimeout(() => {
    restylePolicyCards();
    bindSummaryRow();
    syncDeadlineState();
  }, delay));
})();
