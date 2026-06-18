(() => {
  if (document.body.dataset.page !== "category") return;

  function compactInstitution(value) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    if (!text) return "전국";
    return text.length > 12 ? `${text.slice(0, 12)}...` : text;
  }

  function findPolicy(card) {
    const href = card.querySelector('a[href*="policy.html?id="], a[href*="/policy?id="]')?.getAttribute("href");
    if (!href || !Array.isArray(policies)) return null;
    try {
      const id = new URL(href, location.href).searchParams.get("id");
      return policies.find((item) => item.id === id) || null;
    } catch {
      return null;
    }
  }

  function applyAgencyLabels() {
    document.querySelector(".filter-summary-row .summary-popular")?.remove();
    document.querySelectorAll(".policy-card .badge.agency").forEach((badge) => {
      if (badge.textContent.trim() !== "국가기관") return;
      const policy = findPolicy(badge.closest(".policy-card"));
      badge.textContent = compactInstitution(policy?.institution);
    });
  }

  const list = document.querySelector("#policyList");
  if (list) {
    new MutationObserver(applyAgencyLabels).observe(list, { childList: true, subtree: true });
  }
  applyAgencyLabels();
  [100, 400, 1000, 2500, 5000].forEach((delay) => setTimeout(applyAgencyLabels, delay));
})();
