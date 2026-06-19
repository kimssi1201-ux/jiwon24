(() => {
  if (document.body.dataset.page !== "category") return;
  if (window.GG24_REPEAT_SEARCH_RESET_FIX_VERSION) return;
  window.GG24_REPEAT_SEARCH_RESET_FIX_VERSION = "1";

  function cleanSearchUrl(query) {
    const trimmed = String(query || "").trim();
    if (!trimmed) return "category.html";
    const params = new URLSearchParams();
    params.set("q", trimmed);
    return `category.html?${params.toString()}`;
  }

  function formQuery(form) {
    return (
      form.querySelector("input[type='search']")?.value ||
      form.querySelector("input")?.value ||
      ""
    ).trim();
  }

  function isPolicySearchForm(form) {
    return Boolean(
      form?.matches?.("#categorySearch, #siteSearch, .mobile-search-panel") ||
      form?.querySelector?.("#categorySearchInput, #globalSearch, #mobileHeaderSearchInput"),
    );
  }

  document.addEventListener(
    "submit",
    (event) => {
      const form = event.target;
      if (!isPolicySearchForm(form)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      location.href = cleanSearchUrl(formQuery(form));
    },
    true,
  );

  function patchMobileSearchUrl() {
    if (typeof window.searchUrl === "function") {
      window.searchUrl = cleanSearchUrl;
    }
  }

  patchMobileSearchUrl();
  [100, 400, 1000, 2000].forEach((delay) => window.setTimeout(patchMobileSearchUrl, delay));
})();
