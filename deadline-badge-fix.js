(() => {
  const noBadgePattern = /상시|기관\s*문의|기관별\s*상이|예산\s*소진|예산소진|별도\s*공고|추후\s*공고|신청\s*불필요/;
  const usefulDeadlinePattern = /오늘\s*마감|\d+\s*일\s*남음|마감\s*임박|D-\d+/i;

  function normalized(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function shouldHideDeadlineBadge(text) {
    const label = normalized(text);
    if (!label) return true;
    if (usefulDeadlinePattern.test(label)) return false;
    return noBadgePattern.test(label);
  }

  function cleanCard(card) {
    const badge = card.querySelector(".badge.deadline");
    if (!badge || badge.dataset.deadlineCleaned) return;
    const label = normalized(badge.textContent);
    const period = normalized([...card.querySelectorAll(".policy-facts dt")]
      .find((dt) => normalized(dt.textContent) === "신청기간")
      ?.nextElementSibling?.textContent);
    if (shouldHideDeadlineBadge(label) || label === period) {
      badge.remove();
      return;
    }
    badge.dataset.deadlineCleaned = "true";
  }

  function cleanDetail(detail) {
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
    document.querySelectorAll(".policy-card").forEach(cleanCard);
    const detail = document.querySelector("#policyDetail");
    if (detail) cleanDetail(detail);
  }

  cleanDeadlineBadges();
  const observer = new MutationObserver(cleanDeadlineBadges);
  observer.observe(document.body, { childList: true, subtree: true });
  [100, 300, 800, 1600, 3200].forEach((delay) => setTimeout(cleanDeadlineBadges, delay));
})();
