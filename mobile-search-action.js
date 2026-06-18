(() => {
  if (document.body.dataset.page !== "category") return;

  function injectStyle() {
    if (document.querySelector("#mobile-search-action-style")) return;
    const style = document.createElement("style");
    style.id = "mobile-search-action-style";
    style.textContent = `
      .mobile-header-search-action {
        display: none;
      }

      @media (max-width: 759px) {
        .mobile-header-search-action {
          position: absolute;
          left: 6px;
          top: 50%;
          z-index: 5;
          width: 54px;
          height: 54px;
          display: block;
          transform: translateY(-50%);
          border: 0;
          border-radius: 50%;
          background: transparent;
          color: transparent;
        }

        body[data-page="category"].mobile-search-open .category-hero .search-box {
          display: flex;
          margin: 2px 0 8px;
        }

        body[data-page="category"].mobile-search-open .category-hero {
          gap: 10px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function openMobileSearch() {
    document.body.classList.add("mobile-search-open");
    const input = document.querySelector("#categorySearchInput");
    const box = document.querySelector("#categorySearch");
    if (!input || !box) {
      location.href = "category.html?focusSearch=1";
      return;
    }
    box.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => input.focus({ preventScroll: true }), 180);
  }

  function ensureButton() {
    const header = document.querySelector(".header-inner");
    if (!header || header.querySelector(".mobile-header-search-action")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mobile-header-search-action";
    button.setAttribute("aria-label", "정책 검색 열기");
    button.addEventListener("click", openMobileSearch);
    header.appendChild(button);
  }

  injectStyle();
  ensureButton();

  if (new URLSearchParams(location.search).get("focusSearch") === "1") {
    window.setTimeout(openMobileSearch, 250);
  }
})();
