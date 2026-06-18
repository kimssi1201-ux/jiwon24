(() => {
  if (document.body.dataset.page !== "policy") return;

  const toast = document.querySelector("#toast");

  function showMessage(message) {
    if (typeof showToast === "function") {
      showToast(message);
      return;
    }
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(showMessage.timer);
    showMessage.timer = setTimeout(() => {
      toast.hidden = true;
    }, 2200);
  }

  function shareText() {
    const title = document.querySelector(".detail-head h1")?.textContent?.trim() || document.title;
    const summary = document.querySelector(".detail-head p")?.textContent?.trim() || "지원금 올데이에서 정책 정보를 확인해 보세요.";
    return { title, text: summary, url: location.href };
  }

  function ensureShareButtons() {
    const head = document.querySelector(".detail-head");
    if (!head || head.querySelector(".detail-share")) return;
    const row = document.createElement("div");
    row.className = "detail-share";
    row.setAttribute("aria-label", "정책 공유");
    row.innerHTML = `
      <button class="ghost-button share-button" type="button" data-share-policy>공유하기</button>
      <button class="ghost-button copy-button" type="button" data-copy-link>링크복사</button>
    `;
    head.appendChild(row);
  }

  document.addEventListener("click", async (event) => {
    const shareButton = event.target.closest("[data-share-policy]");
    const copyButton = event.target.closest("[data-copy-link]");
    if (!shareButton && !copyButton) return;

    const data = shareText();
    try {
      if (shareButton && navigator.share) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(data.url);
      showMessage("링크를 복사했어요.");
    } catch (error) {
      if (error?.name !== "AbortError") showMessage("주소창의 링크를 복사해 주세요.");
    }
  });

  const detail = document.querySelector("#policyDetail");
  if (detail) new MutationObserver(ensureShareButtons).observe(detail, { childList: true, subtree: true });
  ensureShareButtons();
  [150, 600, 1500, 3500].forEach((delay) => setTimeout(ensureShareButtons, delay));
})();
