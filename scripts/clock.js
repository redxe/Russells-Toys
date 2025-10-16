document.addEventListener('DOMContentLoaded', () => {
  const hourHand = document.querySelector('.analogue-clock .hour-hand');
  const minuteHand = document.querySelector('.analogue-clock .minute-hand');
  const secondHand = document.querySelector('.analogue-clock .second-hand');
  if (!hourHand || !minuteHand || !secondHand) return;

  const apply = (el, deg) => {
    el.style.transform = `translateX(-50%) rotate(${deg}deg)`;
  };

  const tick = () => {
    const now = new Date();
    const s = now.getSeconds();
    const ms = now.getMilliseconds();
    const m = now.getMinutes();
    const h = now.getHours();

    // No +90° offset; 0deg points to 12 o'clock
    const secDeg = ((s + ms / 1000) / 60) * 360;
    const minDeg = ((m + s / 60) / 60) * 360;
    const hourDeg = (((h % 12) + m / 60) / 12) * 360;

    if (s === 0) {
      secondHand.style.transition = 'none';
    } else if (secondHand.style.transition === 'none') {
      requestAnimationFrame(() => {
        secondHand.style.transition = 'transform 0.05s cubic-bezier(0.1, 2.7, 0.58, 1)';
      });
    }

    apply(secondHand, secDeg);
    apply(minuteHand, minDeg);
    apply(hourHand, hourDeg);
  };

  // Align to next frame close to the next 16ms for smoother movement
  const start = () => {
    const loop = () => {
      tick();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
  };

  let rafId;
  start();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      tick();
      start();
    }
  });
});