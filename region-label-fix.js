(() => {
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

  relabelNationalRegion();
  document.addEventListener("DOMContentLoaded", relabelNationalRegion);

  const observer = new MutationObserver(relabelNationalRegion);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
