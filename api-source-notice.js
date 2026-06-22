(() => {
  if (window.GG24_API_SOURCE_NOTICE_VERSION) return;
  window.GG24_API_SOURCE_NOTICE_VERSION = "1";

  const apiNoticeHtml = `
    <strong>사용 API</strong>
    <span>정책 정보: 공공데이터포털 행정안전부_대한민국 공공서비스(혜택) 정보 API</span>
    <span>복지소식: 공공데이터포털 정책브리핑 정책뉴스 API</span>
    <span>보조 출처: 정부24·보조금24 공식 원문, 정책브리핑 원문</span>
    <span class="api-source-links">
      <a href="https://www.data.go.kr/data/15113968/openapi.do" target="_blank" rel="noopener noreferrer">공공서비스 API</a>
      <a href="https://www.data.go.kr/data/15095335/openapi.do" target="_blank" rel="noopener noreferrer">정책뉴스 API</a>
      <a href="https://www.gov.kr/" target="_blank" rel="noopener noreferrer">정부24</a>
      <a href="https://www.korea.kr/" target="_blank" rel="noopener noreferrer">정책브리핑</a>
    </span>
  `;

  function ensureStyle() {
    if (document.querySelector("#api-source-notice-style")) return;
    const style = document.createElement("style");
    style.id = "api-source-notice-style";
    style.textContent = `
      .api-source-notice,
      .detail-api-source-notice {
        display: grid;
        gap: 6px;
        border: 1px solid #dbeafe;
        border-radius: 14px;
        background: #eff6ff;
        color: #1e3a8a;
        font-size: 12px;
        line-height: 1.55;
        padding: 12px 14px;
      }

      .api-source-notice {
        max-width: 920px;
        margin-top: 12px;
      }

      .detail-api-source-notice {
        margin: 12px 0 0;
      }

      .api-source-notice strong,
      .detail-api-source-notice strong {
        color: #172554;
        font-size: 13px;
      }

      .api-source-links {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .api-source-links a {
        color: #1d4ed8;
        font-weight: 800;
        text-decoration: underline;
        text-underline-offset: 3px;
      }
    `;
    document.head.appendChild(style);
  }

  function applyApiSourceNotice() {
    ensureStyle();

    const footer = document.querySelector(".site-footer");
    if (footer && !footer.querySelector(".api-source-notice")) {
      const notice = document.createElement("p");
      notice.className = "api-source-notice";
      notice.innerHTML = apiNoticeHtml;
      const legal = footer.querySelector(".legal-disclaimer");
      if (legal) legal.insertAdjacentElement("beforebegin", notice);
      else footer.appendChild(notice);
    }

    const detail = document.querySelector("#policyDetail");
    if (detail && !detail.querySelector(".detail-api-source-notice")) {
      const sourceSection = detail.querySelector(".detail-source");
      const legal = detail.querySelector(".detail-legal-disclaimer");
      const target = legal || sourceSection || detail.querySelector(".detail-section");
      if (target) {
        const notice = document.createElement("section");
        notice.className = "detail-api-source-notice";
        notice.innerHTML = apiNoticeHtml;
        target.insertAdjacentElement(legal || sourceSection ? "beforebegin" : "afterend", notice);
      }
    }
  }

  applyApiSourceNotice();
  const observer = new MutationObserver(applyApiSourceNotice);
  observer.observe(document.body, { childList: true, subtree: true });
  [250, 800, 1600, 3200].forEach((delay) => setTimeout(applyApiSourceNotice, delay));
})();
