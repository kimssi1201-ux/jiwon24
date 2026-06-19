(() => {
  if (document.body.dataset.page !== "category") return;

  const params = new URLSearchParams(location.search);
  if (params.get("mode") !== "news") return;

  window.GG24_POLICY_NEWS_FIX_VERSION = "20260619-2";

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

  function enforceNewsShell() {
    document.body.classList.add("category-news-api-mode");
    if (title) title.textContent = "복지소식";
    if (notice) notice.textContent = "정책브리핑에서 복지와 지원 관련 소식을 모아 보여드려요.";

    document.querySelectorAll(".category-tabs a, .desktop-nav a").forEach((link) => {
      const isNews = link.getAttribute("href")?.includes("mode=news");
      link.classList.toggle("active", Boolean(isNews));
    });

    const typeRow = document.querySelector(".category-hero > .filter-row[aria-label='정책 유형']");
    const summaryRow = document.querySelector(".filter-summary-row");
    const searchBox = document.querySelector(".search-box");
    [typeRow, summaryRow, searchBox].forEach((element) => {
      if (element) element.hidden = true;
    });
  }

  function render(message = lastMessage) {
    if (!list || isRendering) return;
    isRendering = true;
    lastMessage = message || "";
    enforceNewsShell();

    if (latestNews.length) {
      if (count) count.textContent = `${latestNews.length.toLocaleString("ko-KR")}개 소식`;
      if (!list.querySelector(".news-card") || list.querySelectorAll(".news-card").length !== latestNews.length) {
        list.innerHTML = latestNews.map(newsCard).join("");
      }
    } else {
      if (count) count.textContent = message ? "확인 필요" : "불러오는 중";
      list.innerHTML = `<div class="empty-card">${escapeText(message || "복지소식을 불러오고 있습니다.")}</div>`;
    }
    isRendering = false;
  }

  async function requestNews(days, limit) {
    const response = await fetch(`/api/news?days=${days}&limit=${limit}&t=${Date.now()}`, {
      headers: { Accept: "application/json" },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.ok === false) {
      throw new Error(payload.message || `정책브리핑 API 응답 오류(${response.status})`);
    }
    return Array.isArray(payload.news) ? payload.news : [];
  }

  async function loadNews() {
    render();
    try {
      latestNews = await requestNews(6, 60);
      if (latestNews.length < 12) {
        try {
          const broaderNews = await requestNews(21, 60);
          if (broaderNews.length > latestNews.length) latestNews = broaderNews;
        } catch {
          // Six days is enough for a stable first screen; broader loading is best-effort.
        }
      }
      render(latestNews.length ? "" : "최근 정책브리핑 자료 중 복지 관련 소식이 없습니다. 잠시 후 다시 확인해 주세요.");
    } catch (error) {
      try {
        latestNews = await requestNews(3, 40);
        render(latestNews.length ? "" : "최근 정책브리핑 자료 중 복지 관련 소식이 없습니다. 잠시 후 다시 확인해 주세요.");
      } catch {
        const raw = error instanceof Error ? error.message : "";
        const message = /403|Forbidden|SERVICE_KEY|인증|승인/i.test(raw)
          ? "정책브리핑 API 활용신청 또는 키 설정을 확인해 주세요."
          : "복지소식을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.";
        latestNews = [];
        render(message);
      }
    }
  }

  loadNews();
  [120, 350, 800, 1500, 3000, 6000, 10000, 15000].forEach((delay) => setTimeout(() => render(), delay));

  let guardCount = 0;
  const guard = setInterval(() => {
    guardCount += 1;
    const expectedCount = latestNews.length ? `${latestNews.length.toLocaleString("ko-KR")}개 소식` : "";
    const needsRender =
      (latestNews.length && (!list?.querySelector(".news-card") || count?.textContent?.trim() !== expectedCount)) ||
      (!latestNews.length && !list?.querySelector(".empty-card"));
    if (needsRender) render();
    if (guardCount > 30) clearInterval(guard);
  }, 1000);

  if (list) {
    new MutationObserver(() => {
      if (isRendering) return;
      const expectedCount = latestNews.length ? `${latestNews.length.toLocaleString("ko-KR")}개 소식` : "";
      if (latestNews.length && (!list.querySelector(".news-card") || count?.textContent?.trim() !== expectedCount)) {
        render();
      }
      if (!latestNews.length && !list.querySelector(".empty-card")) render();
    }).observe(list, { childList: true, subtree: false });
  }
})();
