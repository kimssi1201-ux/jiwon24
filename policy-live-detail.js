(() => {
  const detail = document.querySelector("#policyDetail");
  const requestedId = new URLSearchParams(location.search).get("id");
  if (!detail || !requestedId) return;

  let renderedPolicy = null;
  const staticPolicies = Array.isArray(window.GG24_DATA?.policies) ? window.GG24_DATA.policies : [];
  const chunkStarts = [1, 6, 11, 16, 21, 26, 31, 36];
  const policySnapshotKey = "GG24_LAST_POLICY_DETAIL";

  function escapeHtml(value) {
    return String(value ?? "")
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

  function daysLeft(deadline) {
    if (!deadline) return "기관 문의";
    if (deadline === "상시" || deadline.includes("상시") || deadline.includes("예산") || deadline.includes("문의")) {
      return deadline;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return deadline;
    const due = new Date(`${deadline}T23:59:59+09:00`);
    const diff = Math.ceil((due - new Date()) / 86400000);
    if (diff < 0) return "마감";
    if (diff === 0) return "오늘 마감";
    return `${diff}일 남음`;
  }

  function badgeClass(type) {
    if (type === "환급금") return "refund";
    if (type === "대출") return "loan";
    return "";
  }

  function detailRow(label, value) {
    return `
      <div class="detail-row">
        <dt>${escapeHtml(label)}</dt>
        <dd>${escapeHtml(value || "공고 확인")}</dd>
      </div>
    `;
  }

  function renderPolicy(policy) {
    renderedPolicy = policy;
    detail.dataset.livePolicyId = policy.id;

    const sourceUrl = safeUrl(policy.sourceUrl);
    const sourceAction = sourceUrl
      ? `<a class="primary-button" href="${sourceUrl}" target="_blank" rel="noopener">신청하기</a>`
      : `<button class="primary-button" type="button" data-apply>신청하기</button>`;
    const tags = Array.isArray(policy.tags) ? policy.tags : [];

    document.title = `${policy.title} - 지원금 올데이`;
    detail.innerHTML = `
      <div class="detail-head">
        <div class="meta-row">
          <span class="badge ${badgeClass(policy.type)}">${escapeHtml(policy.type)}</span>
          <span class="badge deadline">${escapeHtml(daysLeft(policy.deadline))}</span>
        </div>
        <h1>${escapeHtml(policy.title)}</h1>
        <p>${escapeHtml(policy.summary)}</p>
        <div class="detail-actions">
          ${sourceAction}
          <a class="ghost-button" href="category.html">목록 보기</a>
        </div>
      </div>

      <aside class="benefit-summary">
        <span>혜택 요약</span>
        <strong>${escapeHtml(policy.maxBenefit || "기관 문의")}</strong>
        <p>내가 지원 받을 수 있는 최대 혜택이에요</p>
      </aside>

      <section class="detail-section">
        <h2>사업내용</h2>
        <dl class="detail-grid">
          ${detailRow("지원기관", policy.institution)}
          ${detailRow("신청 마감일", policy.deadline)}
          ${detailRow("지원 형태", policy.type)}
          ${detailRow("지원 방법", policy.method)}
        </dl>
      </section>

      <section class="detail-section">
        <h2>지원대상</h2>
        <dl class="detail-grid">
          ${detailRow("지원대상", policy.target)}
          ${detailRow("대상 거주지", policy.region)}
          ${detailRow("소득 제한", policy.income)}
          ${detailRow("기타 사항", tags.join(", "))}
        </dl>
      </section>

      <section class="detail-section">
        <h2>접수 방법 및 상세 설명</h2>
        <p>${escapeHtml(policy.summary)} 신청 전에는 관할 기관 공고와 실제 신청 페이지의 최신 조건을 함께 확인해야 합니다.</p>
      </section>
    `;

    if (typeof window.bindCommonActions === "function") {
      window.bindCommonActions();
    }
  }

  function keepRenderedIfOverwritten() {
    const observer = new MutationObserver(() => {
      if (!renderedPolicy) return;
      const text = detail.textContent || "";
      const overwritten =
        detail.dataset.livePolicyId !== requestedId ||
        text.includes("찾을 수 없습니다") ||
        text.includes("불러오는 중");
      if (overwritten) renderPolicy(renderedPolicy);
    });
    observer.observe(detail, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 25000);
  }

  function renderStaticPolicy() {
    const staticPolicy = staticPolicies.find((item) => item.id === requestedId);
    if (!staticPolicy) return false;
    renderPolicy(staticPolicy);
    keepRenderedIfOverwritten();
    return true;
  }

  function renderSnapshotPolicy() {
    try {
      const snapshot = JSON.parse(sessionStorage.getItem(policySnapshotKey) || "null");
      if (!snapshot?.policy || snapshot.id !== requestedId || snapshot.policy.id !== requestedId) return false;
      renderPolicy(snapshot.policy);
      keepRenderedIfOverwritten();
      return true;
    } catch {
      return false;
    }
  }

  async function fetchExactPolicy() {
    const response = await fetch(`/api/policies?id=${encodeURIComponent(requestedId)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    }).catch(() => null);
    if (!response?.ok) return null;
    const liveData = await response.json().catch(() => null);
    if (liveData?.policy?.id === requestedId) return liveData.policy;
    return (Array.isArray(liveData?.policies) ? liveData.policies : []).find((item) => item.id === requestedId) || null;
  }

  async function loadRequestedPolicy() {
    if (!renderedPolicy) {
      detail.innerHTML = `<div class="empty-card">정책 정보를 불러오는 중입니다.</div>`;
    }

    try {
      const exactPolicy = await fetchExactPolicy();
      if (exactPolicy) {
        renderPolicy(exactPolicy);
        keepRenderedIfOverwritten();
        return;
      }

      for (let index = 0; index < chunkStarts.length; index += 2) {
        const batch = chunkStarts.slice(index, index + 2).map((startPage) =>
          fetch(`/api/policies?startPage=${startPage}&pages=5&perPage=500&maxItems=2500`, {
            headers: { Accept: "application/json" },
            cache: "no-store",
          })
            .then((response) => (response.ok ? response.json() : null))
            .catch(() => null),
        );
        const chunks = await Promise.all(batch);
        const policy = chunks
          .flatMap((liveData) => (Array.isArray(liveData?.policies) ? liveData.policies : []))
          .find((item) => item.id === requestedId);

        if (policy) {
          renderPolicy(policy);
          keepRenderedIfOverwritten();
          return;
        }
      }
    } catch {
      // The main detail renderer keeps the existing fallback message.
    }

    if (!renderedPolicy) {
      detail.innerHTML = `<div class="empty-card">정책 정보를 찾을 수 없습니다. 목록에서 다시 검색해 주세요.</div>`;
    }
  }

  renderSnapshotPolicy() || renderStaticPolicy();
  loadRequestedPolicy();
})();
