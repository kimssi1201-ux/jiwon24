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

      .mobile-search-panel {
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

        .mobile-search-panel {
          position: fixed;
          left: 14px;
          right: 14px;
          top: 64px;
          z-index: 75;
          min-height: 50px;
          align-items: center;
          gap: 8px;
          border: 1px solid #d8dee8;
          border-radius: 10px;
          background: #ffffff;
          padding: 7px 8px 7px 14px;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.16);
        }

        body[data-page="category"].mobile-search-open .mobile-search-panel {
          display: flex;
        }

        .mobile-search-panel input {
          min-width: 0;
          flex: 1 1 auto;
          border: 0;
          outline: 0;
          color: #111827;
          font-size: 16px;
          font-weight: 850;
        }

        .mobile-search-panel input::placeholder {
          color: #8c95a3;
        }

        .mobile-search-panel button {
          width: 42px;
          min-height: 38px;
          flex: 0 0 42px;
          border: 0;
          border-radius: 8px;
          background: #111827;
          color: #ffffff;
          font-size: 13px;
          font-weight: 950;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function searchUrl(query) {
    const current = new URLSearchParams(location.search);
    const next = new URLSearchParams();
    ["type", "region", "age", "target", "deadline", "mode"].forEach((key) => {
      const value = current.get(key);
      if (value) next.set(key, value);
    });
    if (query) next.set("q", query);
    const queryString = next.toString();
    return queryString ? `category.html?${queryString}` : "category.html";
  }

  function currentQuery() {
    return (
      new URLSearchParams(location.search).get("q") ||
      document.querySelector("#categorySearchInput")?.value ||
      ""
    ).trim();
  }

  function ensurePanel() {
    let panel = document.querySelector(".mobile-search-panel");
    if (panel) return panel;
    panel = document.createElement("form");
    panel.className = "mobile-search-panel";
    panel.setAttribute("role", "search");

    const label = document.createElement("label");
    label.className = "sr-only";
    label.setAttribute("for", "mobileHeaderSearchInput");
    label.textContent = "\uC815\uCC45 \uAC80\uC0C9";

    const input = document.createElement("input");
    input.id = "mobileHeaderSearchInput";
    input.type = "search";
    input.placeholder = "\uAC80\uC0C9\uC5B4\uB97C \uC785\uB825\uD558\uC138\uC694";
    input.autocomplete = "off";

    const submit = document.createElement("button");
    submit.type = "submit";
    submit.setAttribute("aria-label", "\uAC80\uC0C9");
    submit.textContent = "\uAC80\uC0C9";

    panel.append(label, input, submit);
    panel.addEventListener("submit", (event) => {
      event.preventDefault();
      const query = panel.querySelector("input")?.value.trim() || "";
      location.href = searchUrl(query);
    });
    document.body.appendChild(panel);
    return panel;
  }

  function openMobileSearch() {
    const panel = ensurePanel();
    document.body.classList.add("mobile-search-open");
    const input = panel.querySelector("input");
    if (input && !input.value) input.value = currentQuery();
    window.setTimeout(() => input?.focus({ preventScroll: true }), 60);
  }

  function ensureButton() {
    const header = document.querySelector(".header-inner");
    if (!header || header.querySelector(".mobile-header-search-action")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mobile-header-search-action";
    button.setAttribute("aria-label", "\uC815\uCC45 \uAC80\uC0C9 \uC5F4\uAE30");
    button.addEventListener("click", openMobileSearch);
    header.appendChild(button);
  }

  injectStyle();
  ensurePanel();
  ensureButton();

  if (new URLSearchParams(location.search).get("focusSearch") === "1") {
    window.setTimeout(openMobileSearch, 250);
  }
})();
