(() => {
  if (document.body.dataset.page !== "category") return;

  const params = new URLSearchParams(location.search);
  if (params.get("mode") !== "news") return;

  const list = document.querySelector("#policyList");
  const title = document.querySelector("#categoryTitle");
  const count = document.querySelector("#categoryCount");
  const notice = document.querySelector("#resultNotice");
  let latestNews = [];
  let lastMessage = "";
  let isRendering = false;

  function escapeText(value) {
    if (typeof escapeHtml === "function") return escapeHtml(value);
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
  }

  function safeUrl(value) {
    try {
      const url = new URL(value || "", location.href);
      if (!/^https?:$/.test(url.protocol)) return "";
      return url.href;
    } catch {
      return "";
    }
  }

  function shortSummary(item) {
    const summary = String(item.summary || "").replace(/\s+/g, " ").trim();
    if (!summary) return "정책브리핑에서 제공하는 정책 관련 소식입니다.";
    return summary.length > 120 ? `${summary.slice(0, 120)}...` : summary;
  }

  function newsCard(item) {
    const href = safeUrl(item.url);
    const date = formatDate(item.date);
    const sourceLabel = item.department || item.source || "정책브리핑";
    const titleHtml = href
      ? `<a href="${escapeText(href)}" target="_blank" rel="noopener">${escapeText(item.title)}</a>`
      : escapeText(item.title);

    return `
      <article class="policy-card app-list-card news-card">
        <div class="policy-body">
          <div class="meta-row">
            <span class="badge agency">${escapeText(sourceLabel)}</span>
            ${date ? `<span class="badge deadline">${escapeText(date)}</span>` : ""}
          </div>
          <h3>${titleHtml}</h3>
          <p class="policy-highlight">${escapeText(shortSummary(item))}</p>
        </div>
      </article>
    `;
  }

  function render(message = lastMessage) {
    if (!list || isRendering) return;
    isRendering = true;
    lastMessage = message || "";
    document.body.classList.add("category-news-api-mode");
    if (title) title.textContent = "복지소식";
    if (notice) notice.textContent = "정책브리핑에서 복지와 지원 관련 소식을 모아 보여드려요.";

    if (latestNews.length) {
      if (count) count.textContent = `${latestNews.length.toLocaleString("ko-KR")}개 소식`;
      list.innerHTML = latestNews.map(newsCard).join("");
    } else {
      if (count) count.textContent = message ? "확인 필요" : "불러오는 중";
      list.innerHTML = `<div class="empty-card">${escapeText(message || "복지소식을 불러오고 있습니다.")}</div>`;
    }
    isRendering = false;
  }

  async function loadNews() {
    render();
    try {
      const response = await fetch(`/api/news?days=21&limit=60&t=${Date.now()}`, {
        headers: { Accept: "application/json" },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.ok === false) {
        const rawMessage = payload.message || `정책브리핑 API 응답 오류(${response.status})`;
        throw new Error(rawMessage);
      }

      latestNews = Array.isArray(payload.news) ? payload.news : [];
      render(
        latestNews.length
          ? ""
          : "최근 정책브리핑 자료 중 복지 관련 소식이 없습니다. 기간을 넓혀 다시 확인해 주세요.",
      );
    } catch (error) {
      const raw = error instanceof Error ? error.message : "";
      const message = /403|Forbidden|SERVICE_KEY|인증|승인/i.test(raw)
        ? "정책브리핑 API 활용신청 또는 키 설정을 확인해 주세요."
        : "복지소식을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.";
      latestNews = [];
      render(message);
    }
  }

  loadNews();
  [120, 400, 900, 1800, 3200, 6000, 10500, 13000].forEach((delay) => setTimeout(() => render(), delay));

  if (list) {
    new MutationObserver(() => {
      if (isRendering || list.querySelector(".news-card, .empty-card")) return;
      render();
    }).observe(list, { childList: true });
  }
})();
