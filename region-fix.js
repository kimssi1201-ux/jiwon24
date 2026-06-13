(() => {
  if (document.body.dataset.page !== "category") return;

  const regionAliases = {
    서울: ["서울", "서울특별시"],
    경기: ["경기", "경기도", "수원", "성남", "고양", "용인", "부천", "화성", "남양주", "안양", "평택", "파주", "김포", "광명"],
    인천: ["인천", "인천광역시"],
    부산: ["부산", "부산광역시"],
    대구: ["대구", "대구광역시"],
    광주: ["광주", "광주광역시"],
    대전: ["대전", "대전광역시"],
    울산: ["울산", "울산광역시"],
    세종: ["세종", "세종특별자치시"],
    강원: ["강원", "강원특별자치도", "춘천", "원주", "강릉", "동해", "속초", "삼척"],
    충북: ["충북", "충청북도", "청주", "충주", "제천"],
    충남: ["충남", "충청남도", "천안", "공주", "아산", "서산", "논산", "계룡", "당진", "태안", "홍성"],
    전북: ["전북", "전라북도", "전북특별자치도", "전주", "군산", "익산", "정읍", "남원", "김제"],
    전남: ["전남", "전라남도", "목포", "여수", "순천", "나주", "광양"],
    경북: ["경북", "경상북도", "포항", "경주", "김천", "안동", "구미", "영주", "영천", "상주", "문경", "경산"],
    경남: ["경남", "경상남도", "창원", "진주", "통영", "사천", "김해", "밀양", "거제", "양산"],
    제주: ["제주", "제주특별자치도"],
  };

  const staticPolicies = Array.isArray(window.GG24_DATA?.policies) ? window.GG24_DATA.policies : [];

  function keyFor(policy) {
    return policy?.id || `${policy?.title || ""}-${policy?.institution || ""}`;
  }

  function mergePolicies(...lists) {
    const seen = new Set();
    return lists.flat().filter((policy) => {
      if (!policy) return false;
      const key = keyFor(policy);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function regionSource(policy) {
    return [
      policy?.region,
      policy?.institution,
      policy?.target,
      policy?.summary,
      policy?.method,
      (policy?.tags || []).join(" "),
    ]
      .filter(Boolean)
      .join(" ");
  }

  function aliasesFor(region) {
    return regionAliases[region] || [region];
  }

  function isNationalPolicy(policy) {
    return String(policy?.region || "").includes("전국");
  }

  function matchesRegion(policy, region) {
    if (region === "전체지역") return true;
    if (region === "전국") return isNationalPolicy(policy);
    if (isNationalPolicy(policy)) return true;

    const source = regionSource(policy);
    return aliasesFor(region).some((alias) => source.includes(alias));
  }

  function regionPriority(policy, region) {
    if (region === "전체지역" || region === "전국") return 0;
    if (isNationalPolicy(policy)) return 1;
    const source = regionSource(policy);
    if (aliasesFor(region).some((alias) => source.includes(alias))) return 0;
    return 2;
  }

  filteredPolicies = function filteredPoliciesWithRegionFallback() {
    const liveParams = new URLSearchParams(location.search);
    const type = liveParams.get("type") || "전체";
    const region = liveParams.get("region") || "전체지역";
    const age = liveParams.get("age") || "전체연령";
    const target = liveParams.get("target") || "전체대상";
    const query = (liveParams.get("q") || "").trim().toLowerCase();

    const list = policies.filter((policy) => {
      const typeMatch = type === "전체" || policy.type === type;
      const regionMatch = matchesRegion(policy, region);
      const ageMatch = age === "전체연령" || policyAgeGroups(policy).includes(age);
      const targetMatch = target === "전체대상" || policyTargetGroups(policy).includes(target);
      const queryMatch = !query || policySearchText(policy).includes(query);
      return typeMatch && regionMatch && ageMatch && targetMatch && queryMatch;
    });

    if (region !== "전체지역") {
      list.sort(
        (a, b) =>
          regionPriority(a, region) - regionPriority(b, region) ||
          (Number(b.views) || 0) - (Number(a.views) || 0),
      );
    }

    return list;
  };

  function renderMergedStaticPolicies() {
    policies = mergePolicies(policies, staticPolicies);
    renderCategory();
  }

  renderMergedStaticPolicies();
  [1200, 3500, 6500].forEach((delay) => {
    setTimeout(renderMergedStaticPolicies, delay);
  });

  fetch("/api/policies?pages=40&perPage=500&maxItems=12000", {
    headers: { Accept: "application/json" },
    cache: "no-store",
  })
    .then((response) => (response.ok ? response.json() : null))
    .then((liveData) => {
      if (Array.isArray(liveData?.policies) && liveData.policies.length) {
        policies = mergePolicies(liveData.policies, staticPolicies);
        renderCategory();
      }
    })
    .catch(() => undefined);
})();
