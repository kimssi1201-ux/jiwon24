(() => {
  const detail = document.querySelector("#policyDetail");
  const requestedId = new URLSearchParams(location.search).get("id");
  if (!detail) return;
  if (!requestedId) {
    detail.innerHTML = `<div class="empty-card">목록에서 정책을 선택해 주세요.</div>`;
    return;
  }

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

  function normalizeText(value, fallback = "공고 확인") {
    const text = String(value ?? "")
      .replace(/<[^>]*>/g, " ")
      .replace(/[○●❍▪▫■□◆◇▶]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!text || text === "undefined" || text === "null") return fallback;
    return text;
  }

  function compactText(value, maxLength = 360, fallback = "공고 확인") {
    const text = normalizeText(value, fallback);
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 1).trim()}…`;
  }

  function normalizeDeadline(value) {
    const text = normalizeText(value, "기관 문의");
    if (/상시|연중|수시/.test(text) && /정기|기간|별도|공고/.test(text)) return "상시 또는 정기 신청";
    return text;
  }

  function isAlwaysDeadline(value) {
    return /상시|연중|수시/.test(normalizeText(value, ""));
  }

  function uniqueItems(items) {
    return [...new Set(items.map((item) => normalizeText(item, "")).filter(Boolean))];
  }

  function daysLeft(deadline) {
    const text = normalizeDeadline(deadline);
    if (!text) return "기관 문의";
    if (text === "상시" || text.includes("상시") || text.includes("예산") || text.includes("문의")) {
      return text;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    const due = new Date(`${text}T23:59:59+09:00`);
    const diff = Math.ceil((due - new Date()) / 86400000);
    if (diff < 0) return "마감";
    if (diff === 0) return "오늘 마감";
    return `${diff}일 남음`;
  }

  function deadlineBadge(deadline) {
    const status = daysLeft(deadline);
    if (!deadline || status === normalizeDeadline(deadline) || isAlwaysDeadline(status)) return "";
    return `<span class="badge deadline">${escapeHtml(status)}</span>`;
  }

  function badgeClass(type) {
    if (type === "환급금") return "refund";
    if (type === "대출") return "loan";
    return "";
  }

  function detailRow(label, value) {
    const text = normalizeText(value, "");
    if (!text) return "";
    const valueClass = label.includes("신청") && isAlwaysDeadline(text) ? ` class="deadline-always"` : "";
    return `
      <div class="detail-row">
        <dt>${escapeHtml(label)}</dt>
        <dd${valueClass}>${escapeHtml(text)}</dd>
      </div>
    `;
  }

  function detailHighlight(label, value) {
    const text = normalizeText(value, "");
    if (!text) return "";
    const valueClass = label.includes("신청") && isAlwaysDeadline(text) ? ` class="deadline-always"` : "";
    return `
      <div class="detail-highlight">
        <span>${escapeHtml(label)}</span>
        <strong${valueClass}>${escapeHtml(text)}</strong>
      </div>
    `;
  }

  function detailGrid(rows) {
    const content = rows.filter(Boolean).join("");
    return content ? `<dl class="detail-grid">${content}</dl>` : "";
  }

  function detailShareActions(policy) {
    const title = policy?.title || "정책 정보";
    const text = policy?.summary || "지원금 올데이에서 정책 정보를 확인해 보세요.";
    return `
      <div class="detail-share" aria-label="정책 공유">
        <button class="ghost-button share-button" type="button" data-share-policy data-share-title="${escapeHtml(title)}" data-share-text="${escapeHtml(text)}">카카오톡 공유</button>
        <button class="ghost-button copy-button" type="button" data-copy-link>링크 복사</button>
      </div>
    `;
  }

  function detailTags(tags) {
    const visibleTags = uniqueItems(tags)
      .flatMap((tag) => String(tag).split(/[,#]/))
      .map((tag) => normalizeText(tag, ""))
      .filter((tag) => tag && tag.length <= 18)
      .slice(0, 7);
    if (!visibleTags.length) return "";
    return `
      <div class="detail-tags" aria-label="정책 키워드">
        ${visibleTags.map((tag) => `<span>#${escapeHtml(tag)}</span>`).join("")}
      </div>
    `;
  }

  function detailGuide(policy, sourceUrl) {
    const applyText = sourceUrl
      ? "신청하기 버튼을 누르면 해당 기관의 공식 안내 또는 신청 페이지로 이동합니다."
      : "신청 전 관할 기관의 최신 공고와 접수 가능 여부를 먼저 확인하세요.";
    const summary = compactText(policy.summary, 360, "정책의 주요 조건과 신청 방법을 확인할 수 있습니다.");
    const benefit = compactText(policy.maxBenefit, 150, "기관 문의");
    const target = compactText(policy.target, 220, "공고 확인");
    return `
      <section class="detail-section detail-guide">
        <h2>이 정책에서 확인할 내용</h2>
        <p class="detail-lead">${escapeHtml(summary)}</p>
        <ul class="detail-list">
          <li>
            <strong>받을 수 있는 혜택</strong>
            <span>${escapeHtml(benefit)}</span>
          </li>
          <li>
            <strong>대상 조건</strong>
            <span>${escapeHtml(target)}</span>
          </li>
          <li>
            <strong>신청 안내</strong>
            <span>${escapeHtml(applyText)}</span>
          </li>
        </ul>
      </section>
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
    const title = normalizeText(policy.title, "정책 정보");
    const type = normalizeText(policy.type, "복지정책");
    const summary = compactText(policy.summary, 420, "정책의 주요 내용을 확인하세요.");
    const institution = normalizeText(policy.institution, "관할 기관");
    const deadline = normalizeDeadline(policy.deadline);
    const target = compactText(policy.target, 260, "공고 확인");
    const method = normalizeText(policy.method, "기관 안내 확인");
    const region = normalizeText(policy.region, "전국");
    const income = compactText(policy.income, 180, "공고 확인");
    const maxBenefit = normalizeText(policy.maxBenefit, "기관 문의");
    const policyTags = [...tags, region, type].filter(Boolean);

    document.title = `${title} - 지원금 올데이`;
    detail.innerHTML = `
      <div class="detail-head">
        <div class="meta-row">
          <span class="badge ${badgeClass(type)}">${escapeHtml(type)}</span>
          ${deadlineBadge(policy.deadline)}
          <span class="badge neutral">${escapeHtml(region)}</span>
        </div>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(summary)}</p>
        ${detailTags(policyTags)}
        <div class="detail-actions">
          ${sourceAction}
          <a class="ghost-button" href="category.html">목록 보기</a>
        </div>
        ${detailShareActions(policy)}
      </div>

      <aside class="benefit-summary">
        <span>혜택 요약</span>
        <strong>${escapeHtml(maxBenefit)}</strong>
        <p>신청 전 실제 지급 조건을 공식 안내에서 확인하세요.</p>
      </aside>

      <section class="detail-section detail-overview">
        <h2>한눈에 보기</h2>
        <div class="detail-highlights">
          ${detailHighlight("지원기관", institution)}
          ${detailHighlight("신청기간", deadline)}
          ${detailHighlight("지원대상", target)}
          ${detailHighlight("신청방법", method)}
        </div>
      </section>

      ${detailGuide(policy, sourceUrl)}

      <section class="detail-section">
        <h2>상세 정보</h2>
        ${detailGrid([
          detailRow("지역", region),
          detailRow("지원 분야", type),
          detailRow("신청 방법", method),
          detailRow("소득 기준", income),
        ])}
      </section>

      <section class="detail-section">
        <h2>대상 조건</h2>
        ${detailGrid([
          detailRow("지원대상", target),
          detailRow("거주지", region),
          detailRow("추가 키워드", uniqueItems(tags).join(", ")),
        ])}
      </section>

      <section class="detail-section">
        <h2>신청 전 확인</h2>
        <p>${escapeHtml(summary)} 신청 전에는 ${escapeHtml(institution)}의 최신 공고에서 제출 서류, 접수 가능 시간, 세부 자격을 함께 확인해야 합니다.</p>
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
