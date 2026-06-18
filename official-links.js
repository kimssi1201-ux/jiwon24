(() => {
  const header = document.querySelector(".header-inner");
  const desktopNav = document.querySelector(".desktop-nav");
  const categoryTabs = document.querySelector(".category-tabs");
  if (!header && !desktopNav && !categoryTabs) return;

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
    .official-links-trigger {
      font-family: inherit;
      cursor: pointer;
    }

    .desktop-nav .official-links-trigger {
      border: 0;
      background: transparent;
      color: inherit;
      padding: 0;
      font-size: inherit;
      font-weight: inherit;
      white-space: nowrap;
    }

    .desktop-nav .official-links-trigger:hover,
    .desktop-nav .official-links-trigger:focus-visible {
      color: var(--teal-dark, #0f766e);
    }

    .category-tabs .official-links-trigger {
      position: relative;
      flex: 0 0 auto;
      min-height: 42px;
      border: 0;
      background: transparent;
      color: #8d939d;
      padding: 0;
      font-size: 18px;
      font-weight: 950;
      white-space: nowrap;
    }

    body.official-links-open .category-tabs .official-links-trigger {
      color: #111827;
    }

    body.official-links-open .category-tabs .official-links-trigger::after {
      content: "";
      position: absolute;
      left: 0;
      right: 0;
      bottom: -1px;
      height: 3px;
      border-radius: 999px 999px 0 0;
      background: #111827;
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
      font-size: 20px;
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
      cursor: pointer;
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
      text-decoration: none;
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
      content: "열기";
      width: 42px;
      min-height: 30px;
      display: inline-grid;
      place-items: center;
      border-radius: 999px;
      background: #eff6ff;
      color: #2563eb;
      font-size: 12px;
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
      body[data-page="category"] .header-inner::after {
        content: none;
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
        font-size: 21px;
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

  const triggers = [];

  function registerTrigger(button) {
    if (!button || triggers.includes(button)) return button;
    button.type = "button";
    button.classList.add("official-links-trigger");
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-expanded", "false");
    if (!button.textContent.trim()) button.textContent = "관공서 모음";
    button.addEventListener("click", () => {
      if (document.body.classList.contains("official-links-open")) closeMenu();
      else openMenu();
    });
    triggers.push(button);
    return button;
  }

  function makeTrigger(className) {
    const button = document.createElement("button");
    button.className = `official-links-trigger ${className}`;
    button.textContent = "관공서 모음";
    return registerTrigger(button);
  }

  document.querySelectorAll("[data-official-links-trigger], .official-links-trigger").forEach(registerTrigger);

  if (desktopNav && !desktopNav.querySelector("[data-official-links-trigger], .official-links-trigger")) {
    desktopNav.append(makeTrigger("official-links-nav-button"));
  }

  if (categoryTabs && !categoryTabs.querySelector("[data-official-links-trigger], .official-links-trigger")) {
    categoryTabs.append(makeTrigger("official-links-tab-button"));
  }

  if (!desktopNav && !categoryTabs && header && !header.querySelector("[data-official-links-trigger], .official-links-trigger")) {
    header.append(makeTrigger("official-links-header-button"));
  }

  const backdrop = document.createElement("div");
  backdrop.className = "official-links-backdrop";
  backdrop.innerHTML = `
    <section class="official-links-panel" role="dialog" aria-modal="true" aria-labelledby="officialLinksTitle">
      <div class="official-links-head">
        <h2 id="officialLinksTitle">관공서 모음</h2>
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

  function setExpanded(value) {
    triggers.forEach((trigger) => trigger.setAttribute("aria-expanded", String(value)));
  }

  function closeMenu() {
    document.body.classList.remove("official-links-open");
    setExpanded(false);
  }

  function openMenu() {
    document.body.classList.add("official-links-open");
    setExpanded(true);
    backdrop.querySelector(".official-links-close")?.focus();
  }

  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop || event.target.closest(".official-links-close")) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
})();
