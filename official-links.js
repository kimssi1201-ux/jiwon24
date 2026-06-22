(() => {
  const links = [
    { name: "정부24·보조금24", desc: "민원, 정부혜택, 정책정보를 확인할 수 있는 대표 공공서비스입니다.", phone: "1588-2188", url: "https://plus.gov.kr/" },
    { name: "복지로", desc: "복지서비스, 복지멤버십, 온라인 신청 정보를 제공합니다.", phone: "129", url: "https://www.bokjiro.go.kr/" },
    { name: "고용24", desc: "취업지원, 실업급여, 국민취업지원제도 관련 정보를 확인할 수 있습니다.", phone: "1350", url: "https://www.work24.go.kr/" },
    { name: "홈택스", desc: "근로·자녀장려금, 세금 신고, 환급 조회를 이용할 수 있습니다.", phone: "126", url: "https://www.hometax.go.kr/" },
    { name: "국민건강보험", desc: "건강보험, 장기요양, 보험료 민원 정보를 제공합니다.", phone: "1577-1000", url: "https://www.nhis.or.kr/" },
    { name: "국민연금", desc: "연금 조회, 가입내역, 노후준비 정보를 확인할 수 있습니다.", phone: "1355", url: "https://www.nps.or.kr/" },
    { name: "서민금융진흥원", desc: "서민금융상품, 휴면예금, 금융지원 정보를 제공합니다.", phone: "1397", url: "https://www.kinfa.or.kr/" },
    { name: "국가보훈부", desc: "국가유공자와 보훈가족 지원 정보를 확인할 수 있습니다.", phone: "1577-0606", url: "https://www.mpva.go.kr/" },
  ];

  window.GG24_OFFICIAL_LINKS_PAGE_VERSION = "20260619-5";

  const params = new URLSearchParams(location.search);
  const isCategoryPage = document.body.dataset.page === "category";
  const isOfficialMode = params.get("mode") === "official";
  const officialHref = "category.html?mode=official";

  function escapeText(value) {
    if (typeof escapeHtml === "function") return escapeHtml(value);
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function safeUrl(value) {
    try {
      const url = new URL(value || "", location.href);
      return /^https?:$/.test(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  function phoneHref(value) {
    return `tel:${String(value || "").replace(/[^0-9+]/g, "")}`;
  }

  function normalizeLegacyButtons() {
    document.querySelectorAll("button[data-official-links-trigger], button.official-links-trigger").forEach((button) => {
      button.removeAttribute("aria-haspopup");
      button.removeAttribute("aria-expanded");
      button.addEventListener("click", (event) => {
        event.preventDefault();
        location.href = officialHref;
      });
    });
  }

  function setActiveTabs() {
    if (!isCategoryPage) return;
    const isNewsMode = params.get("mode") === "news";
    const isDeadlineMode = params.get("deadline") === "soon";
    const isDefaultMode = !isNewsMode && !isDeadlineMode && !isOfficialMode;

    document.querySelectorAll(".category-tabs a, .desktop-nav a").forEach((link) => {
      const href = link.getAttribute("href") || "";
      const active =
        (isOfficialMode && href.includes("mode=official")) ||
        (isNewsMode && href.includes("mode=news")) ||
        (isDeadlineMode && href.includes("deadline=soon")) ||
        (isDefaultMode && !href.includes("mode=") && !href.includes("deadline="));
      link.classList.toggle("active", active);
    });
  }

  function officialTabNeedsActiveFix() {
    if (!isOfficialMode) return false;
    const officialLinks = [...document.querySelectorAll('.category-tabs a[href*="mode=official"], .desktop-nav a[href*="mode=official"]')];
    const wrongActive = document.querySelector('.category-tabs a.active:not([href*="mode=official"]), .desktop-nav a.active:not([href*="mode=official"])');
    return Boolean(wrongActive) || officialLinks.some((link) => !link.classList.contains("active"));
  }

  function injectOfficialStyles() {
    if (document.querySelector("#officialLinksPageStyle")) return;
    const style = document.createElement("style");
    style.id = "officialLinksPageStyle";
    style.textContent = `
      body.category-official-mode .category-hero,
      body.category-official-mode .filter-summary-row {
        display: none !important;
      }

      body.category-official-mode .desktop-nav a.active:not([href*="mode=official"]) {
        color: inherit;
      }

      body.category-official-mode .desktop-nav a[href*="mode=official"] {
        color: #2563eb;
        font-weight: 900;
      }

      .official-link-card-inline .policy-highlight {
        color: #475569;
      }

      .official-phone-line {
        display: inline-flex;
        width: fit-content;
        align-items: center;
        gap: 6px;
        border-radius: 999px;
        background: #f8fafc;
        color: #172026;
        padding: 8px 12px;
        font-size: 14px;
        font-weight: 900;
      }

      .official-phone-line a {
        color: #1d4ed8;
        font-weight: 950;
      }

      .official-open-link {
        width: fit-content;
        min-height: 34px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        background: #eff6ff;
        color: #2563eb;
        padding: 7px 12px;
        font-size: 13px;
        font-weight: 900;
      }

      @media (max-width: 759px) {
        body.category-official-mode .site-main {
          padding-top: 12px;
        }

        body.category-official-mode .category-tabs a.active:not([href*="mode=official"]) {
          border-color: #d7e1ef;
          background: #f7faff;
          color: #253041;
          box-shadow: inset 0 -1px 0 rgba(37, 99, 235, 0.05);
        }

        body.category-official-mode .category-tabs a[href*="mode=official"] {
          border-color: #2563eb;
          background: #2563eb;
          color: #ffffff;
          box-shadow: 0 7px 16px rgba(37, 99, 235, 0.24);
        }

        body.category-official-mode .category-tabs a.active:not([href*="mode=official"])::after,
        body.category-official-mode .category-tabs a[href*="mode=official"]::after {
          display: none;
        }

        body.category-official-mode .result-notice {
          margin: 0 2px 2px;
          color: #64748b;
          font-size: 14px;
          line-height: 1.45;
          font-weight: 760;
        }

        body.category-official-mode .official-link-card-inline .policy-highlight {
          color: #475569;
          font-weight: 700;
        }

        body.category-official-mode .official-phone-line {
          padding: 9px 13px;
          font-size: 15px;
        }

        body.category-official-mode .official-open-link {
          min-height: 38px;
          padding: 8px 14px;
          font-size: 14px;
        }
      }
    `;
    document.head.append(style);
  }

  function officialCard(link) {
    const href = safeUrl(link.url);
    return `
      <article class="policy-card app-list-card official-link-card-inline">
        <div class="policy-body">
          <div class="meta-row">
            <span class="badge agency">공식 사이트</span>
          </div>
          <h3><a href="${escapeText(href)}" target="_blank" rel="noopener noreferrer">${escapeText(link.name)}</a></h3>
          <p class="policy-highlight">${escapeText(link.desc)}</p>
          <p class="official-phone-line">대표전화 <a href="${escapeText(phoneHref(link.phone))}">${escapeText(link.phone)}</a></p>
          <a class="official-open-link" href="${escapeText(href)}" target="_blank" rel="noopener noreferrer">사이트 열기</a>
        </div>
      </article>
    `;
  }

  function renderOfficialPage() {
    if (!isCategoryPage || !isOfficialMode) return;

    injectOfficialStyles();
    const title = document.querySelector("#categoryTitle");
    const count = document.querySelector("#categoryCount");
    const notice = document.querySelector("#resultNotice");
    const list = document.querySelector("#policyList");
    const cardHtml = links.map(officialCard).join("");
    let isPainting = false;

    const needsPaint = () => {
      const officialCards = list ? list.querySelectorAll(".official-link-card-inline").length : links.length;
      return (
        !document.body.classList.contains("category-official-mode") ||
        officialTabNeedsActiveFix() ||
        (title && title.textContent.trim() !== "관공서 모음") ||
        (count && count.textContent.trim() !== `${links.length.toLocaleString("ko-KR")}곳`) ||
        (notice && !notice.textContent.includes("대표번호")) ||
        (list && officialCards !== links.length)
      );
    };

    const paint = (force = false) => {
      if (isPainting || (!force && !needsPaint())) return;
      isPainting = true;
      document.body.classList.add("category-official-mode");
      setActiveTabs();
      if (title && title.textContent.trim() !== "관공서 모음") title.textContent = "관공서 모음";
      if (count && count.textContent.trim() !== `${links.length.toLocaleString("ko-KR")}곳`) {
        count.textContent = `${links.length.toLocaleString("ko-KR")}곳`;
      }
      if (notice && !notice.textContent.includes("대표번호")) {
        notice.textContent = "자주 찾는 복지·고용·세금·금융 관련 관공서 공식 사이트와 대표번호입니다.";
      }
      if (list && (force || list.querySelectorAll(".official-link-card-inline").length !== links.length)) {
        list.innerHTML = cardHtml;
      }
      isPainting = false;
    };

    paint(true);
    [120, 450, 1200, 3000, 6000, 10000].forEach((delay) => setTimeout(() => paint(false), delay));

    if (list) {
      const listObserver = new MutationObserver(() => {
        if (isPainting) return;
        if (list.querySelectorAll(".official-link-card-inline").length !== links.length) paint(true);
      });
      listObserver.observe(list, { childList: true, subtree: false });
      setTimeout(() => listObserver.disconnect(), 10000);
    }

    document.querySelectorAll(".category-tabs, .desktop-nav").forEach((nav) => {
      const tabObserver = new MutationObserver(() => {
        if (!isPainting && officialTabNeedsActiveFix()) paint(false);
      });
      tabObserver.observe(nav, { attributes: true, subtree: true, attributeFilter: ["class"] });
      setTimeout(() => tabObserver.disconnect(), 10000);
    });
  }

  normalizeLegacyButtons();
  setActiveTabs();
  renderOfficialPage();
})();

(() => {
  if (window.GG24_API_SOURCE_NOTICE_LOADER_VERSION) return;
  window.GG24_API_SOURCE_NOTICE_LOADER_VERSION = "1";

  function loadApiSourceNotice() {
    if (document.querySelector('script[src*="api-source-notice.js"]')) return;
    const script = document.createElement("script");
    script.src = "api-source-notice.js?v=1";
    script.defer = true;
    document.body.appendChild(script);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadApiSourceNotice, { once: true });
  } else {
    loadApiSourceNotice();
  }
})();
