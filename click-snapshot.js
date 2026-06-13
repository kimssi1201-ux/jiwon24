(() => {
  const policySnapshotKey = "GG24_LAST_POLICY_DETAIL";

  function text(selector, root) {
    return root.querySelector(selector)?.textContent?.trim() || "";
  }

  function safeUrl(value) {
    try {
      const url = new URL(String(value || ""), location.href);
      return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  }

  function policyFromCard(link) {
    const id = new URL(link.getAttribute("href"), location.href).searchParams.get("id");
    const card = link.closest(".policy-card");
    if (!id || !card) return null;

    const badges = [...card.querySelectorAll(".badge")];
    const type = badges.find((badge) => !badge.classList.contains("deadline"))?.textContent?.trim() || "지원금";
    const deadline = card.querySelector(".badge.deadline")?.textContent?.trim() || "공고 확인";
    const institution = text(".policy-body p", card).replace(/^기관:\s*/, "") || "공공기관";
    const benefitText = [...card.querySelectorAll(".mini-meta span")]
      .map((item) => item.textContent.trim())
      .find((item) => item.startsWith("혜택"));
    const sourceUrl = safeUrl(card.querySelector(".apply-link")?.getAttribute("href"));

    return {
      id,
      title: text("h3", card) || link.textContent.trim() || "정책 정보",
      type,
      institution,
      deadline,
      views: 0,
      maxBenefit: benefitText ? benefitText.replace(/^혜택\s*/, "") : "기관 문의",
      region: "공고 확인",
      income: "공고 확인",
      target: "공식 공고에서 상세 조건을 확인하세요.",
      method: "공식 페이지에서 확인",
      summary: "정책 상세 정보는 공식 원문과 해당 기관 공고에서 최종 확인해야 합니다.",
      tags: [type, institution].filter(Boolean),
      sourceUrl: sourceUrl.includes("policy") ? "" : sourceUrl,
      featured: false,
    };
  }

  document.addEventListener(
    "click",
    (event) => {
      const link = event.target.closest?.('a[href*="policy.html?id="], a[href*="/policy?id="]');
      if (!link) return;
      try {
        const policy = policyFromCard(link);
        if (!policy) return;
        sessionStorage.setItem(
          policySnapshotKey,
          JSON.stringify({
            id: policy.id,
            savedAt: Date.now(),
            policy,
          }),
        );
      } catch {
        // Navigation should continue even when storage is unavailable.
      }
    },
    true,
  );
})();
