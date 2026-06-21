(() => {
  if (window.GG24_SOURCE_COMPLIANCE_FIX_VERSION) return;
  window.GG24_SOURCE_COMPLIANCE_FIX_VERSION = "3";

  const officialSources = [
    { label: "공공데이터포털", desc: "행정안전부 대한민국 공공서비스(혜택) 정보 API", url: "https://www.data.go.kr/" },
    { label: "정부24·보조금24", desc: "정책별 공식 원문 및 신청 안내", url: "https://www.gov.kr/" },
    { label: "정책브리핑", desc: "정부 보도자료 및 정책 뉴스", url: "https://www.korea.kr/" },
  ];

  function safeHref(value) {
    try {
      const url = new URL(String(value || ""), location.href);
      return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  }

  function officialFallback() {
    return "https://www.gov.kr/";
  }

  function sourceLinksHtml() {
    return officialSources
      .map((source) => `<a href="${source.url}" target="_blank" rel="noopener noreferrer">${source.label}</a>`)
      .join(" · ");
  }

  function sourceListHtml() {
    return officialSources
      .map(
        (source) => `
          <li>
            <a href="${source.url}" target="_blank" rel="noopener noreferrer">${source.label}</a>
            <span>${source.desc}</span>
          </li>
        `,
      )
      .join("");
  }

  function insertServiceMenuStyle() {
    if (document.querySelector("#service-menu-style")) return;

    const style = document.createElement("style");
    style.id = "service-menu-style";
    style.textContent = `
      .service-menu-button {
        width: 44px;
        height: 44px;
        border: 0;
        border-radius: 999px;
        background: transparent;
        color: #111827;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 4px;
        flex: 0 0 auto;
        cursor: pointer;
      }

      .service-menu-button span {
        width: 5px;
        height: 5px;
        border-radius: 999px;
        background: currentColor;
        display: block;
      }

      .service-menu-button:focus-visible {
        outline: 3px solid rgba(37, 99, 235, 0.25);
        outline-offset: 2px;
      }

      .service-menu-backdrop {
        position: fixed;
        inset: 0;
        z-index: 120;
        display: none;
        align-items: flex-start;
        justify-content: flex-end;
        padding: 18px;
        background: rgba(15, 23, 42, 0.34);
      }

      body.service-menu-open {
        overflow: hidden;
      }

      body.service-menu-open .service-menu-backdrop {
        display: flex;
      }

      .service-menu-panel {
        width: min(380px, calc(100vw - 32px));
        margin-top: 64px;
        border: 1px solid rgba(148, 163, 184, 0.28);
        border-radius: 22px;
        background: #ffffff;
        box-shadow: 0 24px 70px rgba(15, 23, 42, 0.22);
        padding: 20px;
        color: #111827;
      }

      .service-menu-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 14px;
      }

      .service-menu-head strong {
        font-size: 21px;
        line-height: 1.25;
        letter-spacing: 0;
      }

      .service-menu-close {
        width: 40px;
        height: 40px;
        border: 1px solid #e5e7eb;
        border-radius: 999px;
        background: #ffffff;
        color: #111827;
        font-size: 25px;
        line-height: 1;
        cursor: pointer;
      }

      .service-menu-copy {
        margin: 0 0 14px;
        color: #4b5563;
        font-size: 15px;
        line-height: 1.65;
      }

      .service-menu-copy strong {
        display: block;
        color: #111827;
        font-size: 16px;
        margin-bottom: 4px;
      }

      .service-menu-warning {
        margin: 0 0 16px;
        border-radius: 14px;
        background: #f8fafc;
        border: 1px solid #e5e7eb;
        padding: 12px;
        color: #374151;
        font-size: 14px;
        line-height: 1.55;
      }

      .service-menu-links {
        display: grid;
        gap: 8px;
      }

      .service-menu-links a {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 44px;
        border: 1px solid #e5e7eb;
        border-radius: 13px;
        padding: 0 13px;
        color: #111827;
        text-decoration: none;
        font-weight: 800;
        font-size: 14px;
        background: #ffffff;
      }

      .service-menu-links a::after {
        content: ">";
        color: #94a3b8;
        font-weight: 900;
      }

      @media (max-width: 759px) {
        body[data-page="category"] .header-inner::after {
          content: none !important;
          display: none !important;
        }

        .service-menu-button {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 4;
        }

        .service-menu-backdrop {
          align-items: flex-end;
          padding: 0;
        }

        .service-menu-panel {
          width: 100%;
          max-height: min(78vh, 620px);
          overflow: auto;
          margin: 0;
          border-radius: 24px 24px 0 0;
          padding: 22px 20px calc(22px + env(safe-area-inset-bottom));
        }
      }
    `;
    document.head.appendChild(style);
  }

  function insertServiceMenu() {
    const header = document.querySelector(".header-inner");
    if (!header || document.querySelector(".service-menu-button")) return;

    insertServiceMenuStyle();

    const button = document.createElement("button");
    button.type = "button";
    button.className = "service-menu-button";
    button.setAttribute("aria-label", "서비스 안내 열기");
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-expanded", "false");
    button.innerHTML = "<span></span><span></span><span></span>";

    const backdrop = document.createElement("div");
    backdrop.className = "service-menu-backdrop";
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");
    backdrop.setAttribute("aria-label", "서비스 안내");
    backdrop.innerHTML = `
      <div class="service-menu-panel">
        <div class="service-menu-head">
          <strong>서비스 안내</strong>
          <button type="button" class="service-menu-close" aria-label="서비스 안내 닫기">×</button>
        </div>
        <p class="service-menu-copy"><strong>지원금 올데이는 민간 정보 서비스입니다.</strong>정부기관 공식 앱이 아니며, 정책 정보를 한곳에서 보기 쉽게 정리해 제공합니다.</p>
        <p class="service-menu-warning">정책 정보는 공개된 공식 출처를 바탕으로 정리합니다. 실제 신청 전에는 관할 기관의 최신 공고에서 자격, 서류, 기간을 반드시 확인하세요.</p>
        <div class="service-menu-links">
          <a href="https://www.data.go.kr/" target="_blank" rel="noopener noreferrer">공공데이터포털</a>
          <a href="https://www.gov.kr/" target="_blank" rel="noopener noreferrer">정부24·보조금24</a>
          <a href="https://www.korea.kr/" target="_blank" rel="noopener noreferrer">정책브리핑</a>
          <a href="about.html">회사소개</a>
          <a href="terms.html">이용약관</a>
          <a href="privacy.html">개인정보처리방침</a>
        </div>
      </div>
    `;

    const closeMenu = () => {
      document.body.classList.remove("service-menu-open");
      button.setAttribute("aria-expanded", "false");
    };
    const openMenu = () => {
      document.body.classList.add("service-menu-open");
      button.setAttribute("aria-expanded", "true");
      backdrop.querySelector(".service-menu-close")?.focus();
    };

    button.addEventListener("click", openMenu);
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop || event.target.closest(".service-menu-close")) closeMenu();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });

    header.appendChild(button);
    document.body.appendChild(backdrop);
  }

  function insertGlobalNotice() {
    if (document.querySelector(".source-notice")) return;
    const target = document.querySelector(".site-main");
    if (!target) return;

    const notice = document.createElement("section");
    notice.className = "source-notice";
    notice.innerHTML = `
      <strong>공식 출처 안내</strong>
      <p>지원금 올데이는 정부기관 공식 앱이 아닌 민간 정보 서비스입니다. 이 서비스에서 사용하는 정책 정보 출처는 아래 공개·공식 출처이며, 각 정책 상세 화면에서 가능한 경우 해당 기관의 원문 링크를 함께 제공합니다.</p>
      <ul>${sourceListHtml()}</ul>
      <p class="source-notice-caution">신청 전에는 반드시 원문 페이지와 관할 기관의 최신 공고에서 신청 자격, 제출 서류, 접수 기간을 다시 확인하세요.</p>
    `;
    target.insertBefore(notice, target.firstChild);
  }

  function insertFooterSources() {
    const footer = document.querySelector(".site-footer");
    if (!footer || footer.querySelector(".official-source-links")) return;

    const paragraph = document.createElement("p");
    paragraph.className = "official-source-links";
    paragraph.innerHTML = `공식 출처: ${sourceLinksHtml()} · 각 정책 상세 화면의 관할 기관 원문 링크`;
    footer.appendChild(paragraph);
  }

  function cardInstitution(card) {
    const paragraphs = [...card.querySelectorAll("p")].map((paragraph) => paragraph.textContent || "");
    const agencyLine = paragraphs.find((text) => text.includes("기관:"));
    return agencyLine ? agencyLine.replace("기관:", "").trim() : "공공기관";
  }

  function insertCardSources() {
    document.querySelectorAll(".policy-card").forEach((card) => {
      if (card.querySelector(".source-row")) return;

      const mini = card.querySelector(".mini-meta");
      const apply = card.querySelector(".apply-link");
      const href = safeHref(apply?.getAttribute("href")) || officialFallback();
      const row = document.createElement("div");
      row.className = "source-row";
      row.innerHTML = `<span>데이터 출처: 공공데이터포털</span><span>원문: ${cardInstitution(card)}</span><a href="${href}" target="_blank" rel="noopener noreferrer">공식 원문</a>`;

      if (mini) mini.insertAdjacentElement("afterend", row);
      else card.querySelector(".policy-body")?.appendChild(row);
    });
  }

  function detailInstitution() {
    const highlights = [...document.querySelectorAll(".detail-highlight")];
    const item = highlights.find((node) => (node.textContent || "").includes("지원기관"));
    const text = item?.querySelector("strong")?.textContent?.trim();
    return text || "관할 기관";
  }

  function insertDetailSource() {
    const detail = document.querySelector("#policyDetail");
    if (!detail || detail.querySelector(".detail-source")) return;

    const actions = detail.querySelector(".detail-actions");
    if (!actions || !detail.querySelector(".detail-section")) return;

    const sourceLink = actions.querySelector("a.primary-button[href]");
    const href = safeHref(sourceLink?.getAttribute("href")) || officialFallback();
    const section = document.createElement("section");
    section.className = "detail-section detail-source";
    section.innerHTML = `
      <h2>공식 출처</h2>
      <p>이 정책 정보는 공공데이터포털의 행정안전부 대한민국 공공서비스(혜택) 정보와 ${detailInstitution()}의 공식 안내를 바탕으로 정리했습니다. 지원금 올데이는 정부기관 공식 앱이 아니며 신청, 심사, 지급, 대출 실행 권한이 없습니다.</p>
      <a class="ghost-button source-official-link" href="${href}" target="_blank" rel="noopener noreferrer">관할 기관 공식 원문 확인</a>
      <div class="source-links">${sourceLinksHtml()}</div>
    `;

    const before = [...detail.querySelectorAll(".detail-section")].find((node) =>
      (node.textContent || "").includes("신청 전 확인"),
    );
    if (before) before.insertAdjacentElement("beforebegin", section);
    else detail.appendChild(section);
  }

  function apply() {
    insertServiceMenu();
    insertGlobalNotice();
    insertFooterSources();
    insertCardSources();
    insertDetailSource();
  }

  apply();
  const observer = new MutationObserver(apply);
  observer.observe(document.body, { childList: true, subtree: true });
  [250, 800, 1600, 3200].forEach((delay) => setTimeout(apply, delay));
})();
