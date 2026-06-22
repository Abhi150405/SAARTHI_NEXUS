import gsap from 'gsap';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   GSAP ANIMATION REGISTRY — Departure Board
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/**
 * Split-flap row entrance — rows flip in from top
 */
export function animateBoardEntry(rows) {
  if (!rows || rows.length === 0) return;
  gsap.fromTo(
    rows,
    { rotateX: 90, opacity: 0, transformOrigin: 'top center' },
    {
      rotateX: 0,
      opacity: 1,
      duration: 0.3,
      stagger: 0.04,
      ease: 'power3.out',
      transformPerspective: 1200,
    }
  );
}

/**
 * Split-flap row exit — rows flip out to top
 */
export function animateBoardExit(rows, onComplete) {
  if (!rows || rows.length === 0) {
    onComplete?.();
    return;
  }
  gsap.to(rows, {
    rotateX: -90,
    opacity: 0,
    duration: 0.18,
    stagger: 0.025,
    ease: 'power2.in',
    transformOrigin: 'top center',
    transformPerspective: 1200,
    onComplete,
  });
}

/**
 * Animated counter — counts up from 0 to endValue
 */
export function animateCountUp(el, endValue, decimals = 0, delay = 0) {
  if (!el) return;
  const num = parseFloat(endValue) || 0;
  gsap.from(el, {
    textContent: 0,
    duration: 1.2,
    delay,
    ease: 'power2.out',
    snap: { textContent: decimals === 0 ? 1 : 0.01 },
    onUpdate() {
      const val = parseFloat(el.textContent) || 0;
      el.textContent = val.toFixed(decimals);
    },
  });
}

/**
 * Character scramble — cycles random chars then snaps to final
 */
export function scrambleText(el, finalText, duration = 400) {
  if (!el || !finalText) return;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let frame = 0;
  const totalFrames = duration / 16;
  const interval = setInterval(() => {
    el.textContent = finalText
      .split('')
      .map((char, i) =>
        frame / totalFrames > i / finalText.length
          ? char
          : chars[Math.floor(Math.random() * chars.length)]
      )
      .join('');
    if (++frame >= totalFrames) {
      el.textContent = finalText;
      clearInterval(interval);
    }
  }, 16);
  return () => clearInterval(interval);
}

/**
 * Stamp slam animation — scale + rotation bounce
 */
export function animateStampIn(el) {
  if (!el) return;
  gsap.fromTo(
    el,
    { scale: 2, opacity: 0, rotation: -25 },
    {
      scale: 1,
      opacity: 1,
      rotation: -8,
      duration: 0.5,
      ease: 'back.out(1.7)',
      delay: 0.3,
    }
  );
}

/**
 * Live countdown ticker — updates every frame
 * Returns cleanup function
 */
export function startCountdownTimer(el, deadlineDate) {
  if (!el) return () => {};
  const update = () => {
    const diff = deadlineDate - Date.now();
    if (diff <= 0) {
      el.textContent = '0D : 00H : 00M';
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    el.textContent = `${d}D : ${String(h).padStart(2, '0')}H : ${String(m).padStart(2, '0')}M`;
  };
  gsap.ticker.add(update);
  update();
  return () => gsap.ticker.remove(update);
}

/**
 * Pulse an element between default and orange color
 */
export function pulseElement(el) {
  if (!el) return;
  return gsap.to(el, {
    color: '#F97316',
    repeat: -1,
    yoyo: true,
    duration: 0.8,
    ease: 'power1.inOut',
  });
}
