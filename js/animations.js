/**
 * ELOQVENT 2K26 - Clean Motion & Interaction Script
 * Minimalist, elegant, Apple-style animations without clutter.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Lucide icons if available
  if (window.lucide) {
    window.lucide.createIcons();
  }

  initOpeningAnimation();
  initCountdownTimer();
  initOfferTimer();
});

/**
 * Clean & Elegant Opening Animation
 * Highlights "ELOQVENT 2K26" gracefully, then reveals the full page.
 * Guaranteed to NEVER lock or trap scrolling.
 */
function initOpeningAnimation() {
  const introOverlay = document.getElementById("intro-overlay");
  if (!introOverlay) return;

  // Ensure body can always scroll if user refreshes or scrolls
  const unlockBody = () => {
    document.body.style.overflow = "auto";
    introOverlay.style.opacity = "0";
    introOverlay.style.pointerEvents = "none";
    setTimeout(() => {
      introOverlay.style.display = "none";
    }, 600);
  };

  // Run the clean text reveal
  const introText = document.getElementById("intro-event-title");
  const introTagline = document.getElementById("intro-tagline-text");

  setTimeout(() => {
    if (introText) {
      introText.style.opacity = "1";
      introText.style.transform = "scale(1)";
    }
  }, 100);

  setTimeout(() => {
    if (introTagline) {
      introTagline.style.opacity = "1";
      introTagline.style.transform = "translateY(0)";
    }
  }, 400);

  // Transition smoothly into the website after 1.4 seconds
  setTimeout(unlockBody, 1400);

  // Instant dismiss on any click or keypress
  introOverlay.addEventListener("click", unlockBody);
  window.addEventListener("scroll", unlockBody, { once: true });
}

/**
 * Clean Countdown Timer (Original Conclave Timer)
 */
function initCountdownTimer() {
  const targetDateStr = window.ELOQVENT_CONFIG?.event?.countdownDate || "2026-03-27T09:00:00";
  const targetTime = new Date(targetDateStr).getTime();

  const daysEl = document.getElementById("cd-days");
  const hoursEl = document.getElementById("cd-hours");
  const minsEl = document.getElementById("cd-mins");
  const secsEl = document.getElementById("cd-secs");

  function update() {
    const now = new Date().getTime();
    const diff = targetTime - now;

    if (diff <= 0) {
      if (daysEl) daysEl.textContent = "00";
      if (hoursEl) hoursEl.textContent = "00";
      if (minsEl) minsEl.textContent = "00";
      if (secsEl) secsEl.textContent = "00";
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    if (daysEl) daysEl.textContent = days < 10 ? `0${days}` : days;
    if (hoursEl) hoursEl.textContent = hours < 10 ? `0${hours}` : hours;
    if (minsEl) minsEl.textContent = mins < 10 ? `0${mins}` : mins;
    if (secsEl) secsEl.textContent = secs < 10 ? `0${secs}` : secs;
  }

  update();
  setInterval(update, 1000);
}

/**
 * Interactive Early Bird Offer Countdown
 * Keeps the offer end timer in sync live every second.
 */
function initOfferTimer() {
  const pillTimer = document.getElementById("hero-offer-pill-timer");
  if (!pillTimer) return;

  const deadlineStr = window.ELOQVENT_CONFIG?.pricing?.earlyBirdDeadline || "2026-10-13T00:00:00+05:30";
  const targetTime = new Date(deadlineStr).getTime();

  function update() {
    const now = Date.now();
    const diff = targetTime - now;

    if (diff <= 0) {
      pillTimer.textContent = "Expired";
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    pillTimer.textContent = `${days}d ${hours < 10 ? "0" + hours : hours}h ${mins < 10 ? "0" + mins : mins}m ${secs < 10 ? "0" + secs : secs}s`;
  }

  update();
  setInterval(update, 1000);
}

