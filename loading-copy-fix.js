(() => {
  const LOADING_COPY = "조건에 맞는 정책을 찾고 있습니다";
  const LOADING_PATTERNS = [
    /최신 정책 정보를 불러오고 있습니다/,
    /검색 결과를 불러오고 있습니다/,
    /조건에 맞는 정책을 불러오고 있습니다/,
    /정책 정보를 불러오는 중입니다/,
  ];

  function shouldReplace(text) {
    return LOADING_PATTERNS.some((pattern) => pattern.test(String(text || "").trim()));
  }

  function applyLoadingCopy() {
    document.querySelectorAll(".empty-card").forEach((element) => {
      if (shouldReplace(element.textContent)) element.textContent = LOADING_COPY;
    });
  }

  if (typeof renderCategory === "function" && !window.GG24_LOADING_COPY_RENDER_PATCHED) {
    const previousRenderCategory = renderCategory;
    renderCategory = function renderCategoryWithLoadingCopy(...args) {
      const result = previousRenderCategory(...args);
      applyLoadingCopy();
      return result;
    };
    window.renderCategory = renderCategory;
    window.GG24_LOADING_COPY_RENDER_PATCHED = true;
  }

  applyLoadingCopy();
  const observer = new MutationObserver(applyLoadingCopy);
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
})();
