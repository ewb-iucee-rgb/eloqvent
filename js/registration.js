/**
 * ELOQVENT 2K26 - High-Performance Registration Controller
 * Features: Background Pre-Compression, Zero-Delay Submit, CORS-Safe Fetch
 */

document.addEventListener("DOMContentLoaded", () => {
  initRegistrationSystem();
  if (window.lucide) window.lucide.createIcons();
});

let compressedScreenshotBase64 = null;
let compressionPromise = null;

const PERSONAL_FIELD_IDS = {
  name: "reg-name",
  email: "reg-email",
  mobile: "reg-mobile",
  college: "reg-college",
  rollNumber: "reg-roll-number",
  year: "reg-year",
  branch: "reg-branch"
};

function initRegistrationSystem() {
  const modal = document.getElementById("registration-modal");
  const closeBtn = document.getElementById("reg-modal-close");
  const backdrop = document.getElementById("reg-modal-backdrop");
  const form = document.getElementById("registration-form");
  const successState = document.getElementById("reg-success-state");
  const trackSelect = document.getElementById("reg-track-select");
  const personalDetails = document.getElementById("personal-details-section");
  const paymentSection = document.getElementById("payment-section");
  const submitBtn = document.getElementById("reg-submit-btn");
  const qr = document.getElementById("payment-qr");
  const qrFallback = document.getElementById("payment-qr-fallback");
  const paymentFile = document.getElementById("reg-payment-screenshot");
  const paymentPreviewWrap = document.getElementById("payment-preview-wrap");
  const paymentPreview = document.getElementById("payment-preview");
  const paymentError = document.getElementById("reg-form-error");
  const amount = document.getElementById("reg-total-amount");
  const category = document.getElementById("reg-fee-category");
  const feePerPerson = document.getElementById("reg-fee-per-person");
  let requestId = "";

  if (!modal || !form) return;

  if (qr) {
    qr.src = window.ELOQVENT_CONFIG?.sheets?.paymentQrImage || "photos/payment-qr.jpeg";
    qr.addEventListener("error", () => {
      qr.classList.add("hidden");
      qrFallback?.classList.remove("hidden");
    });
  }

  window.openRegistrationModal = function (preselect = "") {
    resetRegistrationForm();
    requestId = createRequestId();
    if (preselect && trackSelect) {
      const normalized = preselect.toLowerCase();
      const option = Array.from(trackSelect.options).find((o) => o.value.toLowerCase().includes(normalized));
      if (option) trackSelect.value = option.value;
    }
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    syncRegistrationSteps();
    if (window.lucide) window.lucide.createIcons();
  };

  window.closeRegistrationModal = function () {
    modal.classList.add("hidden");
    document.body.style.overflow = "auto";
  };

  document.querySelectorAll("[data-open-register]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      window.openRegistrationModal(btn.getAttribute("data-track") || "");
    });
  });

  closeBtn?.addEventListener("click", window.closeRegistrationModal);
  backdrop?.addEventListener("click", window.closeRegistrationModal);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) window.closeRegistrationModal();
  });

  trackSelect?.addEventListener("change", syncRegistrationSteps);

  // BACKGROUND PRE-COMPRESSION PIPELINE
  paymentFile?.addEventListener("change", () => {
    const file = paymentFile.files?.[0];
    compressedScreenshotBase64 = null;
    compressionPromise = null;

    if (!file) {
      paymentPreviewWrap.classList.add("hidden");
      paymentPreview.removeAttribute("src");
      return;
    }

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      showError("Choose a JPG, PNG, or WebP image.");
      paymentFile.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showError("Payment screenshot must be 10 MB or smaller.");
      paymentFile.value = "";
      return;
    }

    clearError();
    if (paymentPreview.src.startsWith("blob:")) URL.revokeObjectURL(paymentPreview.src);
    paymentPreview.src = URL.createObjectURL(file);
    paymentPreviewWrap.classList.remove("hidden");

    // Asynchronously kick off compression in background while user fills remaining form fields
    compressionPromise = fastCompressImage(file)
      .then((b64) => {
        compressedScreenshotBase64 = b64;
        return b64;
      })
      .catch((err) => {
        console.error("Image compression error:", err);
        showError("Could not process the payment screenshot. Please choose another image.");
      });
  });

  // SUBMISSION PIPELINE
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();
    if (!form.reportValidity()) return;

    const event = trackSelect.value;
    const participant = collectParticipant();
    const utr = document.getElementById("reg-reference-id").value.trim();
    const webAppUrl = window.ELOQVENT_CONFIG?.sheets?.webAppUrl?.trim();

    if (!event || Object.values(participant).some((value) => !value)) {
      showError("Select an event and complete every personal detail.");
      return;
    }

    if (!/^[A-Za-z0-9-]{6,35}$/.test(utr)) {
      showError("Enter a valid UPI transaction reference (6–35 characters).");
      return;
    }

    const file = paymentFile.files?.[0];
    if (!file) {
      showError("Upload your payment screenshot to continue.");
      return;
    }

    if (!webAppUrl || !/^https:\/\/script\.google\.com\//.test(webAppUrl)) {
      showError("Registration backend is currently not configured. Please contact an organizer.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Processing submission...";

    try {
      // If user submitted before background compression completed, await it now
      if (!compressedScreenshotBase64 && compressionPromise) {
        submitBtn.textContent = "Finalizing screenshot...";
        await compressionPromise;
      } else if (!compressedScreenshotBase64) {
        submitBtn.textContent = "Preparing payment proof...";
        compressedScreenshotBase64 = await fastCompressImage(file);
      }

      if (!compressedScreenshotBase64) {
        throw new Error("Payment screenshot could not be processed. Please re-upload.");
      }

      const payload = {
        requestId,
        event,
        ...participant,
        feePerPerson: Number(feePerPerson.textContent.replace(/[^0-9]/g, "")),
        expectedAmount: Number(amount.textContent.replace(/[^0-9]/g, "")),
        utr,
        paymentScreenshot: compressedScreenshotBase64,
        website: document.getElementById("reg-website-check").value
      };

      submitBtn.textContent = "Securing registration slot...";
      const result = await submitToAppsScriptFast(webAppUrl, payload);

      if (!result || result.status !== "success" || !result.registrationId) {
        throw new Error(result?.message || "The registration could not be saved.");
      }

      document.getElementById("reg-success-id").textContent = result.registrationId;
      document.getElementById("reg-success-event").textContent = event;
      document.getElementById("reg-success-amount").textContent = `₹${result.expectedAmount}`;
      form.classList.add("hidden");
      successState.classList.remove("hidden");
      if (window.lucide) window.lucide.createIcons();

    } catch (err) {
      console.error(err);
      showError(err.message || "We could not confirm the registration. Your entries are still here; check your connection and try again.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Registration";
    }
  });

  function syncRegistrationSteps() {
    const hasEvent = Boolean(trackSelect.value);
    personalDetails.classList.toggle("hidden", !hasEvent);
    paymentSection.classList.toggle("hidden", !hasEvent);
    personalDetails.querySelectorAll("input, select").forEach((field) => { field.disabled = !hasEvent; });
    paymentSection.querySelectorAll("input").forEach((field) => { field.disabled = !hasEvent; });

    if (!hasEvent) {
      submitBtn.disabled = true;
      return;
    }

    updateFee();
    submitBtn.disabled = false;
  }

  function updateFee() {
    const pricing = window.ELOQVENT_CONFIG?.pricing || {};
    const earlyBirdEndsAt = Date.parse(pricing.earlyBirdDeadline || "2026-10-13T00:00:00+05:30");
    const isEarlyBird = Date.now() < earlyBirdEndsAt;
    const perPerson = Number(isEarlyBird ? pricing.earlyBirdPerPerson : pricing.regularPerPerson) || (isEarlyBird ? 299 : 359);
    category.textContent = isEarlyBird ? "Early Bird Registration" : "Regular Registration";
    feePerPerson.textContent = `₹${perPerson}`;
    amount.textContent = `₹${perPerson}`;
  }

  function collectParticipant() {
    return Object.fromEntries(Object.entries(PERSONAL_FIELD_IDS).map(([key, id]) => [
      key,
      document.getElementById(id).value.trim()
    ]));
  }

  function resetRegistrationForm() {
    form.reset();
    compressedScreenshotBase64 = null;
    compressionPromise = null;
    successState.classList.add("hidden");
    form.classList.remove("hidden");
    personalDetails.classList.add("hidden");
    paymentSection.classList.add("hidden");
    personalDetails.querySelectorAll("input, select").forEach((field) => { field.disabled = true; });
    paymentSection.querySelectorAll("input").forEach((field) => { field.disabled = true; });
    paymentPreviewWrap.classList.add("hidden");
    clearError();
    if (paymentPreview.src.startsWith("blob:")) URL.revokeObjectURL(paymentPreview.src);
    paymentPreview.removeAttribute("src");
    if (paymentFile) paymentFile.value = "";
    submitBtn.disabled = true;
    submitBtn.textContent = "Submit Registration";
  }

  function showError(message) {
    paymentError.textContent = message;
    paymentError.classList.remove("hidden");
    paymentError.focus();
  }

  function clearError() {
    paymentError.textContent = "";
    paymentError.classList.add("hidden");
  }
}

function createRequestId() {
  return window.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * High-Speed Image Compression Pipeline:
 * - Off-thread decoding via createImageBitmap where supported.
 * - Clamps dimensions to 1080px max (preserves 100% legibility of UPI transaction details).
 * - 0.72 JPEG quality cuts payload size by ~85% (~80KB vs ~700KB) for instant network transmission.
 */
async function fastCompressImage(file) {
  const maxDimension = 1080;
  const quality = 0.72;

  // Modern browser path: createImageBitmap (runs off the main thread)
  if ("createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { alpha: false });
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();

      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      return dataUrl.split(",")[1];
    } catch (_) {
      // Fall through to HTMLImageElement fallback on decode error
    }
  }

  // Fallback path: HTMLImageElement + ObjectURL
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
      const width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
      const height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { alpha: false });
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(dataUrl.split(",")[1]);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to read screenshot file."));
    };

    img.src = objectUrl;
  });
}

/**
 * Fast Simple-POST Submitter (No CORS Preflight Options delay)
 */
async function submitToAppsScriptFast(url, payload) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 28000); // 28s timeout

  try {
    // Sending stringified payload with text/plain is a CORS-safelisted request.
    // The browser skips the OPTIONS preflight, saving an entire network roundtrip.
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const text = await response.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch (_) {
      throw new Error("Invalid response format received from registration server.");
    }

    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Submission timed out due to high network traffic. Please try submitting again.");
    }
    throw error;
  }
}

