(() => {
  const section = document.querySelector("#urgentPoliciesSection");
  const list = document.querySelector("#urgentPolicies");
  const label = document.querySelector("#urgentPolicyLabel");
  if (!section || !list) return;

  const URGENT_WINDOW_DAYS = 45;
  const URGENT_LIMIT = 4;
  const money = new Intl.NumberFormat("ko-KR");
  const today = new Date();

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function safeUrl(value) {
    try {
      const url = new URL(String(value || ""), location.href);
      return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  }

  function daysUntil(policy) {
    const deadline = policy?.deadline || "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return null;
    const due = new Date(`${deadline}T23:59:59+09:00`);
    const diff = Math.ceil((due - today) / 86400000);
    return Number.isFinite(diff) ? diff : null;
  }

  function daysLeft(deadline) {
    if (!deadline) return "기관 문의";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return deadline;
    const due = new Date(`${deadline}T23:59:59+09:00`);
    const diff = Math.ceil((due - today) / 86400000);
    if (diff < 0) return "마감";
    if (diff === 0) return "오늘 마감";
    return `${diff}일 남음`;
  }

  function badgeClass(type) {
    if (type === "환급금") return "refund";
    if (type === "대출") return "loan";
    return "";
  }

  function illustrationForType(type) {
    if (type === "환급금") return "assets/illustration-refund.svg";
    if (type === "대출") return "assets/illustration-loan.svg";
    return "assets/illustration-support.svg";
  }

  function policyUrl(policy) {
    return `policy.html?id=${encodeURIComponent(policy.id)}`;
  }

  function policyCard(policy) {
    const title = escapeHtml(policy.title);
    const type = escapeHtml(policy.type);
    const thumbClass = badgeClass(policy.type) || "support";
    const illustration = illustrationForType(policy.type);
    const detailUrl = policyUrl(policy);
    const sourceUrl = safeUrl(policy.sourceUrl);
    const applyHref = sourceUrl || detailUrl;
    const applyTarget = sourceUrl ? ` target="_blank" rel="noopener"` : "";

    return `
      <article class="policy-card" data-type="${type}">
        <a class="policy-thumb ${thumbClass}" href="${detailUrl}" aria-label="${title} 상세 보기">
          <img class="tile-illustration" src="${illustration}" alt="" aria-hidden="true" />
        </a>
        <div class="policy-body">
          <div class="meta-row">
            <span class="badge ${badgeClass(policy.type)}">${type}</span>
            <span class="badge deadline">${escapeHtml(daysLeft(policy.deadline))}</span>
          </div>
          <h3><a href="${detailUrl}">${title}</a></h3>
          <p>기관: ${escapeHtml(policy.institution)}</p>
          <div class="mini-meta">
            <span>${money.format(policy.views || 0)}명 확인</span>
            <span>혜택 ${escapeHtml(policy.maxBenefit || "기관 문의")}</span>
          </div>
          <div class="card-actions">
            <a class="ghost-button" href="${detailUrl}">상세보기</a>
            <a class="apply-link" href="${applyHref}"${applyTarget}>신청하기</a>
          </div>
        </div>
      </article>
    `;
  }

  function urgentPolicies(policies, limit = URGENT_LIMIT) {
    return policies
      .map((policy) => ({ policy, diff: daysUntil(policy) }))
      .filter((item) => item.diff !== null && item.diff >= 0 && item.diff <= URGENT_WINDOW_DAYS)
      .sort((a, b) => a.diff - b.diff || (b.policy.views || 0) - (a.policy.views || 0))
      .slice(0, limit)
      .map((item) => item.policy);
  }

  function render(policies) {
    const urgent = urgentPolicies(Array.isArray(policies) ? policies : []);
    section.hidden = urgent.length === 0;
    list.innerHTML = urgent.map(policyCard).join("");
    if (label && urgent.length) {
      label.textContent = `${URGENT_WINDOW_DAYS}일 이내 마감 ${money.format(urgent.length)}개 먼저 보기`;
    }
  }

  const initialPolicies = window.GG24_DATA?.policies || [];
  render(initialPolicies);

  fetch("/api/policies?pages=20&perPage=500&maxItems=10000", {
    headers: { Accept: "application/json" },
    cache: "no-store",
  })
    .then((response) => (response.ok ? response.json() : null))
    .then((liveData) => {
      if (Array.isArray(liveData?.policies) && liveData.policies.length) {
        const seen = new Set();
        const merged = [...liveData.policies, ...initialPolicies].filter((policy) => {
          const key = policy.id || policy.title;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        render(merged);
      }
    })
    .catch(() => undefined);
})();
