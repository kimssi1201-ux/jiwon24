(() => {
  if (window.GG24_SOURCE_COMPLIANCE_FIX_VERSION) return;
  window.GG24_SOURCE_COMPLIANCE_FIX_VERSION = "1";

  const officialSources = [
    { label: "정부24", url: "https://www.gov.kr/" },
    { label: "공공데이터포털", url: "https://www.data.go.kr/" },
    { label: "정책브리핑", url: "https://www.korea.kr/" },
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
      .map((source) => `<a href="${source.url}" target="_blank" rel="noopener">${source.label}</a>`)
      .join(" · ");
  }

  function insertGlobalNotice() {
    if (document.querySelector(".source-notice")) return;
    const target = document.querySelector(".site-main");
    if (!target) return;

    const notice = document.createElement("section");
    notice.className = "source-notice";
    notice.innerHTML = `
      <strong>공식 출처 안내</strong>
      <p>지원금 올데이는 정부기관 공식 앱이 아닌 민간 정보 서비스입니다. 정책 정보는 공공데이터포털의 행정안전부 공공서비스 정보, 정부24 공식 원문, 정책브리핑 등 공개 출처를 바탕으로 정리합니다. 신청 전 반드시 해당 기관의 공식 공고와 신청 조건을 확인하세요.</p>
      <div>${sourceLinksHtml()}</div>
    `;
    target.insertBefore(notice, target.firstChild);
  }

  function insertFooterSources() {
    const footer = document.querySelector(".site-footer");
    if (!footer || footer.querySelector(".official-source-links")) return;

    const paragraph = document.createElement("p");
    paragraph.className = "official-source-links";
    paragraph.innerHTML = `공식 출처: ${sourceLinksHtml()}`;
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
      row.innerHTML = `<span>출처: ${cardInstitution(card)}</span><a href="${href}" target="_blank" rel="noopener">공식 원문</a>`;

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
      <p>이 정책 정보는 ${detailInstitution()}의 공식 안내와 공공데이터포털 제공 정보를 바탕으로 정리했습니다. 지원금 올데이는 정부기관 공식 앱이 아니며 신청, 심사, 지급 권한이 없습니다.</p>
      <a class="ghost-button source-official-link" href="${href}" target="_blank" rel="noopener">공식 원문 확인</a>
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