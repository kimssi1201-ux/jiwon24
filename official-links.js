(() => {
  const header = document.querySelector(".header-inner");
  if (!header || header.querySelector(".official-links-button")) return;

  const links = [
    { name: "정부24·보조금24", desc: "민원, 정부혜택, 정책정보", url: "https://plus.gov.kr/" },
    { name: "복지로", desc: "복지서비스, 복지멤버십, 온라인 신청", url: "https://www.bokjiro.go.kr/" },
    { name: "고용24", desc: "취업지원, 실업급여, 국민취업지원제도", url: "https://www.work24.go.kr/" },
    { name: "홈택스", desc: "근로·자녀장려금, 세금, 환급 조회", url: "https://www.hometax.go.kr/" },
    { name: "국민건강보험", desc: "건강보험, 장기요양, 보험료 민원", url: "https://www.nhis.or.kr/" },
    { name: "국민연금", desc: "연금 조회, 가입내역, 노후준비", url: "https://www.nps.or.kr/" },
    { name: "서민금융진흥원", desc: "서민금융상품, 휴면예금, 금융지원", url: "https://www.kinfa.or.kr/" },
    { name: "국가보훈부", desc: "국가유공자, 보훈가족 지원", url: "https://www.mpva.go.kr/" },
  ];

  const style = document.createElement("style");
  style.textContent = `
    .official-links-button {
      min-height: 38px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border: 1px solid var(--line, #dfe7e5);
      border-radius: 999px;
      background: #ffffff;
      color: #172026;
      padding: 8px 12px;
      font-size: 13px;
      font-weight: 900;
      white-space: nowrap;
      box-shadow: 0 6px 18px rgba(19, 32, 38, 0.08);
    }

    .official-links-button-icon {
      width: 16px;
      height: 16px;
      position: relative;
      display: inline-block;
      border-radius: 50%;
      background: #eff6ff;
    }

    .official-links-button-icon::before,
    .official-links-button-icon::after {
      content: "";
      position: absolute;
      border-radius: 999px;
      background: #2563eb;
    }

    .official-links-button-icon::before {
      left: 4px;
      top: 4px;
      width: 8px;
      height: 8px;
    }

    .official-links-button-icon::after {
      left: 7px;
      top: 2px;
      width: 2px;
      height: 12px;
    }

    .official-links-backdrop {
      position: fixed;
      inset: 0;
      z-index: 90;
      display: none;
      background: rgba(15, 23, 42, 0.42);
      padding: 18px;
    }

    body.official-links-open .official-links-backdrop {
      display: block;
    }

    .official-links-panel {
      width: min(420px, calc(100vw - 32px));
      max-height: min(620px, calc(100vh - 76px));
      margin: 64px auto 0;
      overflow: auto;
      border: 1px solid rgba(226, 232, 240, 0.92);
      border-radius: 14px;
      background: #ffffff;
      box-shadow: 0 28px 80px rgba(15, 23, 42, 0.24);
    }

    .official-links-head {
      position: sticky;
      top: 0;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 18px 18px 12px;
      background: rgba(255, 255, 255, 0.96);
      border-bottom: 1px solid #eef2f7;
    }

    .official-links-head h2 {
      margin: 0;
      color: #111827;
      font-size: 19px;
      line-height: 1.2;
      font-weight: 950;
    }

    .official-links-close {
      width: 36px;
      height: 36px;
      border: 1px solid #dbe3ec;
      border-radius: 999px;
      background: #ffffff;
      color: #111827;
      font-size: 22px;
      line-height: 1;
      font-weight: 700;
    }

    .official-links-list {
      display: grid;
      gap: 8px;
      padding: 12px 14px 14px;
    }

    .official-link-card {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px 12px;
      align-items: center;
      border: 1px solid #e3e9f2;
      border-radius: 10px;
      background: #ffffff;
      padding: 14px;
    }

    .official-link-card strong {
      color: #111827;
      font-size: 16px;
      line-height: 1.25;
      font-weight: 950;
    }

    .official-link-card small {
      grid-column: 1 / -1;
      color: #64748b;
      font-size: 13px;
      line-height: 1.35;
      font-weight: 760;
    }

    .official-link-card::after {
      content: "↗";
      width: 30px;
      height: 30px;
      display: inline-grid;
      place-items: center;
      border-radius: 999px;
      background: #eff6ff;
      color: #2563eb;
      font-weight: 950;
    }

    .official-links-note {
      margin: 0;
      padding: 0 18px 18px;
      color: #64748b;
      font-size: 12px;
      line-height: 1.4;
      font-weight: 760;
    }

    @media (max-width: 759px) {
      .header-inner {
        position: relative;
      }

      body[data-page="category"] .header-inner::after {
        content: none;
      }

      .official-links-button {
        position: absolute;
        right: 14px;
        top: 50%;
        width: 42px;
        height: 42px;
        min-height: 42px;
        transform: translateY(-50%);
        justify-content: center;
        border: 0;
        background: transparent;
        padding: 0;
        box-shadow: none;
      }

      .official-links-button-text,
      .official-links-button-icon {
        display: none;
      }

      .official-links-button::before {
        content: "";
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #111827;
        box-shadow: 0 -9px 0 #111827, 0 9px 0 #111827;
      }

      .official-links-backdrop {
        padding: 0;
      }

      .official-links-panel {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        max-height: min(82vh, 680px);
        margin: 0;
        border-radius: 18px 18px 0 0;
        border-bottom: 0;
        padding-bottom: env(safe-area-inset-bottom);
      }

      .official-links-head h2 {
        font-size: 20px;
      }

      .official-link-card {
        padding: 15px;
      }

      .official-link-card strong {
        font-size: 17px;
      }

      .official-link-card small {
        font-size: 14px;
      }
    }
  `;
  document.head.append(style);

  const button = document.createElement("button");
  button.type = "button";
  button.className = "official-links-button";
  button.setAttribute("aria-haspopup", "dialog");
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-label", "공식기관 바로가기 열기");
  button.innerHTML = `<span class="official-links-button-icon" aria-hidden="true"></span><span class="official-links-button-text">공식기관</span>`;
  header.append(button);

  const backdrop = document.createElement("div");
  backdrop.className = "official-links-backdrop";
  backdrop.innerHTML = `
    <section class="official-links-panel" role="dialog" aria-modal="true" aria-labelledby="officialLinksTitle">
      <div class="official-links-head">
        <h2 id="officialLinksTitle">공식기관 바로가기</h2>
        <button type="button" class="official-links-close" aria-label="닫기">×</button>
      </div>
      <div class="official-links-list">
        ${links
          .map(
            (link) => `
              <a class="official-link-card" href="${link.url}" target="_blank" rel="noopener noreferrer">
                <strong>${link.name}</strong>
                <small>${link.desc}</small>
              </a>
            `,
          )
          .join("")}
      </div>
      <p class="official-links-note">각 항목은 해당 기관의 공식 사이트로 이동합니다.</p>
    </section>
  `;
  document.body.append(backdrop);

  function closeMenu() {
    document.body.classList.remove("official-links-open");
    button.setAttribute("aria-expanded", "false");
  }

  function openMenu() {
    document.body.classList.add("official-links-open");
    button.setAttribute("aria-expanded", "true");
    backdrop.querySelector(".official-links-close")?.focus();
  }

  button.addEventListener("click", () => {
    if (document.body.classList.contains("official-links-open")) closeMenu();
    else openMenu();
  });

  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop || event.target.closest(".official-links-close")) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
})();
