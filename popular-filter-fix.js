(() => {
  if (document.body.dataset.page !== "category") return;

  function removePopularFilter() {
    document.querySelectorAll(".filter-summary-row .summary-popular").forEach((element) => element.remove());
  }

  removePopularFilter();

  const hero = document.querySelector(".category-hero");
  if (!hero) return;

  const observer = new MutationObserver(removePopularFilter);
  observer.observe(hero, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), 12000);
})();
