(() => {
  const noBadgePattern = /상시|기관\s*문의|기관별\s*상이|예산\s*소진|예산소진|별도\s*공고|추후\s*공고|신청\s*불필요/;
  const usefulDeadlinePattern = /오늘\s*마감|\d+\s*일\s*남음|마감\s*임박|D-\d+/i;
  const alwaysPattern = /상시|연중|수시/;

  function injectStyle() {
    if (document.querySelector("#deadline-badge-fix-style")) return;
    const style = document.createElement("style");
    style.id = "deadline-badge-fix-style";
    style.textContent = `
      .deadline-always {
        color: #047857 !important;
        font-weight: 950 !important;
      }

      body[data-page="category"] .policy-facts dd.deadline-always,
      body[data-page="policy"] .detail-highlight strong.deadline-always,
      body[data-page="policy"] .detail-row dd.deadline-always {
        background: #ecfdf5;
        border: 1px solid #a7f3d0;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        width: fit-content;
        padding: 4px 10px;
        line-height: 1.2;
      }
    `;
    document.head.appendChild(style);
  }

  function normalized(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function shouldHideDeadlineBadge(text) {
    const label = normalized(text);
    if (!label) return true;
    if (usefulDeadlinePattern.test(label)) return false;
    return noBadgePattern.test(label);
  }

  function markAlwaysValue(element) {
    if (!element) return;
    element.classList.toggle("deadline-always", alwaysPattern.test(normalized(element.textContent)));
  }

  function cleanCard(card) {
    const badge = card.querySelector(".badge.deadline");
    const periodElement = [...card.querySelectorAll(".policy-facts dt")]
      .find((dt) => normalized(dt.textContent) === "신청기간")
      ?.nextElementSibling;
    markAlwaysValue(periodElement);

    if (!badge || badge.dataset.deadlineCleaned) return;
    const label = normalized(badge.textContent);
    const period = normalized(periodElement?.textContent);
    if (shouldHideDeadlineBadge(label) || label === period) {
      badge.remove();
      return;
    }
    badge.dataset.deadlineCleaned = "true";
  }

  function cleanDetail(detail) {
    [...detail.querySelectorAll(".detail-highlight")].forEach((row) => {
      if (normalized(row.querySelector("span")?.textContent) === "신청기간") {
        markAlwaysValue(row.querySelector("strong"));
      }
    });
    [...detail.querySelectorAll(".detail-row")].forEach((row) => {
      if (normalized(row.querySelector("dt")?.textContent).includes("신청")) {
        markAlwaysValue(row.querySelector("dd"));
      }
    });

    const badge = detail.querySelector(".detail-head .badge.deadline");
    if (!badge || badge.dataset.deadlineCleaned) return;
    const label = normalized(badge.textContent);
    if (shouldHideDeadlineBadge(label)) {
      badge.remove();
      return;
    }
    badge.dataset.deadlineCleaned = "true";
  }

  function cleanDeadlineBadges() {
    injectStyle();
    document.querySelectorAll(".policy-card").forEach(cleanCard);
    const detail = document.querySelector("#policyDetail");
    if (detail) cleanDetail(detail);
  }

  cleanDeadlineBadges();
  const observer = new MutationObserver(cleanDeadlineBadges);
  observer.observe(document.body, { childList: true, subtree: true });
  [100, 300, 800, 1600, 3200].forEach((delay) => setTimeout(cleanDeadlineBadges, delay));
})();
