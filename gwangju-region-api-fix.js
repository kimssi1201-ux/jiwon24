(() => {
  if (document.body.dataset.page !== "category") return;

  window.GG24_GWANGJU_REGION_API_FIX_VERSION = "1";

  function normalizedRegion() {
    const url = new URL(location.href);
    const raw = String(url.searchParams.get("region") || "").replace(/\s+/g, "");
    if (raw === "광주광역시") {
      url.searchParams.set("region", "광주");
      history.replaceState(null, "", `${url.pathname}${url.search}`);
      return "광주";
    }
    return raw;
  }

  if (normalizedRegion() !== "광주") return;

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

  function hasGwangjuCards() {
    const countText = document.querySelector("#categoryCount")?.textContent || "";
    return /[1-9][0-9]*개/.test(countText) && !countText.includes("0개");
  }

  async function loadGwangjuPolicies() {
    try {
      const response = await fetch(`/api/policies?region=${encodeURIComponent("광주")}&pages=40&perPage=500&maxItems=2500&t=${Date.now()}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !Array.isArray(payload.policies) || !payload.policies.length) return;

      policies = mergePolicies(payload.policies, Array.isArray(policies) ? policies : []);
      window.GG24_CATEGORY_FULL_LOAD_DONE = true;
      if (typeof renderCategory === "function") renderCategory();
    } catch {
      // Other loaders can still fall back to their normal policy chunks.
    }
  }

  loadGwangjuPolicies();
  [900, 1800, 4200, 7200, 11000].forEach((delay) => {
    setTimeout(() => {
      if (!hasGwangjuCards()) loadGwangjuPolicies();
      else if (typeof renderCategory === "function") renderCategory();
    }, delay);
  });
})();
