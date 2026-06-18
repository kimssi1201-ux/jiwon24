(() => {
  if (document.body.dataset.page !== "policy") return;

  const toast = document.querySelector("#toast");
  const KAKAO_SDK_SRC = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.6/kakao.min.js";
  const SITE_KAKAO_JS_KEY = "";
  let kakaoSdkPromise = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

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

  function injectDetailStyle() {
    if (document.querySelector("#policy-detail-enhance-style")) return;
    const style = document.createElement("style");
    style.id = "policy-detail-enhance-style";
    style.textContent = `
      body[data-page="policy"] .detail-card { font-size: 17px; }
      body[data-page="policy"] .detail-head h1 { font-size: clamp(32px, 8.4vw, 46px); line-height: 1.15; }
      body[data-page="policy"] .detail-head p { font-size: 18px; line-height: 1.72; font-weight: 850; }
      body[data-page="policy"] .detail-actions .primary-button,
      body[data-page="policy"] .detail-actions .ghost-button,
      body[data-page="policy"] .detail-share .ghost-button { min-height: 50px; font-size: 16px; font-weight: 900; }
      body[data-page="policy"] .detail-share .share-button { border-color: #fee500; background: #fee500; color: #111827; }
      body[data-page="policy"] .detail-share .share-button::before { content: none; display: none; }
      body[data-page="policy"] .detail-section h2 { font-size: 23px; }
      body[data-page="policy"] .detail-section p { font-size: 17px; line-height: 1.85; }
      body[data-page="policy"] .detail-highlight strong,
      body[data-page="policy"] .detail-row dd { font-size: 17px; line-height: 1.65; }
      body[data-page="policy"] .detail-tags { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 2px; }
      body[data-page="policy"] .detail-tags span { border-radius: 999px; background: #eff6ff; color: #1d4ed8; padding: 7px 10px; font-size: 14px; font-weight: 900; line-height: 1; }
      body[data-page="policy"] .detail-guide { border: 1px solid #dbeafe; border-radius: 16px; background: #f8fbff; padding: 18px; }
      body[data-page="policy"] .detail-lead { margin: 0; color: #111827; font-size: 18px; font-weight: 850; line-height: 1.78; }
      body[data-page="policy"] .detail-list { display: grid; gap: 10px; margin: 14px 0 0; padding: 0; list-style: none; }
      body[data-page="policy"] .detail-list li { display: grid; gap: 5px; border: 1px solid #e5e7eb; border-radius: 14px; background: #fff; padding: 14px; }
      body[data-page="policy"] .detail-list strong { color: #1d4ed8; font-size: 14px; font-weight: 950; }
      body[data-page="policy"] .detail-list span { color: #111827; font-size: 17px; font-weight: 800; line-height: 1.62; word-break: keep-all; overflow-wrap: anywhere; }
    `;
    document.head.appendChild(style);
  }

  function textOf(selector) {
    return document.querySelector(selector)?.textContent?.replace(/\s+/g, " ").trim() || "";
  }

  function highlightValue(label) {
    const rows = [...document.querySelectorAll(".detail-highlight")];
    const row = rows.find((item) => item.querySelector("span")?.textContent?.includes(label));
    return row?.querySelector("strong")?.textContent?.replace(/\s+/g, " ").trim() || "";
  }

  function shareText() {
    const title = textOf(".detail-head h1") || document.title;
    const summary = textOf(".detail-head p") || "지원금 올데이에서 정책 정보를 확인해 보세요.";
    return { title, text: summary, url: location.href };
  }

  function kakaoShareText(data) {
    const text = `${data.title}\n${data.text}`.replace(/\s+/g, " ").trim();
    return text.length > 200 ? `${text.slice(0, 197)}...` : text;
  }

  function kakaoShareImageUrl() {
    return "https://jiwon24.pages.dev/assets/app-icon-512.png?v=1";
  }

  function kakaoKey() {
    return (
      SITE_KAKAO_JS_KEY ||
      window.GG24_KAKAO_JS_KEY ||
      window.KAKAO_JS_KEY ||
      document.querySelector('meta[name="kakao-js-key"]')?.content ||
      localStorage.getItem("KAKAO_JS_KEY") ||
      ""
    ).trim();
  }

  function loadKakaoSdk() {
    if (window.Kakao?.Share) return Promise.resolve(window.Kakao);
    if (kakaoSdkPromise) return kakaoSdkPromise;

    kakaoSdkPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${KAKAO_SDK_SRC}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve(window.Kakao), { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = KAKAO_SDK_SRC;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.onload = () => resolve(window.Kakao);
      script.onerror = reject;
      document.head.appendChild(script);
    });

    return kakaoSdkPromise;
  }

  async function copyShareUrl(data, message = "링크를 복사했어요.") {
    await navigator.clipboard.writeText(data.url);
    showMessage(message);
  }

  async function nativeShareOrCopy(data) {
    if (navigator.share) {
      await navigator.share({ title: data.title, text: data.text, url: data.url });
      return true;
    }
    await copyShareUrl(data, "링크를 복사했어요. 카카오톡에 붙여넣어 공유할 수 있어요.");
    return false;
  }

  async function sendKakaoShare(data) {
    const key = kakaoKey();
    if (!key) {
      return nativeShareOrCopy(data);
    }

    const Kakao = await loadKakaoSdk();
    if (!Kakao?.isInitialized?.()) Kakao.init(key);

    Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title: data.title || "지원금 올데이",
        description: kakaoShareText(data),
        imageUrl: kakaoShareImageUrl(),
        link: {
          mobileWebUrl: data.url,
          webUrl: data.url,
        },
      },
      buttons: [
        {
          title: "정책 보기",
          link: {
            mobileWebUrl: data.url,
            webUrl: data.url,
          },
        },
      ],
      installTalk: true,
    });

    return true;
  }

  function ensureShareButtons() {
    const head = document.querySelector(".detail-head");
    if (!head) return;

    head.querySelectorAll("[data-share-policy]").forEach((button) => {
      if (button.textContent.trim() !== "💬 카카오톡 공유") {
        button.textContent = "💬 카카오톡 공유";
      }
    });

    if (head.querySelector(".detail-share")) return;
    const row = document.createElement("div");
    row.className = "detail-share";
    row.setAttribute("aria-label", "정책 공유");
    row.innerHTML = `
      <button class="ghost-button share-button" type="button" data-share-policy>💬 카카오톡 공유</button>
      <button class="ghost-button copy-button" type="button" data-copy-link>🔗 링크복사</button>
    `;
    head.appendChild(row);
  }

  function ensureActionEmojis() {
    document.querySelectorAll("[data-copy-link]").forEach((button) => {
      if (button.textContent.trim() !== "🔗 링크복사") {
        button.textContent = "🔗 링크복사";
      }
    });

    document.querySelectorAll(".detail-actions .primary-button").forEach((button) => {
      if (button.textContent.trim() !== "📝 신청하기") {
        button.textContent = "📝 신청하기";
      }
    });

    document.querySelectorAll(".detail-actions .ghost-button").forEach((button) => {
      if (button.textContent.trim() !== "📋 목록 보기") {
        button.textContent = "📋 목록 보기";
      }
    });
  }

  function ensureTags() {
    const head = document.querySelector(".detail-head");
    const summary = textOf(".detail-head p");
    if (!head || head.querySelector(".detail-tags")) return;

    const baseTags = [...document.querySelectorAll(".meta-row .badge")].map((badge) => badge.textContent.trim());
    const region = highlightValue("거주지") || highlightValue("지역");
    const target = highlightValue("지원대상");
    const tags = [...baseTags, region, target]
      .flatMap((value) => String(value || "").split(/[,·#]/))
      .map((value) => value.trim())
      .filter((value) => value && value.length <= 12 && !summary.includes(`${value} `));
    const uniqueTags = [...new Set(tags)].slice(0, 6);
    if (!uniqueTags.length) return;

    const tagBox = document.createElement("div");
    tagBox.className = "detail-tags";
    tagBox.setAttribute("aria-label", "정책 키워드");
    tagBox.innerHTML = uniqueTags.map((tag) => `<span>#${escapeHtml(tag)}</span>`).join("");
    const actions = head.querySelector(".detail-actions");
    head.insertBefore(tagBox, actions || null);
  }

  function ensureGuide() {
    const overview = document.querySelector(".detail-overview");
    if (!overview || document.querySelector(".detail-guide")) return;

    const summary = textOf(".detail-head p") || "정책의 주요 조건과 신청 방법을 확인할 수 있습니다.";
    const benefit = textOf(".benefit-summary strong") || "기관 문의";
    const target = highlightValue("지원대상") || "공고 확인";
    const method = highlightValue("신청방법") || "관할 기관 안내 확인";
    const institution = highlightValue("지원기관") || "관할 기관";

    const guide = document.createElement("section");
    guide.className = "detail-section detail-guide";
    guide.innerHTML = `
      <h2>이 정책에서 확인할 내용</h2>
      <p class="detail-lead">${escapeHtml(summary)}</p>
      <ul class="detail-list">
        <li><strong>받을 수 있는 혜택</strong><span>${escapeHtml(benefit)}</span></li>
        <li><strong>대상 조건</strong><span>${escapeHtml(target)}</span></li>
        <li><strong>신청 안내</strong><span>${escapeHtml(method)} · 신청 전 ${escapeHtml(institution)}의 최신 공고를 확인하세요.</span></li>
      </ul>
    `;
    overview.insertAdjacentElement("afterend", guide);
  }

  function enhanceDetail() {
    injectDetailStyle();
    ensureShareButtons();
    ensureActionEmojis();
    ensureTags();
    ensureGuide();
  }

  document.addEventListener("click", async (event) => {
    const shareButton = event.target.closest("[data-share-policy]");
    const copyButton = event.target.closest("[data-copy-link]");
    if (!shareButton && !copyButton) return;

    const data = shareText();
    try {
      if (shareButton) {
        const sent = await sendKakaoShare(data);
        if (sent) return;
        return;
      }
      if (copyButton) {
        await copyShareUrl(data);
        return;
      }
    } catch (error) {
      if (error?.name !== "AbortError") showMessage("주소창의 링크를 복사해 주세요.");
    }
  });

  const detail = document.querySelector("#policyDetail");
  if (detail) {
    let pendingEnhance = false;
    const observer = new MutationObserver(() => {
      if (pendingEnhance) return;
      pendingEnhance = true;
      requestAnimationFrame(() => {
        pendingEnhance = false;
        enhanceDetail();
      });
    });
    observer.observe(detail, { childList: true });
  }
  enhanceDetail();
  [150, 600, 1500, 3500].forEach((delay) => setTimeout(enhanceDetail, delay));
})();
