(() => {
  const image = document.querySelector('[data-hero-phone="main"]');
  if (!image || !window.fetch) return;

  const chunks = ["01", "02", "03", "04", "05", "06", "07", "08", "09"];
  const basePath = "assets/hero-phone-hq-";
  Promise.all(
    chunks.map((chunk) =>
      fetch(basePath + chunk + ".txt?v=1", { cache: "force-cache" }).then((response) =>
        response.ok ? response.text() : "",
      ),
    ),
  )
    .then((parts) => {
      const payload = parts.join("").replace(/\s/g, "");
      if (payload.length < 10000) return;
      const highQuality = new Image();
      highQuality.decoding = "async";
      highQuality.onload = () => {
        image.src = highQuality.src;
        image.classList.add("is-hq-loaded");
      };
      highQuality.src = "data:image/jpeg;base64," + payload;
    })
    .catch(() => undefined);
})();