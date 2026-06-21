(() => {
  if (window.GG24_SOURCE_COMPLIANCE_FIX_VERSION) return;
  window.GG24_SOURCE_COMPLIANCE_FIX_VERSION = "2";

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
