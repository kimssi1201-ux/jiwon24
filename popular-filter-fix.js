(() => {
  if (document.body.dataset.page !== "category") return;

  function removePopularFilter() {
    document.querySelectorAll(".filter-summary-row .summary-popular").forEach((element) => element.remove());
  }

  removePopularFilter();
  new MutationObserver(removePopularFilter).observe(document.body, { childList: true, subtree: true });
})();
