(() => {
  const state = {
    mode: "pregnancy",
    lastResult: null,
  };

  const modeButtons = document.querySelectorAll(".mode-btn");
  const startScanBtn = document.getElementById("start-scan-btn");
  const stopScanBtn = document.getElementById("stop-scan-btn");
  const manualForm = document.getElementById("manual-form");
  const barcodeInput = document.getElementById("barcode-input");
  const resultsEl = document.getElementById("results");

  let scanner = null;

  modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.mode = btn.dataset.mode;
      modeButtons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      if (state.lastResult) renderResult(state.lastResult);
    });
  });

  startScanBtn.addEventListener("click", startCameraScan);
  stopScanBtn.addEventListener("click", stopCameraScan);

  manualForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const barcode = barcodeInput.value.trim();
    if (!barcode) return;
    fetchScan(barcode);
  });

  function startCameraScan() {
    if (typeof Html5Qrcode === "undefined") {
      renderError("Camera scanning library failed to load. Use manual entry below.");
      return;
    }
    scanner = new Html5Qrcode("reader");
    startScanBtn.classList.add("hidden");
    stopScanBtn.classList.remove("hidden");

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          fetchScan(decodedText);
          stopCameraScan();
        },
        () => {} // ignore per-frame scan failures
      )
      .catch((err) => {
        renderError("Couldn't access the camera. You can still use manual entry below.");
        console.error(err);
        stopCameraScan();
      });
  }

  function stopCameraScan() {
    startScanBtn.classList.remove("hidden");
    stopScanBtn.classList.add("hidden");
    if (scanner) {
      scanner.stop().catch(() => {});
      scanner.clear();
      scanner = null;
    }
  }

  async function fetchScan(barcode) {
    renderLoading();
    try {
      const res = await fetch(`/api/scan/${encodeURIComponent(barcode)}`);
      if (res.status === 400) {
        renderError("That doesn't look like a valid barcode.");
        return;
      }
      if (!res.ok) {
        renderError("Something went wrong looking up that product. Try again.");
        return;
      }
      const data = await res.json();
      state.lastResult = data;
      renderResult(data);
    } catch (err) {
      console.error(err);
      renderError("Network error — check your connection and try again.");
    }
  }

  function renderLoading() {
    resultsEl.classList.remove("hidden");
    resultsEl.innerHTML = `<div class="card loading">Looking up product…</div>`;
  }

  function renderError(message) {
    resultsEl.classList.remove("hidden");
    resultsEl.innerHTML = `<div class="card verdict-avoid"><p>${escapeHtml(message)}</p></div>`;
  }

  function renderResult(data) {
    resultsEl.classList.remove("hidden");

    if (!data.found) {
      resultsEl.innerHTML = `
        <div class="card verdict-unknown">
          <h2>Product not found</h2>
          <p>We couldn't find this barcode in Open Food Facts, so we have no ingredient data to check.</p>
        </div>`;
      return;
    }

    const verdict = data.overall[state.mode];
    const verdictLabel = { safe: "Safe", caution: "Caution", avoid: "Avoid", unknown: "Unknown" }[verdict];

    const flaggedHtml = data.flagged.length
      ? data.flagged
          .map((f) => {
            const v = f[state.mode];
            return `
              <li class="ingredient-item verdict-${v.verdict}">
                <span class="ingredient-name">${escapeHtml(prettifyId(f.ingredient))}</span>
                <span class="ingredient-verdict">${escapeHtml(v.verdict)}</span>
                <p class="ingredient-reason">${escapeHtml(v.reason)}</p>
              </li>`;
          })
          .join("")
      : `<li class="ingredient-item">No ingredients in this product matched our safety dataset.</li>`;

    resultsEl.innerHTML = `
      <div class="card verdict-${verdict}">
        <div class="product-header">
          ${data.product.image ? `<img src="${escapeHtml(data.product.image)}" alt="" class="product-image" />` : ""}
          <div>
            <h2>${escapeHtml(data.product.name)}</h2>
            ${data.product.brand ? `<p class="product-brand">${escapeHtml(data.product.brand)}</p>` : ""}
          </div>
        </div>
        <div class="verdict-badge">${verdictLabel} <span class="verdict-mode">(${state.mode})</span></div>
        <ul class="ingredient-list">${flaggedHtml}</ul>
      </div>`;
  }

  function prettifyId(id) {
    return id.replace(/-/g, " ");
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
})();
