/**
 * ELOQVENT 2K26 - Apple-Style Tracks Carousel
 * Minimalist, responsive, and intuitive.
 */

document.addEventListener("DOMContentLoaded", () => {
  initTracksCarousel();
});

function initTracksCarousel() {
  const btnElocution = document.getElementById("btn-tab-elocution");
  const btnRootRiddle = document.getElementById("btn-tab-root-riddle");
  const cardElocution = document.getElementById("track-card-elocution");
  const cardRootRiddle = document.getElementById("track-card-root-riddle");

  if (!btnElocution || !btnRootRiddle || !cardElocution || !cardRootRiddle) return;

  function setTrack(track) {
    if (track === "elocution") {
      btnElocution.classList.add("active");
      btnRootRiddle.classList.remove("active");
      cardElocution.classList.remove("hidden-card");
      cardElocution.classList.add("active-card");
      cardRootRiddle.classList.remove("active-card");
      cardRootRiddle.classList.add("hidden-card");
    } else {
      btnRootRiddle.classList.add("active");
      btnElocution.classList.remove("active");
      cardRootRiddle.classList.remove("hidden-card");
      cardRootRiddle.classList.add("active-card");
      cardElocution.classList.remove("active-card");
      cardElocution.classList.add("hidden-card");
    }
  }

  btnElocution.addEventListener("click", () => setTrack("elocution"));
  btnRootRiddle.addEventListener("click", () => setTrack("rootRiddle"));

  // Prev & Next arrows
  const prevBtn = document.getElementById("track-prev-btn");
  const nextBtn = document.getElementById("track-next-btn");
  if (prevBtn) prevBtn.addEventListener("click", () => setTrack("elocution"));
  if (nextBtn) nextBtn.addEventListener("click", () => setTrack("rootRiddle"));
}
