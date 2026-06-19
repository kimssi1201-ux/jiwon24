(() => {
  const noBadgePattern = /상시|기관\s*문의|기관별\s*상이|예산\s*소진|예산소진|별도\s*공고|추후\s*공고|신청\s*불필요/;
  const usefulDeadlinePattern = /오늘\s*마감|\d+\s*일\s*남음|마감\s*임박|D-\d+/i;
  const alwaysPattern = /상시|연중|수시/;

  function injectStyle() {
    if (document.querySelector("#deadline-badge-fix-style")) return;
    const style = document.createElement("style");
    style.id = "deadline-badge-fix-style";
    style.textContent = `
      .deadline-always {
        color: #047857 !important;
        font-weight: 950 !important;
      }

      body[data-page="category"] .policy-facts dd.deadline-always,
      body[data-page="policy"] .detail-highlight strong.deadline-always,
      body[data-page="policy"] .detail-row dd.deadline-always {
        background: #ecfdf5;
        border: 1px solid #a7f3d0;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        width: fit-content;
        padding: 4px 10px;
        line-height: 1.2;
      }
    `;
    document.head.appendChild(style);
  }

  function normalized(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function shouldHideDeadlineBadge(text) {
    const label = normalized(text);
    if (!label) return true;
    if (usefulDeadlinePattern.test(label)) return false;
    return noBadgePattern.test(label);
  }

  function markAlwaysValue(element) {
    if (!element) return;
    element.classList.toggle("deadline-always", alwaysPattern.test(normalized(element.textContent)));
  }

  function cleanCard(card) {
    const badge = card.querySelector(".badge.deadline");
    const periodElement = [...card.querySelectorAll(".policy-facts dt")]
      .find((dt) => normalized(dt.textContent) === "신청기간")
      ?.nextElementSibling;
    markAlwaysValue(periodElement);

    if (!badge || badge.dataset.deadlineCleaned) return;
    const label = normalized(badge.textContent);
    const period = normalized(periodElement?.textContent);
    if (shouldHideDeadlineBadge(label) || label === period) {
      badge.remove();
      return;
    }
    badge.dataset.deadlineCleaned = "true";
  }

  function cleanDetail(detail) {
    [...detail.querySelectorAll(".detail-highlight")].forEach((row) => {
      if (normalized(row.querySelector("span")?.textContent) === "신청기간") {
        markAlwaysValue(row.querySelector("strong"));
      }
    });
    [...detail.querySelectorAll(".detail-row")].forEach((row) => {
      if (normalized(row.querySelector("dt")?.textContent).includes("신청")) {
        markAlwaysValue(row.querySelector("dd"));
      }
    });

    const badge = detail.querySelector(".detail-head .badge.deadline");
    if (!badge || badge.dataset.deadlineCleaned) return;
    const label = normalized(badge.textContent);
    if (shouldHideDeadlineBadge(label)) {
      badge.remove();
      return;
    }
    badge.dataset.deadlineCleaned = "true";
  }

  function cleanDeadlineBadges() {
    injectStyle();
    document.querySelectorAll(".policy-card").forEach(cleanCard);
    const detail = document.querySelector("#policyDetail");
    if (detail) cleanDetail(detail);
  }

  cleanDeadlineBadges();
  const observer = new MutationObserver(cleanDeadlineBadges);
  observer.observe(document.body, { childList: true, subtree: true });
  [100, 300, 800, 1600, 3200].forEach((delay) => setTimeout(cleanDeadlineBadges, delay));
})();

(() => {
  if (document.body.dataset.page !== "category") return;
  if (window.GG24_AUDIENCE_CODE_FIX_VERSION) return;
  window.GG24_AUDIENCE_CODE_FIX_VERSION = "20260619-1";

  const ageLabels = {
    INFANT_BIRTH: "영유아·출산",
    CHILD_TEEN: "아동·청소년",
    YOUTH: "청년",
    MIDDLE_SENIOR: "중장년·어르신",
  };

  const targetLabels = {
    VETERAN: "국가유공자·보훈",
    DISABLED: "장애인",
    SMALL_BUSINESS: "소상공인",
    FARM_FISHERY: "농어업인",
    LOW_INCOME: "저소득층",
    NEWLYWED: "신혼부부",
    FOREIGNER_MULTICULTURAL: "외국인·다문화",
  };

  const broadAnyonePattern = /누구든지|누구나|가입 가능|발급 가능|사용 가능|지역제한 없음|제한 없음|연령 무관/;
  const childAgeOnlyPattern = /(?:만\s*)?(?:[6-9]|1[0-7])세\s*이상/;
  const childSignalPattern = /아동|어린이|청소년|초등|중등|고등|초·중·고|초중고|학교밖|학교\s*밖|결식아동|아이돌봄|아동수당|교복|입학준비|입학축하|검정고시|청소년육성|방과후|돌봄교실|교육비|학습비|급식/;
  const infantSignalPattern = /영유아|영아|유아|신생아|출산|출생|임산부|임신|산모|난임|산후|태아|육아|어린이집|누리과정|보육료|보육수당|부모급여|첫만남/;
  const youthSignalPattern = /청년|대학생|취업준비|미취업|구직|사회초년|청년창업|청년월세|만\s*(?:18|19|2[0-9]|3[0-9])세/;
  const middleSignalPattern = /중장년|신중년|중년|장년|5060|4050|경력단절|재취업|만\s*(?:4[0-9]|5[0-9]|6[0-4])세/;
  const seniorSignalPattern = /어르신|노인|고령|경로|독거노인|기초연금|노인일자리|장기요양|치매|노후|65세\s*이상|70세\s*이상|75세\s*이상|80세\s*이상|만\s*(?:6[5-9]|[78][0-9])세/;

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function normalized(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function sourceText(policy) {
    return [
      policy?.title,
      policy?.summary,
      policy?.target,
      policy?.method,
      policy?.income,
      policy?.institution,
      policy?.region,
      policy?.type,
      policy?.userType,
      policy?.serviceField,
      policy?.supportKind,
      ...(Array.isArray(policy?.tags) ? policy.tags : []),
    ]
      .filter(Boolean)
      .join(" ");
  }

  function groupsFromCodes(codes, labels) {
    if (!Array.isArray(codes)) return [];
    return unique(codes.map((code) => labels[code]));
  }

  function strongAgeGroups(policy) {
    const source = sourceText(policy);
    const headline = normalized([policy?.title, policy?.summary].join(" "));
    const groups = new Set();

    if (/임신·출산/.test(String(policy?.serviceField || "")) || infantSignalPattern.test(source)) {
      groups.add("영유아·출산");
    }
    if (
      childSignalPattern.test(source) ||
      (/장학금/.test(headline) && /초등|중등|고등|청소년|아동|어린이|학교/.test(source))
    ) {
      groups.add("아동·청소년");
    }
    if (
      groups.has("아동·청소년") &&
      childAgeOnlyPattern.test(source) &&
      broadAnyonePattern.test(source) &&
      !childSignalPattern.test(headline)
    ) {
      groups.delete("아동·청소년");
    }
    if (youthSignalPattern.test(source)) {
      groups.add("청년");
    }
    if (seniorSignalPattern.test(source) || (middleSignalPattern.test(source) && !broadAnyonePattern.test(source))) {
      groups.add("중장년·어르신");
    }

    return [...groups];
  }

  function strongTargetGroups(policy) {
    const source = sourceText(policy);
    const groups = new Set();

    if (/국가유공자|보훈|참전|독립유공|상이군경|고엽제|5\.?18|민주유공|보훈대상|유족|순직|의사상자|전몰|전상|무공수훈|참전유공/.test(source)) {
      groups.add("국가유공자·보훈");
    }
    if (/장애인|장애아|장애정도|발달장애|중증장애|장애수당|장애연금|장애인복지/.test(source)) {
      groups.add("장애인");
    }
    if (/소상공인|소공인|전통시장|시장상인|상인회|개인사업자|자영업|가맹점|상권|점포/.test(source)) {
      groups.add("소상공인");
    }
    if (/농업|농가|농민|어업|어민|임업|축산|귀농|귀어|농어업|농촌|어촌|경영체/.test(source)) {
      groups.add("농어업인");
    }
    if (/저소득|기초생활|수급자|차상위|한부모|취약계층|중위소득|생계급여|의료급여|주거급여|긴급복지/.test(source)) {
      groups.add("저소득층");
    }
    if (/신혼|혼인|결혼|예비부부|신혼부부|청년부부/.test(source)) {
      groups.add("신혼부부");
    }

    const foreignerPositive = /다문화|결혼이민|이주민|중도입국|난민|귀화|국적취득|새터민|북한이탈주민|외국인주민|등록외국인|외국국적동포|외국인\s*(?:포함|대상|지원|주민|유아|아동|청소년|근로|산모|임산부)/.test(source);
    const foreignerNegative = /외국인[^.\n\r]{0,80}(제외|불가|아님|미포함|제한)|외국국적[^.\n\r]{0,80}(제외|불가|아님)|대한민국\s*국적/.test(source);
    if (foreignerPositive || (/외국인/.test(source) && !foreignerNegative)) {
      groups.add("외국인·다문화");
    }

    return [...groups];
  }

  function finalAgeGroups(policy) {
    const groups = new Set([...groupsFromCodes(policy?.ageCodes, ageLabels), ...strongAgeGroups(policy)]);
    const source = sourceText(policy);
    const headline = normalized([policy?.title, policy?.summary].join(" "));

    if (
      groups.has("아동·청소년") &&
      childAgeOnlyPattern.test(source) &&
      broadAnyonePattern.test(source) &&
      !childSignalPattern.test(headline)
    ) {
      groups.delete("아동·청소년");
    }
    if (
      groups.has("중장년·어르신") &&
      broadAnyonePattern.test(source) &&
      !seniorSignalPattern.test(source) &&
      !/중장년|신중년|중년|장년|5060|4050/.test(source)
    ) {
      groups.delete("중장년·어르신");
    }

    return [...groups];
  }

  function finalTargetGroups(policy) {
    const groups = new Set([...groupsFromCodes(policy?.targetCodes, targetLabels), ...strongTargetGroups(policy)]);
    const source = sourceText(policy);
    if (
      groups.has("소상공인") &&
      /귀농|귀산촌|농업창업|농식품|농업인|농어업/.test(source) &&
      !/소상공인|소공인|전통시장|시장상인|상인회|개인사업자|자영업|가맹점|상권|점포/.test(source)
    ) {
      groups.delete("소상공인");
    }
    return [...groups];
  }

  window.policyAgeGroups = finalAgeGroups;
  window.policyTargetGroups = finalTargetGroups;
  try {
    policyAgeGroups = finalAgeGroups;
    policyTargetGroups = finalTargetGroups;
  } catch {}

  if (typeof renderCategory === "function") {
    [0, 500, 1500].forEach((delay) => setTimeout(renderCategory, delay));
  }
})();
