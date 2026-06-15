(() => {
  const WRAPPED_MARKER = "__gg24RegionLabelWrapped";

  function setText(element, value) {
    if (element.textContent.trim() !== value) {
      element.textContent = value;
    }
  }

  function relabelNationalRegion() {
    document.querySelectorAll('a[href*="region=%EC%A0%84%EA%B5%AD"], a[href*="region=전국"]').forEach((link) => {
      const text = link.textContent.trim();
      if (text === "전국" || text === "전국 지원금") setText(link, "전국공통");
    });

    document.querySelectorAll('[data-region-filter="전국"]').forEach((link) => {
      setText(link, "전국공통");
    });

    const title = document.querySelector("#categoryTitle");
    if (title?.textContent?.trim() === "전국 정보") {
      setText(title, "전국공통 정보");
    }
  }

  function relabelGwangjuRegion() {
    document.querySelectorAll('a[href*="region=%EA%B4%91%EC%A3%BC"], a[href*="region=광주"]').forEach((link) => {
      const text = link.textContent.trim();
      if (text === "광주" || text === "광주 지원금") setText(link, text.replace("광주", "광주광역시"));
    });

    document.querySelectorAll('[data-region-filter="광주"]').forEach((link) => {
      setText(link, "광주광역시");
    });

    const title = document.querySelector("#categoryTitle");
    if (title?.textContent?.trim() === "광주 정보") {
      setText(title, "광주광역시 정보");
    }
  }

  function relabelRegions() {
    relabelNationalRegion();
    relabelGwangjuRegion();
  }

  function wrapRenderCategory() {
    if (typeof window.renderCategory !== "function" || window.renderCategory[WRAPPED_MARKER]) return;
    const previousRenderCategory = window.renderCategory;
    window.renderCategory = function renderCategoryWithStableRegionLabels(...args) {
      const result = previousRenderCategory.apply(this, args);
      relabelRegions();
      return result;
    };
    window.renderCategory[WRAPPED_MARKER] = true;
  }

  wrapRenderCategory();
  relabelRegions();
  document.addEventListener("DOMContentLoaded", () => {
    wrapRenderCategory();
    relabelRegions();
  });
})();
