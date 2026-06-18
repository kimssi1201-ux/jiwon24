(() => {
  if (document.body.dataset.page !== "policy") return;

  const searchForm = document.querySelector("#siteSearch");
  if (searchForm) {
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = searchForm.querySelector('input[type="search"]');
      const query = String(input?.value || "").trim();
      const target = query ? `category.html?q=${encodeURIComponent(query)}` : "category.html";
      location.href = target;
    });
  }

  window.showToast =
    window.showToast ||
    ((message) => {
      const toast = document.querySelector("#toast");
      if (!toast) return;
      toast.textContent = message;
      toast.hidden = false;
      clearTimeout(window.showToast.timer);
      window.showToast.timer = setTimeout(() => {
        toast.hidden = true;
      }, 2200);
    });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
