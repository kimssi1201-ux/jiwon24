(() => {
  const standalone =
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator?.standalone === true ||
    new URLSearchParams(location.search).get("source") === "pwa";
  const isIos = /iphone|ipad|ipod/i.test(window.navigator?.userAgent || "");
  const bar = document.querySelector(".promo-bar");
  let installPrompt = null;

  const style = document.createElement("style");
  style.textContent = `
    .app-install-button {
      min-height: 30px;
      border: 1px solid rgba(255, 255, 255, 0.42);
      border-radius: 999px;
      background: #ffffff;
      color: #132026;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 900;
      white-space: nowrap;
    }

    .app-install-button[hidden],
    body.is-standalone .promo-bar {
      display: none !important;
    }

    body.is-standalone .site-header {
      top: 0;
    }
  `;
  document.head.append(style);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => undefined);
  }

  if (standalone) {
    document.body.classList.add("is-standalone");
  }

  function notify(message) {
    if (typeof window.showToast === "function") {
      window.showToast(message);
      return;
    }
    const toast = document.querySelector("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => {
      toast.hidden = true;
    }, 2600);
  }

  if (!bar || standalone) return;

  const installButton = document.createElement("button");
  installButton.type = "button";
  installButton.className = "app-install-button";
  installButton.hidden = true;
  installButton.textContent = "앱 설치";
  bar.append(installButton);

  function showInstallButton(label = "앱 설치") {
    installButton.textContent = label;
    installButton.hidden = false;
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    showInstallButton("앱 설치");
  });

  if (isIos) {
    window.setTimeout(() => showInstallButton("홈화면 추가"), 1000);
  }

  installButton.addEventListener("click", async () => {
    if (installPrompt) {
      installPrompt.prompt();
      await installPrompt.userChoice.catch(() => undefined);
      installPrompt = null;
      installButton.hidden = true;
      return;
    }
    notify("공유 버튼에서 홈 화면에 추가를 선택하면 앱처럼 열립니다.");
  });

  window.addEventListener("appinstalled", () => {
    installButton.hidden = true;
    document.body.classList.add("is-standalone");
    notify("지원금 올데이가 홈화면에 추가되었습니다.");
  });

  navigator.serviceWorker?.ready
    .then((registration) => {
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            notify("새 버전으로 업데이트되었습니다.");
          }
        });
      });
    })
    .catch(() => undefined);
})();
